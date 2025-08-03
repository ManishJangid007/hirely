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
  
  // Update meta theme-color immediately
  let metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.setAttribute('name', 'theme-color');
    document.head.appendChild(metaThemeColor);
  }
  
  if (theme === 'dark') {
    metaThemeColor.setAttribute('content', '#1f2937');
    document.documentElement.classList.add('dark');
  } else {
    metaThemeColor.setAttribute('content', '#ffffff');
    document.documentElement.classList.remove('dark');
  }
  
  // Update iOS status bar style
  let appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (!appleStatusBar) {
    appleStatusBar = document.createElement('meta');
    appleStatusBar.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
    document.head.appendChild(appleStatusBar);
  }
  
  if (theme === 'dark') {
    appleStatusBar.setAttribute('content', 'black-translucent');
  } else {
    appleStatusBar.setAttribute('content', 'default');
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
