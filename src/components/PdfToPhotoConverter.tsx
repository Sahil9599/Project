import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileDropzone } from './FileDropzone';
import { ProgressBar } from './ProgressBar';
import { ImagePreviewModal } from './ImagePreviewModal';
import { convertPdfToImages } from '../lib/pdfToImage';
import { saveConversionRecord, saveConvertedFileToVault } from '../lib/cloudStorage';
import { downloadSingleFile, downloadPhotosAsZip } from '../lib/zipHelper';
import type { PdfFileItem, PdfToPhotoOptions, ConvertedPhotoResult } from '../types';
import {
  FileText,
  Trash2,
  Download,
  Sliders,
  CheckCircle2,
  Cloud,
  Eye,
  Sparkles,
} from 'lucide-react';

interface PdfToPhotoConverterProps {
  onGoToVault: () => void;
}

export const PdfToPhotoConverter: React.FC<PdfToPhotoConverterProps> = ({
  onGoToVault,
}) => {
  const { user } = useAuth();
  const [pdfItems, setPdfItems] = useState<PdfFileItem[]>([]);
  const [options, setOptions] = useState<PdfToPhotoOptions>({
    format: 'jpeg',
    scale: 2.0, // 144 DPI High Definition default
    quality: 0.9,
    pageRange: 'all',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [results, setResults] = useState<ConvertedPhotoResult[]>([]);
  const [previewPhoto, setPreviewPhoto] = useState<ConvertedPhotoResult | null>(null);
  const [savedToCloud, setSavedToCloud] = useState(false);

  const handleFilesSelected = (files: File[]) => {
    const newItems: PdfFileItem[] = files.map((file) => ({
      id: `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      file,
      name: file.name,
      size: file.size,
    }));

    setPdfItems((prev) => [...prev, ...newItems]);
    setResults([]);
    setSavedToCloud(false);
  };

  const handleRemove = (id: string) => {
    setPdfItems((prev) => prev.filter((i) => i.id !== id));
  };

  const totalInputSize = pdfItems.reduce((acc, curr) => acc + curr.size, 0);

  const handleConvert = async () => {
    if (pdfItems.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setProgressStatus('Initializing PDF render canvas...');

    try {
      const photos = await convertPdfToImages(pdfItems, options, (p, status) => {
        setProgress(p);
        setProgressStatus(status);
      });

      setResults(photos);

      // Save to cloud if user is signed in
      if (user) {
        setProgressStatus('Storing photos into personal cloud vault...');
        const totalResultSize = photos.reduce((acc, p) => acc + p.size, 0);

        const record = await saveConversionRecord(user.uid, {
          conversionType: 'pdf-to-photo',
          originalFilesCount: pdfItems.length,
          originalFileNames: pdfItems.map((p) => p.name),
          totalOriginalSizeBytes: totalInputSize,
          totalResultSizeBytes: totalResultSize,
          compressionQuality: `${options.scale * 72} DPI (${options.format.toUpperCase()})`,
          status: 'completed',
          outputSummary: `${pdfItems.length} PDF(s) → ${photos.length} Photo Page(s)`,
        });

        if (record) {
          for (const photo of photos) {
            await saveConvertedFileToVault(
              user.uid,
              record.id,
              photo.fileName,
              `image/${options.format}`,
              photo.blob,
              photo.dataUrl
            );
          }
          setSavedToCloud(true);
        }
      }
    } catch (err) {
      console.error('PDF Conversion error:', err);
      alert(err instanceof Error ? err.message : 'Failed to convert PDF documents');
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

  const totalOutputSize = results.reduce((acc, p) => acc + p.size, 0);

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
          PDF to Photo Extraction Studio
        </h1>
        <p className="text-sm text-blue-100 font-medium drop-shadow-sm mt-1">
          High-fidelity vector rasterization from PDF pages into crystal-clear JPEG, WebP, or PNG photos.
        </p>
      </div>

      {/* Upload Dropzone */}
      <FileDropzone
        mode="pdf"
        accept="application/pdf,.pdf"
        onFilesSelected={handleFilesSelected}
        title="Upload PDF files to rasterize"
        description="Select or drop single or multi-page PDF documents. Batch processing enabled."
        disabled={isProcessing}
      />

      {/* PDF Queue */}
      {pdfItems.length > 0 && (
        <div className="bg-white/85 backdrop-blur-xl border border-white/70 rounded-3xl p-6 shadow-xl shadow-blue-950/5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                PDF Document Queue ({pdfItems.length})
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                <span>Total payload: {formatBytes(totalInputSize)}</span>
              </div>
            </div>

            <button
              onClick={() => setPdfItems([])}
              disabled={isProcessing}
              className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-4">
            {pdfItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 transition-all"
              >
                <div className="flex items-center gap-3 truncate pr-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[11px] font-mono text-slate-500 tabular-nums">
                      {formatBytes(item.size)}
                      {item.pageCount ? ` · ${item.pageCount} page(s)` : ''}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRemove(item.id)}
                  disabled={isProcessing}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rendering & Compression Controls */}
      {pdfItems.length > 0 && (
        <div className="bg-white/85 backdrop-blur-xl border border-white/70 rounded-3xl p-6 space-y-6 shadow-xl shadow-blue-950/5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Rendering Resolution & Image Quality
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Resolution / DPI */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resolution & Sharpness (DPI)
              </label>
              <select
                value={options.scale}
                onChange={(e) =>
                  setOptions((prev) => ({ ...prev, scale: parseFloat(e.target.value) }))
                }
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs"
              >
                <option value={1.0}>Standard 72 DPI (Lightweight & Fast)</option>
                <option value={2.0}>High Definition 144 DPI (Print & Clean Text)</option>
                <option value={3.0}>Ultra Retina 216 DPI (Studio Crisp)</option>
              </select>
            </div>

            {/* Target Output Format */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Output Image Format
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
                <option value="jpeg">JPEG (Universal, Small)</option>
                <option value="webp">WebP (Modern, High Compression)</option>
                <option value="png">PNG (Lossless, Maximum Fidelity)</option>
              </select>
            </div>

            {/* Quality Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Compression Quality</span>
                <span className="font-mono tabular-nums text-blue-600 font-bold">
                  {options.format === 'png' ? 'Lossless (100%)' : `${Math.round(options.quality * 100)}%`}
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                disabled={options.format === 'png'}
                value={options.quality}
                onChange={(e) =>
                  setOptions((prev) => ({ ...prev, quality: parseFloat(e.target.value) }))
                }
                className="w-full accent-blue-600 cursor-pointer disabled:opacity-40"
              />
            </div>
          </div>

          {/* Page Range Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pages to Render
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['all', 'first', 'custom'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setOptions((prev) => ({ ...prev, pageRange: r }))}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                      options.pageRange === r
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 border-transparent'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-slate-50 shadow-xs'
                    }`}
                  >
                    {r === 'all' && 'All Pages'}
                    {r === 'first' && 'First Page'}
                    {r === 'custom' && 'Custom Range'}
                  </button>
                ))}
              </div>
            </div>

            {options.pageRange === 'custom' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Custom Range Specification
                </label>
                <input
                  type="text"
                  value={options.customRange}
                  onChange={(e) =>
                    setOptions((prev) => ({ ...prev, customRange: e.target.value }))
                  }
                  placeholder="e.g. 1-3, 5, 8"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Separate single pages with commas or ranges with hyphens
                </p>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <div className="text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-blue-600" />
                <span>Rendered photo pages are safely archived in your private vault</span>
              </span>
            </div>

            <button
              onClick={handleConvert}
              disabled={isProcessing || pdfItems.length === 0}
              className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Render {pdfItems.length} PDF{pdfItems.length === 1 ? '' : 's'} to Photos</span>
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

      {/* Results Gallery */}
      {results.length > 0 && !isProcessing && (
        <div className="bg-white/85 backdrop-blur-xl border border-white/70 rounded-3xl p-6 space-y-6 shadow-xl shadow-blue-950/5 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Rendered Photo Gallery ({results.length} Page{results.length === 1 ? '' : 's'})
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                  <span>Total size: {formatBytes(totalOutputSize)}</span>
                  <span aria-hidden="true">·</span>
                  <span>Format: {options.format.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadPhotosAsZip(results, 'converted_photos.zip')}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download All as ZIP</span>
              </button>
            </div>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {results.map((photo, idx) => (
              <div
                key={idx}
                className="group relative bg-white border border-slate-200 rounded-2xl p-2.5 flex flex-col justify-between overflow-hidden hover:border-blue-300 hover:shadow-md transition-all"
              >
                {/* Photo Preview */}
                <div
                  onClick={() => setPreviewPhoto(photo)}
                  className="relative aspect-[3/4] w-full rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden cursor-pointer mb-2 border border-slate-100"
                >
                  <img
                    src={photo.dataUrl}
                    alt={photo.fileName}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-blue-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="p-2 rounded-full bg-white/90 text-blue-600 shadow-md hover:scale-110 transition-transform">
                      <Eye className="w-4 h-4" />
                    </span>
                  </div>
                  <span className="absolute bottom-1.5 right-1.5 bg-slate-900/75 backdrop-blur-xs text-[10px] font-mono px-2 py-0.5 rounded-md text-white font-semibold">
                    p.{photo.pageNumber}
                  </span>
                </div>

                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 truncate">{photo.fileName}</p>
                  <p className="text-[11px] font-mono text-slate-500 tabular-nums">
                    {formatBytes(photo.size)} · {photo.width}x{photo.height}
                  </p>
                </div>

                {/* Direct Download Button */}
                <button
                  onClick={() => downloadSingleFile(photo.blob, photo.fileName)}
                  className="mt-2.5 w-full py-1.5 text-xs font-semibold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-100 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            ))}
          </div>

          {/* Cloud Vault feedback */}
          {savedToCloud && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-50/90 border border-blue-100 text-xs text-blue-800">
              <span className="flex items-center gap-2 font-medium">
                <Cloud className="w-4 h-4 text-blue-600" />
                <span>Rendered photos stored in your personal Cloud Vault.</span>
              </span>
              <button
                onClick={onGoToVault}
                className="text-blue-700 hover:underline font-bold"
              >
                View in Vault &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Image Preview Modal */}
      {previewPhoto && (
        <ImagePreviewModal
          isOpen={!!previewPhoto}
          onClose={() => setPreviewPhoto(null)}
          imageUrl={previewPhoto.dataUrl}
          title={previewPhoto.fileName}
          blob={previewPhoto.blob}
        />
      )}
    </div>
  );
};
