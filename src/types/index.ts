export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isLocalOnly?: boolean;
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  totalConversions?: number;
  storageUsedBytes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversionRecord {
  id: string;
  userId: string;
  conversionType: 'photo-to-pdf' | 'pdf-to-photo';
  originalFilesCount?: number;
  originalFileNames?: string[];
  totalOriginalSizeBytes?: number;
  totalResultSizeBytes?: number;
  compressionQuality?: string;
  compressionRatio?: number;
  status: 'completed' | 'failed';
  outputSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredFile {
  id: string;
  userId: string;
  conversionRecordId?: string;
  fileName: string;
  fileType: string;
  sizeBytes: number;
  fileData?: string; // Data URL or base64
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImageFileItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  width: number;
  height: number;
  rotation: number;
}

export interface PdfFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount?: number;
}

export type CompressionPreset = 'maximum' | 'high' | 'medium' | 'compact' | 'custom';

export interface ImageToPdfOptions {
  pageSize: 'fit' | 'a4' | 'letter';
  orientation: 'auto' | 'portrait' | 'landscape';
  margin: 'none' | 'compact' | 'standard'; // 0, 5mm, 10mm
  preset: CompressionPreset;
  quality: number; // 0.1 to 1.0
  maxDimension: number; // 0 for original, or 3840, 2048, 1280
  format: 'jpeg' | 'png' | 'webp';
  mergeIntoSinglePdf: boolean;
}

export interface PdfToPhotoOptions {
  format: 'jpeg' | 'png' | 'webp';
  scale: number; // 1.0 (72dpi), 2.0 (144dpi), 3.0 (216dpi)
  quality: number; // 0.1 to 1.0
  pageRange: 'all' | 'first' | 'custom';
  customRange?: string; // e.g. "1-5, 8"
}

export interface ConvertedPhotoResult {
  pageNumber: number;
  pdfName: string;
  fileName: string;
  dataUrl: string;
  blob: Blob;
  size: number;
  width: number;
  height: number;
}

export interface ConvertedPdfResult {
  fileName: string;
  blob: Blob;
  dataUrl: string;
  size: number;
  pageCount: number;
}

export interface WatermarkSettings {
  enabled: boolean;
  type: 'text' | 'image';
  text: string;
  textColor: string;
  textSize: number;
  opacity: number; // 0.05 to 1.0
  rotation: number; // degrees, e.g. -45, 0, 90
  repeat: boolean; // Tiled pattern
  imageDataUrl?: string;
  imageScale: number; // 0.2 to 2.0
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  targetPages: 'all' | 'first' | 'last' | 'custom';
  customPages?: string;
}

export interface SignatureSettings {
  enabled: boolean;
  signatureDataUrl?: string; // transparent png data URL
  position: 'bottom-right' | 'bottom-left' | 'bottom-center' | 'top-right' | 'custom';
  customXPercent?: number; // 0 to 100
  customYPercent?: number; // 0 to 100
  scale: number; // 0.4 to 2.0
  targetPages: 'all' | 'first' | 'last' | 'custom';
  customPages?: string;
  dateStamp?: {
    enabled: boolean;
    text: string;
    color: string;
  };
}

export interface ProcessedPdfResult {
  fileName: string;
  blob: Blob;
  dataUrl: string;
  size: number;
  pageCount: number;
}

export interface MergePdfItem {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
  pageRange: string; // e.g. "all", "1-3", "2"
  previewThumbnail?: string;
  rotation?: 0 | 90 | 180 | 270;
}

export interface MergeOptions {
  outputFileName: string;
  includeBlankPageBetweenFiles: boolean;
  normalizePageOrientation: 'keep' | 'portrait' | 'landscape';
}

export interface MergedPdfResult {
  fileName: string;
  blob: Blob;
  dataUrl: string;
  size: number;
  totalPages: number;
  includedFilesCount: number;
}
