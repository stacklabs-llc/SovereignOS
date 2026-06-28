import React, { createContext, useContext, useState, useEffect } from 'react';

const originalAudioPlay = typeof window !== 'undefined' ? HTMLAudioElement.prototype.play : null;
const originalAudioContext = typeof window !== 'undefined' ? (window.AudioContext || (window as any).webkitAudioContext) : null;

interface ThemeContextProps {
  decorumLevel: number;
  setDecorumLevel: (level: number) => void;
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
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

  const setDecorumLevel = (level: number) => {
    setDecorumLevelState(level);
    localStorage.setItem('decorumLevel', level.toString());
  };

  const setActiveTheme = (theme: string) => {
    setActiveThemeState(theme);
    localStorage.setItem('activeTheme', theme);
  };

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'decorumLevel' && e.newValue !== null) {
        setDecorumLevelState(parseInt(e.newValue, 10));
      }
      if (e.key === 'activeTheme' && e.newValue !== null) {
        setActiveThemeState(e.newValue);
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
    <ThemeContext.Provider value={{ decorumLevel, setDecorumLevel, activeTheme, setActiveTheme }}>
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
