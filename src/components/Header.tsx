import React, { useState } from 'react';
import logo from '../assets/logo.png';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import SettingsModal from './SettingsModal';
import AIConfigModal from './AIConfigModal';

interface HeaderProps {
  onBackupClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onBackupClick }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAIConfigOpen, setIsAIConfigOpen] = useState(false);

  const handleGitHubClick = () => {
    window.open('https://github.com/ManishJangid007/hirely', '_blank');
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 shadow-sm border-b transition-colors duration-300"
      style={{
        backgroundColor: 'var(--header-bg)',
        borderColor: 'var(--header-border)',
        color: 'var(--header-text)',
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        zIndex: '50'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div
            className="flex items-center space-x-1 cursor-pointer hover:opacity-80 transition-opacity duration-200"
            onClick={() => window.location.href = '/'}
            title="Go to Home"
          >
            <img
              src={logo}
              alt="Hirely"
              className="h-[52px] w-auto object-contain"
            />
            <h1 className="text-2xl font-bold" style={{ color: 'var(--header-text)' }}>
              Hirely
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Settings gear */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center p-2 border rounded-full shadow-sm text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
              style={{
                backgroundColor: 'var(--header-bg)',
                borderColor: 'var(--header-border)',
                color: 'var(--header-text)'
              }}
              aria-label="Settings"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onBackupClick={onBackupClick}
        onDocsClick={handleGitHubClick}
        onOpenAIConfig={() => setIsAIConfigOpen(true)}
      />
      <AIConfigModal isOpen={isAIConfigOpen} onClose={() => setIsAIConfigOpen(false)} />
    </div>
  );
};

export default Header; 