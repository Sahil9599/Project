import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import type { MergePdfItem, MergeOptions, MergedPdfResult } from '../types';

/**
 * Parses user custom page range string like "all", "1-3, 5" into 0-indexed page indices for pdf-lib
 */
export function parseMergePageIndices(pageRange: string, totalPages: number): number[] {
  if (totalPages <= 0) return [];
  if (!pageRange || pageRange.trim().toLowerCase() === 'all' || !pageRange.trim()) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const indices = new Set<number>();
  const parts = pageRange.split(',').map((p) => p.trim());

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        for (
          let p = Math.max(1, Math.min(start, end));
          p <= Math.min(totalPages, Math.max(start, end));
          p++
        ) {
          indices.add(p - 1);
        }
      }
    } else {
      const p = parseInt(part, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        indices.add(p - 1);
      }
    }
  }

  const sorted = Array.from(indices).sort((a, b) => a - b);
  return sorted.length > 0 ? sorted : Array.from({ length: totalPages }, (_, i) => i);
}

/**
 * Generates a fast first-page thumbnail for a PDF File
 */
export async function generatePdfThumbnail(file: File, width = 140): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const page = await pdfDoc.getPage(1);

    const unscaledViewport = page.getViewport({ scale: 1 });
    const scale = width / unscaledViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const context = canvas.getContext('2d');

    if (!context) return '';

    // Render white background
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    }).promise;

    return canvas.toDataURL('image/jpeg', 0.82);
  } catch (err) {
    console.warn('Failed to generate PDF thumbnail:', err);
    return '';
  }
}

/**
 * Inspects a PDF File to get its total page count
 */
export async function inspectPdfPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    return pdfDoc.numPages;
  } catch (err) {
    console.warn('Failed to inspect PDF with pdfjsLib, falling back to pdf-lib:', err);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      return pdf.getPageCount();
    } catch {
      return 1;
    }
  }
}

/**
 * Core function to merge multiple PDF items into a single unified PDF file
 */
export async function mergeMultiplePdfs(
  items: MergePdfItem[],
  options: MergeOptions,
  onProgress?: (progress: number, status: string) => void
): Promise<MergedPdfResult> {
  if (items.length === 0) {
    throw new Error('Please select at least one PDF file to merge.');
  }

  onProgress?.(5, 'Creating empty master PDF document...');
  const mergedPdf = await PDFDocument.create();

  const totalItems = items.length;
  let copiedTotalPages = 0;

  for (let index = 0; index < totalItems; index++) {
    const item = items[index];
    const itemProgress = Math.round(10 + (index / totalItems) * 75);
    onProgress?.(
      itemProgress,
      `Processing file ${index + 1} of ${totalItems}: ${item.name}...`
    );

    // Read bytes of source PDF
    const fileBytes = await item.file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const sourceTotalPages = sourcePdf.getPageCount();

    // Determine target page indices to copy
    const targetIndices = parseMergePageIndices(item.pageRange, sourceTotalPages);

    if (targetIndices.length > 0) {
      // Copy pages to merged document
      const copiedPages = await mergedPdf.copyPages(sourcePdf, targetIndices);

      for (const page of copiedPages) {
        // Apply optional rotation per-item
        if (item.rotation) {
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees((currentRotation + item.rotation) % 360));
        }

        // Apply normalization if requested
        if (options.normalizePageOrientation !== 'keep') {
          const { width, height } = page.getSize();
          const isLandscape = width > height;
          if (options.normalizePageOrientation === 'portrait' && isLandscape) {
            const rot = page.getRotation().angle;
            page.setRotation(degrees((rot + 90) % 360));
          } else if (options.normalizePageOrientation === 'landscape' && !isLandscape) {
            const rot = page.getRotation().angle;
            page.setRotation(degrees((rot + 90) % 360));
          }
        }

        mergedPdf.addPage(page);
        copiedTotalPages++;
      }
    }

    // Optional blank page separator between consecutive files
    if (
      options.includeBlankPageBetweenFiles &&
      index < totalItems - 1 &&
      targetIndices.length > 0
    ) {
      // Match the dimensions of standard letter or previous page
      mergedPdf.addPage([595.28, 841.89]); // Standard A4 points
      copiedTotalPages++;
    }
  }

  onProgress?.(90, 'Finalizing and assembling merged document...');
  const mergedBytes = await mergedPdf.save();

  // Create downloadable Blob
  const blob = new Blob([mergedBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const dataUrl = URL.createObjectURL(blob);

  // Sanitize file name
  let outputName = options.outputFileName.trim();
  if (!outputName) {
    outputName = 'merged-documents.pdf';
  } else if (!outputName.toLowerCase().endsWith('.pdf')) {
    outputName = `${outputName}.pdf`;
  }

  onProgress?.(100, 'Merging complete!');

  return {
    fileName: outputName,
    blob,
    dataUrl,
    size: blob.size,
    totalPages: copiedTotalPages,
    includedFilesCount: totalItems,
  };
}
