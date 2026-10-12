import React, { useRef, useState } from 'react';
import { UploadCloud, FileImage, FileText } from 'lucide-react';

interface FileDropzoneProps {
  accept: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  title: string;
  description: string;
  mode: 'photo' | 'pdf';
  disabled?: boolean;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  accept,
  multiple = true,
  onFilesSelected,
  title,
  description,
  mode,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      const filtered = filterValidFiles(droppedFiles, mode);
      if (filtered.length > 0) {
        onFilesSelected(filtered);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      const filtered = filterValidFiles(selected, mode);
      if (filtered.length > 0) {
        onFilesSelected(filtered);
      }
      e.target.value = ''; // Reset input
    }
  };

  const filterValidFiles = (files: File[], targetMode: 'photo' | 'pdf'): File[] => {
    if (targetMode === 'photo') {
      return files.filter(
        (f) =>
          f.type.startsWith('image/') ||
          /\.(jpe?g|png|webp|gif|bmp|heic|svg)$/i.test(f.name)
      );
    } else {
      return files.filter(
        (f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name)
      );
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
      className={`relative w-full rounded-3xl border-2 border-dashed transition-all duration-200 cursor-pointer p-8 md:p-12 text-center flex flex-col items-center justify-center gap-3 backdrop-blur-xl shadow-xl shadow-blue-950/5 ${
        isDragOver
          ? 'border-blue-600 bg-blue-50/90 scale-[0.99] ring-4 ring-blue-500/20'
          : 'border-blue-200 hover:border-blue-400 bg-white/80 hover:bg-white/95'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white mb-1 shadow-lg shadow-blue-500/30 transition-transform duration-200 hover:scale-105">
        {mode === 'photo' ? (
          <FileImage className="w-7 h-7 stroke-[1.8]" />
        ) : (
          <FileText className="w-7 h-7 stroke-[1.8]" />
        )}
      </div>

      <div className="space-y-1 max-w-md">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600">{description}</p>
      </div>

      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 font-semibold bg-blue-50/70 border border-blue-100/80 px-3.5 py-1.5 rounded-xl">
        <UploadCloud className="w-4 h-4 text-blue-600" />
        <span>Drop files here or click to browse</span>
        <span aria-hidden="true" className="text-blue-300">·</span>
        <span className="text-blue-700">Batch processing enabled</span>
      </div>
    </div>
  );
};
