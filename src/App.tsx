import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { PhotoToPdfConverter } from './components/PhotoToPdfConverter';
import { PdfToPhotoConverter } from './components/PdfToPhotoConverter';
import { SignWatermarkConverter } from './components/SignWatermarkConverter';
import { AnimatedBackground } from './components/AnimatedBackground';
import { FileImage, FileText, Stamp, Shield } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'photo-to-pdf' | 'pdf-to-photo' | 'sign-watermark'>('photo-to-pdf');

  return (
    <div className="min-h-screen relative text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Dynamic Animated Ambient Wallpaper Background */}
      <AnimatedBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Modern Frosted Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Main Workspace Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {/* Mode Switcher Banner (Below Header) */}
          <div className="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 p-1.5 bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg shadow-blue-950/5 rounded-2xl self-start">
              <button
                onClick={() => setActiveTab('photo-to-pdf')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
                  activeTab === 'photo-to-pdf'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <FileImage className="w-3.5 h-3.5" />
                <span>Photo to PDF</span>
              </button>
              <button
                onClick={() => setActiveTab('pdf-to-photo')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
                  activeTab === 'pdf-to-photo'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF to Photo</span>
              </button>
              <button
                onClick={() => setActiveTab('sign-watermark')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
                  activeTab === 'sign-watermark'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Stamp className="w-3.5 h-3.5" />
                <span>Sign & Watermark</span>
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-white/75 backdrop-blur-xl border border-white/60 rounded-xl shadow-sm text-slate-700 font-medium">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Client-Side Processing & Privacy Isolation</span>
              </div>
            </div>
          </div>

          {/* Tab Views */}
          {activeTab === 'photo-to-pdf' && <PhotoToPdfConverter />}

          {activeTab === 'pdf-to-photo' && <PdfToPhotoConverter />}

          {activeTab === 'sign-watermark' && <SignWatermarkConverter />}
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
                <span aria-hidden="true" className="text-slate-400">·</span>
                <span className="font-medium text-slate-700">Batch Conversion & Secure Document Studio</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <span className="liquid-glass__link px-3 py-1 bg-white/45 text-[11px] font-semibold text-slate-700 select-none">
                  High-Fidelity Compression
                </span>
                <span className="liquid-glass__link px-3 py-1 bg-white/45 text-[11px] font-semibold text-slate-700 select-none">
                  Zero Server Re-encoding
                </span>
                <span className="liquid-glass__link px-3 py-1 bg-white/45 text-[11px] font-semibold text-slate-700 select-none">
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
      <AppContent />
    </AuthProvider>
  );
}
