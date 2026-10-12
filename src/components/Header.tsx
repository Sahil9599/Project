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
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand title, one line */}
        <button
          onClick={() => setActiveTab('photo-to-pdf')}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-neutral-200 transition-colors flex items-center gap-2 text-left"
        >
          <span>DocuMorph</span>
        </button>

        {/* Zone 2: 4 nav links, 1-2 word labels, single-line */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
          <button
            onClick={() => setActiveTab('photo-to-pdf')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'photo-to-pdf'
                ? 'text-white border-b-2 border-white pb-0.5'
                : 'hover:text-neutral-200'
            }`}
          >
            Photo to PDF
          </button>
          <button
            onClick={() => setActiveTab('pdf-to-photo')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'pdf-to-photo'
                ? 'text-white border-b-2 border-white pb-0.5'
                : 'hover:text-neutral-200'
            }`}
          >
            PDF to Photo
          </button>
          <button
            onClick={() => setActiveTab('cloud-vault')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'cloud-vault'
                ? 'text-white border-b-2 border-white pb-0.5'
                : 'hover:text-neutral-200'
            }`}
          >
            Cloud Vault
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'history'
                ? 'text-white border-b-2 border-white pb-0.5'
                : 'hover:text-neutral-200'
            }`}
          >
            History
          </button>
        </nav>

        {/* Zone 3: Privacy & Security Badge (No sign in button) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-neutral-300 bg-neutral-900/80 border border-neutral-800 rounded-lg shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Secure & Private</span>
          </div>
        </div>
      </div>

      {/* Mobile nav subbar */}
      <div className="md:hidden flex items-center justify-around px-4 py-2 border-t border-neutral-900 bg-neutral-950 text-xs font-medium text-neutral-400">
        <button
          onClick={() => setActiveTab('photo-to-pdf')}
          className={activeTab === 'photo-to-pdf' ? 'text-white font-semibold' : ''}
        >
          Photo to PDF
        </button>
        <button
          onClick={() => setActiveTab('pdf-to-photo')}
          className={activeTab === 'pdf-to-photo' ? 'text-white font-semibold' : ''}
        >
          PDF to Photo
        </button>
        <button
          onClick={() => setActiveTab('cloud-vault')}
          className={activeTab === 'cloud-vault' ? 'text-white font-semibold' : ''}
        >
          Vault
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={activeTab === 'history' ? 'text-white font-semibold' : ''}
        >
          History
        </button>
      </div>
    </header>
  );
};
