import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeftIcon,
    PlusIcon,
    TrashIcon,
    DocumentTextIcon,
    FolderIcon
} from '@heroicons/react/24/outline';
import { QuestionTemplate, QuestionSection } from '../types';
import AddTemplateModal from './AddTemplateModal';
import AddSectionModal from './AddSectionModal';

interface QuestionTemplatesProps {
    templates: QuestionTemplate[];
    onAddTemplate: (template: Omit<QuestionTemplate, 'id'>) => void;
    onUpdateTemplate: (id: string, updates: Partial<QuestionTemplate>) => void;
    onDeleteTemplate: (id: string) => void;
}

const QuestionTemplates: React.FC<QuestionTemplatesProps> = ({
    templates,
    onAddTemplate,
    onUpdateTemplate,
    onDeleteTemplate
}) => {
    const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
    const [showAddSectionModal, setShowAddSectionModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<QuestionTemplate | null>(null);

    const handleAddSection = (templateId: string, section: Omit<QuestionSection, 'id'>) => {
        const newSection: QuestionSection = {
            ...section,
            id: Date.now().toString()
        };

        const template = templates.find(t => t.id === templateId);
        if (template) {
            const updatedTemplate = {
                ...template,
                sections: [...template.sections, newSection]
            };
            onUpdateTemplate(templateId, updatedTemplate);
        }
    };

    const handleDeleteSection = (templateId: string, sectionId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            const updatedTemplate = {
                ...template,
                sections: template.sections.filter(s => s.id !== sectionId)
            };
            onUpdateTemplate(templateId, updatedTemplate);
        }
    };

    const handleAddQuestion = (templateId: string, sectionId: string, questionText: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            const updatedSections = template.sections.map(section => {
                if (section.id === sectionId) {
                    return {
                        ...section,
                        questions: [
                            ...section.questions,
                            {
                                id: Date.now().toString(),
                                text: questionText,
                                section: section.name,
                                isAnswered: false
                            }
                        ]
                    };
                }
                return section;
            });

            const updatedTemplate = {
                ...template,
                sections: updatedSections
            };
            onUpdateTemplate(templateId, updatedTemplate);
        }
    };

    const handleDeleteQuestion = (templateId: string, sectionId: string, questionId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            const updatedSections = template.sections.map(section => {
                if (section.id === sectionId) {
                    return {
                        ...section,
                        questions: section.questions.filter(q => q.id !== questionId)
                    };
                }
                return section;
            });

            const updatedTemplate = {
                ...template,
                sections: updatedSections
            };
            onUpdateTemplate(templateId, updatedTemplate);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-4">
                            <Link
                                to="/"
                                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                                Back
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Question Templates</h1>
                                <p className="text-sm text-gray-500">Manage reusable question templates</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAddTemplateModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Add Template
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {templates.length === 0 ? (
                    <div className="text-center py-12">
                        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No templates</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by creating your first question template.</p>
                        <div className="mt-6">
                            <button
                                onClick={() => setShowAddTemplateModal(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                            >
                                <PlusIcon className="w-4 h-4 mr-2" />
                                Add Template
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {templates.map((template) => (
                            <div key={template.id} className="bg-white shadow rounded-lg">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                                            <p className="text-sm text-gray-500">
                                                {template.sections.length} sections, {template.sections.reduce((acc, section) => acc + section.questions.length, 0)} questions
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <button
                                                onClick={() => {
                                                    setSelectedTemplate(template);
                                                    setShowAddSectionModal(true);
                                                }}
                                                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                            >
                                                <PlusIcon className="w-4 h-4 mr-2" />
                                                Add Section
                                            </button>
                                            <button
                                                onClick={() => onDeleteTemplate(template.id)}
                                                className="text-danger-600 hover:text-danger-800"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-4">
                                    <div className="space-y-4">
                                        {template.sections.map((section) => (
                                            <div key={section.id} className="border rounded-lg">
                                                <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <FolderIcon className="w-5 h-5 text-gray-400 mr-2" />
                                                        <h4 className="text-sm font-medium text-gray-900">{section.name}</h4>
                                                        <span className="ml-2 text-xs text-gray-500">({section.questions.length} questions)</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => {
                                                                const questionText = prompt('Enter question text:');
                                                                if (questionText?.trim()) {
                                                                    handleAddQuestion(template.id, section.id, questionText.trim());
                                                                }
                                                            }}
                                                            className="text-primary-600 hover:text-primary-800 text-sm"
                                                        >
                                                            Add Question
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSection(template.id, section.id)}
                                                            className="text-danger-600 hover:text-danger-800"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {section.questions.length > 0 && (
                                                    <div className="p-4">
                                                        <ul className="space-y-2">
                                                            {section.questions.map((question) => (
                                                                <li key={question.id} className="flex items-center justify-between text-sm">
                                                                    <span className="text-gray-700">{question.text}</span>
                                                                    <button
                                                                        onClick={() => handleDeleteQuestion(template.id, section.id, question.id)}
                                                                        className="text-danger-600 hover:text-danger-800"
                                                                    >
                                                                        <TrashIcon className="w-4 h-4" />
                                                                    </button>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            <AddTemplateModal
                isOpen={showAddTemplateModal}
                onClose={() => setShowAddTemplateModal(false)}
                onAddTemplate={onAddTemplate}
            />

            <AddSectionModal
                isOpen={showAddSectionModal}
                onClose={() => {
                    setShowAddSectionModal(false);
                    setSelectedTemplate(null);
                }}
                onAddSection={(section) => {
                    if (selectedTemplate) {
                        handleAddSection(selectedTemplate.id, section);
                    }
                }}
                template={selectedTemplate}
            />
        </div>
    );
};

export default QuestionTemplates; 