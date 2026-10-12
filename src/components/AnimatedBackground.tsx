import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-neutral-950">
      {/* High-Resolution Modern Fluid Wallpaper */}
      <img
        src="/background.png"
        alt="DocuMorph Background Wallpaper"
        className="w-full h-full object-cover object-center scale-100"
      />

      {/* Subtle modern dark overlay to ensure maximum contrast and readability */}
      <div className="absolute inset-0 bg-neutral-950/60 backdrop-brightness-[0.88]" />

      {/* Soft gradient wash top and bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/80 via-transparent to-neutral-950/90" />
    </div>
  );
};
