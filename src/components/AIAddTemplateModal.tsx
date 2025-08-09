import React, { useEffect, useState } from 'react';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface AIAddTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (params: { templateName: string; experienceYears: number; description?: string }) => void;
}

const AIAddTemplateModal: React.FC<AIAddTemplateModalProps> = ({ isOpen, onClose, onStart }) => {
    const [templateName, setTemplateName] = useState('');
    const [experienceYears, setExperienceYears] = useState(3);
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTemplateName('');
            setExperienceYears(3);
            setDescription('');
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!templateName.trim()) return;
        onStart({ templateName: templateName.trim(), experienceYears, description: description.trim() || undefined });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="mt-1">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <SparklesIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Create Template with AI</h3>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="aiTemplateName" className="form-label required">Template Name</label>
                            <input
                                id="aiTemplateName"
                                type="text"
                                className="form-input"
                                placeholder="e.g., Frontend Interview"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="aiExperience" className="form-label">Experience</label>
                                <span className="text-sm text-gray-600 dark:text-gray-300">{experienceYears}+ years</span>
                            </div>
                            <input
                                id="aiExperience"
                                type="range"
                                min={1}
                                max={10}
                                step={1}
                                value={experienceYears}
                                onChange={(e) => setExperienceYears(Number(e.target.value))}
                                className="w-full accent-blue-600"
                            />
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <span>1+</span>
                                <span>5+</span>
                                <span>10+</span>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="aiDescription" className="form-label">Description (Optional)</label>
                            <textarea
                                id="aiDescription"
                                className="form-textarea"
                                rows={3}
                                placeholder="Describe the focus or seniority specifics"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
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
                                disabled={!templateName.trim()}
                                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            >
                                Continue
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AIAddTemplateModal;


