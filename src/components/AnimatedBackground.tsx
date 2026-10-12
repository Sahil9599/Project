import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-slate-900">
      {/* High-Resolution Modern Fluid Wallpaper */}
      <img
        src="/background.png"
        alt="DocuMorph Wallpaper"
        className="w-full h-full object-cover object-center"
      />

      {/* Gentle crystal ambient overlay letting wallpaper colors and fluid curves shine through */}
      <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-transparent to-slate-950/30" />
    </div>
  );
};
