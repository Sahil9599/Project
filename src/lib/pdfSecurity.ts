import { encryptPDF, AlreadyEncryptedError, PasswordEncodingError } from '@pdfsmaller/pdf-encrypt-lite';
import { decryptPDF, isEncrypted } from '@pdfsmaller/pdf-decrypt';
import type { SecurityCheckResult, ProtectOptions, UnlockOptions, ProtectedPdfResult } from '../types';

/**
 * Checks whether a given PDF file buffer is password encrypted and inspects metadata.
 */
export async function checkPdfSecurity(fileOrBytes: File | Uint8Array): Promise<SecurityCheckResult> {
  const bytes = fileOrBytes instanceof File
    ? new Uint8Array(await fileOrBytes.arrayBuffer())
    : fileOrBytes;

  try {
    const result = await isEncrypted(bytes);
    return {
      encrypted: Boolean(result?.encrypted),
      algorithm: result?.algorithm,
      version: result?.version,
      revision: result?.revision,
      keyLength: result?.keyLength,
    };
  } catch (error) {
    console.error('Failed to probe PDF encryption state:', error);
    return { encrypted: false };
  }
}

/**
 * Encrypts and password-protects a PDF file using client-side RC4 128-bit encryption.
 */
export async function protectPdf(
  file: File,
  options: ProtectOptions,
  onProgress?: (progress: number, stage: string) => void
): Promise<ProtectedPdfResult> {
  onProgress?.(15, 'Reading PDF file data...');
  const arrayBuffer = await file.arrayBuffer();
  const inputBytes = new Uint8Array(arrayBuffer);

  onProgress?.(35, 'Analyzing existing document security...');
  const securityInfo = await checkPdfSecurity(inputBytes);
  if (securityInfo.encrypted) {
    throw new Error('This PDF is already encrypted! Please unlock or remove existing password protection first.');
  }

  if (!options.userPassword || options.userPassword.trim() === '') {
    throw new Error('Please enter a password to protect the PDF document.');
  }

  onProgress?.(60, 'Applying client-side cryptographic encryption...');
  const encryptOpts: { ownerPassword?: string } = {};
  if (options.ownerPassword && options.ownerPassword.trim() !== '') {
    encryptOpts.ownerPassword = options.ownerPassword.trim();
  }

  try {
    const encryptedBytes = await encryptPDF(
      inputBytes,
      options.userPassword.trim(),
      encryptOpts.ownerPassword ? encryptOpts : null
    );

    onProgress?.(90, 'Packaging protected PDF...');
    const blob = new Blob([encryptedBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
    const dataUrl = URL.createObjectURL(blob);

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const finalName = options.outputFileName?.trim()
      ? (options.outputFileName.endsWith('.pdf') ? options.outputFileName : `${options.outputFileName}.pdf`)
      : `${baseName}-protected.pdf`;

    onProgress?.(100, 'Document protected successfully!');

    return {
      fileName: finalName,
      blob,
      dataUrl,
      size: blob.size,
      mode: 'protect',
      algorithm: 'RC4 128-bit',
    };
  } catch (err: unknown) {
    if (err instanceof AlreadyEncryptedError) {
      throw new Error('This document is already password protected.');
    }
    if (err instanceof PasswordEncodingError) {
      throw new Error('Invalid characters in password. Please use standard alphanumeric and symbol characters.');
    }
    const message = err instanceof Error ? err.message : 'Encryption failed';
    throw new Error(`Failed to protect PDF: ${message}`);
  }
}

/**
 * Unlocks / decrypts a password-protected PDF file and produces an unencrypted version.
 */
export async function unlockPdf(
  file: File,
  options: UnlockOptions,
  onProgress?: (progress: number, stage: string) => void
): Promise<ProtectedPdfResult> {
  onProgress?.(15, 'Reading encrypted PDF data...');
  const arrayBuffer = await file.arrayBuffer();
  const inputBytes = new Uint8Array(arrayBuffer);

  onProgress?.(35, 'Verifying document encryption...');
  const securityInfo = await checkPdfSecurity(inputBytes);
  if (!securityInfo.encrypted) {
    throw new Error('This document is not password protected. No unlock is needed!');
  }

  if (!options.password || options.password.trim() === '') {
    throw new Error('Please provide the password to unlock this document.');
  }

  onProgress?.(65, 'Decrypting PDF security layers...');
  try {
    const decryptedBytes = await decryptPDF(inputBytes, options.password.trim());

    onProgress?.(90, 'Generating clean unprotected PDF...');
    const blob = new Blob([decryptedBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
    const dataUrl = URL.createObjectURL(blob);

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const finalName = options.outputFileName?.trim()
      ? (options.outputFileName.endsWith('.pdf') ? options.outputFileName : `${options.outputFileName}.pdf`)
      : `${baseName}-unlocked.pdf`;

    onProgress?.(100, 'PDF unlocked successfully!');

    return {
      fileName: finalName,
      blob,
      dataUrl,
      size: blob.size,
      mode: 'unlock',
    };
  } catch (err: unknown) {
    const rawMsg = err instanceof Error ? err.message : '';
    if (rawMsg.toLowerCase().includes('password') || rawMsg.toLowerCase().includes('incorrect') || rawMsg.toLowerCase().includes('auth')) {
      throw new Error('Incorrect password provided. Please check the password and try again.');
    }
    throw new Error(`Failed to unlock PDF: ${rawMsg || 'Password verification failed'}`);
  }
}
