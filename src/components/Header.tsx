import React, { useState } from 'react';
import { ShieldCheck, HardDrive, Lock, Cpu, Info, CheckCircle2, X } from 'lucide-react';

export const Header: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <header className="sticky top-2 sm:top-3 z-40 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mb-2">
        <div className="liquid-glass relative w-full overflow-hidden shadow-lg shadow-blue-950/5">
          {/* Liquid Glass Layers from CSS */}
          <div className="liquid-glass--bend" />
          <div className="liquid-glass--face" />
          <div className="liquid-glass--edge" />

          {/* Header Interactive Content */}
          <div className="relative z-10 px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
            {/* Zone 1: Brand title & Sub-badge */}
            <div className="flex items-center gap-3">
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight whitespace-nowrap shrink-0 flex items-center gap-2 select-none">
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
                  DocuMorph
                </span>
              </div>
              <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-500 bg-white/40 px-2.5 py-0.5 rounded-full border border-white/60">
                v2.4 Pro
              </span>
            </div>

            {/* Zone 2: Animated Live Privacy & Security Trust Booster Pill */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="group relative liquid-glass__link flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 bg-white/60 hover:bg-white/80 transition-all cursor-pointer border border-emerald-500/20 shadow-xs"
                title="Click to view Privacy & Client-Side Isolation Guarantee"
              >
                {/* Animated Green Pulse Indicator */}
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-xs shadow-emerald-500/50" />
                </span>

                {/* Status text */}
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-emerald-800 text-[11px] sm:text-xs tracking-tight">
                    100% Client-Side
                  </span>
                  <span className="hidden md:inline text-slate-400">·</span>
                  <span className="hidden md:inline font-medium text-slate-600 text-[11px]">
                    Zero Cloud Uploads
                  </span>
                </div>

                {/* Info badge */}
                <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 transition-colors ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Trust & Privacy Security Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
          <div className="liquid-glass relative w-full max-w-lg overflow-hidden shadow-2xl p-6 sm:p-7 border border-white/80">
            <div className="liquid-glass--bend" />
            <div className="liquid-glass--face" />
            <div className="liquid-glass--edge" />

            <div className="relative z-10 space-y-5">
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 flex items-center justify-center shadow-inner">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      Client-Side Privacy Guarantee
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Active
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">How your sensitive documents remain strictly private</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white/60 rounded-xl transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Guarantees List */}
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-white/70 backdrop-blur-md border border-white/90 rounded-2xl flex items-start gap-3 shadow-xs">
                  <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">100% In-Browser Execution</h4>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      All PDF conversions, signings, merging, and cryptographic protections run exclusively using WebAssembly (Wasm) inside your browser memory.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-white/70 backdrop-blur-md border border-white/90 rounded-2xl flex items-start gap-3 shadow-xs">
                  <div className="p-1.5 rounded-xl bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Zero Cloud Uploads</h4>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Your files never leave your device and are never sent over the internet to remote servers or third-party databases.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-white/70 backdrop-blur-md border border-white/90 rounded-2xl flex items-start gap-3 shadow-xs">
                  <div className="p-1.5 rounded-xl bg-indigo-100 text-indigo-700 shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Instant RAM Purge</h4>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Temporary file representations exist only in active RAM and are immediately discarded as soon as you finish your task or close the tab.
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Status Summary */}
              <div className="p-3 bg-emerald-50/90 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-medium">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Sandbox Isolation: Fully Active
                </span>
                <span className="text-[11px] text-emerald-700">Encrypted Local Pipeline</span>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 text-xs font-bold text-slate-700 bg-white/90 hover:bg-white border border-slate-200 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Close & Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
