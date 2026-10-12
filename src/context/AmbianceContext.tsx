import React, { createContext, useContext, useState, useEffect } from 'react';

export type WallpaperPreset = 'mistletoe' | 'obsidian' | 'solstice' | 'glacier' | 'aurora' | 'custom';
export type GlassMode = 'light' | 'dark';
export type GlassBlurIntensity = 'subtle' | 'balanced' | 'deep';

export interface WallpaperOption {
  id: WallpaperPreset;
  name: string;
  subtitle: string;
  colorPreview: string; // Tailwind gradient or CSS color
  tag: string;
}

export const WALLPAPER_PRESETS: WallpaperOption[] = [
  {
    id: 'mistletoe',
    name: 'Mistletoe Velvet',
    subtitle: 'Signature botanical emerald & deep foliage',
    colorPreview: 'from-emerald-950 via-teal-900 to-slate-950',
    tag: 'Signature',
  },
  {
    id: 'obsidian',
    name: 'Midnight Obsidian',
    subtitle: 'Deep stealth space & matte smoked crystal',
    colorPreview: 'from-slate-950 via-indigo-950 to-neutral-950',
    tag: 'Ultra Dark',
  },
  {
    id: 'solstice',
    name: 'Pastel Solstice',
    subtitle: 'Warm golden hour, blush coral & lavender',
    colorPreview: 'from-amber-200 via-rose-300 to-purple-400',
    tag: 'Warm Pastel',
  },
  {
    id: 'glacier',
    name: 'Nordic Glacier',
    subtitle: 'Arctic crystalline frost & cerulean glow',
    colorPreview: 'from-sky-200 via-cyan-400 to-blue-600',
    tag: 'Frost Crystal',
  },
  {
    id: 'aurora',
    name: 'Cyber Aurora',
    subtitle: 'Boreal neon waves & electric violet ribbons',
    colorPreview: 'from-fuchsia-600 via-purple-900 to-emerald-500',
    tag: 'Vibrant Glow',
  },
  {
    id: 'custom',
    name: 'Custom Wallpaper',
    subtitle: 'Upload any high-res desktop background',
    colorPreview: 'from-slate-700 via-slate-800 to-slate-900',
    tag: 'Personal',
  },
];

interface AmbianceContextType {
  wallpaper: WallpaperPreset;
  setWallpaper: (preset: WallpaperPreset) => void;
  glassMode: GlassMode;
  setGlassMode: (mode: GlassMode) => void;
  toggleGlassMode: () => void;
  glassBlur: GlassBlurIntensity;
  setGlassBlur: (blur: GlassBlurIntensity) => void;
  particlesEnabled: boolean;
  setParticlesEnabled: (enabled: boolean) => void;
  customWallpaperUrl: string | null;
  setCustomWallpaperUrl: (url: string | null) => void;
  resetToDefaults: () => void;
}

const STORAGE_KEY = 'documorph_ambiance_preferences';

const AmbianceContext = createContext<AmbianceContextType | undefined>(undefined);

export const AmbianceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallpaper, setWallpaperState] = useState<WallpaperPreset>('mistletoe');
  const [glassMode, setGlassModeState] = useState<GlassMode>('light');
  const [glassBlur, setGlassBlurState] = useState<GlassBlurIntensity>('balanced');
  const [particlesEnabled, setParticlesEnabledState] = useState<boolean>(true);
  const [customWallpaperUrl, setCustomWallpaperUrlState] = useState<string | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.wallpaper) setWallpaperState(parsed.wallpaper);
        if (parsed.glassMode) setGlassModeState(parsed.glassMode);
        if (parsed.glassBlur) setGlassBlurState(parsed.glassBlur);
        if (typeof parsed.particlesEnabled === 'boolean') setParticlesEnabledState(parsed.particlesEnabled);
        if (parsed.customWallpaperUrl) setCustomWallpaperUrlState(parsed.customWallpaperUrl);
      }
    } catch (e) {
      console.warn('Could not read ambiance settings from localStorage', e);
    }
  }, []);

  // Save changes to localStorage and update HTML attribute
  const savePreferences = (updated: {
    wallpaper?: WallpaperPreset;
    glassMode?: GlassMode;
    glassBlur?: GlassBlurIntensity;
    particlesEnabled?: boolean;
    customWallpaperUrl?: string | null;
  }) => {
    try {
      const current = {
        wallpaper,
        glassMode,
        glassBlur,
        particlesEnabled,
        customWallpaperUrl,
        ...updated,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (e) {
      console.warn('Could not save ambiance settings to localStorage', e);
    }
  };

  const setWallpaper = (preset: WallpaperPreset) => {
    setWallpaperState(preset);
    savePreferences({ wallpaper: preset });
  };

  const setGlassMode = (mode: GlassMode) => {
    setGlassModeState(mode);
    savePreferences({ glassMode: mode });
  };

  const toggleGlassMode = () => {
    const next = glassMode === 'light' ? 'dark' : 'light';
    setGlassMode(next);
  };

  const setGlassBlur = (blur: GlassBlurIntensity) => {
    setGlassBlurState(blur);
    savePreferences({ glassBlur: blur });
  };

  const setParticlesEnabled = (enabled: boolean) => {
    setParticlesEnabledState(enabled);
    savePreferences({ particlesEnabled: enabled });
  };

  const setCustomWallpaperUrl = (url: string | null) => {
    setCustomWallpaperUrlState(url);
    if (url) {
      setWallpaperState('custom');
      savePreferences({ customWallpaperUrl: url, wallpaper: 'custom' });
    } else {
      if (wallpaper === 'custom') {
        setWallpaperState('mistletoe');
        savePreferences({ customWallpaperUrl: null, wallpaper: 'mistletoe' });
      } else {
        savePreferences({ customWallpaperUrl: null });
      }
    }
  };

  const resetToDefaults = () => {
    setWallpaperState('mistletoe');
    setGlassModeState('light');
    setGlassBlurState('balanced');
    setParticlesEnabledState(true);
    setCustomWallpaperUrlState(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  // Sync with document element attributes for global CSS styling
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', glassMode);
    root.setAttribute('data-wallpaper', wallpaper);
    root.setAttribute('data-blur', glassBlur);

    if (glassMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [glassMode, wallpaper, glassBlur]);

  return (
    <AmbianceContext.Provider
      value={{
        wallpaper,
        setWallpaper,
        glassMode,
        setGlassMode,
        toggleGlassMode,
        glassBlur,
        setGlassBlur,
        particlesEnabled,
        setParticlesEnabled,
        customWallpaperUrl,
        setCustomWallpaperUrl,
        resetToDefaults,
      }}
    >
      {children}
    </AmbianceContext.Provider>
  );
};

export const useAmbiance = (): AmbianceContextType => {
  const context = useContext(AmbianceContext);
  if (!context) {
    throw new Error('useAmbiance must be used within an AmbianceProvider');
  }
  return context;
};
