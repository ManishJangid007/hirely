import React, { useState } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { QuestionTemplate } from '../types';

interface AddQuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddQuestion: (questionText: string, section: string) => void;
    questionTemplates: QuestionTemplate[];
}

const AddQuestionModal: React.FC<AddQuestionModalProps> = ({
    isOpen,
    onClose,
    onAddQuestion,
    questionTemplates
}) => {
    const [questionText, setQuestionText] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [customSection, setCustomSection] = useState('');
    const [showCustomSection, setShowCustomSection] = useState(false);

    // Get all unique sections from templates
    const getAllSections = () => {
        const sections = new Set<string>();
        questionTemplates.forEach(template => {
            template.sections.forEach(section => {
                sections.add(section.name);
            });
        });
        return Array.from(sections);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!questionText.trim()) return;

        const section = showCustomSection ? customSection : selectedSection;
        onAddQuestion(questionText.trim(), section || 'Other');

        // Reset form
        setQuestionText('');
        setSelectedSection('');
        setCustomSection('');
        setShowCustomSection(false);
        onClose();
    };

    const handleSectionChange = (section: string) => {
        if (section === 'custom') {
            setShowCustomSection(true);
            setSelectedSection('');
        } else {
            setShowCustomSection(false);
            setSelectedSection(section);
            setCustomSection('');
        }
    };

    if (!isOpen) return null;

    const allSections = getAllSections();

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Add Question</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="questionText" className="block text-sm font-medium text-gray-700">
                                Question Text *
                            </label>
                            <textarea
                                id="questionText"
                                value={questionText}
                                onChange={(e) => setQuestionText(e.target.value)}
                                placeholder="Enter your question..."
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                rows={4}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="section" className="block text-sm font-medium text-gray-700">
                                Section (Optional)
                            </label>
                            <select
                                id="section"
                                value={showCustomSection ? 'custom' : selectedSection}
                                onChange={(e) => handleSectionChange(e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            >
                                <option value="">No section (will go to "Other")</option>
                                {allSections.map((section) => (
                                    <option key={section} value={section}>
                                        {section}
                                    </option>
                                ))}
                                <option value="custom">Add custom section...</option>
                            </select>
                        </div>

                        {showCustomSection && (
                            <div>
                                <label htmlFor="customSection" className="block text-sm font-medium text-gray-700">
                                    Custom Section Name
                                </label>
                                <input
                                    type="text"
                                    id="customSection"
                                    value={customSection}
                                    onChange={(e) => setCustomSection(e.target.value)}
                                    placeholder="Enter section name..."
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                />
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
                                disabled={!questionText.trim()}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add Question
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddQuestionModal; 