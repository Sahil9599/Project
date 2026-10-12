import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: 'photo-to-pdf' | 'pdf-to-photo' | 'sign-watermark' | 'merge-pdfs';
  setActiveTab: (tab: 'photo-to-pdf' | 'pdf-to-photo' | 'sign-watermark' | 'merge-pdfs') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="sticky top-2 sm:top-3 z-40 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mb-2">
      <div className="liquid-glass relative w-full overflow-hidden shadow-lg shadow-blue-950/5">
        {/* Liquid Glass Layers from CSS */}
        <div className="liquid-glass--bend" />
        <div className="liquid-glass--face" />
        <div className="liquid-glass--edge" />

        {/* Header Interactive Content */}
        <div className="relative z-10 px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Brand title */}
          <button
            onClick={() => setActiveTab('photo-to-pdf')}
            className="text-xl font-extrabold tracking-tight whitespace-nowrap shrink-0 transition-opacity hover:opacity-80 flex items-center gap-2 text-left"
          >
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
              DocuMorph
            </span>
          </button>

          {/* Zone 2: Navigation Links with Liquid Glass links */}
          <nav className="hidden md:flex items-center gap-2 text-sm font-medium">
            <button
              onClick={() => setActiveTab('photo-to-pdf')}
              className={`liquid-glass__link whitespace-nowrap shrink-0 px-3.5 py-2 text-xs font-semibold ${
                activeTab === 'photo-to-pdf'
                  ? 'is-active'
                  : 'text-slate-700 hover:text-slate-900 bg-white/40'
              }`}
            >
              Photo to PDF
            </button>
            <button
              onClick={() => setActiveTab('pdf-to-photo')}
              className={`liquid-glass__link whitespace-nowrap shrink-0 px-3.5 py-2 text-xs font-semibold ${
                activeTab === 'pdf-to-photo'
                  ? 'is-active'
                  : 'text-slate-700 hover:text-slate-900 bg-white/40'
              }`}
            >
              PDF to Photo
            </button>
            <button
              onClick={() => setActiveTab('sign-watermark')}
              className={`liquid-glass__link whitespace-nowrap shrink-0 px-3.5 py-2 text-xs font-semibold ${
                activeTab === 'sign-watermark'
                  ? 'is-active'
                  : 'text-slate-700 hover:text-slate-900 bg-white/40'
              }`}
            >
              Sign & Watermark
            </button>
            <button
              onClick={() => setActiveTab('merge-pdfs')}
              className={`liquid-glass__link whitespace-nowrap shrink-0 px-3.5 py-2 text-xs font-semibold ${
                activeTab === 'merge-pdfs'
                  ? 'is-active'
                  : 'text-slate-700 hover:text-slate-900 bg-white/40'
              }`}
            >
              Merge PDFs
            </button>
          </nav>

          {/* Zone 3: Privacy & Security Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="liquid-glass__link flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white/50">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Secure & Private</span>
            </div>
          </div>
        </div>

        {/* Mobile nav subbar */}
        <div className="md:hidden relative z-10 flex flex-wrap items-center justify-center gap-1.5 px-3 py-2 border-t border-white/50 text-xs font-medium text-slate-700 bg-white/30">
          <button
            onClick={() => setActiveTab('photo-to-pdf')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeTab === 'photo-to-pdf' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-700 hover:bg-white/40'
            }`}
          >
            Photo to PDF
          </button>
          <button
            onClick={() => setActiveTab('pdf-to-photo')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeTab === 'pdf-to-photo' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-700 hover:bg-white/40'
            }`}
          >
            PDF to Photo
          </button>
          <button
            onClick={() => setActiveTab('sign-watermark')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeTab === 'sign-watermark' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-700 hover:bg-white/40'
            }`}
          >
            Sign & Watermark
          </button>
          <button
            onClick={() => setActiveTab('merge-pdfs')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeTab === 'merge-pdfs' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-700 hover:bg-white/40'
            }`}
          >
            Merge PDFs
          </button>
        </div>
      </div>
    </header>
  );
};
