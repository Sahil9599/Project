import React, { useState, useRef, useEffect } from 'react';
import {
  Files,
  Upload,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCw,
  FileCheck,
  Download,
  Eye,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FilePlus,
  Sparkles,
  BookOpen,
  Split,
  ExternalLink,
  RefreshCw,
  Info,
} from 'lucide-react';
import type { MergePdfItem, MergeOptions, MergedPdfResult } from '../types';
import {
  mergeMultiplePdfs,
  generatePdfThumbnail,
  inspectPdfPageCount,
} from '../lib/pdfMerge';
import { ProgressBar } from './ProgressBar';

export const MergePdfsConverter: React.FC = () => {
  const [items, setItems] = useState<MergePdfItem[]>([]);
  const [options, setOptions] = useState<MergeOptions>({
    outputFileName: 'merged-document.pdf',
    includeBlankPageBetweenFiles: false,
    normalizePageOrientation: 'keep',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [result, setResult] = useState<MergedPdfResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPreviewItem, setSelectedPreviewItem] = useState<MergePdfItem | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (result?.dataUrl) {
        URL.revokeObjectURL(result.dataUrl);
      }
    };
  }, [result]);

  const handleFilesAdded = async (newFiles: FileList | File[]) => {
    setErrorMessage(null);
    const pdfFiles = Array.from(newFiles).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length === 0) {
      setErrorMessage('Please upload valid PDF files.');
      return;
    }

    const newItems: MergePdfItem[] = [];

    for (const file of pdfFiles) {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const pageCount = await inspectPdfPageCount(file);
      const thumbnail = await generatePdfThumbnail(file);

      newItems.push({
        id,
        file,
        name: file.name,
        size: file.size,
        pageCount,
        pageRange: 'all',
        previewThumbnail: thumbnail,
        rotation: 0,
      });
    }

    setItems((prev) => [...prev, ...newItems]);
    // Reset previous merge result when new files are added
    setResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAdded(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedPreviewItem?.id === id) {
      setSelectedPreviewItem(null);
    }
    setResult(null);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    setItems((prev) => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
    setResult(null);
  };

  const rotateItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newRot = (((item.rotation || 0) + 90) % 360) as 0 | 90 | 180 | 270;
          return { ...item, rotation: newRot };
        }
        return item;
      })
    );
    setResult(null);
  };

  const updatePageRange = (id: string, range: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, pageRange: range } : item))
    );
    setResult(null);
  };

  const clearAll = () => {
    setItems([]);
    setResult(null);
    setSelectedPreviewItem(null);
    setErrorMessage(null);
  };

  const handleMerge = async () => {
    if (items.length < 2) {
      setErrorMessage('Please add at least 2 PDF files to merge.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProgress(0);
      setProgressStatus('Starting PDF merge...');

      const mergedResult = await mergeMultiplePdfs(items, options, (prog, stat) => {
        setProgress(prog);
        setProgressStatus(stat);
      });

      setResult(mergedResult);
      setProgress(100);
      setProgressStatus('Merged successfully!');
    } catch (err: unknown) {
      console.error('Merge error:', err);
      setErrorMessage(
        err instanceof Error ? err.message : 'An error occurred while merging the PDF files.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const totalOriginalPages = items.reduce((acc, curr) => acc + (curr.pageCount || 0), 0);
  const totalOriginalSize = items.reduce((acc, curr) => acc + curr.size, 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Intro Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-700 text-xs font-semibold tracking-wide uppercase shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Unified Document Combiner</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 bg-clip-text text-transparent">
          Merge Multiple PDFs
        </h1>
        <p className="text-sm sm:text-base text-slate-600 font-normal">
          Combine separate documents, reports, receipts, and pages into a single organized PDF.
          Reorder with one click, extract specific page ranges, and rotate orientations.
        </p>
      </div>

      {/* Main Grid: Upload & File Queue on Left, Options & Action on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (Span 7 or 8) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Upload Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-300 relative group overflow-hidden ${
              isDraggingOver
                ? 'border-blue-500 bg-blue-50/80 scale-[1.01] shadow-xl shadow-blue-500/10'
                : 'border-slate-300/80 bg-white/70 hover:border-blue-400 hover:bg-white/90 shadow-sm'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300">
                <Files className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-slate-800">
                  Click or drag & drop PDF files to combine
                </p>
                <p className="text-xs text-slate-500">
                  Select 2 or more PDFs. You can reorder, rotate, or pick custom pages later.
                </p>
              </div>
              <button
                type="button"
                className="liquid-glass__link px-5 py-2 text-xs font-semibold text-blue-700 bg-blue-50/90 border border-blue-200/80 rounded-xl hover:bg-blue-100/90 transition-all shadow-xs flex items-center gap-2 mt-2 pointer-events-none"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Browse PDF Files</span>
              </button>
            </div>
          </div>

          {/* Error Message banner */}
          {errorMessage && (
            <div className="p-4 bg-rose-50/90 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs sm:text-sm animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Notice</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Files List / Order Panel */}
          {items.length > 0 && (
            <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-blue-950/5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Document Sequence ({items.length} {items.length === 1 ? 'file' : 'files'})
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50/80 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                    <span>Add More</span>
                  </button>
                  <button
                    onClick={clearAll}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50/80 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3.5 sm:p-4 rounded-2xl bg-white/90 border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 group"
                  >
                    {/* Left: Sequence index, thumbnail & file info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
                        {index + 1}
                      </div>

                      {/* PDF Thumbnail */}
                      <div className="w-12 h-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center relative shadow-xs">
                        {item.previewThumbnail ? (
                          <img
                            src={item.previewThumbnail}
                            alt={item.name}
                            className={`w-full h-full object-cover transition-transform ${
                              item.rotation === 90
                                ? 'rotate-90'
                                : item.rotation === 180
                                ? 'rotate-180'
                                : item.rotation === 270
                                ? 'rotate-270'
                                : ''
                            }`}
                          />
                        ) : (
                          <Files className="w-5 h-5 text-slate-400" />
                        )}
                        {item.rotation ? (
                          <span className="absolute bottom-0.5 right-0.5 px-1 bg-blue-600 text-[9px] text-white font-bold rounded">
                            {item.rotation}°
                          </span>
                        ) : null}
                      </div>

                      {/* File Details */}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-slate-800 truncate" title={item.name}>
                          {item.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span>{formatFileSize(item.size)}</span>
                          <span>•</span>
                          <span className="font-medium text-blue-600">
                            {item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Page Range selection, rotation & ordering buttons */}
                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Page Range selector */}
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200 text-xs">
                        <Split className="w-3 h-3 text-slate-400" />
                        <span className="text-[11px] text-slate-500">Pages:</span>
                        <input
                          type="text"
                          value={item.pageRange}
                          onChange={(e) => updatePageRange(item.id, e.target.value)}
                          placeholder="all or 1-3"
                          className="w-16 sm:w-20 px-1.5 py-0.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-hidden focus:border-blue-500 font-mono text-slate-700"
                          title="Examples: 'all' for all pages, or '1-3', or '1, 3, 5'"
                        />
                      </div>

                      {/* Rotate Button */}
                      <button
                        onClick={() => rotateItem(item.id)}
                        title="Rotate PDF 90° clockwise"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>

                      {/* Reorder Buttons */}
                      <div className="flex items-center gap-0.5 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
                        <button
                          onClick={() => moveItem(index, 'up')}
                          disabled={index === 0}
                          title="Move up in order"
                          className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors rounded"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveItem(index, 'down')}
                          disabled={index === items.length - 1}
                          title="Move down in order"
                          className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors rounded"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.id)}
                        title="Remove from merge list"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Tip */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60">
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>
                  The merged PDF will append documents in the exact order shown above (1 to {items.length}).
                  Use arrows to reorder.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Span 5 or 4): Settings, Stats & Merge Action */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Options & Merge Control Card */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-blue-950/5 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sliders className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Merge Settings
              </h3>
            </div>

            {/* Output File Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Output File Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={options.outputFileName}
                  onChange={(e) =>
                    setOptions((prev) => ({ ...prev, outputFileName: e.target.value }))
                  }
                  placeholder="merged-document.pdf"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 font-medium text-slate-800 shadow-2xs"
                />
              </div>
            </div>

            {/* Blank page between files toggle */}
            <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={options.includeBlankPageBetweenFiles}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    includeBlankPageBetweenFiles: e.target.checked,
                  }))
                }
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800 block">
                  Add blank sheet between documents
                </span>
                <span className="text-slate-500 text-[11px]">
                  Helpful for double-sided (duplex) printing so documents don't share a page.
                </span>
              </div>
            </label>

            {/* Orientation normalization */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Page Orientation
              </label>
              <select
                value={options.normalizePageOrientation}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    normalizePageOrientation: e.target.value as 'keep' | 'portrait' | 'landscape',
                  }))
                }
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 text-slate-800 shadow-2xs"
              >
                <option value="keep">Preserve original page orientations</option>
                <option value="portrait">Normalize all pages to Portrait</option>
                <option value="landscape">Normalize all pages to Landscape</option>
              </select>
            </div>

            {/* Summary statistics */}
            <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/60 border border-blue-100 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Selected Documents:</span>
                <span className="font-bold text-slate-900">{items.length}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Total Source Pages:</span>
                <span className="font-bold text-slate-900">{totalOriginalPages} pages</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Combined Source Size:</span>
                <span className="font-bold text-slate-900">{formatFileSize(totalOriginalSize)}</span>
              </div>
            </div>

            {/* Merge Action Button with Liquid Glass styling */}
            <button
              onClick={handleMerge}
              disabled={isProcessing || items.length < 2}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg transition-all ${
                items.length < 2
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25 active:scale-[0.98]'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Merging Documents...</span>
                </>
              ) : (
                <>
                  <Files className="w-4 h-4" />
                  <span>Merge {items.length > 0 ? items.length : ''} PDFs Now</span>
                </>
              )}
            </button>

            {items.length === 1 && (
              <p className="text-[11px] text-amber-600 text-center font-medium">
                Add at least 1 more PDF to enable merging.
              </p>
            )}
          </div>

          {/* Progress Bar during conversion */}
          {isProcessing && (
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-4 rounded-2xl shadow-sm">
              <ProgressBar
                progress={progress}
                status={progressStatus}
                isProcessing={isProcessing}
              />
            </div>
          )}

          {/* Success & Download Card */}
          {result && (
            <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white/90 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-xl shadow-emerald-950/5 space-y-4 animate-scaleUp">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-emerald-950">
                    PDFs Merged Successfully!
                  </h4>
                  <p className="text-xs text-emerald-800">
                    {result.totalPages} pages combined from {result.includedFilesCount} documents.
                  </p>
                </div>
              </div>

              <div className="bg-white/90 rounded-2xl p-3 border border-emerald-200/60 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">File Name:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[200px]" title={result.fileName}>
                    {result.fileName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Merged Size:</span>
                  <span className="font-semibold text-slate-800">
                    {formatFileSize(result.size)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Total Pages:</span>
                  <span className="font-semibold text-emerald-700">
                    {result.totalPages}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <a
                  href={result.dataUrl}
                  download={result.fileName}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition-all text-center"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Merged PDF</span>
                </a>
                <a
                  href={result.dataUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 rounded-xl bg-white/90 hover:bg-white text-slate-700 font-semibold text-xs border border-slate-200/80 flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
