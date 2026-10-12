import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: 'photo-to-pdf' | 'pdf-to-photo' | 'cloud-vault' | 'history';
  setActiveTab: (tab: 'photo-to-pdf' | 'pdf-to-photo' | 'cloud-vault' | 'history') => void;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuthModal,
}) => {
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

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

        {/* Zone 3: Account dropdown if active */}
        <div className="flex items-center gap-3 shrink-0 relative">
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-neutral-200 bg-neutral-900 border border-neutral-800 rounded-lg hover:border-neutral-700 hover:bg-neutral-800/80 transition-colors whitespace-nowrap shrink-0"
              >
                <User className="w-3.5 h-3.5 text-neutral-400" />
                <span className="max-w-[120px] truncate">
                  {user.displayName || user.email || 'My Account'}
                </span>
              </button>

              {showUserMenu && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-xl bg-neutral-900 border border-neutral-800 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  <div className="px-2 py-1.5 border-b border-neutral-800 mb-2">
                    <p className="text-xs text-neutral-400">Active session</p>
                    <p className="text-xs font-semibold text-neutral-200 truncate mt-0.5">
                      {user.email || 'Private Workspace'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] text-neutral-400 font-mono">
                      <ShieldCheck className="w-3 h-3 text-neutral-300 shrink-0" />
                      <span className="truncate">UID: {user.uid}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('cloud-vault')}
                    className="w-full text-left px-2 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
                  >
                    Personal Vault
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="w-full text-left px-2 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
                  >
                    Conversion History
                  </button>
                  <button
                    onClick={() => signOut()}
                    className="w-full text-left px-2 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors flex items-center gap-1.5 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Reset Session</span>
                  </button>
                </div>
              )}
            </div>
          )}
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
