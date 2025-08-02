import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface EditSectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEditSection: (templateId: string, sectionId: string, sectionName: string) => void;
    templateId: string;
    sectionId: string;
    currentSectionName: string;
}

const EditSectionModal: React.FC<EditSectionModalProps> = ({
    isOpen,
    onClose,
    onEditSection,
    templateId,
    sectionId,
    currentSectionName
}) => {
    const [sectionName, setSectionName] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSectionName(currentSectionName);
        }
    }, [isOpen, currentSectionName]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sectionName.trim()) return;

        onEditSection(templateId, sectionId, sectionName.trim());
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Edit Section</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="sectionName" className="form-label required">
                                Section Name
                            </label>
                            <input
                                type="text"
                                id="sectionName"
                                value={sectionName}
                                onChange={(e) => setSectionName(e.target.value)}
                                placeholder="Enter section name..."
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                            >
                                Update Section
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditSectionModal; 