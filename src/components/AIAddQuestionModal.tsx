import React, { useEffect, useState } from 'react';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface AIAddQuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (params: { prompt: string }) => void;
    sectionName?: string;
}

const AIAddQuestionModal: React.FC<AIAddQuestionModalProps> = ({ isOpen, onClose, onStart, sectionName }) => {
    const [prompt, setPrompt] = useState('');

    useEffect(() => {
        if (isOpen) {
            setPrompt('');
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        onStart({ prompt: prompt.trim() });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="mt-1">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <SparklesIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">AI Question</h3>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {sectionName && (
                        <p className="text-xs mb-2 text-gray-600 dark:text-gray-300">Section: <span className="font-medium">{sectionName}</span></p>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="aiQuestionPrompt" className="form-label required">Prompt</label>
                            <textarea
                                id="aiQuestionPrompt"
                                className="form-textarea"
                                rows={5}
                                placeholder="Describe what questions you want (e.g., 8 advanced React hooks questions with concise answers)."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!prompt.trim()}
                                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            >
                                Generate
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AIAddQuestionModal;


