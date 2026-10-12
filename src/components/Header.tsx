import React, { useState } from 'react';
import {
  ShieldCheck,
  HardDrive,
  Lock,
  Cpu,
  Info,
  CheckCircle2,
  X,
  Palette,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { useAmbiance, WALLPAPER_PRESETS } from '../context/AmbianceContext';
import { AmbianceSelectorModal } from './AmbianceSelectorModal';

export const Header: React.FC = () => {
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showAmbianceModal, setShowAmbianceModal] = useState(false);
  const { glassMode, toggleGlassMode, wallpaper } = useAmbiance();

  const currentPreset = WALLPAPER_PRESETS.find((p) => p.id === wallpaper) || WALLPAPER_PRESETS[0];

  return (
    <>
      <header className="sticky top-2 sm:top-3 z-40 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mb-2">
        <div className="liquid-glass relative w-full overflow-hidden shadow-lg shadow-blue-950/5">
          {/* Liquid Glass Layers from CSS */}
          <div className="liquid-glass--bend" />
          <div className="liquid-glass--face" />
          <div className="liquid-glass--edge" />

          {/* Header Interactive Content */}
          <div className="relative z-10 px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-6">
            {/* Zone 1: Brand title & Sub-badge */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight whitespace-nowrap shrink-0 flex items-center gap-2 select-none">
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
                  DocuMorph
                </span>
              </div>
              <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-white/40 dark:bg-white/10 px-2.5 py-0.5 rounded-full border border-white/60 dark:border-white/10">
                v2.5 Pro
              </span>
            </div>

            {/* Zone 2: Interactive Controls (Trust Booster + Ambiance & Glass Switcher) */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Animated Live Privacy & Security Trust Booster Pill */}
              <button
                type="button"
                onClick={() => setShowSecurityModal(true)}
                className="group relative liquid-glass__link flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 transition-all cursor-pointer border border-emerald-500/20 shadow-xs"
                title="Click to view Privacy & Client-Side Isolation Guarantee"
              >
                {/* Animated Green Pulse Indicator */}
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-xs shadow-emerald-500/50" />
                </span>

                {/* Status text */}
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-emerald-800 dark:text-emerald-400 text-[11px] sm:text-xs tracking-tight">
                    100% Client-Side
                  </span>
                  <span className="hidden md:inline text-slate-400">·</span>
                  <span className="hidden md:inline font-medium text-slate-600 dark:text-slate-300 text-[11px]">
                    Zero Cloud Uploads
                  </span>
                </div>

                {/* Info badge */}
                <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors ml-0.5" />
              </button>

              {/* Quick Dark/Light Glass Toggle */}
              <button
                type="button"
                onClick={toggleGlassMode}
                className="liquid-glass__link p-1.5 sm:p-2 text-slate-700 dark:text-slate-200 bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 transition-all cursor-pointer border border-white/60 dark:border-white/10 shadow-xs"
                title={`Switch to ${glassMode === 'light' ? 'Dark Obsidian' : 'Light Crystalline'} Glass`}
              >
                {glassMode === 'light' ? (
                  <Moon className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
              </button>

              {/* Dynamic Wallpaper & Ambiance Switcher Button */}
              <button
                type="button"
                onClick={() => setShowAmbianceModal(true)}
                className="group relative liquid-glass__link flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 transition-all cursor-pointer border border-blue-500/20 shadow-xs"
                title="Customize Wallpaper, Ambiance & Glass Depth"
              >
                <Palette className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                  Ambiance
                </span>
                {/* Active wallpaper indicator dot */}
                <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 ring-2 ring-blue-500/30" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dynamic Wallpaper & Ambiance Luxury Modal */}
      <AmbianceSelectorModal
        isOpen={showAmbianceModal}
        onClose={() => setShowAmbianceModal(false)}
      />

      {/* Trust & Privacy Security Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
          <div className="liquid-glass relative w-full max-w-lg overflow-hidden shadow-2xl p-6 sm:p-7 border border-white/80 dark:border-white/10">
            <div className="liquid-glass--bend" />
            <div className="liquid-glass--face" />
            <div className="liquid-glass--edge" />

            <div className="relative z-10 space-y-5">
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      Client-Side Privacy Guarantee
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50">
                        Active
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      How your sensitive documents remain strictly private
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSecurityModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Guarantees List */}
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-white/90 dark:border-white/10 rounded-2xl flex items-start gap-3 shadow-xs">
                  <div className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs">
                      100% In-Browser Execution
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                      All PDF conversions, signings, password encryption and watermarking are powered by WebAssembly and browser Canvas.
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-white/90 dark:border-white/10 rounded-2xl flex items-start gap-3 shadow-xs">
                  <div className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0 mt-0.5">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs">
                      Zero Server Uploads
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                      Your confidential PDFs, IDs, bank statements and signatures never leave your personal computer or touch external cloud servers.
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-white/90 dark:border-white/10 rounded-2xl flex items-start gap-3 shadow-xs">
                  <div className="p-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs">
                      Ephemeral RAM Storage
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                      Document buffers and cryptographic keys are erased from browser memory the moment you download or refresh the page.
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-200/50 dark:border-white/10">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Offline & Air-Gap Capable
                </span>
                <button
                  type="button"
                  onClick={() => setShowSecurityModal(false)}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all cursor-pointer shadow-xs"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
