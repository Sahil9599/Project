import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileDropzone } from './FileDropzone';
import { ProgressBar } from './ProgressBar';
import { ImagePreviewModal } from './ImagePreviewModal';
import { convertPdfToImages, getPdfPageCount } from '../lib/pdfToImage';
import { saveConversionRecord, saveConvertedFileToVault } from '../lib/cloudStorage';
import { downloadSingleFile, downloadPhotosAsZip } from '../lib/zipHelper';
import type { PdfFileItem, PdfToPhotoOptions, ConvertedPhotoResult } from '../types';
import {
  FileText,
  Sliders,
  Download,
  Eye,
  CheckCircle2,
  Trash2,
  Cloud,
  Layers,
  Sparkles,
} from 'lucide-react';

interface PdfToPhotoConverterProps {
  onOpenAuth: () => void;
  onGoToVault: () => void;
}

export const PdfToPhotoConverter: React.FC<PdfToPhotoConverterProps> = ({
  onOpenAuth,
  onGoToVault,
}) => {
  const { user } = useAuth();
  const [pdfItems, setPdfItems] = useState<PdfFileItem[]>([]);
  const [options, setOptions] = useState<PdfToPhotoOptions>({
    format: 'jpeg',
    scale: 2.0, // 144 DPI High Definition default
    quality: 0.9,
    pageRange: 'all',
    customRange: '1-5',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [results, setResults] = useState<ConvertedPhotoResult[]>([]);
  const [savedToCloud, setSavedToCloud] = useState(false);

  // Preview modal state
  const [previewPhoto, setPreviewPhoto] = useState<ConvertedPhotoResult | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    const newItems: PdfFileItem[] = [];
    for (const file of files) {
      const item: PdfFileItem = {
        id: `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        file,
        name: file.name,
        size: file.size,
      };

      // Probe page count
      try {
        item.pageCount = await getPdfPageCount(file);
      } catch {
        item.pageCount = undefined;
      }

      newItems.push(item);
    }

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
    setProgressStatus('Initializing PDF render pipeline...');

    try {
      const photos = await convertPdfToImages(pdfItems, options, (p, status) => {
        setProgress(p);
        setProgressStatus(status);
      });

      setResults(photos);

      // Save to cloud if user is signed in
      if (user) {
        setProgressStatus('Storing converted photos in personal cloud vault...');
        const totalResultSize = photos.reduce((acc, p) => acc + p.size, 0);
        const ratio = totalInputSize > 0 ? totalResultSize / totalInputSize : 1;

        const record = await saveConversionRecord(user.uid, {
          conversionType: 'pdf-to-photo',
          originalFilesCount: pdfItems.length,
          originalFileNames: pdfItems.map((p) => p.name),
          totalOriginalSizeBytes: totalInputSize,
          totalResultSizeBytes: totalResultSize,
          compressionQuality: `${options.format.toUpperCase()} (${Math.round(options.quality * 100)}%)`,
          compressionRatio: Number(ratio.toFixed(2)),
          status: 'completed',
          outputSummary: `${pdfItems.length} PDF(s) → ${photos.length} image photo(s)`,
        });

        if (record) {
          // Save up to 20 files directly to vault
          for (let i = 0; i < Math.min(20, photos.length); i++) {
            const photo = photos[i];
            await saveConvertedFileToVault(
              user.uid,
              record.id,
              photo.fileName,
              `image/${options.format}`,
              photo.blob,
              photo.dataUrl // Thumbnail
            );
          }
          setSavedToCloud(true);
        }
      }
    } catch (err: unknown) {
      console.error('PDF to Photo error:', err);
      setProgressStatus('Conversion failed. Please verify PDF integrity.');
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

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-100">
          PDF to Photo Studio
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Render PDF documents into high-resolution JPEG, WebP, or PNG photos with batch ZIP export.
        </p>
      </div>

      {/* Upload Dropzone */}
      <FileDropzone
        mode="pdf"
        accept="application/pdf,.pdf"
        onFilesSelected={handleFilesSelected}
        title="Upload PDF files for extraction"
        description="Select one or multiple PDF documents to render pages into photos."
        disabled={isProcessing}
      />

      {/* Batch PDFs Queue */}
      {pdfItems.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div>
              <h2 className="text-base font-semibold text-neutral-100">
                PDF Batch Queue ({pdfItems.length})
              </h2>
              <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                <span>Total payload: {formatBytes(totalInputSize)}</span>
              </div>
            </div>

            <button
              onClick={() => setPdfItems([])}
              disabled={isProcessing}
              className="px-3 py-1.5 text-xs text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-4">
            {pdfItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800"
              >
                <div className="flex items-center gap-3 truncate pr-2">
                  <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-300 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-medium text-neutral-200 truncate">{item.name}</p>
                    <p className="text-[11px] font-mono text-neutral-400 tabular-nums">
                      {formatBytes(item.size)}
                      {item.pageCount ? ` · ${item.pageCount} page(s)` : ''}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRemove(item.id)}
                  disabled={isProcessing}
                  className="p-1 text-neutral-400 hover:text-red-400 rounded hover:bg-neutral-800 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rendering & Compression Controls */}
      {pdfItems.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
            <Sliders className="w-4 h-4 text-neutral-400" />
            <h3 className="text-sm font-semibold text-neutral-100">
              Rendering Resolution & Image Quality
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Resolution / DPI */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Resolution & Sharpness (DPI)
              </label>
              <select
                value={options.scale}
                onChange={(e) =>
                  setOptions((prev) => ({ ...prev, scale: parseFloat(e.target.value) }))
                }
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none"
              >
                <option value={1.0}>Standard 72 DPI (Lightweight & Fast)</option>
                <option value={2.0}>High Definition 144 DPI (Print & Clean Text)</option>
                <option value={3.0}>Ultra Retina 216 DPI (Studio Crisp)</option>
              </select>
            </div>

            {/* Target Output Format */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
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
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none"
              >
                <option value="jpeg">JPEG (Universal, Small)</option>
                <option value="webp">WebP (Modern, High Compression)</option>
                <option value="png">PNG (Lossless, Maximum Fidelity)</option>
              </select>
            </div>

            {/* Quality Slider */}
            <div>
              <div className="flex justify-between text-xs text-neutral-300 mb-1">
                <span>Compression Quality</span>
                <span className="font-mono tabular-nums">
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
                className="w-full accent-neutral-100 cursor-pointer disabled:opacity-40"
              />
            </div>
          </div>

          {/* Page Range Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-800/80">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Pages to Render
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['all', 'first', 'custom'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setOptions((prev) => ({ ...prev, pageRange: r }))}
                    className={`py-1.5 px-3 rounded-lg text-xs font-medium border text-center transition-colors ${
                      options.pageRange === r
                        ? 'bg-neutral-100 text-neutral-950 border-white'
                        : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700'
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
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Custom Range Specification
                </label>
                <input
                  type="text"
                  value={options.customRange}
                  onChange={(e) =>
                    setOptions((prev) => ({ ...prev, customRange: e.target.value }))
                  }
                  placeholder="e.g. 1-3, 5, 8"
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none"
                />
                <p className="text-[10px] text-neutral-400 mt-1">
                  Separate single pages with commas or ranges with hyphens
                </p>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-neutral-400">
              {user ? (
                <span className="flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-neutral-300" />
                  <span>Rendered photo pages will sync to your private Cloud Vault</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <button
                    onClick={onOpenAuth}
                    className="text-neutral-200 hover:underline font-medium"
                  >
                    Sign in
                  </button>
                  <span>to keep converted photos in your personal account</span>
                </span>
              )}
            </div>

            <button
              onClick={handleConvert}
              disabled={isProcessing || pdfItems.length === 0}
              className="w-full sm:w-auto px-6 py-2.5 bg-neutral-100 hover:bg-white text-neutral-950 rounded-xl text-xs font-semibold transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
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
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-neutral-100" />
              <div>
                <h3 className="text-base font-semibold text-neutral-100">
                  Rendered Photo Gallery ({results.length} Page{results.length === 1 ? '' : 's'})
                </h3>
                <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                  <span>Total size: {formatBytes(totalOutputSize)}</span>
                  <span aria-hidden="true">·</span>
                  <span>Format: {options.format.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadPhotosAsZip(results, 'converted_photos.zip')}
                className="px-4 py-2 bg-neutral-100 hover:bg-white text-neutral-950 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download All as ZIP</span>
              </button>
            </div>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {results.map((photo, idx) => (
              <div
                key={idx}
                className="group relative bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 flex flex-col justify-between overflow-hidden hover:border-neutral-700 transition-colors"
              >
                {/* Photo Preview */}
                <div
                  onClick={() => setPreviewPhoto(photo)}
                  className="relative aspect-[3/4] w-full rounded-lg bg-neutral-900 flex items-center justify-center overflow-hidden cursor-pointer mb-2"
                >
                  <img
                    src={photo.dataUrl}
                    alt={photo.fileName}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="p-1.5 rounded-full bg-black/60 text-white hover:scale-110 transition-transform">
                      <Eye className="w-4 h-4" />
                    </span>
                  </div>
                  <span className="absolute bottom-1 right-1 bg-black/70 text-[10px] font-mono px-1.5 py-0.5 rounded text-neutral-300">
                    p.{photo.pageNumber}
                  </span>
                </div>

                <div className="truncate">
                  <p className="text-xs font-medium text-neutral-200 truncate">{photo.fileName}</p>
                  <p className="text-[11px] font-mono text-neutral-400 tabular-nums">
                    {formatBytes(photo.size)} · {photo.width}x{photo.height}
                  </p>
                </div>

                {/* Direct Download Button */}
                <button
                  onClick={() => downloadSingleFile(photo.blob, photo.fileName)}
                  className="mt-2 w-full py-1 text-xs text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors flex items-center justify-center gap-1"
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
                <span>Rendered photos stored in your personal Cloud Vault.</span>
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
