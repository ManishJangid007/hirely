import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { QuestionTemplate, QuestionSection } from '../types';

interface AddSectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddSection: (section: Omit<QuestionSection, 'id'>) => void;
    template: QuestionTemplate | null;
}

const AddSectionModal: React.FC<AddSectionModalProps> = ({
    isOpen,
    onClose,
    onAddSection,
    template
}) => {
    const [sectionName, setSectionName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sectionName.trim()) return;

        // Check if section name already exists in the template
        if (template && template.sections.some(s => s.name.toLowerCase() === sectionName.trim().toLowerCase())) {
            alert('A section with this name already exists in this template.');
            return;
        }

        onAddSection({
            name: sectionName.trim(),
            questions: []
        });

        setSectionName('');
        onClose();
    };

    if (!isOpen || !template) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Add Section to "{template.name}"</h3>
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
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!sectionName.trim()}
                                className="px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                Add Section
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddSectionModal; 