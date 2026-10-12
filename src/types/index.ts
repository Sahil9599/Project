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
  customRange: string; // e.g. "1-5, 8"
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
