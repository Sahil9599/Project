import * as pdfjsLib from 'pdfjs-dist';
import type { PdfFileItem, PdfToPhotoOptions, ConvertedPhotoResult } from '../types';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  } catch {
    // fallback if version isn't set yet
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
  }
}

/**
 * Parses user custom page range string like "1-3, 5, 8" into an array of page numbers
 */
export function parseCustomPageRange(rangeStr: string, totalPages: number): number[] {
  if (!rangeStr.trim()) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages = new Set<number>();
  const parts = rangeStr.split(',').map(p => p.trim());

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        for (let p = Math.max(1, Math.min(start, end)); p <= Math.min(totalPages, Math.max(start, end)); p++) {
          pages.add(p);
        }
      }
    } else {
      const p = parseInt(part, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        pages.add(p);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Reads PDF page count without rendering
 */
export async function getPdfPageCount(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  return pdf.numPages;
}

/**
 * Converts a batch of PDF files into image photos
 */
export async function convertPdfToImages(
  pdfItems: PdfFileItem[],
  options: PdfToPhotoOptions,
  onProgress?: (progress: number, status: string) => void
): Promise<ConvertedPhotoResult[]> {
  const allResults: ConvertedPhotoResult[] = [];
  const totalPdfs = pdfItems.length;

  for (let pdfIndex = 0; pdfIndex < totalPdfs; pdfIndex++) {
    const item = pdfItems[pdfIndex];
    const arrayBuffer = await item.file.arrayBuffer();
    
    onProgress?.(
      Math.round((pdfIndex / totalPdfs) * 100),
      `Loading document ${pdfIndex + 1} of ${totalPdfs}: ${item.name}...`
    );

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const totalDocPages = pdf.numPages;

    // Determine target pages to render
    let targetPages: number[] = [];
    if (options.pageRange === 'first') {
      targetPages = [1];
    } else if (options.pageRange === 'custom') {
      targetPages = parseCustomPageRange(options.customRange || '', totalDocPages);
      if (targetPages.length === 0) targetPages = [1];
    } else {
      targetPages = Array.from({ length: totalDocPages }, (_, i) => i + 1);
    }

    const baseName = item.name.replace(/\.[^/.]+$/, '');
    const mimeType = options.format === 'png' ? 'image/png' : options.format === 'webp' ? 'image/webp' : 'image/jpeg';
    const ext = options.format === 'jpeg' ? 'jpg' : options.format;

    for (let i = 0; i < targetPages.length; i++) {
      const pageNum = targetPages[i];
      const overallFraction = (pdfIndex + i / targetPages.length) / totalPdfs;
      onProgress?.(
        Math.round(overallFraction * 90),
        `Rendering ${item.name} - Page ${pageNum} of ${totalDocPages}...`
      );

      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: options.scale });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d', { alpha: false });

      if (!ctx) {
        throw new Error('Canvas context could not be created');
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: ctx,
        viewport,
        canvas,
      };

      await page.render(renderContext).promise;

      // Convert to blob and dataUrl
      const quality = options.format === 'png' ? 1.0 : options.quality;
      const dataUrl = canvas.toDataURL(mimeType, quality);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Failed to create image blob from canvas'));
          },
          mimeType,
          quality
        );
      });

      const pageDigits = String(pageNum).padStart(String(totalDocPages).length, '0');
      const outName = `${baseName}_page_${pageDigits}.${ext}`;

      allResults.push({
        pageNumber: pageNum,
        pdfName: item.name,
        fileName: outName,
        dataUrl,
        blob,
        size: blob.size,
        width: viewport.width,
        height: viewport.height,
      });
    }
  }

  onProgress?.(100, `Successfully converted ${allResults.length} page photo(s)!`);
  return allResults;
}
