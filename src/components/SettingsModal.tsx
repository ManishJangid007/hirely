import React from 'react';
import { XMarkIcon, Cog6ToothIcon, BookOpenIcon, CloudArrowUpIcon, SparklesIcon } from '@heroicons/react/24/outline';
import ThemeToggle from './ThemeToggle';
import { useTheme, PRIMARY_COLORS, PrimaryColor } from '../contexts/ThemeContext';
// AIConfigModal is opened by parent via callback

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBackupClick: () => void;
    onDocsClick: () => void;
    onOpenAIConfig: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onBackupClick, onDocsClick, onOpenAIConfig }) => {
    const { primaryColor, setPrimaryColor } = useTheme();

    if (!isOpen) return null;

    const handleColorSelect = (color: PrimaryColor) => {
        if (color !== primaryColor) {
            setPrimaryColor(color);
        }
    };

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

                        {/* Primary Color Selection */}
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="mb-3">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">Primary Color</div>
                                <div className="text-xs text-gray-500 dark:text-gray-300">Choose your preferred accent color</div>
                            </div>
                            <div className="flex space-x-2">
                                {Object.entries(PRIMARY_COLORS).map(([key, color]) => {
                                    // Safety check to ensure color data is valid
                                    if (!color || !color.light) {
                                        console.error('Invalid color data for key:', key, color);
                                        return null;
                                    }

                                    return (
                                        <button
                                            key={key}
                                            onClick={() => handleColorSelect(key as PrimaryColor)}
                                            className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${primaryColor === key
                                                ? 'border-gray-900 dark:border-white scale-110 shadow-lg'
                                                : 'border-gray-300 dark:border-gray-500 hover:scale-105 hover:border-gray-400'
                                                }`}
                                            style={{ backgroundColor: color.light }}
                                            title={color.name}
                                        >
                                            {primaryColor === key && (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                Current: {PRIMARY_COLORS[primaryColor]?.name || 'Blue'}
                            </div>

                            {/* Color Preview */}
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Live Preview:</div>
                                <div className="space-y-2">
                                    <div className="flex space-x-2">
                                        <button className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs rounded-full transition-all duration-300 shadow-sm transform hover:scale-105">
                                            Primary Button
                                        </button>
                                        <button className="px-3 py-1.5 bg-primary-100 hover:bg-primary-200 text-primary-700 dark:text-primary-800 text-xs rounded-full transition-all duration-300 border border-primary-300 dark:border-primary-600 transform hover:scale-105">
                                            Secondary
                                        </button>
                                    </div>
                                    <div className="flex space-x-2">
                                        <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 border border-primary-300 dark:border-primary-700 transition-all duration-300 transform hover:scale-110"></div>
                                        <div className="w-6 h-6 rounded-full bg-primary-500 border-2 border-primary-200 dark:border-primary-800 transition-all duration-300 transform hover:scale-110"></div>
                                        <div className="w-6 h-6 rounded-full bg-primary-600 border-2 border-primary-300 dark:border-primary-700 transition-all duration-300 transform hover:scale-110"></div>
                                    </div>
                                    <div className="w-full h-2 bg-primary-200 dark:bg-primary-800 rounded-full transition-all duration-300 transform hover:scale-y-110"></div>
                                </div>
                            </div>
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


