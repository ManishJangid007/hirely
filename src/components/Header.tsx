import React from 'react';
import ThemeToggle from './ThemeToggle';
import logo from '../assets/logo.png';

interface HeaderProps {
  onBackupClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onBackupClick }) => {

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-1">
            <img
              src={logo}
              alt="Hirely"
              className="h-14 w-auto object-contain"
            />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Hirely
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <button
              onClick={onBackupClick}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <span className="hidden sm:inline">Backup</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header; 