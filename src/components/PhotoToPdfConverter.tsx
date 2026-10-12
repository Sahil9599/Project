import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileDropzone } from './FileDropzone';
import { ProgressBar } from './ProgressBar';
import { convertImagesToPdf } from '../lib/imageToPdf';
import { saveConversionRecord, saveConvertedFileToVault } from '../lib/cloudStorage';
import { downloadSingleFile, downloadPdfsAsZip } from '../lib/zipHelper';
import type { ImageFileItem, ImageToPdfOptions, CompressionPreset, ConvertedPdfResult } from '../types';
import {
  FileText,
  RotateCw,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  Sliders,
  CheckCircle2,
  Cloud,
  FileCheck,
} from 'lucide-react';

interface PhotoToPdfConverterProps {
  onOpenAuth: () => void;
  onGoToVault: () => void;
}

export const PhotoToPdfConverter: React.FC<PhotoToPdfConverterProps> = ({
  onOpenAuth,
  onGoToVault,
}) => {
  const { user } = useAuth();
  const [items, setItems] = useState<ImageFileItem[]>([]);
  const [options, setOptions] = useState<ImageToPdfOptions>({
    pageSize: 'fit',
    orientation: 'auto',
    margin: 'none',
    preset: 'high',
    quality: 0.85,
    maxDimension: 3840,
    format: 'jpeg',
    mergeIntoSinglePdf: true,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [results, setResults] = useState<ConvertedPdfResult[]>([]);
  const [savedToCloud, setSavedToCloud] = useState(false);
  const [originalTotalSize, setOriginalTotalSize] = useState(0);

  const handleFilesSelected = (files: File[]) => {
    const newItems: ImageFileItem[] = files.map((file) => {
      const url = URL.createObjectURL(file);
      return {
        id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        file,
        previewUrl: url,
        name: file.name,
        size: file.size,
        width: 0,
        height: 0,
        rotation: 0,
      };
    });

    setItems((prev) => [...prev, ...newItems]);
    setResults([]);
    setSavedToCloud(false);
  };

  const handleRotate = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, rotation: (item.rotation + 90) % 360 } : item
      )
    );
  };

  const handleRemove = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setItems(updated);
  };

  const handlePresetChange = (preset: CompressionPreset) => {
    let quality = 0.85;
    let maxDimension = 3840;

    if (preset === 'maximum') {
      quality = 1.0;
      maxDimension = 0; // original
    } else if (preset === 'high') {
      quality = 0.85;
      maxDimension = 3840;
    } else if (preset === 'medium') {
      quality = 0.65;
      maxDimension = 2048;
    } else if (preset === 'compact') {
      quality = 0.45;
      maxDimension = 1280;
    }

    setOptions((prev) => ({
      ...prev,
      preset,
      quality,
      maxDimension,
    }));
  };

  const totalInputSize = items.reduce((acc, curr) => acc + curr.size, 0);

  const handleConvert = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setProgressStatus('Initializing conversion engine...');
    setOriginalTotalSize(totalInputSize);

    try {
      const pdfs = await convertImagesToPdf(items, options, (p, status) => {
        setProgress(p);
        setProgressStatus(status);
      });

      setResults(pdfs);

      // Save to cloud if user is signed in
      if (user) {
        setProgressStatus('Securing converted documents in personal cloud vault...');
        const totalResultSize = pdfs.reduce((acc, p) => acc + p.size, 0);
        const ratio = totalInputSize > 0 ? (totalResultSize / totalInputSize) : 1;

        const record = await saveConversionRecord(user.uid, {
          conversionType: 'photo-to-pdf',
          originalFilesCount: items.length,
          originalFileNames: items.slice(0, 10).map((i) => i.name),
          totalOriginalSizeBytes: totalInputSize,
          totalResultSizeBytes: totalResultSize,
          compressionQuality: options.preset,
          compressionRatio: Number(ratio.toFixed(2)),
          status: 'completed',
          outputSummary: `${items.length} photo(s) → ${pdfs.length} PDF(s)`,
        });

        if (record) {
          for (const pdf of pdfs) {
            await saveConvertedFileToVault(
              user.uid,
              record.id,
              pdf.fileName,
              'application/pdf',
              pdf.blob
            );
          }
          setSavedToCloud(true);
        }
      }
    } catch (err: unknown) {
      console.error('Photo to PDF conversion error:', err);
      setProgressStatus('Conversion failed. Please verify image inputs.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const totalOutputSize = results.reduce((acc, curr) => acc + curr.size, 0);
  const savingsPercent =
    originalTotalSize > 0
      ? Math.round(((originalTotalSize - totalOutputSize) / originalTotalSize) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* Kicker & Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-100">
          Photo to PDF Batch Studio
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Combine, reorder, and compress images into multi-page or individual high-definition PDF files.
        </p>
      </div>

      {/* Upload Dropzone */}
      <FileDropzone
        mode="photo"
        accept="image/*,.jpeg,.jpg,.png,.webp,.gif,.bmp"
        onFilesSelected={handleFilesSelected}
        title="Upload photos for PDF compilation"
        description="JPEG, PNG, WebP, GIF, or BMP files. Select multiple photos to batch convert."
        disabled={isProcessing}
      />

      {/* Batch Items Queue */}
      {items.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div>
              <h2 className="text-base font-semibold text-neutral-100">
                Photo Batch Queue ({items.length})
              </h2>
              <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                <span>Total payload: {formatBytes(totalInputSize)}</span>
                <span aria-hidden="true">·</span>
                <span>Drag or use arrows to reorder pages</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setItems([])}
                disabled={isProcessing}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>

          {/* Grid of uploaded images */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="group relative bg-neutral-950 border border-neutral-800 rounded-xl p-2 flex flex-col justify-between overflow-hidden"
              >
                {/* Image thumbnail */}
                <div className="relative aspect-square w-full rounded-lg bg-neutral-900 flex items-center justify-center overflow-hidden mb-2">
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    style={{ transform: `rotate(${item.rotation}deg)` }}
                    className="w-full h-full object-cover transition-transform duration-200"
                  />
                  <span className="absolute top-1 left-1 bg-black/70 text-[10px] font-mono px-1.5 py-0.5 rounded text-neutral-300">
                    #{index + 1}
                  </span>
                </div>

                <div className="truncate">
                  <p className="text-xs font-medium text-neutral-200 truncate">{item.name}</p>
                  <p className="text-[11px] font-mono text-neutral-400 tabular-nums">
                    {formatBytes(item.size)}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between pt-2 mt-1 border-t border-neutral-900 text-neutral-400">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0 || isProcessing}
                      className="p-1 hover:text-white disabled:opacity-30 rounded hover:bg-neutral-800"
                      title="Move backward"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === items.length - 1 || isProcessing}
                      className="p-1 hover:text-white disabled:opacity-30 rounded hover:bg-neutral-800"
                      title="Move forward"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRotate(item.id)}
                      disabled={isProcessing}
                      className="p-1 hover:text-white rounded hover:bg-neutral-800"
                      title="Rotate 90 degrees"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={isProcessing}
                      className="p-1 hover:text-red-400 rounded hover:bg-neutral-800"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compression & Output Configuration Settings */}
      {items.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-neutral-400" />
              <h3 className="text-sm font-semibold text-neutral-100">
                Image Compression & PDF Layout Engine
              </h3>
            </div>
            <div className="text-xs text-neutral-400">
              Preset: <span className="text-neutral-200 capitalize font-medium">{options.preset}</span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-2">
              Compression Quality Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(['maximum', 'high', 'medium', 'compact', 'custom'] as CompressionPreset[]).map(
                (p) => (
                  <button
                    key={p}
                    onClick={() => handlePresetChange(p)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                      options.preset === p
                        ? 'bg-neutral-100 text-neutral-950 border-white'
                        : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="capitalize">{p}</div>
                    <div className="text-[10px] opacity-75 mt-0.5">
                      {p === 'maximum' && '100% / Original'}
                      {p === 'high' && '85% / 4K Crisp'}
                      {p === 'medium' && '65% / 2K Balanced'}
                      {p === 'compact' && '45% / Ultra Small'}
                      {p === 'custom' && 'Manual Slider'}
                    </div>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Custom Settings (Sliders & Dimension caps) */}
          {options.preset === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-neutral-950 border border-neutral-800/80">
              <div>
                <div className="flex justify-between text-xs text-neutral-300 mb-1">
                  <span>Compression Quality</span>
                  <span className="font-mono tabular-nums">{Math.round(options.quality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={options.quality}
                  onChange={(e) =>
                    setOptions((prev) => ({ ...prev, quality: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-neutral-100 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">
                  Maximum Resolution Cap
                </label>
                <select
                  value={options.maxDimension}
                  onChange={(e) =>
                    setOptions((prev) => ({ ...prev, maxDimension: parseInt(e.target.value, 10) }))
                  }
                  className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none"
                >
                  <option value={0}>Original Resolution (No Limit)</option>
                  <option value={3840}>4K Ultra HD (3840 px)</option>
                  <option value={2048}>2K Quad HD (2048 px)</option>
                  <option value={1280}>HD 720p (1280 px)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">
                  Intermediate Image Encoding
                </label>
                <select
                  value={options.format}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      format: e.target.value as 'jpeg' | 'png' | 'webp',
                    }))
                  }
                  className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none"
                >
                  <option value="jpeg">JPEG (Fast, Small)</option>
                  <option value="webp">WebP (Modern, High Compression)</option>
                  <option value="png">PNG (Lossless Sharpness)</option>
                </select>
              </div>
            </div>
          )}

          {/* Page Layout Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Document Page Size
              </label>
              <select
                value={options.pageSize}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    pageSize: e.target.value as 'fit' | 'a4' | 'letter',
                  }))
                }
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none"
              >
                <option value="fit">Fit to Image Size (Seamless)</option>
                <option value="a4">Standard A4 Document</option>
                <option value="letter">US Letter Document</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Orientation
              </label>
              <select
                value={options.orientation}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    orientation: e.target.value as 'auto' | 'portrait' | 'landscape',
                  }))
                }
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none"
              >
                <option value="auto">Auto Detect Per Image</option>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Page Margins
              </label>
              <select
                value={options.margin}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    margin: e.target.value as 'none' | 'compact' | 'standard',
                  }))
                }
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none"
              >
                <option value="none">None (Border to Border)</option>
                <option value="compact">Compact (5 mm)</option>
                <option value="standard">Standard (10 mm)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Batch Mode
              </label>
              <select
                value={options.mergeIntoSinglePdf ? 'merge' : 'separate'}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    mergeIntoSinglePdf: e.target.value === 'merge',
                  }))
                }
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none"
              >
                <option value="merge">Single Combined PDF</option>
                <option value="separate">Separate PDF per Photo</option>
              </select>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-neutral-300" />
                <span>Safely saved to your private encrypted vault</span>
              </span>
            </div>

            <button
              onClick={handleConvert}
              disabled={isProcessing || items.length === 0}
              className="w-full sm:w-auto px-6 py-2.5 bg-neutral-100 hover:bg-white text-neutral-950 rounded-xl text-xs font-semibold transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Convert {items.length} Photo{items.length === 1 ? '' : 's'} to PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <ProgressBar
        progress={progress}
        status={progressStatus}
        isProcessing={isProcessing}
      />

      {/* Conversion Output & Downloads */}
      {results.length > 0 && !isProcessing && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-neutral-100" />
              <div>
                <h3 className="text-base font-semibold text-neutral-100">
                  Conversion Complete
                </h3>
                <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                  <span>Output: {results.length} file(s)</span>
                  <span aria-hidden="true">·</span>
                  <span>Total size: {formatBytes(totalOutputSize)}</span>
                  {savingsPercent > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-neutral-200 font-medium">
                        Reduced by {savingsPercent}%
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {results.length === 1 ? (
                <button
                  onClick={() => downloadSingleFile(results[0].blob, results[0].fileName)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-white text-neutral-950 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              ) : (
                <button
                  onClick={() => downloadPdfsAsZip(results, 'converted_pdfs.zip')}
                  className="px-4 py-2 bg-neutral-100 hover:bg-white text-neutral-950 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download All as ZIP</span>
                </button>
              )}
            </div>
          </div>

          {/* Results list */}
          <div className="space-y-2">
            {results.map((res, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800"
              >
                <div className="flex items-center gap-3 truncate pr-4">
                  <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-300 shrink-0">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-medium text-neutral-200 truncate">{res.fileName}</p>
                    <p className="text-[11px] font-mono text-neutral-400 tabular-nums">
                      {formatBytes(res.size)} · {res.pageCount} page(s)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => downloadSingleFile(res.blob, res.fileName)}
                  className="px-3 py-1.5 text-xs text-neutral-200 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
              </div>
            ))}
          </div>

          {/* Cloud Vault feedback */}
          {savedToCloud && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs text-neutral-400">
              <span className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-neutral-300" />
                <span>Files saved to your private Cloud Vault.</span>
              </span>
              <button
                onClick={onGoToVault}
                className="text-neutral-200 hover:underline font-medium"
              >
                View in Vault &rarr;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
