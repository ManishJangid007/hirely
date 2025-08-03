import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

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

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();
