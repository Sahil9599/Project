import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: 'photo-to-pdf' | 'pdf-to-photo' | 'cloud-vault' | 'history';
  setActiveTab: (tab: 'photo-to-pdf' | 'pdf-to-photo' | 'cloud-vault' | 'history') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/40 bg-white/75 backdrop-blur-xl shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand title */}
        <button
          onClick={() => setActiveTab('photo-to-pdf')}
          className="text-xl font-extrabold tracking-tight whitespace-nowrap shrink-0 transition-opacity hover:opacity-80 flex items-center gap-2 text-left"
        >
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
            DocuMorph
          </span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('photo-to-pdf')}
            className={`whitespace-nowrap shrink-0 transition-all px-3.5 py-1.5 rounded-xl ${
              activeTab === 'photo-to-pdf'
                ? 'text-blue-700 font-semibold bg-blue-50/90 shadow-xs border border-blue-100'
                : 'hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Photo to PDF
          </button>
          <button
            onClick={() => setActiveTab('pdf-to-photo')}
            className={`whitespace-nowrap shrink-0 transition-all px-3.5 py-1.5 rounded-xl ${
              activeTab === 'pdf-to-photo'
                ? 'text-blue-700 font-semibold bg-blue-50/90 shadow-xs border border-blue-100'
                : 'hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            PDF to Photo
          </button>
          <button
            onClick={() => setActiveTab('cloud-vault')}
            className={`whitespace-nowrap shrink-0 transition-all px-3.5 py-1.5 rounded-xl ${
              activeTab === 'cloud-vault'
                ? 'text-blue-700 font-semibold bg-blue-50/90 shadow-xs border border-blue-100'
                : 'hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Cloud Vault
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`whitespace-nowrap shrink-0 transition-all px-3.5 py-1.5 rounded-xl ${
              activeTab === 'history'
                ? 'text-blue-700 font-semibold bg-blue-50/90 shadow-xs border border-blue-100'
                : 'hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            History
          </button>
        </nav>

        {/* Zone 3: Privacy & Security Badge (No sign button) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white/90 border border-white/80 rounded-xl shadow-xs">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Secure & Private</span>
          </div>
        </div>
      </div>

      {/* Mobile nav subbar */}
      <div className="md:hidden flex items-center justify-around px-4 py-2 border-t border-white/40 bg-white/85 backdrop-blur-lg text-xs font-medium text-slate-600">
        <button
          onClick={() => setActiveTab('photo-to-pdf')}
          className={activeTab === 'photo-to-pdf' ? 'text-blue-600 font-bold' : ''}
        >
          Photo to PDF
        </button>
        <button
          onClick={() => setActiveTab('pdf-to-photo')}
          className={activeTab === 'pdf-to-photo' ? 'text-blue-600 font-bold' : ''}
        >
          PDF to Photo
        </button>
        <button
          onClick={() => setActiveTab('cloud-vault')}
          className={activeTab === 'cloud-vault' ? 'text-blue-600 font-bold' : ''}
        >
          Vault
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={activeTab === 'history' ? 'text-blue-600 font-bold' : ''}
        >
          History
        </button>
      </div>
    </header>
  );
};
