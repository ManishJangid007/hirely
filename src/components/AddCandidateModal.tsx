import React, { useState } from 'react';
import { XMarkIcon, PlusIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { Candidate, QuestionTemplate } from '../types';

interface AddCandidateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddCandidate: (candidate: Omit<Candidate, 'id' | 'createdAt'>) => void;
    positions: string[];
    questionTemplates: QuestionTemplate[];
}

const AddCandidateModal: React.FC<AddCandidateModalProps> = ({
    isOpen,
    onClose,
    onAddCandidate,
    positions,
    questionTemplates
}) => {
    const [formData, setFormData] = useState({
        fullName: '',
        position: '',
        experienceYears: 0,
        experienceMonths: 0
    });
    const [showQuestionImport, setShowQuestionImport] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fullName || !formData.position) return;

        onAddCandidate({
            fullName: formData.fullName,
            position: formData.position,
            status: 'Not Interviewed',
            experience: {
                years: formData.experienceYears,
                months: formData.experienceMonths
            }
        });

        // Reset form
        setFormData({
            fullName: '',
            position: '',
            experienceYears: 0,
            experienceMonths: 0
        });
        setShowQuestionImport(false);
        setSelectedTemplate('');
        onClose();
    };

    const handleInputChange = (field: string, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Add New Candidate</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                id="fullName"
                                value={formData.fullName}
                                onChange={(e) => handleInputChange('fullName', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                                Position *
                            </label>
                            <select
                                id="position"
                                value={formData.position}
                                onChange={(e) => handleInputChange('position', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                required
                            >
                                <option value="">Select a position</option>
                                {positions.map((position) => (
                                    <option key={position} value={position}>
                                        {position}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="experienceYears" className="block text-sm font-medium text-gray-700">
                                    Years of Experience
                                </label>
                                <input
                                    type="number"
                                    id="experienceYears"
                                    min="0"
                                    value={formData.experienceYears}
                                    onChange={(e) => handleInputChange('experienceYears', parseInt(e.target.value) || 0)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="experienceMonths" className="block text-sm font-medium text-gray-700">
                                    Months of Experience
                                </label>
                                <input
                                    type="number"
                                    id="experienceMonths"
                                    min="0"
                                    max="11"
                                    value={formData.experienceMonths}
                                    onChange={(e) => handleInputChange('experienceMonths', parseInt(e.target.value) || 0)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        {questionTemplates.length > 0 && (
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setShowQuestionImport(!showQuestionImport)}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                >
                                    <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
                                    Import Questions (Optional)
                                </button>

                                {showQuestionImport && (
                                    <div className="mt-3">
                                        <label htmlFor="template" className="block text-sm font-medium text-gray-700">
                                            Select Question Template
                                        </label>
                                        <select
                                            id="template"
                                            value={selectedTemplate}
                                            onChange={(e) => setSelectedTemplate(e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                        >
                                            <option value="">Choose a template</option>
                                            {questionTemplates.map((template) => (
                                                <option key={template.id} value={template.id}>
                                                    {template.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}

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
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                Add Candidate
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddCandidateModal; 