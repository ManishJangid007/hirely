import React from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-10 w-20 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <span className="sr-only">Toggle theme</span>

      {/* Toggle Thumb */}
      <div className={`absolute left-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 ease-in-out ${theme === 'light' ? 'translate-x-0' : 'translate-x-10'
        }`}>
        {theme === 'light' ? (
          <SunIcon className="h-5 w-5 text-yellow-500" />
        ) : (
          <MoonIcon className="h-5 w-5 text-blue-400" />
        )}
      </div>

      {/* Background Icons */}
      <div className="flex w-full justify-between px-2">
        <SunIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        <MoonIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
      </div>
    </button>
  );
};

export default ThemeToggle; 