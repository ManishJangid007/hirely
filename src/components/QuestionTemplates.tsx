import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeftIcon,
    PlusIcon,
    TrashIcon,
    DocumentTextIcon,
    FolderIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    PencilIcon
} from '@heroicons/react/24/outline';
import { QuestionTemplate, QuestionSection } from '../types';
import AddTemplateModal from './AddTemplateModal';
import AddSectionModal from './AddSectionModal';
import AddQuestionModal from './AddQuestionModal';
import EditTemplateModal from './EditTemplateModal';
import EditSectionModal from './EditSectionModal';
import EditQuestionModal from './EditQuestionModal';
import ConfirmationModal from './ConfirmationModal';

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
    const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
    const [questionModalData, setQuestionModalData] = useState<{
        templateId: string;
        sectionId: string;
    } | null>(null);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [deleteConfirmData, setDeleteConfirmData] = useState<{
        templateId: string;
        templateName: string;
    } | null>(null);
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
    const [showDeleteSectionConfirmModal, setShowDeleteSectionConfirmModal] = useState(false);
    const [deleteSectionConfirmData, setDeleteSectionConfirmData] = useState<{
        templateId: string;
        sectionId: string;
        sectionName: string;
    } | null>(null);
    const [showDeleteQuestionConfirmModal, setShowDeleteQuestionConfirmModal] = useState(false);
    const [deleteQuestionConfirmData, setDeleteQuestionConfirmData] = useState<{
        templateId: string;
        sectionId: string;
        questionId: string;
        questionText: string;
    } | null>(null);
    const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
    const [editTemplateData, setEditTemplateData] = useState<{
        templateId: string;
        templateName: string;
    } | null>(null);
    const [showEditSectionModal, setShowEditSectionModal] = useState(false);
    const [editSectionData, setEditSectionData] = useState<{
        templateId: string;
        sectionId: string;
        sectionName: string;
    } | null>(null);
    const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
    const [editQuestionData, setEditQuestionData] = useState<{
        templateId: string;
        sectionId: string;
        questionId: string;
        questionText: string;
        answer?: string;
    } | null>(null);

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

    const handleDeleteSection = (templateId: string, sectionId: string, sectionName: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            const updatedTemplate = {
                ...template,
                sections: template.sections.filter(s => s.id !== sectionId)
            };
            onUpdateTemplate(templateId, updatedTemplate);
        }
    };

    const handleAddQuestion = (templateId: string, sectionId: string, questionText: string, answer?: string) => {
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
                                answer: answer,
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

    const handleDeleteQuestion = (templateId: string, sectionId: string, questionId: string, questionText: string) => {
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

    const handleEditTemplate = (templateId: string, templateName: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            const updatedTemplate = {
                ...template,
                name: templateName
            };
            onUpdateTemplate(templateId, updatedTemplate);
        }
    };

    const handleEditSection = (templateId: string, sectionId: string, sectionName: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            const updatedSections = template.sections.map(section => {
                if (section.id === sectionId) {
                    return {
                        ...section,
                        name: sectionName
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

    const handleEditQuestion = (templateId: string, sectionId: string, questionId: string, questionText: string, answer?: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            const updatedSections = template.sections.map(section => {
                if (section.id === sectionId) {
                    return {
                        ...section,
                        questions: section.questions.map(q => {
                            if (q.id === questionId) {
                                return {
                                    ...q,
                                    text: questionText,
                                    answer: answer
                                };
                            }
                            return q;
                        })
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-4">
                            <Link
                                to="/"
                                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200"
                            >
                                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                                Back
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Question Templates</h1>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage reusable question templates</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAddTemplateModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
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
                        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No templates</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating your first question template.</p>
                        <div className="mt-6">
                            <button
                                onClick={() => setShowAddTemplateModal(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                            >
                                <PlusIcon className="w-4 h-4 mr-2" />
                                Add Template
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 card-hover animate-fade-in"
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                                {template.name}
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {template.sections.length} sections, {template.sections.reduce((acc, section) => acc + section.questions.length, 0)} questions
                                            </p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => {
                                                    setEditTemplateData({
                                                        templateId: template.id,
                                                        templateName: template.name
                                                    });
                                                    setShowEditTemplateModal(true);
                                                }}
                                                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                            >
                                                <PencilIcon className="w-4 h-4 mr-2" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedTemplate(template);
                                                    setShowAddSectionModal(true);
                                                }}
                                                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                            >
                                                <PlusIcon className="w-4 h-4 mr-2" />
                                                Add Section
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setDeleteConfirmData({
                                                        templateId: template.id,
                                                        templateName: template.name
                                                    });
                                                    setShowDeleteConfirmModal(true);
                                                }}
                                                className="inline-flex items-center px-3 py-2 border border-red-300 dark:border-red-600 rounded-lg shadow-sm text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {template.sections.length === 0 ? (
                                        <div className="text-center py-8">
                                            <FolderIcon className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500" />
                                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No sections</h3>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add sections to organize your questions.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {template.sections.map((section) => (
                                                <div
                                                    key={section.id}
                                                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                                                >
                                                    <div className="flex justify-between items-center mb-3">
                                                        <div className="flex items-center">
                                                            <button
                                                                onClick={() => {
                                                                    const newCollapsed = new Set(collapsedSections);
                                                                    if (newCollapsed.has(section.id)) {
                                                                        newCollapsed.delete(section.id);
                                                                    } else {
                                                                        newCollapsed.add(section.id);
                                                                    }
                                                                    setCollapsedSections(newCollapsed);
                                                                }}
                                                                className="mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                                                            >
                                                                {collapsedSections.has(section.id) ? (
                                                                    <ChevronRightIcon className="w-4 h-4" />
                                                                ) : (
                                                                    <ChevronDownIcon className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                                                {section.name}
                                                            </h3>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={() => {
                                                                    setEditSectionData({
                                                                        templateId: template.id,
                                                                        sectionId: section.id,
                                                                        sectionName: section.name
                                                                    });
                                                                    setShowEditSectionModal(true);
                                                                }}
                                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                                                            >
                                                                <PencilIcon className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setDeleteSectionConfirmData({
                                                                        templateId: template.id,
                                                                        sectionId: section.id,
                                                                        sectionName: section.name
                                                                    });
                                                                    setShowDeleteSectionConfirmModal(true);
                                                                }}
                                                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {!collapsedSections.has(section.id) && (
                                                        <div className="space-y-2">
                                                            {section.questions.map((question) => (
                                                                <div
                                                                    key={question.id}
                                                                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                                                >
                                                                    <div className="flex justify-between items-start">
                                                                        <div className="flex-1">
                                                                            <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                                                                {question.text}
                                                                            </div>
                                                                            {question.answer && (
                                                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                                    <span className="font-medium">Answer:</span> {question.answer}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center space-x-2">
                                                                            <button
                                                                                onClick={() => {
                                                                                    setEditQuestionData({
                                                                                        templateId: template.id,
                                                                                        sectionId: section.id,
                                                                                        questionId: question.id,
                                                                                        questionText: question.text,
                                                                                        answer: question.answer
                                                                                    });
                                                                                    setShowEditQuestionModal(true);
                                                                                }}
                                                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                                                                            >
                                                                                <PencilIcon className="w-4 h-4" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => {
                                                                                    setDeleteQuestionConfirmData({
                                                                                        templateId: template.id,
                                                                                        sectionId: section.id,
                                                                                        questionId: question.id,
                                                                                        questionText: question.text
                                                                                    });
                                                                                    setShowDeleteQuestionConfirmModal(true);
                                                                                }}
                                                                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                                                                            >
                                                                                <TrashIcon className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <button
                                                                onClick={() => {
                                                                    setQuestionModalData({
                                                                        templateId: template.id,
                                                                        sectionId: section.id
                                                                    });
                                                                    setShowAddQuestionModal(true);
                                                                }}
                                                                className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                                            >
                                                                <PlusIcon className="w-4 h-4 mr-2" />
                                                                Add Question
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
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
                onClose={() => setShowAddSectionModal(false)}
                onAddSection={(section) => {
                    if (selectedTemplate) {
                        handleAddSection(selectedTemplate.id, section);
                    }
                }}
                template={selectedTemplate}
            />

            {/* Add Question Modal */}
            {showAddQuestionModal && questionModalData && (
                <AddQuestionModal
                    isOpen={showAddQuestionModal}
                    onClose={() => {
                        setShowAddQuestionModal(false);
                        setQuestionModalData(null);
                    }}
                    onAddQuestion={(questionText, section, answer) => {
                        handleAddQuestion(questionModalData.templateId, questionModalData.sectionId, questionText, answer);
                    }}
                    questionTemplates={templates}
                />
            )}

            {/* Delete Template Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteConfirmModal}
                onClose={() => {
                    setShowDeleteConfirmModal(false);
                    setDeleteConfirmData(null);
                }}
                onConfirm={() => {
                    if (deleteConfirmData) {
                        onDeleteTemplate(deleteConfirmData.templateId);
                    }
                }}
                title="Delete Template"
                message={deleteConfirmData ? `Are you sure you want to delete "${deleteConfirmData.templateName}"?` : ''}
                confirmText="Delete"
                cancelText="Cancel"
            />

            {/* Delete Section Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteSectionConfirmModal}
                onClose={() => {
                    setShowDeleteSectionConfirmModal(false);
                    setDeleteSectionConfirmData(null);
                }}
                onConfirm={() => {
                    if (deleteSectionConfirmData) {
                        handleDeleteSection(deleteSectionConfirmData.templateId, deleteSectionConfirmData.sectionId, deleteSectionConfirmData.sectionName);
                    }
                }}
                title="Delete Section"
                message={deleteSectionConfirmData ? `Are you sure you want to delete "${deleteSectionConfirmData.sectionName}"?` : ''}
                confirmText="Delete"
                cancelText="Cancel"
            />

            {/* Delete Question Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteQuestionConfirmModal}
                onClose={() => {
                    setShowDeleteQuestionConfirmModal(false);
                    setDeleteQuestionConfirmData(null);
                }}
                onConfirm={() => {
                    if (deleteQuestionConfirmData) {
                        handleDeleteQuestion(deleteQuestionConfirmData.templateId, deleteQuestionConfirmData.sectionId, deleteQuestionConfirmData.questionId, deleteQuestionConfirmData.questionText);
                    }
                }}
                title="Delete Question"
                message={deleteQuestionConfirmData ? `Are you sure you want to delete "${deleteQuestionConfirmData.questionText}"?` : ''}
                confirmText="Delete"
                cancelText="Cancel"
            />

            {/* Edit Template Modal */}
            {showEditTemplateModal && editTemplateData && (
                <EditTemplateModal
                    isOpen={showEditTemplateModal}
                    onClose={() => {
                        setShowEditTemplateModal(false);
                        setEditTemplateData(null);
                    }}
                    onEditTemplate={handleEditTemplate}
                    templateId={editTemplateData.templateId}
                    currentTemplateName={editTemplateData.templateName}
                />
            )}

            {/* Edit Section Modal */}
            {showEditSectionModal && editSectionData && (
                <EditSectionModal
                    isOpen={showEditSectionModal}
                    onClose={() => {
                        setShowEditSectionModal(false);
                        setEditSectionData(null);
                    }}
                    onEditSection={handleEditSection}
                    templateId={editSectionData.templateId}
                    sectionId={editSectionData.sectionId}
                    currentSectionName={editSectionData.sectionName}
                />
            )}

            {/* Edit Question Modal */}
            {showEditQuestionModal && editQuestionData && (
                <EditQuestionModal
                    isOpen={showEditQuestionModal}
                    onClose={() => {
                        setShowEditQuestionModal(false);
                        setEditQuestionData(null);
                    }}
                    onEditQuestion={handleEditQuestion}
                    questionTemplates={templates}
                    templateId={editQuestionData.templateId}
                    sectionId={editQuestionData.sectionId}
                    questionId={editQuestionData.questionId}
                    currentQuestionText={editQuestionData.questionText}
                    currentAnswer={editQuestionData.answer}
                />
            )}
        </div>
    );
};

export default QuestionTemplates; 