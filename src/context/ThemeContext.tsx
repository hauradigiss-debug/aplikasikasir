import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode } from '../types';

interface ThemeContextType {
  themeMode: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  effectiveTheme: 'light',
  setThemeMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('stationery_pos_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {
      // Fallback
    }
    return 'system';
  });

  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('stationery_pos_theme');
    if (saved === 'dark') return 'dark';
    if (saved === 'light') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Apply theme to document.documentElement
  useEffect(() => {
    const root = document.documentElement;

    const computeEffective = (): 'light' | 'dark' => {
      if (themeMode === 'dark') return 'dark';
      if (themeMode === 'light') return 'light';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const resolved = computeEffective();
    setEffectiveTheme(resolved);

    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem('stationery_pos_theme', themeMode);
    } catch (e) {
      console.warn('Failed to save theme in localStorage', e);
    }

    // Media query listener for 'system' mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      if (themeMode === 'system') {
        const newResolved = mediaQuery.matches ? 'dark' : 'light';
        setEffectiveTheme(newResolved);
        if (newResolved === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, [themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  return (
    <ThemeContext.Provider value={{ themeMode, effectiveTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
