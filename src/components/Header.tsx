import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
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
          <div className="text-xl font-extrabold tracking-tight whitespace-nowrap shrink-0 flex items-center gap-2 text-left select-none">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
              DocuMorph
            </span>
          </div>

          {/* Zone 2: Privacy & Security Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="liquid-glass__link flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white/50">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Secure & Private</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
