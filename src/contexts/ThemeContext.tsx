/**
 * Theme Context
 *
 * Manages application-wide theme (light/dark mode)
 *
 * Features:
 * - Theme persistence in localStorage
 * - System preference detection
 * - Theme toggle functionality
 * - Dark mode CSS class management
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Load theme from localStorage, default to 'system'
    const stored = localStorage.getItem('invoiss-theme');
    return (stored as Theme) || 'system';
  });

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const applyTheme = () => {
      let darkModeEnabled = false;

      if (theme === 'system') {
        // Use system preference
        darkModeEnabled = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        darkModeEnabled = theme === 'dark';
      }

      setIsDarkMode(darkModeEnabled);

      // Apply dark class to html element
      if (darkModeEnabled) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    // Listen for system theme changes when theme is 'system'
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('invoiss-theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
