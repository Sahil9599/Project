import React, { useState } from 'react';
import { FileDropzone } from './FileDropzone';
import { ProgressBar } from './ProgressBar';
import { convertImagesToPdf } from '../lib/imageToPdf';
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
  FileCheck,
} from 'lucide-react';

interface PhotoToPdfConverterProps {}

export const PhotoToPdfConverter: React.FC<PhotoToPdfConverterProps> = () => {
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
    } catch (err) {
      console.error('Conversion failed', err);
      alert(err instanceof Error ? err.message : 'Error converting images');
    } finally {
      setIsProcessing(false);
      setProgress(100);
      setProgressStatus('Complete');
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const totalOutputSize = results.reduce((acc, r) => acc + r.size, 0);
  const savingsPercent =
    originalTotalSize > 0 && totalOutputSize < originalTotalSize
      ? Math.round(((originalTotalSize - totalOutputSize) / originalTotalSize) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
          Photo to PDF Batch Studio
        </h1>
        <p className="text-sm text-blue-100 font-medium drop-shadow-sm mt-1">
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
        <div className="bg-white/85 backdrop-blur-xl border border-white/70 rounded-3xl p-6 shadow-xl shadow-blue-950/5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Photo Batch Queue ({items.length})
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                <span>Total payload: {formatBytes(totalInputSize)}</span>
                <span aria-hidden="true">·</span>
                <span>Drag or use arrows to reorder pages</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setItems([])}
                disabled={isProcessing}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>

          {/* Grid of uploaded images */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 pt-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="group relative bg-white border border-slate-200/90 rounded-2xl p-2.5 flex flex-col justify-between overflow-hidden shadow-xs hover:border-blue-300 hover:shadow-md transition-all"
              >
                {/* Image thumbnail */}
                <div className="relative aspect-square w-full rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden mb-2 border border-slate-100">
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    style={{ transform: `rotate(${item.rotation}deg)` }}
                    className="w-full h-full object-cover transition-transform duration-200"
                  />
                  <span className="absolute top-1.5 left-1.5 bg-slate-900/75 backdrop-blur-xs text-[10px] font-mono px-2 py-0.5 rounded-md text-white font-semibold">
                    #{index + 1}
                  </span>
                </div>

                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                  <p className="text-[11px] font-mono text-slate-500 tabular-nums">
                    {formatBytes(item.size)}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between pt-2 mt-1.5 border-t border-slate-100 text-slate-500">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0 || isProcessing}
                      className="p-1 hover:text-blue-600 disabled:opacity-30 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Move backward"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === items.length - 1 || isProcessing}
                      className="p-1 hover:text-blue-600 disabled:opacity-30 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Move forward"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRotate(item.id)}
                      disabled={isProcessing}
                      className="p-1 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Rotate 90 degrees"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={isProcessing}
                      className="p-1 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
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
        <div className="bg-white/85 backdrop-blur-xl border border-white/70 rounded-3xl p-6 space-y-6 shadow-xl shadow-blue-950/5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <Sliders className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Image Compression & PDF Layout Engine
              </h3>
            </div>
            <div className="text-xs text-slate-500">
              Preset: <span className="text-blue-600 capitalize font-bold">{options.preset}</span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Compression Quality Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {(['maximum', 'high', 'medium', 'compact', 'custom'] as CompressionPreset[]).map(
                (p) => (
                  <button
                    key={p}
                    onClick={() => handlePresetChange(p)}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-semibold border text-center transition-all ${
                      options.preset === p
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 border-transparent'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-slate-50 shadow-xs'
                    }`}
                  >
                    <div className="capitalize">{p}</div>
                    <div className="text-[10px] opacity-80 mt-0.5">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Compression Quality</span>
                  <span className="font-mono tabular-nums text-blue-600 font-bold">{Math.round(options.quality * 100)}%</span>
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
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Maximum Resolution Cap
                </label>
                <select
                  value={options.maxDimension}
                  onChange={(e) =>
                    setOptions((prev) => ({ ...prev, maxDimension: parseInt(e.target.value, 10) }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                >
                  <option value={0}>Original Resolution (No Limit)</option>
                  <option value={3840}>4K Ultra HD (3840 px)</option>
                  <option value={2048}>2K Quad HD (2048 px)</option>
                  <option value={1280}>HD 720p (1280 px)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs"
              >
                <option value="fit">Fit to Image Size (Seamless)</option>
                <option value="a4">Standard A4 Document</option>
                <option value="letter">US Letter Document</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs"
              >
                <option value="auto">Auto Detect Per Image</option>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs"
              >
                <option value="none">None (Border to Border)</option>
                <option value="compact">Compact (5 mm)</option>
                <option value="standard">Standard (10 mm)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs"
              >
                <option value="merge">Single Combined PDF</option>
                <option value="separate">Separate PDF per Photo</option>
              </select>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <div className="text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>100% Client-Side Processing · No files uploaded to server</span>
              </span>
            </div>

            <button
              onClick={handleConvert}
              disabled={isProcessing || items.length === 0}
              className="liquid-glass-btn w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
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
        <div className="bg-white/85 backdrop-blur-xl border border-white/70 rounded-3xl p-6 space-y-6 shadow-xl shadow-blue-950/5 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Conversion Complete
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                  <span>Output: {results.length} file(s)</span>
                  <span aria-hidden="true">·</span>
                  <span>Total size: {formatBytes(totalOutputSize)}</span>
                  {savingsPercent > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-600 font-bold">
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
                  className="liquid-glass-btn px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
              ) : (
                <button
                  onClick={() => downloadPdfsAsZip(results, 'converted_pdfs.zip')}
                  className="liquid-glass-btn px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download All as ZIP</span>
                </button>
              )}
            </div>
          </div>

          {/* Results list */}
          <div className="space-y-2.5">
            {results.map((res, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs"
              >
                <div className="flex items-center gap-3 truncate pr-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 truncate">{res.fileName}</p>
                    <p className="text-[11px] font-mono text-slate-500 tabular-nums">
                      {formatBytes(res.size)} · {res.pageCount} page(s)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => downloadSingleFile(res.blob, res.fileName)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-100 rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
