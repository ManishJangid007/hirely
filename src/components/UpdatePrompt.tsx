import React, { useState } from 'react';

interface UpdatePromptProps {
    onUpdate: () => void;
    onDismiss: () => void;
}

const UpdatePrompt: React.FC<UpdatePromptProps> = ({ onUpdate, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(true);

    const handleUpdate = () => {
        setIsVisible(false);
        onUpdate();
    };

    const handleDismiss = () => {
        setIsVisible(false);
        onDismiss();
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm">
            <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                        New version available
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        A new version of the app is ready. Refresh to get the latest features.
                    </p>
                </div>
            </div>
            <div className="mt-4 flex space-x-2">
                <button
                    onClick={handleUpdate}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                    Refresh Now
                </button>
                <button
                    onClick={handleDismiss}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium py-2 px-3 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                    Later
                </button>
            </div>
        </div>
    );
};

export default UpdatePrompt;
