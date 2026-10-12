import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import type { WatermarkSettings, SignatureSettings, ProcessedPdfResult } from '../types';

/**
 * Parses user target page selection into 0-indexed page indices for pdf-lib
 */
export function getTargetPageIndices(
  targetPages: 'all' | 'first' | 'last' | 'custom',
  customPages: string | undefined,
  totalPages: number
): number[] {
  if (totalPages <= 0) return [];

  if (targetPages === 'first') return [0];
  if (targetPages === 'last') return [totalPages - 1];
  if (targetPages === 'all') return Array.from({ length: totalPages }, (_, i) => i);

  // Custom pages e.g. "1-3, 5" (1-based from user)
  if (!customPages || !customPages.trim()) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const indices = new Set<number>();
  const parts = customPages.split(',').map((p) => p.trim());

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
  return sorted.length > 0 ? sorted : [0];
}

/**
 * Converts a hex color string like "#2563eb" to pdf-lib rgb(r, g, b)
 */
function hexToPdfRgb(hex: string) {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16) / 255;
    const g = parseInt(clean[1] + clean[1], 16) / 255;
    const b = parseInt(clean[2] + clean[2], 16) / 255;
    return rgb(r, g, b);
  }
  const r = parseInt(clean.substring(0, 2), 16) / 255 || 0;
  const g = parseInt(clean.substring(2, 4), 16) / 255 || 0;
  const b = parseInt(clean.substring(4, 6), 16) / 255 || 0;
  return rgb(r, g, b);
}

/**
 * Helper to convert data URL to Uint8Array
 */
function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; isPng: boolean } {
  const isPng = dataUrl.startsWith('data:image/png');
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return { bytes, isPng };
}

/**
 * Processes a PDF file with Watermarking and/or Digital Signature
 */
