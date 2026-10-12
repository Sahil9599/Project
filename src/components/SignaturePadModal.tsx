import React, { useRef, useState, useEffect } from 'react';
import { X, Check, RotateCcw, PenTool, Type, Upload, Sparkles } from 'lucide-react';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureDataUrl: string) => void;
  initialSignature?: string;
}

const INK_COLORS = [
  { label: 'Black Ink', value: '#0f172a' },
  { label: 'Navy Blue', value: '#1d4ed8' },
  { label: 'Royal Blue', value: '#2563eb' },
  { label: 'Deep Red', value: '#b91c1c' },
  { label: 'Forest Green', value: '#15803d' },
];

const SIGNATURE_FONTS = [
  { name: 'Cursive Flow', font: 'italic 44px "Brush Script MT", "Segoe Script", cursive' },
  { name: 'Classic Script', font: 'italic 38px "Dancing Script", "Lucida Handwriting", cursive' },
  { name: 'Executive Elegance', font: 'italic 36px "Zapfino", "Apple Chancery", cursive' },
  { name: 'Modern Hand', font: 'normal 40px "Comic Sans MS", "Caveat", cursive' },
];

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [tab, setTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [selectedColor, setSelectedColor] = useState('#0f172a');
  const [typedName, setTypedName] = useState('Sahil Signature');
  const [selectedFontIndex, setSelectedFontIndex] = useState(0);
  const [penWidth, setPenWidth] = useState(2.5);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawnContent, setHasDrawnContent] = useState(false);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);

  // Initialize or clear canvas
  useEffect(() => {
    if (isOpen && tab === 'draw') {
      const timer = setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setHasDrawnContent(false);
          }
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, tab]);

  if (!isOpen) return null;

  // Drawing event handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = selectedColor;
    setIsDrawing(true);
    setHasDrawnContent(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.closePath();
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawnContent(false);
    }
  };

  // Convert typed text to transparent PNG signature
  const generateTypedSignatureUrl = (): string => {
    const offscreen = document.createElement('canvas');
    offscreen.width = 600;
    offscreen.height = 200;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, offscreen.width, offscreen.height);
    ctx.fillStyle = selectedColor;
    ctx.font = SIGNATURE_FONTS[selectedFontIndex].font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName || 'Signed', offscreen.width / 2, offscreen.height / 2);

    return offscreen.toDataURL('image/png');
  };

  // Process uploaded image to make white background transparent
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const offscreen = document.createElement('canvas');
        offscreen.width = Math.min(800, img.width);
        offscreen.height = Math.round((offscreen.width / img.width) * img.height);
        const ctx = offscreen.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, offscreen.width, offscreen.height);
        const imgData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
        const data = imgData.data;

        // Auto remove paper white background
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // If close to white, make transparent
          if (r > 200 && g > 200 && b > 200) {
            data[i + 3] = 0; // alpha = 0
          } else {
            // Increase dark ink contrast
            data[i + 3] = 255;
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const processedUrl = offscreen.toDataURL('image/png');
        setUploadedPreview(processedUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    if (tab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawnContent) {
        alert('Please draw your signature before applying.');
        return;
      }
      onSave(canvas.toDataURL('image/png'));
      onClose();
    } else if (tab === 'type') {
      if (!typedName.trim()) {
        alert('Please enter your name.');
        return;
      }
      const url = generateTypedSignatureUrl();
      onSave(url);
      onClose();
    } else if (tab === 'upload') {
      if (!uploadedPreview) {
        alert('Please upload an image of your signature.');
        return;
      }
      onSave(uploadedPreview);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Create Digital Signature</h3>
              <p className="text-xs text-slate-500">Draw, type, or upload transparent e-signature</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 pt-3 bg-white gap-2">
          <button
            onClick={() => setTab('draw')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              tab === 'draw'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Draw Signature</span>
          </button>
          <button
            onClick={() => setTab('type')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              tab === 'type'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Type Signature</span>
          </button>
          <button
            onClick={() => setTab('upload')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              tab === 'upload'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: DRAW SIGNATURE */}
          {tab === 'draw' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-medium">Draw on the signature pad below:</span>
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1 text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Pad</span>
                </button>
              </div>

              {/* Drawing Canvas Area */}
              <div className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-white shadow-inner overflow-hidden cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  width={550}
                  height={220}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-44 touch-none block"
                />
                {!hasDrawnContent && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-300 text-sm italic select-none">
                    Sign here with mouse or fingertip...
                  </div>
                )}
                {/* Baseline Guide */}
                <div className="absolute bottom-10 left-6 right-6 border-b border-slate-200 pointer-events-none opacity-60" />
              </div>

              {/* Controls: Color & Stroke */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">Ink Color:</span>
                  <div className="flex items-center gap-1.5">
                    {INK_COLORS.map((c) => (
                      <button
                        key={c.value}
                        title={c.label}
                        onClick={() => setSelectedColor(c.value)}
                        style={{ backgroundColor: c.value }}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          selectedColor === c.value
                            ? 'border-blue-500 scale-110 shadow-sm'
                            : 'border-transparent hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">Stroke:</span>
                  <select
                    value={penWidth}
                    onChange={(e) => setPenWidth(Number(e.target.value))}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700"
                  >
                    <option value={1.5}>Fine (1.5px)</option>
                    <option value={2.5}>Medium (2.5px)</option>
                    <option value={4.0}>Bold (4px)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TYPE SIGNATURE */}
          {tab === 'type' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Type Your Name or Initials
                </label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="e.g. Sahil Sharma"
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Font Style Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Choose Script Style
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SIGNATURE_FONTS.map((sf, idx) => (
                    <button
                      key={sf.name}
                      type="button"
                      onClick={() => setSelectedFontIndex(idx)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedFontIndex === idx
                          ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="text-[10px] font-medium text-slate-400 mb-1">{sf.name}</div>
                      <div
                        style={{
                          color: selectedColor,
                          fontFamily: sf.font.includes('Zapfino')
                            ? 'cursive'
                            : 'cursive, sans-serif',
                          fontSize: '20px',
                          fontStyle: 'italic',
                        }}
                        className="truncate"
                      >
                        {typedName || 'Your Signature'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selector */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs font-medium text-slate-600">Ink Color:</span>
                <div className="flex items-center gap-1.5">
                  {INK_COLORS.map((c) => (
                    <button
                      key={c.value}
                      title={c.label}
                      onClick={() => setSelectedColor(c.value)}
                      style={{ backgroundColor: c.value }}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        selectedColor === c.value
                          ? 'border-blue-500 scale-110 shadow-sm'
                          : 'border-transparent hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: UPLOAD IMAGE */}
          {tab === 'upload' && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition-all block">
                <Upload className="w-8 h-8 text-blue-500 mb-2" />
                <span className="text-xs font-bold text-slate-700">Click to upload signature photo/PNG</span>
                <span className="text-[11px] text-slate-400 mt-1">
                  White backgrounds are automatically made transparent!
                </span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageUpload(e.target.files[0]);
                    }
                  }}
                />
              </label>

              {uploadedPreview && (
                <div className="p-4 bg-slate-100 rounded-2xl flex flex-col items-center gap-2">
                  <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Processed Signature (Transparent Background):</span>
                  </div>
                  <div className="bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:12px_12px] p-3 rounded-xl border border-slate-200">
                    <img
                      src={uploadedPreview}
                      alt="Uploaded signature preview"
                      className="max-h-24 max-w-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="liquid-glass-btn px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20"
          >
            <Check className="w-4 h-4" />
            <span>Apply Signature</span>
          </button>
        </div>
      </div>
    </div>
  );
};
