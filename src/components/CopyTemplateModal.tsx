import React, { useEffect, useMemo, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface CopyTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (newTemplateName: string) => void;
    existingTemplateNames: string[];
    sourceTemplateName?: string;
}

const CopyTemplateModal: React.FC<CopyTemplateModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    existingTemplateNames,
    sourceTemplateName
}) => {
    const [templateName, setTemplateName] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setTemplateName('');
            setError(null);
        }
    }, [isOpen]);

    const normalizedExisting = useMemo(
        () => existingTemplateNames.map((n) => n.trim().toLowerCase()),
        [existingTemplateNames]
    );

    const validate = (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) {
            return 'Template name is required';
        }
        if (normalizedExisting.includes(trimmed.toLowerCase())) {
            return 'A template with this name already exists';
        }
        return null;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validationError = validate(templateName);
        if (validationError) {
            setError(validationError);
            return;
        }
        onConfirm(templateName.trim());
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Make a copy</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {sourceTemplateName && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Source: {sourceTemplateName}</p>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="copyTemplateName" className="form-label required">
                                New Template Name
                            </label>
                            <input
                                type="text"
                                id="copyTemplateName"
                                value={templateName}
                                onChange={(e) => {
                                    setTemplateName(e.target.value);
                                    if (error) setError(null);
                                }}
                                placeholder="Enter template name..."
                                className="form-input"
                                required
                            />
                            {error && (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 pt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!!validate(templateName)}
                                className="px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                Create Copy
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CopyTemplateModal;


