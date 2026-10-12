import React from 'react';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { downloadSingleFile } from '../lib/zipHelper';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title: string;
  blob?: Blob | null;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  blob,
}) => {
  const [zoom, setZoom] = React.useState(1);

  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white border border-white/80 rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/90">
          <div className="truncate pr-4">
            <h3 className="text-sm font-bold text-slate-900 truncate">{title}</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-600 tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {blob && (
              <button
                onClick={() => downloadSingleFile(blob, title)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl transition-all shadow-xs ml-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Preview Container */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-100/50 min-h-[300px]">
          <img
            src={imageUrl}
            alt={title}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            className="max-h-[70vh] object-contain transition-transform duration-150 rounded-xl shadow-md"
          />
        </div>
      </div>
    </div>
  );
};
