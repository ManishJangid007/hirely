import React from 'react';
import { XMarkIcon, Cog6ToothIcon, BookOpenIcon, CloudArrowUpIcon, SparklesIcon } from '@heroicons/react/24/outline';
import ThemeToggle from './ThemeToggle';
// AIConfigModal is opened by parent via callback

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBackupClick: () => void;
    onDocsClick: () => void;
    onOpenAIConfig: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onBackupClick, onDocsClick, onOpenAIConfig }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="mt-1">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <Cog6ToothIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Settings</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Theme */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">Appearance</div>
                                <div className="text-xs text-gray-500 dark:text-gray-300">Toggle between light and dark mode</div>
                            </div>
                            <ThemeToggle />
                        </div>

                        {/* Docs */}
                        <button
                            onClick={onDocsClick}
                            className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200"
                        >
                            <BookOpenIcon className="w-4 h-4 mr-2" />
                            Docs
                        </button>

                        {/* Backup */}
                        <button
                            onClick={() => {
                                onClose();
                                onBackupClick();
                            }}
                            className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200"
                        >
                            <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                            Backup & Data
                        </button>

                        {/* AI Configuration */}
                        <button
                            onClick={() => {
                                onClose();
                                onOpenAIConfig();
                            }}
                            className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200"
                        >
                            <SparklesIcon className="w-4 h-4 mr-2" />
                            AI Configuration
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;


