import React, { createContext, useContext, useState, useEffect } from 'react';

const originalAudioPlay = typeof window !== 'undefined' ? HTMLAudioElement.prototype.play : null;
const originalAudioContext = typeof window !== 'undefined' ? (window.AudioContext || (window as any).webkitAudioContext) : null;

interface ThemeContextProps {
  decorumLevel: number;
  setDecorumLevel: (level: number) => void;
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
  fundiesGrid: boolean;
  setFundiesGrid: (active: boolean) => void;
  pinEngineActive: boolean;
  setPinEngineActive: (active: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  isUmpireOpen: boolean;
  setUmpireOpen: (open: boolean) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [decorumLevel, setDecorumLevelState] = useState<number>(() => {
    const saved = localStorage.getItem('decorumLevel');
    return saved !== null ? parseInt(saved, 10) : 11;
  });

  const [activeTheme, setActiveThemeState] = useState<string>(() => {
    const saved = localStorage.getItem('activeTheme');
    return saved !== null ? saved : 'sovereign-cyan';
  });

  const [fundiesGrid, setFundiesGridState] = useState<boolean>(() => {
    return localStorage.getItem('fundiesGrid') === 'true';
  });

  const [pinEngineActive, setPinEngineActiveState] = useState<boolean>(() => {
    return localStorage.getItem('pinEngineActive') === 'true';
  });

  const [isSidebarCollapsed, setIsSidebarCollapsedState] = useState<boolean>(() => {
    return localStorage.getItem('sovereign_sports_nav_collapsed') === 'true';
  });

  const [isUmpireOpen, setUmpireOpen] = useState<boolean>(false);

  const setDecorumLevel = (level: number) => {
    setDecorumLevelState(level);
    localStorage.setItem('decorumLevel', level.toString());
  };

  const setActiveTheme = (theme: string) => {
    setActiveThemeState(theme);
    localStorage.setItem('activeTheme', theme);
  };

  const setFundiesGrid = (active: boolean) => {
    setFundiesGridState(active);
    localStorage.setItem('fundiesGrid', active ? 'true' : 'false');
  };

  const setPinEngineActive = (active: boolean) => {
    setPinEngineActiveState(active);
    localStorage.setItem('pinEngineActive', active ? 'true' : 'false');
  };

  const setIsSidebarCollapsed = (collapsed: boolean) => {
    setIsSidebarCollapsedState(collapsed);
    localStorage.setItem('sovereign_sports_nav_collapsed', collapsed ? 'true' : 'false');
  };

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'decorumLevel' && e.newValue !== null) {
        setDecorumLevelState(parseInt(e.newValue, 10));
      }
      if (e.key === 'activeTheme' && e.newValue !== null) {
        setActiveThemeState(e.newValue);
      }
      if (e.key === 'fundiesGrid' && e.newValue !== null) {
        setFundiesGridState(e.newValue === 'true');
      }
      if (e.key === 'pinEngineActive' && e.newValue !== null) {
        setPinEngineActiveState(e.newValue === 'true');
      }
      if (e.key === 'sovereign_sports_nav_collapsed' && e.newValue !== null) {
        setIsSidebarCollapsedState(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes first
    root.classList.remove('sovereign-cyan', 'retro-16bit', 'the-show-sim', 'sny-cinematic', 'muppet-hell');
    // Add current theme class
    root.classList.add(activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    if (fundiesGrid) {
      document.body.classList.add('fundies-grid-active');
    } else {
      document.body.classList.remove('fundies-grid-active');
    }
  }, [fundiesGrid]);

  useEffect(() => {
    const root = document.documentElement;
    if (decorumLevel === 0) {
      root.classList.add('industrial-slate');
      
      if (typeof window !== 'undefined') {
        // Mute all new Audio() playback
        HTMLAudioElement.prototype.play = function() {
          return Promise.resolve();
        };

        // Mock AudioContext to return a dummy context
        const SilentAudioContext = function() {
          return {
            state: 'suspended',
            close: () => Promise.resolve(),
            suspend: () => Promise.resolve(),
            resume: () => Promise.resolve(),
            createGain: () => ({
              gain: { value: 0, setValueAtTime: () => {} },
              connect: () => {},
              disconnect: () => {},
            }),
            createOscillator: () => ({
              start: () => {},
              stop: () => {},
              connect: () => {},
              disconnect: () => {},
              frequency: { value: 0, setValueAtTime: () => {} },
              type: 'sine',
            }),
            createAnalyser: () => ({
              connect: () => {},
              disconnect: () => {},
              fftSize: 0,
              frequencyBinCount: 0,
              getByteFrequencyData: () => {},
            }),
            decodeAudioData: () => Promise.resolve({}),
            destination: {},
          };
        };

        (window as any).AudioContext = SilentAudioContext;
        (window as any).webkitAudioContext = SilentAudioContext;
      }
    } else {
      root.classList.remove('industrial-slate');
      
      if (typeof window !== 'undefined') {
        if (originalAudioPlay) {
          HTMLAudioElement.prototype.play = originalAudioPlay;
        }
        if (originalAudioContext) {
          (window as any).AudioContext = originalAudioContext;
          (window as any).webkitAudioContext = originalAudioContext;
        }
      }
    }
  }, [decorumLevel]);

  return (
    <ThemeContext.Provider value={{ 
      decorumLevel, 
      setDecorumLevel, 
      activeTheme, 
      setActiveTheme,
      fundiesGrid,
      setFundiesGrid,
      pinEngineActive,
      setPinEngineActive,
      isSidebarCollapsed,
      setIsSidebarCollapsed,
      isUmpireOpen,
      setUmpireOpen
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
