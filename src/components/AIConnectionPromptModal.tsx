import React from 'react';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface AIConnectionPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfigure: () => void;
    title?: string;
    message?: string;
}

const AIConnectionPromptModal: React.FC<AIConnectionPromptModalProps> = ({
    isOpen,
    onClose,
    onConfigure,
    title = "Configure AI Connection",
    message = "Configure AI connection to use this feature"
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="mt-1">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <SparklesIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-4">
                                <SparklesIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                                {message}
                            </p>
                        </div>

                        <div className="flex justify-end space-x-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onConfigure();
                                }}
                                className="px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
                            >
                                Configure Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIConnectionPromptModal;
