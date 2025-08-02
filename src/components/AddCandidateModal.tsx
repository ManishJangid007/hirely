import React, { useState } from 'react';
import { XMarkIcon, DocumentDuplicateIcon, UserIcon } from '@heroicons/react/24/outline';
import { Candidate, QuestionTemplate } from '../types';

interface AddCandidateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddCandidate: (candidate: Omit<Candidate, 'id' | 'createdAt'>, importedQuestions?: any[]) => void;
    positions: string[];
    questionTemplates: QuestionTemplate[];
    candidates: Candidate[];
}

const AddCandidateModal: React.FC<AddCandidateModalProps> = ({
    isOpen,
    onClose,
    onAddCandidate,
    positions,
    questionTemplates,
    candidates
}) => {
    const [formData, setFormData] = useState({
        fullName: '',
        position: '',
        experienceYears: 0,
        experienceMonths: 0
    });
    const [showQuestionImport, setShowQuestionImport] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [selectedCandidate, setSelectedCandidate] = useState<string>('');
    const [importType, setImportType] = useState<'template' | 'candidate' | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fullName || !formData.position) return;

        let importedQuestions: any[] = [];

        if (importType === 'template' && selectedTemplate) {
            const template = questionTemplates.find(t => t.id === selectedTemplate);
            if (template) {
                importedQuestions = template.sections.flatMap(section =>
                    section.questions.map(q => ({
                        ...q,
                        section: section.name,
                        isAnswered: false,
                        isCorrect: undefined
                    }))
                );
                console.log('Imported questions from template:', importedQuestions);
            }
        } else if (importType === 'candidate' && selectedCandidate) {
            const savedQuestions = localStorage.getItem(`questions_${selectedCandidate}`);
            if (savedQuestions) {
                const parsedQuestions = JSON.parse(savedQuestions);
                // Ensure all questions have the correct structure
                importedQuestions = parsedQuestions.map((q: any) => ({
                    ...q,
                    isAnswered: q.isAnswered || false,
                    isCorrect: q.isCorrect !== undefined ? q.isCorrect : undefined
                }));
                console.log('Imported questions from candidate:', importedQuestions);
            }
        }

        onAddCandidate({
            fullName: formData.fullName,
            position: formData.position,
            status: 'Not Interviewed',
            experience: {
                years: formData.experienceYears,
                months: formData.experienceMonths
            }
        }, importedQuestions);

        // Reset form
        setFormData({
            fullName: '',
            position: '',
            experienceYears: 0,
            experienceMonths: 0
        });
        setShowQuestionImport(false);
        setSelectedTemplate('');
        setSelectedCandidate('');
        setImportType(null);
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
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Add New Candidate</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="fullName" className="form-label required">
                                Full Name
                            </label>
                            <input
                                type="text"
                                id="fullName"
                                value={formData.fullName}
                                onChange={(e) => handleInputChange('fullName', e.target.value)}
                                className="form-input"
                                placeholder="Enter candidate's full name"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="position" className="form-label required">
                                Position
                            </label>
                            <select
                                id="position"
                                value={formData.position}
                                onChange={(e) => handleInputChange('position', e.target.value)}
                                className="form-select"
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
                                <label htmlFor="experienceYears" className="form-label">
                                    Years of Experience
                                </label>
                                <input
                                    type="number"
                                    id="experienceYears"
                                    min="0"
                                    value={formData.experienceYears}
                                    onChange={(e) => handleInputChange('experienceYears', parseInt(e.target.value) || 0)}
                                    className="form-number"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label htmlFor="experienceMonths" className="form-label">
                                    Months of Experience
                                </label>
                                <input
                                    type="number"
                                    id="experienceMonths"
                                    min="0"
                                    max="11"
                                    value={formData.experienceMonths}
                                    onChange={(e) => handleInputChange('experienceMonths', parseInt(e.target.value) || 0)}
                                    className="form-number"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {(questionTemplates.length > 0 || candidates.length > 0) && (
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setShowQuestionImport(!showQuestionImport)}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                >
                                    <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
                                    Import Questions (Optional)
                                </button>

                                {showQuestionImport && (
                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <label className="form-label">Import from:</label>
                                            <div className="space-y-2">
                                                {questionTemplates.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setImportType('template')}
                                                        className={`w-full text-left px-3 py-2 rounded-lg border ${importType === 'template'
                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                                                            }`}
                                                    >
                                                        <DocumentDuplicateIcon className="w-4 h-4 inline mr-2" />
                                                        Question Template
                                                    </button>
                                                )}
                                                {candidates.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setImportType('candidate')}
                                                        className={`w-full text-left px-3 py-2 rounded-lg border ${importType === 'candidate'
                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                                                            }`}
                                                    >
                                                        <UserIcon className="w-4 h-4 inline mr-2" />
                                                        Another Candidate
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {importType === 'template' && questionTemplates.length > 0 && (
                                            <div>
                                                <label htmlFor="template" className="form-label">
                                                    Select Question Template
                                                </label>
                                                <select
                                                    id="template"
                                                    value={selectedTemplate}
                                                    onChange={(e) => setSelectedTemplate(e.target.value)}
                                                    className="form-select"
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

                                        {importType === 'candidate' && candidates.length > 0 && (
                                            <div>
                                                <label htmlFor="candidate" className="form-label">
                                                    Select Candidate
                                                </label>
                                                <select
                                                    id="candidate"
                                                    value={selectedCandidate}
                                                    onChange={(e) => setSelectedCandidate(e.target.value)}
                                                    className="form-select"
                                                >
                                                    <option value="">Choose a candidate</option>
                                                    {candidates.map((candidate) => (
                                                        <option key={candidate.id} value={candidate.id}>
                                                            {candidate.fullName} - {candidate.position}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

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