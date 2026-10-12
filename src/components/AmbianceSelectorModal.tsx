import React, { useRef, useState } from 'react';
import {
  X,
  Sun,
  Moon,
  Sparkles,
  Upload,
  Check,
  RotateCcw,
  Sliders,
  Image as ImageIcon,
  Trash2,
  Layers,
} from 'lucide-react';
import {
  useAmbiance,
  WALLPAPER_PRESETS,
  WallpaperPreset,
  GlassBlurIntensity,
} from '../context/AmbianceContext';

interface AmbianceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AmbianceSelectorModal: React.FC<AmbianceSelectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    wallpaper,
    setWallpaper,
    glassMode,
    setGlassMode,
    glassBlur,
    setGlassBlur,
    particlesEnabled,
    setParticlesEnabled,
    customWallpaperUrl,
    setCustomWallpaperUrl,
    resetToDefaults,
  } = useAmbiance();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCustomFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    // Limit size to 5MB to avoid browser quota issues
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image file must be under 5MB.');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCustomWallpaperUrl(result);
      setWallpaper('custom');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomWallpaper = () => {
    setCustomWallpaperUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/40 backdrop-blur-md animate-fadeIn">
      {/* Liquid Glass Modal Card */}
      <div className="liquid-glass relative w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-white/70">
        <div className="liquid-glass--bend" />
        <div className="liquid-glass--face" />
        <div className="liquid-glass--edge" />

        <div className="relative z-10 flex flex-col max-h-[92vh] overflow-hidden">
          {/* Header */}
          <div className="px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  Ambiance & Glass Luxury
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                    Live
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tailor dynamic wallpapers, frosted glass depth, and light/dark mood
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-6 text-xs">
            {/* 1. GLASS THEME MODE SWITCH (LIGHT VS DARK OBSIDIAN) */}
            <div className="space-y-2.5">
              <label className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Glass Aesthetics & Contrast
              </label>

              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100/70 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setGlassMode('light')}
                  className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold transition-all cursor-pointer ${
                    glassMode === 'light'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md shadow-slate-900/10 border border-white/80'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sun className={`w-4 h-4 ${glassMode === 'light' ? 'text-amber-500' : ''}`} />
                  <div className="text-left">
                    <div className="text-xs">Light Crystalline</div>
                    <div className="text-[10px] font-normal opacity-70">Pure crystal glass frost</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setGlassMode('dark')}
                  className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold transition-all cursor-pointer ${
                    glassMode === 'dark'
                      ? 'bg-slate-950 text-white shadow-md shadow-indigo-950/40 border border-indigo-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Moon className={`w-4 h-4 ${glassMode === 'dark' ? 'text-indigo-400' : ''}`} />
                  <div className="text-left">
                    <div className="text-xs">Dark Obsidian</div>
                    <div className="text-[10px] font-normal opacity-70">Smoked matte crystal</div>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. DYNAMIC WALLPAPERS SELECTION GRID */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Dynamic Wallpaper Presets
                </label>
                <span className="text-[11px] text-slate-400">Instant cross-fade</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {WALLPAPER_PRESETS.map((preset) => {
                  const isActive = wallpaper === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setWallpaper(preset.id)}
                      className={`group relative p-2.5 rounded-2xl border text-left transition-all cursor-pointer overflow-hidden flex flex-col justify-between h-28 ${
                        isActive
                          ? 'border-blue-600 dark:border-blue-400 bg-white/90 dark:bg-slate-900/90 shadow-md shadow-blue-500/20 ring-2 ring-blue-500/30'
                          : 'border-white/60 dark:border-white/10 bg-white/50 dark:bg-slate-900/40 hover:bg-white/80 dark:hover:bg-slate-900/70 hover:border-slate-300'
                      }`}
                    >
                      {/* Mini Preview Background */}
                      <div className="absolute inset-0 z-0 overflow-hidden opacity-30 group-hover:opacity-40 transition-opacity">
                        {preset.id === 'mistletoe' && (
                          <img
                            src="/background.png"
                            alt="preview"
                            className="w-full h-full object-cover object-center filter saturate-150"
                          />
                        )}
                        {preset.id === 'custom' && customWallpaperUrl && (
                          <img
                            src={customWallpaperUrl}
                            alt="preview"
                            className="w-full h-full object-cover object-center"
                          />
                        )}
                        {preset.id !== 'mistletoe' && preset.id !== 'custom' && (
                          <div
                            className={`w-full h-full bg-gradient-to-br ${preset.colorPreview}`}
                          />
                        )}
                      </div>

                      {/* Top Bar with Tag and Active Check */}
                      <div className="relative z-10 flex items-center justify-between w-full">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white/80 dark:bg-black/60 text-slate-700 dark:text-slate-300 border border-white/50 dark:border-white/10">
                          {preset.tag}
                        </span>

                        {isActive && (
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Bottom Info */}
                      <div className="relative z-10 mt-auto">
                        <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                          {preset.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {preset.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. CUSTOM WALLPAPER UPLOAD ZONE (If user wants their own) */}
            <div className="p-3.5 bg-white/60 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/70 dark:border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  Personal Desktop Wallpaper
                </span>
                {customWallpaperUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveCustomWallpaper}
                    className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove Image
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleCustomFileChange}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 px-3.5 rounded-xl border border-dashed border-blue-400 dark:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-blue-700 dark:text-blue-300 font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {customWallpaperUrl ? 'Replace Custom Image' : 'Choose Wallpaper from PC'}
                  </span>
                </button>

                {customWallpaperUrl && (
                  <button
                    type="button"
                    onClick={() => setWallpaper('custom')}
                    className={`py-2 px-4 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                      wallpaper === 'custom'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-white/80 dark:border-white/10'
                    }`}
                  >
                    {wallpaper === 'custom' ? 'Applied' : 'Apply Now'}
                  </button>
                )}
              </div>

              {uploadError && (
                <p className="text-[11px] text-rose-500 font-medium">{uploadError}</p>
              )}
            </div>

            {/* 4. FROSTED GLASS BLUR INTENSITY & PARTICLES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Blur Intensity */}
              <div className="p-3.5 bg-white/60 dark:bg-slate-900/50 rounded-2xl border border-white/70 dark:border-white/10 space-y-2">
                <label className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  Glass Blur Depth
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/70 dark:bg-slate-800/70 rounded-xl">
                  {(['subtle', 'balanced', 'deep'] as GlassBlurIntensity[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setGlassBlur(level)}
                      className={`py-1.5 text-[11px] font-bold rounded-lg capitalize transition-all cursor-pointer ${
                        glassBlur === level
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Atmospheric Bokeh Particles */}
              <div className="p-3.5 bg-white/60 dark:bg-slate-900/50 rounded-2xl border border-white/70 dark:border-white/10 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Ambient Light Particles
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Floating bokeh ambient discs
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setParticlesEnabled(!particlesEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    particlesEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      particlesEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="px-5 sm:px-7 py-4 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between gap-3 bg-white/40 dark:bg-slate-950/40">
            <button
              type="button"
              onClick={resetToDefaults}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Default
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer"
            >
              Apply & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