export async function applySignAndWatermarkToPdf(
  file: File,
  watermark: WatermarkSettings,
  signature: SignatureSettings,
  onProgress?: (percent: number, status: string) => void
): Promise<ProcessedPdfResult> {
  onProgress?.(15, `Loading ${file.name}...`);
  const arrayBuffer = await file.arrayBuffer();

  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();

  onProgress?.(35, 'Embedding styles & assets...');
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Pre-embed watermark image if used
  let embeddedWatermarkImage: any = null;
  if (watermark.enabled && watermark.type === 'image' && watermark.imageDataUrl) {
    try {
      const { bytes, isPng } = dataUrlToBytes(watermark.imageDataUrl);
      embeddedWatermarkImage = isPng
        ? await pdfDoc.embedPng(bytes)
        : await pdfDoc.embedJpg(bytes);
    } catch (e) {
      console.warn('Could not embed watermark image:', e);
    }
  }

  // Pre-embed signature image if used
  let embeddedSignatureImage: any = null;
  if (signature.enabled && signature.signatureDataUrl) {
    try {
      const { bytes, isPng } = dataUrlToBytes(signature.signatureDataUrl);
      embeddedSignatureImage = isPng
        ? await pdfDoc.embedPng(bytes)
        : await pdfDoc.embedJpg(bytes);
    } catch (e) {
      console.warn('Could not embed signature image:', e);
    }
  }

  const watermarkIndices = watermark.enabled
    ? getTargetPageIndices(watermark.targetPages, watermark.customPages, totalPages)
    : [];

  const signatureIndices = signature.enabled && embeddedSignatureImage
    ? getTargetPageIndices(signature.targetPages, signature.customPages, totalPages)
    : [];

  onProgress?.(50, `Applying signatures & watermarks across ${totalPages} page(s)...`);

  for (let i = 0; i < totalPages; i++) {
    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();

    // 1. WATERMARK APPLICATION
    if (watermark.enabled && watermarkIndices.includes(i)) {
      if (watermark.type === 'text' && watermark.text.trim()) {
        const text = watermark.text.trim();
        const fontSize = watermark.textSize || 48;
        const color = hexToPdfRgb(watermark.textColor || '#64748b');
        const opacity = Math.max(0.05, Math.min(1.0, watermark.opacity || 0.25));
        const rotationAngle = watermark.rotation ?? -45;

        const textWidth = boldFont.widthOfTextAtSize(text, fontSize);
        const textHeight = boldFont.heightAtSize(fontSize);

        if (watermark.repeat) {
          // Tiled repeating watermark pattern
          const stepX = Math.max(textWidth + 80, 220);
          const stepY = Math.max(textHeight + 120, 160);

          for (let x = -stepX / 2; x < width + stepX; x += stepX) {
            for (let y = -stepY / 2; y < height + stepY; y += stepY) {
              page.drawText(text, {
                x,
                y,
                size: fontSize * 0.7,
                font: boldFont,
                color,
                opacity: opacity * 0.8,
                rotate: degrees(rotationAngle),
              });
            }
          }
        } else {
          // Single watermark placement
          let x = (width - textWidth) / 2;
          let y = (height - textHeight) / 2;

          if (watermark.position === 'top-left') {
            x = 40;
            y = height - textHeight - 40;
          } else if (watermark.position === 'top-right') {
            x = width - textWidth - 40;
            y = height - textHeight - 40;
          } else if (watermark.position === 'bottom-left') {
            x = 40;
            y = 40;
          } else if (watermark.position === 'bottom-right') {
            x = width - textWidth - 40;
            y = 40;
          }

          page.drawText(text, {
            x,
            y,
            size: fontSize,
            font: boldFont,
            color,
            opacity,
            rotate: degrees(rotationAngle),
          });
        }
      } else if (watermark.type === 'image' && embeddedWatermarkImage) {
        const imgDims = embeddedWatermarkImage.scale(watermark.imageScale || 0.6);
        const opacity = Math.max(0.05, Math.min(1.0, watermark.opacity || 0.3));

        let x = (width - imgDims.width) / 2;
        let y = (height - imgDims.height) / 2;

        if (watermark.position === 'top-left') {
          x = 40;
          y = height - imgDims.height - 40;
        } else if (watermark.position === 'top-right') {
          x = width - imgDims.width - 40;
          y = height - imgDims.height - 40;
        } else if (watermark.position === 'bottom-left') {
          x = 40;
          y = 40;
        } else if (watermark.position === 'bottom-right') {
          x = width - imgDims.width - 40;
          y = 40;
        }

        page.drawImage(embeddedWatermarkImage, {
          x,
          y,
          width: imgDims.width,
          height: imgDims.height,
          opacity,
        });
      }
    }

    // 2. SIGNATURE APPLICATION
    if (signature.enabled && embeddedSignatureImage && signatureIndices.includes(i)) {
      const sigScale = signature.scale || 1.0;
      // Standard signature width target ~ 150pt
      const baseWidth = 160 * sigScale;
      const aspect = embeddedSignatureImage.width / embeddedSignatureImage.height;
      const sigWidth = baseWidth;
      const sigHeight = baseWidth / aspect;

      let sigX = width - sigWidth - 50;
      let sigY = 50;

      if (signature.position === 'bottom-left') {
        sigX = 50;
        sigY = 50;
      } else if (signature.position === 'bottom-center') {
        sigX = (width - sigWidth) / 2;
        sigY = 50;
      } else if (signature.position === 'top-right') {
        sigX = width - sigWidth - 50;
        sigY = height - sigHeight - 50;
      } else if (signature.position === 'custom') {
        const xPct = (signature.customXPercent ?? 75) / 100;
        const yPct = (signature.customYPercent ?? 15) / 100;
        sigX = Math.max(10, Math.min(width - sigWidth - 10, width * xPct));
        // In PDF coordinates, y=0 is at bottom!
        sigY = Math.max(10, Math.min(height - sigHeight - 10, height * yPct));
      }

      page.drawImage(embeddedSignatureImage, {
        x: sigX,
        y: sigY,
        width: sigWidth,
        height: sigHeight,
      });

      // Optional Date or Signer Stamp under the signature
      if (signature.dateStamp?.enabled && signature.dateStamp.text) {
        const dateText = signature.dateStamp.text;
        const dateSize = 9;
        const dateColor = hexToPdfRgb(signature.dateStamp.color || '#475569');
        page.drawText(dateText, {
          x: sigX,
          y: Math.max(15, sigY - 14),
          size: dateSize,
          font: regularFont,
          color: dateColor,
        });
      }
    }
  }

  onProgress?.(85, 'Compiling and encrypting document stream...');
  const pdfBytes = await pdfDoc.save();
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const outName = `${baseName}_signed_watermarked.pdf`;

  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const dataUrl = URL.createObjectURL(blob);

  onProgress?.(100, 'Document completed!');

  return {
    fileName: outName,
    blob,
    dataUrl,
    size: blob.size,
    pageCount: totalPages,
  };
}
