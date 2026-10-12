import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { PhotoToPdfConverter } from './components/PhotoToPdfConverter';
import { PdfToPhotoConverter } from './components/PdfToPhotoConverter';
import { HistoryVault } from './components/HistoryVault';
import { AuthModal } from './components/AuthModal';
import { AnimatedBackground } from './components/AnimatedBackground';
import { FileImage, FileText, HardDrive, Shield } from 'lucide-react';

function AppContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'photo-to-pdf' | 'pdf-to-photo' | 'cloud-vault' | 'history'>('photo-to-pdf');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen relative bg-transparent text-neutral-100 flex flex-col font-sans selection:bg-neutral-800 selection:text-white">
      {/* Dynamic Animated Ambient Background */}
      <AnimatedBackground />

      {/* Top Bar Contract (3 Zones) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Mode Switcher Banner (Below Header) */}
        <div className="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-6">
          <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-xl self-start">
            <button
              onClick={() => setActiveTab('photo-to-pdf')}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'photo-to-pdf'
                  ? 'bg-neutral-100 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <FileImage className="w-3.5 h-3.5" />
              <span>Photo to PDF</span>
            </button>
            <button
              onClick={() => setActiveTab('pdf-to-photo')}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'pdf-to-photo'
                  ? 'bg-neutral-100 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF to Photo</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-neutral-300" />
              <span>Client-Side Processing & Privacy Isolation</span>
            </div>
            {user ? (
              <button
                onClick={() => setActiveTab('cloud-vault')}
                className="text-neutral-200 hover:underline flex items-center gap-1 font-medium"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Cloud Vault</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-neutral-200 hover:underline font-medium"
              >
                Sign in to save files
              </button>
            )}
          </div>
        </div>

        {/* Tab Views */}
        {activeTab === 'photo-to-pdf' && (
          <PhotoToPdfConverter
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onGoToVault={() => setActiveTab('cloud-vault')}
          />
        )}

        {activeTab === 'pdf-to-photo' && (
          <PdfToPhotoConverter
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onGoToVault={() => setActiveTab('cloud-vault')}
          />
        )}

        {activeTab === 'cloud-vault' && (
          <HistoryVault
            initialSubTab="vault"
            onNavigateToConvert={(t) => setActiveTab(t)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'history' && (
          <HistoryVault
            initialSubTab="history"
            onNavigateToConvert={(t) => setActiveTab(t)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}
      </main>

      {/* Minimalist Anti-Slop Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-8 text-neutral-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-400">DocuMorph</span>
            <span aria-hidden="true">·</span>
            <span>Batch Conversion & Secure Document Studio</span>
          </div>

          <div className="flex items-center gap-4 text-neutral-400">
            <a
              href="/documorph-source-code.zip"
              download="documorph-source-code.zip"
              className="text-neutral-300 hover:text-white underline font-medium"
            >
              Download Full Source (.ZIP)
            </a>
            <span aria-hidden="true">·</span>
            <span>High-Fidelity Compression</span>
            <span aria-hidden="true">·</span>
            <span>Personal UID Cloud Isolation</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
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
