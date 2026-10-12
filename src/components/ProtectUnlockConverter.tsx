import React, { useState, useRef, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Upload,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Download,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Info
} from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { protectPdf, unlockPdf, checkPdfSecurity } from '../lib/pdfSecurity';
import type { SecurityCheckResult, ProtectedPdfResult } from '../types';

export const ProtectUnlockConverter: React.FC = () => {
  const [subMode, setSubMode] = useState<'protect' | 'unlock'>('protect');
  const [file, setFile] = useState<File | null>(null);
  const [isCheckingSecurity, setIsCheckingSecurity] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<SecurityCheckResult | null>(null);

  // Protect inputs
  const [userPassword, setUserPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [enableOwnerPassword, setEnableOwnerPassword] = useState(false);
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);

  // Unlock inputs
  const [unlockPassword, setUnlockPassword] = useState('');
  const [showUnlockPassword, setShowUnlockPassword] = useState(false);

  // Output custom name
  const [outputFileName, setOutputFileName] = useState('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProtectedPdfResult | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inspect security whenever a file is selected
  useEffect(() => {
    if (!file) {
      setSecurityStatus(null);
      setResult(null);
      setErrorMessage(null);
      return;
    }

    let isMounted = true;
    setIsCheckingSecurity(true);
    setErrorMessage(null);
    setResult(null);

    checkPdfSecurity(file)
      .then((status) => {
        if (!isMounted) return;
        setSecurityStatus(status);
        setIsCheckingSecurity(false);
        // Smart mode auto-detection
        if (status.encrypted) {
          setSubMode('unlock');
        } else {
          setSubMode('protect');
        }
      })
      .catch(() => {
        if (isMounted) setIsCheckingSecurity(false);
      });

    return () => {
      isMounted = false;
    };
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf' || selected.name.toLowerCase().endsWith('.pdf')) {
        setFile(selected);
        setOutputFileName('');
      } else {
        setErrorMessage('Please select a valid PDF file (.pdf)');
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (selected.type === 'application/pdf' || selected.name.toLowerCase().endsWith('.pdf')) {
        setFile(selected);
        setOutputFileName('');
      } else {
        setErrorMessage('Please drop a valid PDF file (.pdf)');
      }
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 14; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setUserPassword(pass);
    setConfirmPassword(pass);
    setShowUserPassword(true);
  };

  const handleCopyPassword = () => {
    if (userPassword) {
      navigator.clipboard.writeText(userPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleProcess = async () => {
    if (!file) {
      setErrorMessage('Please select a PDF document first.');
      return;
    }

    setErrorMessage(null);
    setResult(null);

    if (subMode === 'protect') {
      if (!userPassword) {
        setErrorMessage('Please enter a password to protect the document.');
        return;
      }
      if (userPassword !== confirmPassword) {
        setErrorMessage('Passwords do not match! Please verify your password confirmation.');
        return;
      }

      setIsProcessing(true);
      setProgress(5);
      setStage('Initializing protection engine...');

      try {
        const res = await protectPdf(
          file,
          {
            userPassword,
            ownerPassword: enableOwnerPassword ? ownerPassword : undefined,
            outputFileName,
          },
          (p, s) => {
            setProgress(p);
            setStage(s);
          }
        );
        setResult(res);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to protect PDF';
        setErrorMessage(msg);
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Unlock mode
      if (!unlockPassword) {
        setErrorMessage('Please enter the current password to unlock this document.');
        return;
      }

      setIsProcessing(true);
      setProgress(5);
      setStage('Verifying credentials...');

      try {
        const res = await unlockPdf(
          file,
          {
            password: unlockPassword,
            outputFileName,
          },
          (p, s) => {
            setProgress(p);
            setStage(s);
          }
        );
        setResult(res);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to unlock PDF';
        setErrorMessage(msg);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const clearSelection = () => {
    setFile(null);
    setSecurityStatus(null);
    setResult(null);
    setErrorMessage(null);
    setUserPassword('');
    setConfirmPassword('');
    setOwnerPassword('');
    setUnlockPassword('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Hero Pill & Headline */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 border border-blue-200/60 text-blue-700 text-xs font-semibold backdrop-blur-md">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Client-Side Military-Grade Encryption</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-950 to-slate-800 bg-clip-text text-transparent">
          Protect & Unlock PDF
        </h1>
        <p className="text-sm text-slate-600">
          Encrypt your PDF with a secure password or permanently remove passwords from encrypted documents. Completely private in your browser.
        </p>
      </div>

      {/* Main Glass Workspace Card */}
      <div className="liquid-glass relative w-full overflow-hidden shadow-2xl shadow-blue-950/10 p-6 sm:p-8">
        <div className="liquid-glass--bend" />
        <div className="liquid-glass--face" />
        <div className="liquid-glass--edge" />

        <div className="relative z-10 space-y-6">
          {/* Mode Switch Tabs: Protect vs Unlock */}
          <div className="flex items-center justify-center">
            <div className="inline-flex p-1.5 rounded-2xl bg-white/70 backdrop-blur-md border border-white/80 shadow-inner gap-1">
              <button
                type="button"
                onClick={() => {
                  setSubMode('protect');
                  setErrorMessage(null);
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  subMode === 'protect'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Protect PDF (Add Password)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubMode('unlock');
                  setErrorMessage(null);
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  subMode === 'unlock'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock PDF (Remove Password)</span>
              </button>
            </div>
          </div>

          {/* File Upload Zone */}
          {!file ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-300/80 hover:border-blue-500 bg-white/40 hover:bg-white/60 backdrop-blur-md rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-4 group shadow-inner"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                {subMode === 'protect' ? <Lock className="w-8 h-8" /> : <Unlock className="w-8 h-8" />}
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-slate-800">
                  Click or drag and drop your PDF here
                </p>
                <p className="text-xs text-slate-500">
                  Compatible with all standard Adobe PDF formats
                </p>
              </div>
              <button
                type="button"
                className="liquid-glass-wrapper px-4 py-2 text-xs font-bold text-blue-700 bg-white/80 rounded-xl border border-white hover:bg-white shadow-sm"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5 inline" />
                Browse File
              </button>
            </div>
          ) : (
            /* Selected File Details Banner */
            <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 truncate">{file.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    {isCheckingSecurity ? (
                      <span className="text-slate-400">Inspecting security...</span>
                    ) : securityStatus?.encrypted ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                        <Lock className="w-3 h-3" /> Password Protected ({securityStatus.algorithm || 'Encrypted'})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                        <ShieldCheck className="w-3 h-3" /> Unencrypted PDF
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white/80 hover:bg-white border border-slate-200 rounded-lg transition-all"
                >
                  Change File
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Mode Mismatch Warning / Guidance */}
          {file && !isCheckingSecurity && (
            <>
              {subMode === 'protect' && securityStatus?.encrypted && (
                <div className="p-3.5 bg-amber-50/90 border border-amber-200/80 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">This PDF is already encrypted!</p>
                    <p>
                      To change password or unlock it, switch to{' '}
                      <button
                        type="button"
                        onClick={() => setSubMode('unlock')}
                        className="underline font-bold text-amber-900"
                      >
                        Unlock PDF mode
                      </button>
                      .
                    </p>
                  </div>
                </div>
              )}

              {subMode === 'unlock' && !securityStatus?.encrypted && (
                <div className="p-3.5 bg-blue-50/90 border border-blue-200/80 rounded-xl text-xs text-blue-800 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">This PDF is not password protected!</p>
                    <p>
                      This file does not have an open password. If you want to add password protection, switch to{' '}
                      <button
                        type="button"
                        onClick={() => setSubMode('protect')}
                        className="underline font-bold text-blue-900"
                      >
                        Protect PDF mode
                      </button>
                      .
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Configuration Settings Box */}
          {file && (
            <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-2xl p-6 shadow-sm space-y-6">
              {subMode === 'protect' ? (
                /* PROTECT FORM */
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-blue-600" />
                      Set Document Password
                    </h3>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Suggest Strong Password</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* User Open Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                        <span>Password (Required to open)</span>
                        {userPassword && (
                          <button
                            type="button"
                            onClick={handleCopyPassword}
                            className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            {copied ? 'Copied!' : 'Copy'}
                          </button>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type={showUserPassword ? 'text' : 'password'}
                          value={userPassword}
                          onChange={(e) => setUserPassword(e.target.value)}
                          placeholder="e.g. SecretDoc#2026"
                          className="w-full px-3.5 py-2.5 bg-white/90 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowUserPassword(!showUserPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Confirm Password
                      </label>
                      <input
                        type={showUserPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className={`w-full px-3.5 py-2.5 bg-white/90 border rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                          confirmPassword && userPassword !== confirmPassword
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-slate-200 focus:border-blue-500'
                        }`}
                      />
                      {confirmPassword && userPassword !== confirmPassword && (
                        <p className="text-[11px] text-red-500">Passwords do not match</p>
                      )}
                    </div>
                  </div>

                  {/* Advanced: Owner Master Password (Optional) */}
                  <div className="pt-2 border-t border-slate-200/60">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={enableOwnerPassword}
                        onChange={(e) => setEnableOwnerPassword(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <span className="text-xs font-semibold text-slate-700">
                        Set separate Master/Owner Password (Optional)
                      </span>
                    </label>

                    {enableOwnerPassword && (
                      <div className="mt-3 pl-6 space-y-1.5">
                        <label className="text-xs text-slate-600">
                          Owner Password (grants full permissions to modify settings)
                        </label>
                        <div className="relative max-w-sm">
                          <input
                            type={showOwnerPassword ? 'text' : 'password'}
                            value={ownerPassword}
                            onChange={(e) => setOwnerPassword(e.target.value)}
                            placeholder="Master password"
                            className="w-full px-3.5 py-2.5 bg-white/90 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showOwnerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* UNLOCK FORM */
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-blue-600" />
                    Enter PDF Password to Remove Protection
                  </h3>
                  <div className="max-w-md space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Document Password
                    </label>
                    <div className="relative">
                      <input
                        type={showUnlockPassword ? 'text' : 'password'}
                        value={unlockPassword}
                        onChange={(e) => setUnlockPassword(e.target.value)}
                        placeholder="Enter the PDF password"
                        className="w-full px-3.5 py-2.5 bg-white/90 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showUnlockPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Output Filename (Optional) */}
              <div className="pt-3 border-t border-slate-200/60">
                <label className="text-xs font-semibold text-slate-700">
                  Custom Output Name (Optional)
                </label>
                <div className="mt-1.5 max-w-md">
                  <input
                    type="text"
                    value={outputFileName}
                    onChange={(e) => setOutputFileName(e.target.value)}
                    placeholder={
                      subMode === 'protect'
                        ? `${file.name.replace(/\.[^/.]+$/, '')}-protected.pdf`
                        : `${file.name.replace(/\.[^/.]+$/, '')}-unlocked.pdf`
                    }
                    className="w-full px-3.5 py-2 bg-white/90 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar during execution */}
          {isProcessing && (
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-4 rounded-2xl shadow-sm">
              <ProgressBar
                progress={progress}
                status={stage}
                isProcessing={isProcessing}
              />
            </div>
          )}

          {/* Error Message Display */}
          {errorMessage && (
            <div className="p-4 bg-red-50/90 border border-red-200/80 rounded-2xl text-xs text-red-700 flex items-start gap-3 shadow-xs">
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-red-800">Operation Notice</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Action Trigger Button */}
          {file && !result && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleProcess}
                disabled={isProcessing}
                className="liquid-glass-wrapper px-8 py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 shadow-xl shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 text-sm sm:text-base cursor-pointer"
              >
                <div className="liquidGlass-effect" />
                <div className="liquidGlass-tint" />
                <div className="liquidGlass-shine" />
                <span className="relative z-10 flex items-center gap-2">
                  {subMode === 'protect' ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Encrypt & Protect PDF</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>Unlock & Remove Password</span>
                    </>
                  )}
                </span>
              </button>
            </div>
          )}

          {/* Success Result & Download Area */}
          {result && (
            <div className="bg-emerald-50/80 backdrop-blur-xl border border-emerald-200/80 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-lg shadow-emerald-500/10">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-slate-900">
                  {result.mode === 'protect' ? 'PDF Protected Successfully!' : 'PDF Unlocked Successfully!'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                  {result.mode === 'protect'
                    ? 'Your document is now secured with password protection. Readers will be asked for the password before opening.'
                    : 'The encryption security layer has been removed. You can now open and view this PDF without entering a password.'}
                </p>
              </div>

              <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/80 border border-emerald-200 rounded-xl text-xs text-slate-700 shadow-xs">
                <span className="font-bold text-slate-800">{result.fileName}</span>
                <span>•</span>
                <span>{formatFileSize(result.size)}</span>
                {result.algorithm && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600 font-semibold">{result.algorithm}</span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a
                  href={result.dataUrl}
                  download={result.fileName}
                  className="liquid-glass-wrapper px-6 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Processed PDF</span>
                </a>

                <button
                  type="button"
                  onClick={clearSelection}
                  className="px-5 py-3 rounded-2xl text-xs font-semibold text-slate-700 bg-white/90 hover:bg-white border border-slate-200 shadow-xs transition-all"
                >
                  Process Another PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
