import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { QuestionTemplate, Question } from '../types';

interface AddQuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddQuestion: (questionText: string, section: string, answer?: string) => void;
    questionTemplates: QuestionTemplate[];
    preSelectedSection?: string;
    candidateQuestions?: Question[];
}

const AddQuestionModal: React.FC<AddQuestionModalProps> = ({
    isOpen,
    onClose,
    onAddQuestion,
    questionTemplates,
    preSelectedSection,
    candidateQuestions = []
}) => {
    const [questionText, setQuestionText] = useState('');
    const [answer, setAnswer] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [customSection, setCustomSection] = useState('');
    const [showCustomSection, setShowCustomSection] = useState(false);

    // Template import selection
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [selectedTemplateSectionName, setSelectedTemplateSectionName] = useState<string>('');

    // Set pre-selected section when modal opens
    useEffect(() => {
        if (isOpen && preSelectedSection) {
            setSelectedSection(preSelectedSection);
            setShowCustomSection(false);
        }
    }, [isOpen, preSelectedSection]);

    // Get all unique sections from templates and candidate questions
    const getAllSections = () => {
        const sections = new Set<string>();

        // Add sections from templates
        questionTemplates.forEach(template => {
            template.sections.forEach(section => {
                sections.add(section.name);
            });
        });

        // Add sections from candidate's existing questions
        candidateQuestions.forEach(question => {
            if (question.section) {
                sections.add(question.section);
            }
        });

        return Array.from(sections).sort();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Priority: template selection overrides manual question
        if (selectedTemplateId) {
            const template = questionTemplates.find(t => t.id === selectedTemplateId);
            if (template) {
                const sectionsToImport = selectedTemplateSectionName
                    ? template.sections.filter(s => s.name === selectedTemplateSectionName)
                    : template.sections;

                sectionsToImport.forEach(section => {
                    section.questions.forEach(q => {
                        onAddQuestion(q.text, section.name, q.answer);
                    });
                });
            }
            resetForm();
            onClose();
            return;
        }

        // Manual question path
        if (!questionText.trim()) return;
        const section = showCustomSection ? customSection : selectedSection;
        onAddQuestion(questionText.trim(), section || 'Other', answer.trim() || undefined);

        resetForm();
        onClose();
    };

    const resetForm = () => {
        setQuestionText('');
        setAnswer('');
        setSelectedSection('');
        setCustomSection('');
        setShowCustomSection(false);
        setSelectedTemplateId('');
        setSelectedTemplateSectionName('');
    };

    const handleClose = () => {
        resetForm();
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
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Add Question</h3>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="questionText" className={`form-label ${selectedTemplateId ? '' : 'required'}`}>
                                Question Text
                            </label>
                            <textarea
                                id="questionText"
                                value={questionText}
                                onChange={(e) => setQuestionText(e.target.value)}
                                placeholder="Enter your question..."
                                className="form-textarea"
                                rows={4}
                                required={!selectedTemplateId}
                            />
                        </div>

                        <div>
                            <label htmlFor="answer" className="form-label">
                                Answer (Optional)
                            </label>
                            <textarea
                                id="answer"
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                placeholder="Enter the expected answer..."
                                className="form-textarea"
                                rows={3}
                            />
                        </div>

                        <div>
                            <label htmlFor="section" className="form-label">
                                Section (Optional)
                            </label>
                            <select
                                id="section"
                                value={showCustomSection ? 'custom' : selectedSection}
                                onChange={(e) => handleSectionChange(e.target.value)}
                                className="form-select"
                            >
                                <option value="">No section (will go to "Other")</option>
                                {allSections.map((section) => (
                                    <option key={section} value={section}>
                                        {section}
                                    </option>
                                ))}
                                <option value="custom">+ Add new section</option>
                            </select>
                        </div>

                        {showCustomSection && (
                            <div>
                                <label htmlFor="customSection" className="form-label">
                                    New Section Name
                                </label>
                                <input
                                    type="text"
                                    id="customSection"
                                    value={customSection}
                                    onChange={(e) => setCustomSection(e.target.value)}
                                    placeholder="Enter section name..."
                                    className="form-input"
                                />
                            </div>
                        )}

                        {/* Divider */}
                        <hr className="border-gray-200 dark:border-gray-700" />

                        {/* Template Import */}
                        <div>
                            <label htmlFor="templateSelect" className="form-label">
                                Import from Template (Optional)
                            </label>
                            <select
                                id="templateSelect"
                                value={selectedTemplateId}
                                onChange={(e) => {
                                    setSelectedTemplateId(e.target.value);
                                    // reset section when template changes
                                    setSelectedTemplateSectionName('');
                                }}
                                className="form-select"
                            >
                                <option value="">No template</option>
                                {questionTemplates.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        {selectedTemplateId && (
                            <div>
                                <label htmlFor="templateSectionSelect" className="form-label">
                                    Template Section (Optional)
                                </label>
                                <select
                                    id="templateSectionSelect"
                                    value={selectedTemplateSectionName}
                                    onChange={(e) => setSelectedTemplateSectionName(e.target.value)}
                                    className="form-select"
                                >
                                    <option value="">All sections</option>
                                    {questionTemplates.find(t => t.id === selectedTemplateId)?.sections.map((s) => (
                                        <option key={s.id} value={s.name}>{s.name}</option>
                                    ))}
                                </select>
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    If no section is selected, all sections from the template will be imported.
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 pt-6">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
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