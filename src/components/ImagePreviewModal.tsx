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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="truncate pr-4">
            <h3 className="text-sm font-semibold text-neutral-100 truncate">{title}</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-neutral-400 tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {blob && (
              <button
                onClick={() => downloadSingleFile(blob, title)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-950 bg-neutral-100 hover:bg-white rounded-lg transition-colors ml-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Preview Container */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-neutral-950/40 min-h-[300px]">
          <img
            src={imageUrl}
            alt={title}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            className="max-h-[70vh] object-contain transition-transform duration-150 rounded"
          />
        </div>
      </div>
    </div>
  );
};
