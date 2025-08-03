import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      return savedTheme;
    }

    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  });

  useEffect(() => {
    // Update localStorage
    localStorage.setItem('theme', theme);
    
    // Update document class
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Update CSS variables for header colors
    if (theme === 'dark') {
      root.style.setProperty('--header-bg', '#1f2937');
      root.style.setProperty('--header-text', '#ffffff');
      root.style.setProperty('--header-border', '#374151');
    } else {
      root.style.setProperty('--header-bg', '#ffffff');
      root.style.setProperty('--header-text', '#111827');
      root.style.setProperty('--header-border', '#e5e7eb');
    }

    // Update PWA theme colors
    updatePWAThemeColors(theme);
  }, [theme]);

  const updatePWAThemeColors = (currentTheme: Theme) => {
    // Update meta theme-color tag
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }

    const newThemeColor = currentTheme === 'dark' ? '#1f2937' : '#ffffff';
    if (metaThemeColor.getAttribute('content') !== newThemeColor) {
      metaThemeColor.setAttribute('content', newThemeColor);
    }

    // Update apple-mobile-web-app-status-bar-style for iOS
    let appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!appleStatusBar) {
      appleStatusBar = document.createElement('meta');
      appleStatusBar.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
      document.head.appendChild(appleStatusBar);
    }

    const newStatusBarStyle = currentTheme === 'dark' ? 'black-translucent' : 'default';
    if (appleStatusBar.getAttribute('content') !== newStatusBarStyle) {
      appleStatusBar.setAttribute('content', newStatusBarStyle);
    }

    // Update Windows tile color
    let msTileColor = document.querySelector('meta[name="msapplication-TileColor"]');
    if (!msTileColor) {
      msTileColor = document.createElement('meta');
      msTileColor.setAttribute('name', 'msapplication-TileColor');
      document.head.appendChild(msTileColor);
    }

    if (msTileColor.getAttribute('content') !== newThemeColor) {
      msTileColor.setAttribute('content', newThemeColor);
    }

    // Update manifest theme color dynamically
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (manifestLink) {
      // Create a new manifest URL with the current theme
      const manifestUrl = new URL(manifestLink.href);
      manifestUrl.searchParams.set('theme', currentTheme);
      manifestLink.href = manifestUrl.toString();
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 