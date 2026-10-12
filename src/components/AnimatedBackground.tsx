import React, { useMemo } from 'react';
import { useAmbiance } from '../context/AmbianceContext';

export const AnimatedBackground: React.FC = () => {
  const { wallpaper, glassMode, customWallpaperUrl, particlesEnabled } = useAmbiance();

  // Floating ambient light particles (subtle, non-distracting luxury aesthetic)
  const particles = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      size: Math.floor(100 + (i % 5) * 60),
      top: `${(i * 17) % 95}%`,
      left: `${(i * 23) % 95}%`,
      duration: `${18 + (i % 6) * 4}s`,
      delay: `${-(i * 2)}s`,
      opacity: 0.12 + (i % 3) * 0.06,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-slate-950 transition-colors duration-700">
      {/* 1. WALLPAPER RENDERING LAYER */}
      {wallpaper === 'mistletoe' && (
        <div className="absolute inset-0 transition-opacity duration-700">
          <img
            src="/background.png"
            alt="Mistletoe Velvet Wallpaper"
            className="w-full h-full object-cover object-center"
          />
          {/* Ambient tint adapted to dark / light glass */}
          <div
            className={`absolute inset-0 transition-colors duration-500 ${
              glassMode === 'dark'
                ? 'bg-slate-950/45 backdrop-blur-[1px]'
                : 'bg-slate-950/15 backdrop-blur-[0.5px]'
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-transparent to-slate-950/40" />
        </div>
      )}

      {wallpaper === 'obsidian' && (
        <div className="absolute inset-0 transition-opacity duration-700 bg-[#020617]">
          {/* Deep Space Indigo & Cyan Mesh */}
          <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-indigo-900/30 via-slate-900/10 to-transparent blur-3xl animate-drift" />
          <div className="absolute top-[40%] -right-[15%] w-[65vw] h-[65vw] rounded-full bg-gradient-to-bl from-cyan-950/35 via-blue-950/20 to-transparent blur-3xl animate-drift" style={{ animationDelay: '-7s' }} />
          <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-violet-950/30 via-slate-950 to-transparent blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/30 via-slate-950/70 to-[#020617]" />
        </div>
      )}

      {wallpaper === 'solstice' && (
        <div className="absolute inset-0 transition-opacity duration-700 bg-gradient-to-br from-amber-100 via-rose-100 to-indigo-100 dark:from-slate-950 dark:via-rose-950/40 dark:to-slate-950">
          {/* Warm Golden Hour & Twilight Fluid Blobs */}
          <div className="absolute -top-[15%] -left-[10%] w-[65vw] h-[65vw] rounded-full bg-gradient-to-br from-amber-300/40 via-rose-300/30 to-purple-300/20 blur-3xl animate-drift" />
          <div className="absolute top-[35%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-bl from-pink-300/40 via-purple-300/30 to-sky-200/20 blur-3xl animate-drift" style={{ animationDelay: '-10s' }} />
          <div className="absolute -bottom-[15%] left-[25%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-tr from-amber-200/35 via-rose-200/25 to-indigo-200/20 blur-3xl" />
          {glassMode === 'dark' && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px]" />
          )}
        </div>
      )}

      {wallpaper === 'glacier' && (
        <div className="absolute inset-0 transition-opacity duration-700 bg-gradient-to-br from-slate-900 via-sky-950 to-slate-950">
          {/* Arctic Frost & Cerulean Crystal Mesh */}
          <div className="absolute -top-[10%] -left-[10%] w-[65vw] h-[65vw] rounded-full bg-gradient-to-br from-cyan-400/25 via-sky-500/15 to-transparent blur-3xl animate-drift" />
          <div className="absolute top-[40%] -right-[15%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-bl from-blue-400/20 via-teal-400/15 to-transparent blur-3xl animate-drift" style={{ animationDelay: '-8s' }} />
          <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-sky-400/20 via-slate-900 to-transparent blur-3xl" />
          <div className="absolute inset-0 bg-radial from-cyan-900/15 via-transparent to-slate-950/70" />
          {glassMode === 'light' ? (
            <div className="absolute inset-0 bg-sky-100/15" />
          ) : (
            <div className="absolute inset-0 bg-slate-950/40" />
          )}
        </div>
      )}

      {wallpaper === 'aurora' && (
        <div className="absolute inset-0 transition-opacity duration-700 bg-slate-950 overflow-hidden">
          {/* Boreal Neon Northern Lights */}
          <div className="absolute -top-[30%] -left-[20%] w-[90vw] h-[90vw] rounded-full bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-transparent blur-3xl animate-aurora" />
          <div className="absolute -bottom-[20%] -right-[20%] w-[90vw] h-[90vw] rounded-full bg-gradient-to-l from-fuchsia-600/25 via-purple-600/20 to-transparent blur-3xl animate-aurora" style={{ animationDelay: '-12s' }} />
          <div className="absolute top-[20%] left-[10%] w-[70vw] h-[50vw] rounded-full bg-gradient-to-tr from-indigo-500/20 via-cyan-400/15 to-transparent blur-3xl animate-drift" />
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]" />
        </div>
      )}

      {wallpaper === 'custom' && (
        <div className="absolute inset-0 transition-opacity duration-700">
          {customWallpaperUrl ? (
            <img
              src={customWallpaperUrl}
              alt="Custom User Wallpaper"
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <img
              src="/background.png"
              alt="Default Wallpaper"
              className="w-full h-full object-cover object-center"
            />
          )}
          <div
            className={`absolute inset-0 transition-colors duration-500 ${
              glassMode === 'dark'
                ? 'bg-slate-950/50 backdrop-blur-[1px]'
                : 'bg-slate-950/20 backdrop-blur-[0.5px]'
            }`}
          />
        </div>
      )}

      {/* 2. OPTIONAL FLOATING AMBIENT PARTICLES */}
      {particlesEnabled && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full transition-opacity duration-1000 animate-pulse"
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                top: p.top,
                left: p.left,
                background:
                  wallpaper === 'solstice'
                    ? 'radial-gradient(circle, rgba(251, 146, 60, 0.15) 0%, rgba(251, 113, 133, 0) 70%)'
                    : wallpaper === 'glacier'
                    ? 'radial-gradient(circle, rgba(56, 189, 248, 0.16) 0%, rgba(14, 165, 233, 0) 70%)'
                    : wallpaper === 'aurora'
                    ? 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(139, 92, 246, 0) 70%)'
                    : 'radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 70%)',
                animationDuration: p.duration,
                animationDelay: p.delay,
              }}
            />
          ))}
        </div>
      )}

      {/* 3. LIGHT CRYSTAL VIGNETTE */}
      <div className="absolute inset-0 bg-radial from-transparent via-transparent to-slate-950/35 pointer-events-none" />
    </div>
  );
};
