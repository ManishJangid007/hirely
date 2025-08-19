import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import UpdatePrompt from './components/UpdatePrompt';

// Initialize PWA theme colors before React renders
const initializePWATheme = () => {
  // Get saved theme or default to system preference
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

  // Only update if the theme color is not already set correctly
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  const expectedColor = theme === 'dark' ? '#1f2937' : '#ffffff';

  if (metaThemeColor && metaThemeColor.getAttribute('content') !== expectedColor) {
    metaThemeColor.setAttribute('content', expectedColor);
  }

  // Update document class if needed
  const root = document.documentElement;
  if (theme === 'dark' && !root.classList.contains('dark')) {
    root.classList.add('dark');
  } else if (theme === 'light' && root.classList.contains('dark')) {
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

  // Update iOS status bar style if needed
  const appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  const expectedStatusBarStyle = theme === 'dark' ? 'black-translucent' : 'default';

  if (appleStatusBar && appleStatusBar.getAttribute('content') !== expectedStatusBarStyle) {
    appleStatusBar.setAttribute('content', expectedStatusBarStyle);
  }

  // Update Windows tile color if needed
  const msTileColor = document.querySelector('meta[name="msapplication-TileColor"]');
  if (msTileColor && msTileColor.getAttribute('content') !== expectedColor) {
    msTileColor.setAttribute('content', expectedColor);
  }
};

// Initialize theme before React renders
initializePWATheme();

// Create root element
const rootElement = document.getElementById('root') as HTMLElement;
const root = ReactDOM.createRoot(rootElement);

// Create a wrapper component to handle service worker updates
const AppWrapper = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    // Service worker update callback
    const onUpdate = (registration: ServiceWorkerRegistration) => {
      console.log('New content is available; please refresh.');
      setShowUpdatePrompt(true);
    };

    // Service worker success callback
    const onSuccess = (registration: ServiceWorkerRegistration) => {
      console.log('Content is cached for offline use.');
    };

    // Register service worker with callbacks
    serviceWorkerRegistration.register({
      onUpdate,
      onSuccess,
    });
  }, []);

  const handleUpdate = () => {
    serviceWorkerRegistration.skipWaiting();
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
  };

  return (
    <>
      <App />
      {showUpdatePrompt && (
        <UpdatePrompt onUpdate={handleUpdate} onDismiss={handleDismiss} />
      )}
    </>
  );
};

root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
