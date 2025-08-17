import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

// Define available primary colors
export type PrimaryColor = 'blue' | 'teal' | 'purple' | 'indigo' | 'orange';

export const PRIMARY_COLORS: Record<PrimaryColor, { name: string; light: string; dark: string }> = {
  blue: { name: 'Blue', light: '#3b82f6', dark: '#60a5fa' },
  teal: { name: 'Teal', light: '#14b8a6', dark: '#2dd4bf' },
  purple: { name: 'Purple', light: '#8b5cf6', dark: '#a78bfa' },
  indigo: { name: 'Indigo', light: '#6366f1', dark: '#818cf8' },
  orange: { name: 'Orange', light: '#f59e0b', dark: '#fbbf24' },
};

// Generate color shades for each primary color
const generateColorShades = (baseColor: string, isDark: boolean = false): Record<string, string> => {
  // This is a simplified color generation - in a real app you might want to use a color library
  const color = isDark ? PRIMARY_COLORS[baseColor as PrimaryColor]?.dark : PRIMARY_COLORS[baseColor as PrimaryColor]?.light;

  if (!color) return {};

  // For now, we'll use the base colors and generate some variations
  // In a production app, you'd want to use a proper color manipulation library
  if (isDark) {
    // Dark mode color shades
    switch (baseColor) {
      case 'blue':
        return {
          '50': '#dbeafe', '100': '#bfdbfe', '200': '#93c5fd', '300': '#60a5fa',
          '400': '#3b82f6', '500': '#60a5fa', '600': '#2563eb', '700': '#1d4ed8',
          '800': '#1e40af', '900': '#1e3a8a'
        };
      case 'teal':
        return {
          '50': '#ccfbf1', '100': '#99f6e4', '200': '#5eead4', '300': '#2dd4bf',
          '400': '#14b8a6', '500': '#2dd4bf', '600': '#0d9488', '700': '#0f766e',
          '800': '#115e59', '900': '#134e4a'
        };
      case 'purple':
        return {
          '50': '#f3e8ff', '100': '#e9d5ff', '200': '#d8b4fe', '300': '#c084fc',
          '400': '#a855f7', '500': '#a78bfa', '600': '#9333ea', '700': '#7c3aed',
          '800': '#6b21a8', '900': '#581c87'
        };
      case 'indigo':
        return {
          '50': '#e0e7ff', '100': '#c7d2fe', '200': '#a5b4fc', '300': '#818cf8',
          '400': '#6366f1', '500': '#818cf8', '600': '#4f46e5', '700': '#4338ca',
          '800': '#3730a3', '900': '#312e81'
        };
      case 'orange':
        return {
          '50': '#fffbeb', '100': '#fef3c7', '200': '#fde68a', '300': '#fcd34d',
          '400': '#fbbf24', '500': '#fbbf24', '600': '#d97706', '700': '#b45309',
          '800': '#92400e', '900': '#78350f'
        };
      default:
        return {};
    }
  } else {
    // Light mode color shades
    switch (baseColor) {
      case 'blue':
        return {
          '50': '#eff6ff', '100': '#dbeafe', '200': '#bfdbfe', '300': '#93c5fd',
          '400': '#60a5fa', '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8',
          '800': '#1e40af', '900': '#1e3a8a'
        };
      case 'teal':
        return {
          '50': '#f0fdf4', '100': '#ccfbf1', '200': '#99f6e4', '300': '#5eead4',
          '400': '#2dd4bf', '500': '#14b8a6', '600': '#0d9488', '700': '#0f766e',
          '800': '#115e59', '900': '#134e4a'
        };
      case 'purple':
        return {
          '50': '#faf5ff', '100': '#f3e8ff', '200': '#e9d5ff', '300': '#d8b4fe',
          '400': '#c084fc', '500': '#8b5cf6', '600': '#9333ea', '700': '#7c3aed',
          '800': '#6b21a8', '900': '#581c87'
        };
      case 'indigo':
        return {
          '50': '#eef2ff', '100': '#e0e7ff', '200': '#c7d2fe', '300': '#a5b4fc',
          '400': '#818cf8', '500': '#6366f1', '600': '#4f46e5', '700': '#4338ca',
          '800': '#3730a3', '900': '#312e81'
        };
      case 'orange':
        return {
          '50': '#fffbeb', '100': '#fef3c7', '200': '#fde68a', '300': '#fcd34d',
          '400': '#fbbf24', '500': '#f59e0b', '600': '#d97706', '700': '#b45309',
          '800': '#92400e', '900': '#78350f'
        };
      default:
        return {};
    }
  }
};

