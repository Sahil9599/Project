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
      className={`relative w-full rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer p-8 md:p-12 text-center flex flex-col items-center justify-center gap-3 ${
        isDragOver
          ? 'border-neutral-200 bg-neutral-900/80 scale-[0.99]'
          : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 hover:bg-neutral-900/60'
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

      <div className="w-14 h-14 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300 mb-1 transition-transform group-hover:scale-105">
        {mode === 'photo' ? (
          <FileImage className="w-6 h-6 stroke-[1.5]" />
        ) : (
          <FileText className="w-6 h-6 stroke-[1.5]" />
        )}
      </div>

      <div className="space-y-1 max-w-md">
        <h3 className="text-base font-semibold text-neutral-100">{title}</h3>
        <p className="text-sm text-neutral-400">{description}</p>
      </div>

      <div className="flex items-center gap-2 mt-2 text-xs text-neutral-400 font-medium">
        <UploadCloud className="w-4 h-4 text-neutral-300" />
        <span>Drop files here or click to browse</span>
        <span aria-hidden="true">·</span>
        <span>Batch processing enabled</span>
      </div>
    </div>
  );
};
