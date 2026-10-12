import { jsPDF } from 'jspdf';
import type { ImageFileItem, ImageToPdfOptions, ConvertedPdfResult } from '../types';

/**
 * Compresses and scales an image using an offscreen canvas
 */
async function compressImageToCanvas(
  item: ImageFileItem,
  options: ImageToPdfOptions
): Promise<{ dataUrl: string; width: number; height: number; sizeBytes: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let { width, height } = img;
      
      // If rotated 90 or 270 deg, swap dimensions
      const is90Rotated = item.rotation % 180 !== 0;
      let targetWidth = is90Rotated ? height : width;
      let targetHeight = is90Rotated ? width : height;

      // Downscale if maximum dimension constraint is set
      if (options.maxDimension > 0) {
        const maxDim = Math.max(targetWidth, targetHeight);
        if (maxDim > options.maxDimension) {
          const ratio = options.maxDimension / maxDim;
          targetWidth = Math.round(targetWidth * ratio);
          targetHeight = Math.round(targetHeight * ratio);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d', { alpha: false });

      if (!ctx) {
        reject(new Error('Failed to get canvas 2d context'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Fill white background for transparency conversion
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Handle rotation and drawing
      ctx.save();
      ctx.translate(targetWidth / 2, targetHeight / 2);
      ctx.rotate((item.rotation * Math.PI) / 180);
      const drawW = is90Rotated ? targetHeight : targetWidth;
      const drawH = is90Rotated ? targetWidth : targetHeight;
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      const mimeType = options.format === 'png' ? 'image/png' : options.format === 'webp' ? 'image/webp' : 'image/jpeg';
      const quality = options.format === 'png' ? 1.0 : options.quality;
      
      const dataUrl = canvas.toDataURL(mimeType, quality);
      
      // Approximate size from base64
      const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
      const sizeBytes = Math.round((base64Length * 3) / 4);

      resolve({
        dataUrl,
        width: targetWidth,
        height: targetHeight,
        sizeBytes,
      });
    };
    img.onerror = (err) => reject(new Error('Failed to load image for compression'));
    img.src = item.previewUrl;
  });
}

export async function convertImagesToPdf(
  items: ImageFileItem[],
  options: ImageToPdfOptions,
  onProgress?: (progress: number, status: string) => void
): Promise<ConvertedPdfResult[]> {
  if (items.length === 0) return [];

  const total = items.length;
  
  if (options.mergeIntoSinglePdf) {
    onProgress?.(5, `Preparing document for ${total} images...`);
    
    // We'll create a single PDF containing all images
    let doc: jsPDF | null = null;
    let totalCompressedSize = 0;

    for (let i = 0; i < total; i++) {
      const item = items[i];
      const stepPercent = Math.round(5 + (i / total) * 85);
      onProgress?.(stepPercent, `Compressing image ${i + 1} of ${total}: ${item.name}`);

      const processed = await compressImageToCanvas(item, options);
      totalCompressedSize += processed.sizeBytes;

      const imgAspect = processed.width / processed.height;

      // Determine page dimensions
      let orientation: 'p' | 'l' = 'p';
      let pageWidthMm = 210;
      let pageHeightMm = 297;

      if (options.pageSize === 'fit') {
        pageWidthMm = 210;
        pageHeightMm = 210 / imgAspect;
        orientation = pageWidthMm > pageHeightMm ? 'l' : 'p';
      } else if (options.pageSize === 'letter') {
        pageWidthMm = 215.9;
        pageHeightMm = 279.4;
        if (options.orientation === 'landscape' || (options.orientation === 'auto' && imgAspect > 1)) {
          orientation = 'l';
          const tmp = pageWidthMm;
          pageWidthMm = pageHeightMm;
          pageHeightMm = tmp;
        }
      } else {
        // A4 default
        pageWidthMm = 210;
        pageHeightMm = 297;
        if (options.orientation === 'landscape' || (options.orientation === 'auto' && imgAspect > 1)) {
          orientation = 'l';
          const tmp = pageWidthMm;
          pageWidthMm = pageHeightMm;
          pageHeightMm = tmp;
        }
      }

      if (i === 0) {
        doc = new jsPDF({
          orientation,
          unit: 'mm',
          format: options.pageSize === 'fit' ? [pageWidthMm, pageHeightMm] : options.pageSize === 'letter' ? 'letter' : 'a4',
          compress: true,
        });
      } else if (doc) {
        doc.addPage(
          options.pageSize === 'fit' ? [pageWidthMm, pageHeightMm] : options.pageSize === 'letter' ? 'letter' : 'a4',
          orientation
        );
      }

      if (!doc) continue;

      // Margins
      let marginMm = 0;
      if (options.margin === 'compact') marginMm = 5;
      if (options.margin === 'standard') marginMm = 10;

      const availableW = pageWidthMm - marginMm * 2;
      const availableH = pageHeightMm - marginMm * 2;

      let drawW = availableW;
      let drawH = availableW / imgAspect;

      if (drawH > availableH) {
        drawH = availableH;
        drawW = availableH * imgAspect;
      }

      const posX = marginMm + (availableW - drawW) / 2;
      const posY = marginMm + (availableH - drawH) / 2;

      const imgFormat = options.format === 'png' ? 'PNG' : options.format === 'webp' ? 'WEBP' : 'JPEG';
      doc.addImage(processed.dataUrl, imgFormat, posX, posY, drawW, drawH, undefined, 'FAST');
    }

    onProgress?.(95, 'Finalizing and packaging PDF...');
    if (!doc) throw new Error('No PDF generated');

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Create base64 dataUrl for cloud storage if within limits
    const pdfDataUrl = doc.output('datauristring');

    onProgress?.(100, 'Batch Photo to PDF conversion complete!');

    return [
      {
        fileName: items.length === 1 ? `${items[0].name.replace(/\.[^/.]+$/, '')}.pdf` : `converted_batch_${items.length}_photos.pdf`,
        blob: pdfBlob,
        dataUrl: pdfDataUrl,
        size: pdfBlob.size,
        pageCount: items.length,
      },
    ];
  } else {
    // Individual PDF for each photo
    const results: ConvertedPdfResult[] = [];
    for (let i = 0; i < total; i++) {
      const item = items[i];
      const stepPercent = Math.round((i / total) * 90);
      onProgress?.(stepPercent, `Converting ${item.name} (${i + 1} of ${total})...`);

      const processed = await compressImageToCanvas(item, options);
      const imgAspect = processed.width / processed.height;

      let pageWidthMm = 210;
      let pageHeightMm = 210 / imgAspect;
      const orientation: 'p' | 'l' = pageWidthMm > pageHeightMm ? 'l' : 'p';

      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: options.pageSize === 'fit' ? [pageWidthMm, pageHeightMm] : 'a4',
        compress: true,
      });

      const imgFormat = options.format === 'png' ? 'PNG' : 'JPEG';
      doc.addImage(processed.dataUrl, imgFormat, 0, 0, pageWidthMm, pageHeightMm, undefined, 'FAST');

      const pdfBlob = doc.output('blob');
      const pdfDataUrl = doc.output('datauristring');

      results.push({
        fileName: `${item.name.replace(/\.[^/.]+$/, '')}.pdf`,
        blob: pdfBlob,
        dataUrl: pdfDataUrl,
        size: pdfBlob.size,
        pageCount: 1,
      });
    }

    onProgress?.(100, 'All photos converted into individual PDFs!');
    return results;
  }
}
