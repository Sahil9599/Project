import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AmbianceProvider, useAmbiance } from './context/AmbianceContext';
import { Header } from './components/Header';
import { PhotoToPdfConverter } from './components/PhotoToPdfConverter';
import { PdfToPhotoConverter } from './components/PdfToPhotoConverter';
import { SignWatermarkConverter } from './components/SignWatermarkConverter';
import { MergePdfsConverter } from './components/MergePdfsConverter';
import { ProtectUnlockConverter } from './components/ProtectUnlockConverter';
import { AnimatedBackground } from './components/AnimatedBackground';
import { FileImage, FileText, Stamp, Files, ShieldCheck, Shield } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'photo-to-pdf' | 'pdf-to-photo' | 'sign-watermark' | 'merge-pdfs' | 'protect-unlock'>('photo-to-pdf');
  const { glassMode } = useAmbiance();

  return (
    <div className="min-h-screen relative text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white transition-colors duration-400">
      {/* Dynamic Animated Ambient Wallpaper Background */}
      <AnimatedBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Modern Frosted Header */}
        <Header />

        {/* Main Workspace Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {/* Mode Switcher Banner (Below Header) */}
          <div className="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-lg shadow-blue-950/5 rounded-2xl self-start">
              <button
                onClick={() => setActiveTab('photo-to-pdf')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'photo-to-pdf'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10'
                }`}
              >
                <FileImage className="w-3.5 h-3.5" />
                <span>Photo to PDF</span>
              </button>
              <button
                onClick={() => setActiveTab('pdf-to-photo')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'pdf-to-photo'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF to Photo</span>
              </button>
              <button
                onClick={() => setActiveTab('sign-watermark')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'sign-watermark'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10'
                }`}
              >
                <Stamp className="w-3.5 h-3.5" />
                <span>Sign & Watermark</span>
              </button>
              <button
                onClick={() => setActiveTab('merge-pdfs')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'merge-pdfs'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10'
                }`}
              >
                <Files className="w-3.5 h-3.5" />
                <span>Merge PDFs</span>
              </button>
              <button
                onClick={() => setActiveTab('protect-unlock')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'protect-unlock'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Protect & Unlock</span>
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-xl shadow-sm text-slate-700 dark:text-slate-200 font-medium">
                <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Client-Side Processing & Privacy Isolation</span>
              </div>
            </div>
          </div>

          {/* Tab Views */}
          {activeTab === 'photo-to-pdf' && <PhotoToPdfConverter />}

          {activeTab === 'pdf-to-photo' && <PdfToPhotoConverter />}

          {activeTab === 'sign-watermark' && <SignWatermarkConverter />}

          {activeTab === 'merge-pdfs' && <MergePdfsConverter />}

          {activeTab === 'protect-unlock' && <ProtectUnlockConverter />}
        </main>

        {/* Floating Liquid Glass Bottom Footer */}
        <footer className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-auto pt-6 pb-6">
          <div className="liquid-glass relative w-full overflow-hidden shadow-lg shadow-blue-950/5">
            {/* Liquid Glass Layers from CSS */}
            <div className="liquid-glass--bend" />
            <div className="liquid-glass--face" />
            <div className="liquid-glass--edge" />

            {/* Bottom Interactive Content */}
            <div className="relative z-10 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
                  DocuMorph
                </span>
                <span aria-hidden="true" className="text-slate-400 dark:text-slate-500">·</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Batch Conversion & Secure Document Studio
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <span className="liquid-glass__link px-3 py-1 bg-white/45 dark:bg-white/10 text-[11px] font-semibold text-slate-700 dark:text-slate-200 select-none border border-white/50 dark:border-white/5">
                  High-Fidelity Compression
                </span>
                <span className="liquid-glass__link px-3 py-1 bg-white/45 dark:bg-white/10 text-[11px] font-semibold text-slate-700 dark:text-slate-200 select-none border border-white/50 dark:border-white/5">
                  Zero Server Re-encoding
                </span>
                <span className="liquid-glass__link px-3 py-1 bg-white/45 dark:bg-white/10 text-[11px] font-semibold text-slate-700 dark:text-slate-200 select-none border border-white/50 dark:border-white/5">
                  Pure Client-Side Security
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AmbianceProvider>
        <AppContent />
      </AmbianceProvider>
    </AuthProvider>
  );
}
