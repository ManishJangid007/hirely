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
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Add Section to "{template.name}"</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="sectionName" className="block text-sm font-medium text-gray-700">
                                Section Name *
                            </label>
                            <input
                                type="text"
                                id="sectionName"
                                value={sectionName}
                                onChange={(e) => setSectionName(e.target.value)}
                                placeholder="Enter section name..."
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                required
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!sectionName.trim()}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
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