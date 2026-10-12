import JSZip from 'jszip';
import type { ConvertedPhotoResult, ConvertedPdfResult } from '../types';

export async function downloadPhotosAsZip(
  photos: ConvertedPhotoResult[],
  zipFilename: string = 'converted_photos.zip',
  onProgress?: (percent: number) => void
): Promise<void> {
  const zip = new JSZip();

  photos.forEach((photo) => {
    zip.file(photo.fileName, photo.blob);
  });

  const content = await zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
    (metadata) => {
      onProgress?.(Math.round(metadata.percent));
    }
  );

  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadPdfsAsZip(
  pdfs: ConvertedPdfResult[],
  zipFilename: string = 'converted_pdfs.zip'
): Promise<void> {
  const zip = new JSZip();

  pdfs.forEach((pdf) => {
    zip.file(pdf.fileName, pdf.blob);
  });

  const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadSingleFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