interface ThemeContextType {
  theme: Theme;
  primaryColor: PrimaryColor;
  toggleTheme: () => void;
  setPrimaryColor: (color: PrimaryColor) => void;
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
  // Clear invalid localStorage data on app start
  useEffect(() => {
    const savedColor = localStorage.getItem('primaryColor');
    if (savedColor && !PRIMARY_COLORS[savedColor as PrimaryColor]) {
      localStorage.removeItem('primaryColor');
    }
  }, []);

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

  const [primaryColor, setPrimaryColorState] = useState<PrimaryColor>(() => {
    // Check localStorage for saved primary color
    const savedColor = localStorage.getItem('primaryColor') as PrimaryColor;
    // Validate that the saved color is still valid
    if (savedColor && PRIMARY_COLORS[savedColor]) {
      return savedColor;
    }
    return 'blue';
  });

  useEffect(() => {
    // Update localStorage
    localStorage.setItem('theme', theme);
    localStorage.setItem('primaryColor', primaryColor);

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

    // Update primary color CSS variables
    const currentColor = PRIMARY_COLORS[primaryColor];
    if (!currentColor) {
      console.error('Invalid primary color:', primaryColor, 'falling back to blue');
      setPrimaryColorState('blue');
      return;
    }

    const primaryColorValue = theme === 'dark' ? currentColor.dark : currentColor.light;
    const colorShades = generateColorShades(primaryColor, theme === 'dark');

    root.style.setProperty('--primary-color', primaryColorValue);
    root.style.setProperty('--primary-color-50', colorShades['50']);
    root.style.setProperty('--primary-color-100', colorShades['100']);
    root.style.setProperty('--primary-color-200', colorShades['200']);
    root.style.setProperty('--primary-color-300', colorShades['300']);
    root.style.setProperty('--primary-color-400', colorShades['400']);
    root.style.setProperty('--primary-color-500', colorShades['500']);
    root.style.setProperty('--primary-color-600', colorShades['600']);
    root.style.setProperty('--primary-color-700', colorShades['700']);
    root.style.setProperty('--primary-color-800', colorShades['800']);
    root.style.setProperty('--primary-color-900', colorShades['900']);

    // Update PWA theme colors
    updatePWAThemeColors(theme);
  }, [theme, primaryColor]);

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

  const setPrimaryColor = (color: PrimaryColor) => {

    // Validate the color exists
    if (!PRIMARY_COLORS[color]) {
      console.error('Invalid color:', color, 'falling back to blue');
      color = 'blue';
    }

    setPrimaryColorState(color);

    // Force immediate CSS variable update
    const root = document.documentElement;
    const currentColor = PRIMARY_COLORS[color];
    const primaryColorValue = theme === 'dark' ? currentColor.dark : currentColor.light;
    const colorShades = generateColorShades(color, theme === 'dark');

    root.style.setProperty('--primary-color', primaryColorValue);
    root.style.setProperty('--primary-color-50', colorShades['50']);
    root.style.setProperty('--primary-color-100', colorShades['100']);
    root.style.setProperty('--primary-color-200', colorShades['200']);
    root.style.setProperty('--primary-color-300', colorShades['300']);
    root.style.setProperty('--primary-color-400', colorShades['400']);
    root.style.setProperty('--primary-color-500', colorShades['500']);
    root.style.setProperty('--primary-color-600', colorShades['600']);
    root.style.setProperty('--primary-color-700', colorShades['700']);
    root.style.setProperty('--primary-color-800', colorShades['800']);
    root.style.setProperty('--primary-color-900', colorShades['900']);

  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, primaryColor, toggleTheme, setPrimaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
}; 