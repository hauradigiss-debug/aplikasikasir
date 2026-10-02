import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { ThemeMode } from '../types';
import { Sun, Moon, Monitor } from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'segmented' | 'compact' | 'dropdown';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'segmented',
  className = '',
}) => {
  const { themeMode, effectiveTheme, setThemeMode } = useTheme();

  const options: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: 'Terang', icon: <Sun className="w-3.5 h-3.5" /> },
    { mode: 'system', label: 'Sistem', icon: <Monitor className="w-3.5 h-3.5" /> },
    { mode: 'dark', label: 'Gelap', icon: <Moon className="w-3.5 h-3.5" /> },
  ];

  if (variant === 'compact') {
    return (
      <div className={`flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/80 ${className}`}>
        {options.map((opt) => {
          const isActive = themeMode === opt.mode;
          return (
            <button
              key={opt.mode}
              type="button"
              onClick={() => setThemeMode(opt.mode)}
              title={`Mode ${opt.label}${opt.mode === 'system' ? ` (Aktif: ${effectiveTheme})` : ''}`}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-700 text-[#00236f] dark:text-blue-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              aria-label={`Pilih mode ${opt.label}`}
            >
              {opt.icon}
            </button>
          );
        })}
      </div>
    );
  }

  // Segmented control (standard)
  return (
    <div
      className={`grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700/80 select-none ${className}`}
      role="group"
      aria-label="Pilihan Tema Aplikasi"
    >
      {options.map((opt) => {
        const isActive = themeMode === opt.mode;
        return (
          <button
            key={opt.mode}
            type="button"
            onClick={() => setThemeMode(opt.mode)}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isActive
                ? 'bg-white dark:bg-slate-700 text-[#00236f] dark:text-blue-200 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/40'
            }`}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
