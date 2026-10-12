import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Trash2,
  Download,
  Stamp,
  PenTool,
  CheckCircle2,
  Calendar,
  Grid,
  RotateCw,
  Eye,
  Sliders,
  Type,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Move,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { FileDropzone } from './FileDropzone';
import { ProgressBar } from './ProgressBar';
import { SignaturePadModal } from './SignaturePadModal';
import { applySignAndWatermarkToPdf } from '../lib/pdfSignWatermark';
import { downloadSingleFile, downloadPdfsAsZip } from '../lib/zipHelper';
import type {
  PdfFileItem,
  WatermarkSettings,
  SignatureSettings,
  ProcessedPdfResult,
} from '../types';

const WATERMARK_PRESETS = [
  'CONFIDENTIAL',
  'DRAFT',
  'OFFICIAL COPY',
  'SAMPLE',
  'APPROVED',
  'INTERNAL USE',
];

const WATERMARK_COLORS = [
  { label: 'Slate Gray', value: '#64748b' },
  { label: 'Crimson Red', value: '#dc2626' },
  { label: 'Royal Blue', value: '#2563eb' },
  { label: 'Amber Gold', value: '#d97706' },
  { label: 'Dark Charcoal', value: '#1e293b' },
];

export const SignWatermarkConverter: React.FC = () => {
  const [items, setItems] = useState<PdfFileItem[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [previewPageNum, setPreviewPageNum] = useState(1);
  const [totalPagesForPreview, setTotalPagesForPreview] = useState(1);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Modal for signature creation
  const [isSigModalOpen, setIsSigModalOpen] = useState(false);

  // Watermark Settings
  const [watermark, setWatermark] = useState<WatermarkSettings>({
    enabled: true,
    type: 'text',
    text: 'CONFIDENTIAL',
    textColor: '#dc2626',
    textSize: 54,
    opacity: 0.22,
    rotation: -45,
    repeat: false,
    imageScale: 0.5,
    position: 'center',
    targetPages: 'all',
    customPages: '',
  });

  // Signature Settings
  const [signature, setSignature] = useState<SignatureSettings>({
    enabled: false,
    signatureDataUrl: undefined,
    position: 'bottom-right',
    customXPercent: 72,
    customYPercent: 12,
    scale: 1.0,
    targetPages: 'last',
    customPages: '',
    dateStamp: {
      enabled: true,
      text: `Signed on ${new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`,
      color: '#475569',
    },
  });

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [results, setResults] = useState<ProcessedPdfResult[]>([]);

  // Dragging signature on preview
  const [isDraggingSig, setIsDraggingSig] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  // Handle files selected
  const handleFilesSelected = async (files: File[]) => {
    const newItems: PdfFileItem[] = [];

    for (const file of files) {
      let pageCount = 1;
      try {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        pageCount = pdf.numPages;
      } catch (err) {
        console.warn('Could not read page count for', file.name, err);
      }

      newItems.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
        pageCount,
      });
    }

    setItems((prev) => [...prev, ...newItems]);
    setResults([]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      if (selectedItemIndex >= updated.length) {
        setSelectedItemIndex(Math.max(0, updated.length - 1));
      }
      return updated;
    });
    setResults([]);
  };

  const handleClearAll = () => {
    setItems([]);
    setResults([]);
  };

  // Render Preview of PDF Page
  useEffect(() => {
    const currentItem = items[selectedItemIndex];
    if (!currentItem) return;

    let isCancelled = false;
    setPreviewLoading(true);

    const renderPage = async () => {
      try {
        const buffer = await currentItem.file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        if (isCancelled) return;

        setTotalPagesForPreview(pdf.numPages);
        const validPage = Math.min(Math.max(1, previewPageNum), pdf.numPages);
        const page = await pdf.getPage(validPage);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale: 1.2 });
        const canvas = previewCanvasRef.current;
        if (!canvas) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: ctx,
          viewport,
          canvas,
        }).promise;
      } catch (err) {
        console.error('Error rendering PDF preview:', err);
      } finally {
        if (!isCancelled) setPreviewLoading(false);
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
    };
  }, [items, selectedItemIndex, previewPageNum]);

  // Handle Dragging Signature on Interactive Preview
  const handlePreviewMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingSig || !previewContainerRef.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPct = Math.max(5, Math.min(90, Math.round((x / rect.width) * 100)));
    // PDF Y coordinates: inverted compared to top-down HTML DOM
    const yPct = Math.max(5, Math.min(90, Math.round((1 - y / rect.height) * 100)));

    setSignature((prev) => ({
      ...prev,
      position: 'custom',
      customXPercent: xPct,
      customYPercent: yPct,
    }));
  };

  const handlePreviewMouseUp = () => {
    if (isDraggingSig) {
      setIsDraggingSig(false);
    }
  };

  // Process Document
  const handleProcess = async () => {
    if (items.length === 0) return;
    if (!watermark.enabled && (!signature.enabled || !signature.signatureDataUrl)) {
      alert('Please enable Watermark or create a Signature before processing.');
      return;
    }

    setIsProcessing(true);
    setProgress(5);
    setProgressStatus('Initializing client-side document engine...');

    try {
      const processedResults: ProcessedPdfResult[] = [];
      const total = items.length;

      for (let i = 0; i < total; i++) {
        const item = items[i];
        const res = await applySignAndWatermarkToPdf(
          item.file,
          watermark,
          signature,
          (pct, status) => {
            const overall = Math.round((i / total) * 100 + (pct / total));
            setProgress(overall);
            setProgressStatus(status);
          }
        );
        processedResults.push(res);
      }

      setResults(processedResults);
      setProgress(100);
      setProgressStatus('All PDF documents signed & watermarked!');
    } catch (err) {
      console.error('Processing failed', err);
      alert(err instanceof Error ? err.message : 'Error applying watermark/signature to PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const currentItem = items[selectedItemIndex];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. DROPZONE OR FILE SELECTION */}
      {items.length === 0 ? (
        <FileDropzone
          accept=".pdf,application/pdf"
          mode="pdf"
          title="Drop PDF documents to Sign & Watermark"
          description="Protect and authenticate contracts, agreements, invoices, or research papers with instant client-side watermarks and digital signatures"
          onFilesSelected={handleFilesSelected}
        />
      ) : (
        <div className="space-y-6">
          {/* Top Bar: Loaded Files summary & Add More */}
          <div className="bg-white/85 backdrop-blur-xl border border-white/70 p-4 sm:p-5 rounded-3xl shadow-xl shadow-blue-950/5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Stamp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {items.length} PDF Document{items.length > 1 ? 's' : ''} Ready
                </h2>
                <p className="text-xs text-slate-500">
                  Total Size: {formatFileSize(items.reduce((acc, i) => acc + i.size, 0))} · 100% Client-Side Privacy
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="cursor-pointer px-3.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100/70 border border-blue-200/60 rounded-xl transition-colors flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Add More PDFs</span>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFilesSelected(Array.from(e.target.files));
                    }
                  }}
                />
              </label>
              <button
                onClick={handleClearAll}
                className="px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-100 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* MAIN 2-COLUMN WORKSPACE: LEFT = INTERACTIVE LIVE PREVIEW, RIGHT = CONTROLS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: INTERACTIVE PREVIEW (5 COLS) */}
            <div className="lg:col-span-5 bg-white/85 backdrop-blur-xl border border-white/70 p-5 rounded-3xl shadow-xl shadow-blue-950/5 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Interactive Live Preview
                  </span>
                </div>
                {totalPagesForPreview > 1 && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold bg-slate-100 px-2.5 py-1 rounded-lg">
                    <button
                      disabled={previewPageNum <= 1}
                      onClick={() => setPreviewPageNum((p) => Math.max(1, p - 1))}
                      className="disabled:opacity-30 hover:text-blue-600"
                    >
                      ◀
                    </button>
                    <span>
                      Page {previewPageNum} of {totalPagesForPreview}
                    </span>
                    <button
                      disabled={previewPageNum >= totalPagesForPreview}
                      onClick={() => setPreviewPageNum((p) => Math.min(totalPagesForPreview, p + 1))}
                      className="disabled:opacity-30 hover:text-blue-600"
                    >
                      ▶
                    </button>
                  </div>
                )}
              </div>

              {/* Preview Container with Live Overlays */}
              <div
                ref={previewContainerRef}
                onMouseMove={handlePreviewMouseMove}
                onMouseUp={handlePreviewMouseUp}
                className="relative border border-slate-200 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center min-h-[380px] shadow-inner select-none"
              >
                {previewLoading && (
                  <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-xs flex items-center justify-center text-xs text-slate-600 font-medium">
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                    Rendering Page Preview...
                  </div>
                )}

                {/* Base PDF Canvas */}
                <canvas
                  ref={previewCanvasRef}
                  className="max-h-[500px] w-auto max-w-full shadow-md object-contain rounded-lg"
                />

                {/* LIVE WATERMARK OVERLAY */}
                {watermark.enabled && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                    {watermark.type === 'text' && watermark.text && (
                      watermark.repeat ? (
                        <div
                          className="grid grid-cols-3 grid-rows-3 w-full h-full p-4 gap-6 items-center justify-items-center opacity-60"
                        >
                          {Array.from({ length: 9 }).map((_, i) => (
                            <span
                              key={i}
                              style={{
                                color: watermark.textColor,
                                opacity: watermark.opacity,
                                transform: `rotate(${watermark.rotation}deg)`,
                                fontSize: `${Math.round(watermark.textSize * 0.45)}px`,
                                fontWeight: 800,
                              }}
                              className="whitespace-nowrap select-none"
                            >
                              {watermark.text}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div
                          style={{
                            color: watermark.textColor,
                            opacity: watermark.opacity,
                            transform: `rotate(${watermark.rotation}deg)`,
                            fontSize: `${Math.round(watermark.textSize * 0.65)}px`,
                            fontWeight: 800,
                          }}
                          className="whitespace-nowrap tracking-wider select-none text-center"
                        >
                          {watermark.text}
                        </div>
                      )
                    )}

                    {watermark.type === 'image' && watermark.imageDataUrl && (
                      <img
                        src={watermark.imageDataUrl}
                        alt="Watermark preview"
                        style={{
                          opacity: watermark.opacity,
                          transform: `scale(${watermark.imageScale})`,
                        }}
                        className="max-w-[80%] max-h-[80%] object-contain select-none"
                      />
                    )}
                  </div>
                )}

                {/* LIVE SIGNATURE OVERLAY */}
                {signature.enabled && signature.signatureDataUrl && (
                  <div
                    onMouseDown={() => setIsDraggingSig(true)}
                    style={{
                      position: 'absolute',
                      left:
                        signature.position === 'bottom-left'
                          ? '10%'
                          : signature.position === 'bottom-center'
                          ? '50%'
                          : signature.position === 'top-right'
                          ? '85%'
                          : signature.position === 'custom'
                          ? `${signature.customXPercent}%`
                          : '85%',
                      bottom:
                        signature.position === 'top-right'
                          ? '80%'
                          : signature.position === 'custom'
                          ? `${signature.customYPercent}%`
                          : '10%',
                      transform:
                        signature.position === 'bottom-center'
                          ? `translate(-50%, 0) scale(${signature.scale})`
                          : signature.position === 'top-right'
                          ? `translate(-100%, 0) scale(${signature.scale})`
                          : signature.position === 'bottom-right'
                          ? `translate(-100%, 0) scale(${signature.scale})`
                          : `scale(${signature.scale})`,
                      transformOrigin: 'bottom center',
                    }}
                    className={`cursor-grab active:cursor-grabbing p-1.5 rounded-lg border-2 border-dashed transition-colors select-none ${
                      isDraggingSig
                        ? 'border-blue-600 bg-blue-50/70 shadow-lg'
                        : 'border-blue-400/80 bg-white/80 hover:border-blue-600 hover:bg-white'
                    }`}
                  >
                    <div className="relative group">
                      <img
                        src={signature.signatureDataUrl}
                        alt="Signature Stamp"
                        className="h-12 w-auto object-contain pointer-events-none"
                      />
                      {signature.dateStamp?.enabled && (
                        <div
                          style={{ color: signature.dateStamp.color }}
                          className="text-[9px] font-semibold whitespace-nowrap mt-0.5"
                        >
                          {signature.dateStamp.text}
                        </div>
                      )}
                      <div className="absolute -top-6 -right-2 bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded shadow flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Move className="w-2.5 h-2.5" />
                        <span>Drag</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-500 bg-blue-50/60 border border-blue-100 p-2.5 rounded-xl flex items-center gap-2">
                <Move className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>
                  Tip: You can drag the signature directly on the preview to adjust its exact location!
                </span>
              </div>

              {/* PDF Documents Selector if multiple loaded */}
              {items.length > 1 && (
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <span className="text-xs font-semibold text-slate-700">Select active file to preview:</span>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {items.map((item, idx) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedItemIndex(idx);
                          setPreviewPageNum(1);
                        }}
                        className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          selectedItemIndex === idx
                            ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="truncate flex-1 mr-2">{item.name}</div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(item.id);
                          }}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: WATERMARK & SIGNATURE SETTINGS (7 COLS) */}
            <div className="lg:col-span-7 space-y-6">
              {/* SECTION A: WATERMARK SETTINGS */}
              <div className="bg-white/85 backdrop-blur-xl border border-white/70 p-5 sm:p-6 rounded-3xl shadow-xl shadow-blue-950/5 space-y-5">
                {/* Header with Switch */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <Stamp className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Document Watermark</h3>
                      <p className="text-xs text-slate-500">Protect against unauthorized copying or leaks</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={watermark.enabled}
                      onChange={(e) =>
                        setWatermark((prev) => ({ ...prev, enabled: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {watermark.enabled && (
                  <div className="space-y-4 pt-1">
                    {/* Watermark Type Selector */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setWatermark((prev) => ({ ...prev, type: 'text' }))}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                          watermark.type === 'text'
                            ? 'bg-white text-blue-600 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Type className="w-3.5 h-3.5" />
                        <span>Text Watermark</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setWatermark((prev) => ({ ...prev, type: 'image' }))}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                          watermark.type === 'image'
                            ? 'bg-white text-blue-600 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Logo / Image Stamp</span>
                      </button>
                    </div>

                    {/* TEXT WATERMARK CONTROLS */}
                    {watermark.type === 'text' && (
                      <div className="space-y-4">
                        {/* Text Presets */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Quick Presets:
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {WATERMARK_PRESETS.map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setWatermark((prev) => ({ ...prev, text: preset }))}
                                className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                                  watermark.text === preset
                                    ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Custom Text Input */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Watermark Text
                          </label>
                          <input
                            type="text"
                            value={watermark.text}
                            onChange={(e) =>
                              setWatermark((prev) => ({ ...prev, text: e.target.value }))
                            }
                            placeholder="e.g. STRICTLY CONFIDENTIAL"
                            className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                        </div>

                        {/* Color & Angle row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                              Stamp Color:
                            </label>
                            <div className="flex items-center gap-2">
                              {WATERMARK_COLORS.map((c) => (
                                <button
                                  key={c.value}
                                  title={c.label}
                                  onClick={() =>
                                    setWatermark((prev) => ({ ...prev, textColor: c.value }))
                                  }
                                  style={{ backgroundColor: c.value }}
                                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                                    watermark.textColor === c.value
                                      ? 'border-blue-500 scale-110 shadow-sm'
                                      : 'border-transparent hover:scale-105'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                              Angle:
                            </label>
                            <div className="grid grid-cols-3 gap-1 text-xs">
                              <button
                                type="button"
                                onClick={() => setWatermark((prev) => ({ ...prev, rotation: -45 }))}
                                className={`py-1 rounded-lg border text-center transition-all ${
                                  watermark.rotation === -45
                                    ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                                    : 'border-slate-200 text-slate-600'
                                }`}
                              >
                                Diagonal (-45°)
                              </button>
                              <button
                                type="button"
                                onClick={() => setWatermark((prev) => ({ ...prev, rotation: 0 }))}
                                className={`py-1 rounded-lg border text-center transition-all ${
                                  watermark.rotation === 0
                                    ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                                    : 'border-slate-200 text-slate-600'
                                }`}
                              >
                                Flat (0°)
                              </button>
                              <button
                                type="button"
                                onClick={() => setWatermark((prev) => ({ ...prev, rotation: 90 }))}
                                className={`py-1 rounded-lg border text-center transition-all ${
                                  watermark.rotation === 90
                                    ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                                    : 'border-slate-200 text-slate-600'
                                }`}
                              >
                                Vertical (90°)
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Sliders: Opacity & Size */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          <div>
                            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                              <span>Opacity:</span>
                              <span className="text-blue-600 font-mono">
                                {Math.round(watermark.opacity * 100)}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.05"
                              max="0.80"
                              step="0.01"
                              value={watermark.opacity}
                              onChange={(e) =>
                                setWatermark((prev) => ({
                                  ...prev,
                                  opacity: parseFloat(e.target.value),
                                }))
                              }
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                              <span>Font Size:</span>
                              <span className="text-blue-600 font-mono">{watermark.textSize}pt</span>
                            </div>
                            <input
                              type="range"
                              min="24"
                              max="80"
                              step="2"
                              value={watermark.textSize}
                              onChange={(e) =>
                                setWatermark((prev) => ({
                                  ...prev,
                                  textSize: parseInt(e.target.value, 10),
                                }))
                              }
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                        </div>

                        {/* Repeat Grid Toggle */}
                        <label className="flex items-center gap-2 pt-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={watermark.repeat}
                            onChange={(e) =>
                              setWatermark((prev) => ({ ...prev, repeat: e.target.checked }))
                            }
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Grid className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-xs font-medium text-slate-700">
                            Tile watermark across whole page (Tiled Security Pattern)
                          </span>
                        </label>
                      </div>
                    )}

                    {/* IMAGE WATERMARK CONTROLS */}
                    {watermark.type === 'image' && (
                      <div className="space-y-4">
                        <label className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition-all block">
                          <ImageIcon className="w-6 h-6 text-blue-500 mb-1" />
                          <span className="text-xs font-bold text-slate-700">
                            Upload Logo or Badge (PNG, JPG)
                          </span>
                          <input
                            type="file"
                            accept="image/png, image/jpeg"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  setWatermark((prev) => ({
                                    ...prev,
                                    imageDataUrl: ev.target?.result as string,
                                  }));
                                };
                                reader.readAsDataURL(e.target.files[0]);
                              }
                            }}
                          />
                        </label>

                        {watermark.imageDataUrl && (
                          <div className="flex items-center gap-4 p-3 bg-slate-100 rounded-xl">
                            <img
                              src={watermark.imageDataUrl}
                              alt="Uploaded logo"
                              className="h-10 w-auto object-contain bg-white rounded p-1 border"
                            />
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between text-xs font-semibold text-slate-700">
                                <span>Logo Scale:</span>
                                <span className="text-blue-600 font-mono">
                                  {Math.round(watermark.imageScale * 100)}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0.2"
                                max="1.5"
                                step="0.05"
                                value={watermark.imageScale}
                                onChange={(e) =>
                                  setWatermark((prev) => ({
                                    ...prev,
                                    imageScale: parseFloat(e.target.value),
                                  }))
                                }
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Watermark Target Pages */}
                    <div className="pt-2 border-t border-slate-100">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Apply Watermark To:
                      </label>
                      <div className="grid grid-cols-4 gap-1.5 text-xs">
                        {(['all', 'first', 'last', 'custom'] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() =>
                              setWatermark((prev) => ({ ...prev, targetPages: mode }))
                            }
                            className={`py-1.5 rounded-xl border text-center capitalize transition-all ${
                              watermark.targetPages === mode
                                ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                                : 'border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {mode === 'all'
                              ? 'All Pages'
                              : mode === 'first'
                              ? '1st Page'
                              : mode === 'last'
                              ? 'Last Page'
                              : 'Custom'}
                          </button>
                        ))}
                      </div>

                      {watermark.targetPages === 'custom' && (
                        <input
                          type="text"
                          value={watermark.customPages || ''}
                          onChange={(e) =>
                            setWatermark((prev) => ({ ...prev, customPages: e.target.value }))
                          }
                          placeholder="e.g. 1-3, 5, 8"
                          className="mt-2 w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION B: DIGITAL SIGNATURE SETTINGS */}
              <div className="bg-white/85 backdrop-blur-xl border border-white/70 p-5 sm:p-6 rounded-3xl shadow-xl shadow-blue-950/5 space-y-5">
                {/* Header with Switch */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                      <PenTool className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Digital Signature Stamp</h3>
                      <p className="text-xs text-slate-500">Sign contracts, certificates, and invoices</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={signature.enabled}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSignature((prev) => ({ ...prev, enabled: checked }));
                        if (checked && !signature.signatureDataUrl) {
                          setIsSigModalOpen(true);
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {signature.enabled && (
                  <div className="space-y-4 pt-1">
                    {/* Active Signature Preview or Create Button */}
                    {signature.signatureDataUrl ? (
                      <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:8px_8px] p-2 rounded-xl border border-slate-200 bg-white">
                            <img
                              src={signature.signatureDataUrl}
                              alt="Signature preview"
                              className="h-10 w-auto object-contain"
                            />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Signature Ready</span>
                            </span>
                            <span className="text-[11px] text-slate-500">Transparent PNG stamp</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsSigModalOpen(true)}
                            className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-xl transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSignature((prev) => ({ ...prev, signatureDataUrl: undefined }))
                            }
                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsSigModalOpen(true)}
                        className="w-full py-4 border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-2xl bg-blue-50/40 hover:bg-blue-50/80 text-blue-600 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <PenTool className="w-4 h-4" />
                        <span>Draw, Type, or Upload Signature</span>
                      </button>
                    )}

                    {/* Position Presets */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Placement Position:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                        {[
                          { key: 'bottom-right', label: 'Bottom Right' },
                          { key: 'bottom-left', label: 'Bottom Left' },
                          { key: 'bottom-center', label: 'Bottom Center' },
                          { key: 'top-right', label: 'Top Right' },
                        ].map((pos) => (
                          <button
                            key={pos.key}
                            type="button"
                            onClick={() =>
                              setSignature((prev) => ({
                                ...prev,
                                position: pos.key as any,
                              }))
                            }
                            className={`py-1.5 rounded-xl border text-center transition-all ${
                              signature.position === pos.key
                                ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                                : 'border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {pos.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Signature Scale */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>Signature Size:</span>
                        <span className="text-blue-600 font-mono">
                          {Math.round(signature.scale * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="1.8"
                        step="0.05"
                        value={signature.scale}
                        onChange={(e) =>
                          setSignature((prev) => ({
                            ...prev,
                            scale: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    {/* Date Stamp Toggle */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span className="text-xs font-semibold text-slate-700">
                            Include Date & Verification Stamp
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={signature.dateStamp?.enabled ?? true}
                          onChange={(e) =>
                            setSignature((prev) => ({
                              ...prev,
                              dateStamp: {
                                enabled: e.target.checked,
                                text: prev.dateStamp?.text || `Signed on ${new Date().toLocaleDateString()}`,
                                color: prev.dateStamp?.color || '#475569',
                              },
                            }))
                          }
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </label>

                      {signature.dateStamp?.enabled && (
                        <input
                          type="text"
                          value={signature.dateStamp.text}
                          onChange={(e) =>
                            setSignature((prev) => ({
                              ...prev,
                              dateStamp: {
                                enabled: true,
                                text: e.target.value,
                                color: prev.dateStamp?.color || '#475569',
                              },
                            }))
                          }
                          className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-xl"
                        />
                      )}
                    </div>

                    {/* Signature Target Pages */}
                    <div className="pt-2 border-t border-slate-100">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Place Signature On:
                      </label>
                      <div className="grid grid-cols-4 gap-1.5 text-xs">
                        {(['last', 'first', 'all', 'custom'] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() =>
                              setSignature((prev) => ({ ...prev, targetPages: mode }))
                            }
                            className={`py-1.5 rounded-xl border text-center capitalize transition-all ${
                              signature.targetPages === mode
                                ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                                : 'border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {mode === 'last'
                              ? 'Last Page (Rec.)'
                              : mode === 'first'
                              ? '1st Page'
                              : mode === 'all'
                              ? 'All Pages'
                              : 'Custom'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION C: ACTION TRIGGER BUTTON */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleProcess}
                  className="liquid-glass-btn w-full py-4 px-6 text-sm sm:text-base font-extrabold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 rounded-2xl flex items-center justify-center gap-3 cursor-pointer shadow-xl shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Stamp className="w-5 h-5" />
                  <span>
                    {isProcessing
                      ? 'Processing Document...'
                      : `Apply Sign & Watermark (${items.length} PDF${items.length > 1 ? 's' : ''})`}
                  </span>
                </button>
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
            </div>
          </div>

          {/* 3. DOWNLOAD & RESULTS SECTION */}
          {results.length > 0 && (
            <div className="bg-white/90 backdrop-blur-xl border border-white/80 p-6 sm:p-8 rounded-3xl shadow-xl shadow-blue-950/5 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
                    <CheckCircle2 className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      Document Processing Complete!
                    </h3>
                    <p className="text-xs text-slate-500">
                      {results.length} protected document{results.length > 1 ? 's' : ''} ready to download
                    </p>
                  </div>
                </div>

                {results.length > 1 && (
                  <button
                    onClick={() => downloadPdfsAsZip(results as any, 'signed_watermarked_pdfs.zip')}
                    className="liquid-glass-btn px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download All as ZIP</span>
                  </button>
                )}
              </div>

              {/* Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((res, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white transition-all flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate">
                          {res.fileName}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {formatFileSize(res.size)} · {res.pageCount} page(s)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={res.dataUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white border border-slate-200 rounded-xl hover:border-blue-200 transition-colors"
                      >
                        Preview
                      </a>
                      <button
                        onClick={() => downloadSingleFile(res.blob, res.fileName)}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Signature Pad Modal */}
      <SignaturePadModal
        isOpen={isSigModalOpen}
        onClose={() => setIsSigModalOpen(false)}
        onSave={(dataUrl) => {
          setSignature((prev) => ({
            ...prev,
            enabled: true,
            signatureDataUrl: dataUrl,
          }));
        }}
      />
    </div>
  );
};
