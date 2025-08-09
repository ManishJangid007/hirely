import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    PlusIcon,
    TrashIcon,
    PencilIcon,
    ArrowLeftIcon,
    DocumentTextIcon,
    FolderIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    DocumentDuplicateIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import { QuestionTemplate, QuestionSection } from '../types';
import AddTemplateModal from './AddTemplateModal';
import AddSectionModal from './AddSectionModal';
import AddQuestionModal from './AddQuestionModal';
import EditTemplateModal from './EditTemplateModal';
import EditSectionModal from './EditSectionModal';
import EditTemplateQuestionModal from './EditTemplateQuestionModal';
import ConfirmationModal from './ConfirmationModal';
import CopyTemplateModal from './CopyTemplateModal';
import AIAddTemplateModal from './AIAddTemplateModal';
import AIAddSectionModal from './AIAddSectionModal';
import AIAddQuestionModal from './AIAddQuestionModal';
import { generateContent, extractFirstText } from '../services/ai';
import { databaseService } from '../services/database';

interface QuestionTemplatesProps {
    templates: QuestionTemplate[];
    onAddTemplate: (template: Omit<QuestionTemplate, 'id'>) => void;
    onUpdateTemplate: (id: string, updates: Partial<QuestionTemplate>) => void;
    onDeleteTemplate: (id: string) => void;
    isLoading?: boolean;
}

const QuestionTemplates: React.FC<QuestionTemplatesProps> = ({
    templates,
    onAddTemplate,
    onUpdateTemplate,
    onDeleteTemplate,
    isLoading = false
}) => {
    const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
    const [showAddSectionModal, setShowAddSectionModal] = useState(false);
    const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
    const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
    const [showEditSectionModal, setShowEditSectionModal] = useState(false);
    const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<QuestionTemplate | null>(null);
    const [questionModalData, setQuestionModalData] = useState<{
        templateId: string;
        sectionId: string;
    } | null>(null);
    const [editTemplateData, setEditTemplateData] = useState<{
        templateId: string;
        templateName: string;
    } | null>(null);
    const [editSectionData, setEditSectionData] = useState<{
        templateId: string;
        sectionId: string;
        sectionName: string;
    } | null>(null);
    const [editQuestionData, setEditQuestionData] = useState<{
        templateId: string;
        sectionId: string;
        questionId: string;
        questionText: string;
        answer?: string;
    } | null>(null);
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
    const [collapsedTemplates, setCollapsedTemplates] = useState<Set<string>>(new Set());
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [deleteConfirmData, setDeleteConfirmData] = useState<{
        templateId: string;
        templateName: string;
    } | null>(null);
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
    const [showCopyTemplateModal, setShowCopyTemplateModal] = useState(false);
    const [copyTemplateData, setCopyTemplateData] = useState<{ templateId: string; templateName: string } | null>(null);
    const [showAIAddTemplateModal, setShowAIAddTemplateModal] = useState(false);
    const [showAIAddSectionModal, setShowAIAddSectionModal] = useState<{ open: boolean; templateId?: string } | null>(null);
    const [showAIAddQuestionModal, setShowAIAddQuestionModal] = useState<{
        open: boolean;
        templateId?: string;
        sectionId?: string;
        sectionName?: string;
    } | null>(null);
    const [isAIGenerating, setIsAIGenerating] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [isGeminiConnected, setIsGeminiConnected] = useState<boolean>(false);
    const aiMessages = [
        'AI is cooking up something special…',
        'Consulting the expert interviewer…',
        'Sorting questions into neat sections…'
    ];
    const [aiMessageIndex, setAiMessageIndex] = useState(0);

    useEffect(() => {
        if (!isAIGenerating) return;
        setAiMessageIndex(0);
        const id = setInterval(() => {
            setAiMessageIndex((i) => (i + 1) % aiMessages.length);
        }, 3000);
        return () => clearInterval(id);
    }, [isAIGenerating, aiMessages.length]);

    // Load Gemini connection state to control AI buttons visibility
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                if (!databaseService.isInitialized()) {
                    try { await databaseService.init(); } catch { }
                }
                const connected = await databaseService.getGeminiConnected();
                if (mounted) setIsGeminiConnected(!!connected);
            } catch {
                if (mounted) setIsGeminiConnected(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    const sanitizeJson = (raw: string): string => {
        // Trim any markdown fences or extra text
        const firstBrace = raw.indexOf('{');
        const lastBrace = raw.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            return raw.substring(firstBrace, lastBrace + 1);
        }
        return raw.trim();
    };

    const composePrompt = (templateName: string, years: number, description?: string) => {
        const extra = description ? `\n- Additional context: ${description}` : '';
        const jsonExample = `{
  "sections": [
    {
      "name": "Section Name",
      "questions": [
        { "text": "Question text", "answer": "Expected answer" }
      ]
    }
  ]
}`;
        return (
            `You are an interviewer with 20+ years of experience in ${templateName}.
Generate an interview question set organized by sections for a candidate with ${years}+ years of experience.
${extra}

Requirements:
- Generate 10 sections, each with 5 questions.
- Output must be only valid JSON (no extra text) following this schema exactly:
${jsonExample}
`
        );
    };

    const handleAIStart = async ({ templateName, experienceYears, description }: { templateName: string; experienceYears: number; description?: string; }) => {
        setShowAIAddTemplateModal(false);
        setAiError(null);
        setIsAIGenerating(true);
        try {
            // Ensure AI is configured
            if (!databaseService.isInitialized()) {
                try { await databaseService.init(); } catch { }
            }
            const connected = await databaseService.getGeminiConnected();
            if (!connected) {
                throw new Error('AI is not connected. Configure Gemini API key in Settings.');
            }

            const prompt = composePrompt(templateName, experienceYears, description);
            const res = await generateContent({ prompt, timeoutMs: 30000 });
            const text = extractFirstText(res) || '';
            const cleaned = sanitizeJson(text);
            const parsed = JSON.parse(cleaned);

            if (!parsed || !Array.isArray(parsed.sections)) {
                throw new Error('AI response missing sections array');
            }

            // Map AI response to our template structure
            const sections = parsed.sections.map((s: any) => {
                const sectionName = String(s.name || '').trim();
                const questions = Array.isArray(s.questions) ? s.questions : [];
                return {
                    id: Date.now().toString() + Math.random(),
                    name: sectionName || 'General',
                    questions: questions.map((q: any, idx: number) => ({
                        id: Date.now().toString() + Math.random() + idx,
                        text: String(q.text || '').trim(),
                        section: sectionName || 'General',
                        answer: q.answer ? String(q.answer) : undefined,
                        isAnswered: false
                    }))
                } as QuestionSection;
            });

            const newTemplate = { name: templateName, sections };
            onAddTemplate(newTemplate);
        } catch (err: any) {
            setAiError(err?.message || 'Failed to generate template');
        } finally {
            setIsAIGenerating(false);
        }
    };

    const handleAddSection = (templateId: string, section: Omit<QuestionSection, 'id'>) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            const newSection: QuestionSection = {
                ...section,
                id: Date.now().toString()
            };
            const updatedTemplate = {
                ...template,
                sections: [...template.sections, newSection]
            };
            onUpdateTemplate(templateId, updatedTemplate);
        }
        setShowAddSectionModal(false);
        setSelectedTemplate(null);
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

    const handleAddQuestion = (templateId: string, sectionId: string, questionText: string, selectedSection: string, answer?: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            // Check if the selected section exists in the template
            let targetSection = template.sections.find(s => s.name === selectedSection);

            // Create the new question
            const newQuestion = {
                id: Date.now().toString(),
                text: questionText,
                section: selectedSection,
                answer: answer,
                isAnswered: false
            };

            let updatedTemplate;

            // If the selected section doesn't exist, create it with the question
            if (!targetSection) {
                const newSection: QuestionSection = {
                    id: Date.now().toString(),
                    name: selectedSection,
                    questions: [newQuestion]
                };
                updatedTemplate = {
                    ...template,
                    sections: [...template.sections, newSection]
                };
            } else {
                // Add the question to the existing section
                const updatedSection = {
                    ...targetSection,
                    questions: [...targetSection.questions, newQuestion]
                };
                updatedTemplate = {
                    ...template,
                    sections: template.sections.map(s => s.id === targetSection!.id ? updatedSection : s)
                };
            }

            // Update the template with a single call
            onUpdateTemplate(templateId, updatedTemplate);
        }
        setShowAddQuestionModal(false);
        setQuestionModalData(null);
    };

    const handleDeleteQuestion = (templateId: string, sectionId: string, questionId: string, questionText: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            const section = template.sections.find(s => s.id === sectionId);
            if (section) {
                const updatedSection = {
                    ...section,
                    questions: section.questions.filter(q => q.id !== questionId)
                };
                const updatedTemplate = {
                    ...template,
                    sections: template.sections.map(s => s.id === sectionId ? updatedSection : s)
                };
                onUpdateTemplate(templateId, updatedTemplate);
            }
        }
    };

    const handleEditTemplate = (templateId: string, templateName: string) => {
        onUpdateTemplate(templateId, { name: templateName });
        setShowEditTemplateModal(false);
        setEditTemplateData(null);
    };

    const handleEditSection = (templateId: string, sectionId: string, sectionName: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            const updatedTemplate = {
                ...template,
                sections: template.sections.map(s => s.id === sectionId ? { ...s, name: sectionName } : s)
            };
            onUpdateTemplate(templateId, updatedTemplate);
        }
        setShowEditSectionModal(false);
        setEditSectionData(null);
    };

    const handleEditQuestion = (templateId: string, sectionId: string, questionId: string, questionText: string, answer?: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            const section = template.sections.find(s => s.id === sectionId);
            if (section) {
                const updatedSection = {
                    ...section,
                    questions: section.questions.map(q => q.id === questionId ? { ...q, text: questionText, answer: answer, section: section.name } : q)
                };
                const updatedTemplate = {
                    ...template,
                    sections: template.sections.map(s => s.id === sectionId ? updatedSection : s)
                };
                onUpdateTemplate(templateId, updatedTemplate);
            }
        }
        setShowEditQuestionModal(false);
        setEditQuestionData(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-16 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6 space-y-4 sm:space-y-0">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                            <Link
                                to="/"
                                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 w-fit"
                            >
                                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                                Back
                            </Link>
                            <div className="text-center sm:text-left">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Question Templates</h1>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage reusable question templates</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            {/* Toggle all templates (icon only) */}
                            <button
                                onClick={() => {
                                    const allTemplateIds = templates.map(t => t.id);
                                    const allSectionIds = templates.flatMap(t => t.sections.map(s => s.id));
                                    const allCollapsed = templates.length > 0 && templates.every(t => collapsedTemplates.has(t.id));
                                    if (allCollapsed) {
                                        // Expand all
                                        setCollapsedTemplates(new Set());
                                        setCollapsedSections(new Set());
                                    } else {
                                        // Collapse all
                                        setCollapsedTemplates(new Set(allTemplateIds));
                                        setCollapsedSections(new Set(allSectionIds));
                                    }
                                }}
                                className="inline-flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200"
                                title="Toggle all"
                                aria-label="Toggle all"
                            >
                                {(() => {
                                    const allCollapsed = templates.length > 0 && templates.every(t => collapsedTemplates.has(t.id));
                                    return allCollapsed ? (
                                        <ChevronDownIcon className="w-5 h-5" />
                                    ) : (
                                        <ChevronRightIcon className="w-5 h-5" />
                                    );
                                })()}
                            </button>
                            <button
                                onClick={() => setShowAddTemplateModal(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 w-fit sm:w-auto"
                            >
                                <PlusIcon className="w-4 h-4 mr-2" />
                                Add Template
                            </button>
                            {isGeminiConnected && (
                                <button
                                    onClick={() => setShowAIAddTemplateModal(true)}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200 w-fit sm:w-auto"
                                >
                                    <SparklesIcon className="w-4 h-4 mr-2" />
                                    AI Template
                                </button>
                            )}
                        </div>
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
                                disabled={isLoading}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                <PlusIcon className="w-4 h-4 mr-2" />
                                {isLoading ? 'Loading...' : 'Add Template'}
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
                                        <div className="flex items-center">
                                            <button
                                                onClick={() => {
                                                    const newCollapsed = new Set(collapsedTemplates);
                                                    if (newCollapsed.has(template.id)) {
                                                        newCollapsed.delete(template.id);
                                                    } else {
                                                        newCollapsed.add(template.id);
                                                    }
                                                    setCollapsedTemplates(newCollapsed);
                                                }}
                                                className="mr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                                            >
                                                {collapsedTemplates.has(template.id) ? (
                                                    <ChevronRightIcon className="w-5 h-5" />
                                                ) : (
                                                    <ChevronDownIcon className="w-5 h-5" />
                                                )}
                                            </button>
                                            <div>
                                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                                    {template.name}
                                                </h2>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {template.sections.length} sections, {template.sections.reduce((acc, section) => acc + section.questions.length, 0)} questions
                                                </p>
                                            </div>
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
                                                    setCopyTemplateData({ templateId: template.id, templateName: template.name });
                                                    setShowCopyTemplateModal(true);
                                                }}
                                                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                            >
                                                <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
                                                Make a copy
                                            </button>
                                            {isGeminiConnected && (
                                                <button
                                                    onClick={() => setShowAIAddSectionModal({ open: true, templateId: template.id })}
                                                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                                >
                                                    <SparklesIcon className="w-4 h-4 mr-2" />
                                                    AI Section
                                                </button>
                                            )}
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

                                    {!collapsedTemplates.has(template.id) && (
                                        <>
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
                                                                    {isGeminiConnected && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setShowAIAddQuestionModal({
                                                                                    open: true,
                                                                                    templateId: template.id,
                                                                                    sectionId: section.id,
                                                                                    sectionName: section.name
                                                                                });
                                                                            }}
                                                                            className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 transition-colors duration-200"
                                                                            title="AI Question"
                                                                        >
                                                                            <SparklesIcon className="w-4 h-4" />
                                                                        </button>
                                                                    )}
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
                                                                                    <div className="text-sm text-gray-700 dark:text-gray-300 font-medium whitespace-pre-wrap break-words">
                                                                                        {question.text}
                                                                                    </div>
                                                                                    {question.answer && (
                                                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-pre-wrap break-words">
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
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            <>
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
                            handleAddQuestion(questionModalData.templateId, questionModalData.sectionId, questionText, section, answer);
                        }}
                        questionTemplates={templates}
                        preSelectedSection={templates.find(t => t.id === questionModalData.templateId)?.sections.find(s => s.id === questionModalData.sectionId)?.name}
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

                {/* AI Add Template Modal */}
                {showAIAddTemplateModal && (
                    <AIAddTemplateModal
                        isOpen={showAIAddTemplateModal}
                        onClose={() => setShowAIAddTemplateModal(false)}
                        onStart={handleAIStart}
                    />
                )}

                {/* Copy Template Modal */}
                {showCopyTemplateModal && copyTemplateData && (
                    <CopyTemplateModal
                        isOpen={showCopyTemplateModal}
                        onClose={() => {
                            setShowCopyTemplateModal(false);
                            setCopyTemplateData(null);
                        }}
                        onConfirm={(newTemplateName) => {
                            const source = templates.find(t => t.id === copyTemplateData.templateId);
                            if (!source) return;
                            const deepCopiedSections = source.sections.map((section) => {
                                const newSectionId = Date.now().toString() + Math.random();
                                return {
                                    id: newSectionId,
                                    name: section.name,
                                    questions: section.questions.map((q, index) => ({
                                        id: Date.now().toString() + Math.random() + index,
                                        text: q.text,
                                        section: section.name,
                                        answer: q.answer,
                                        isAnswered: false
                                    }))
                                } as QuestionSection;
                            });
                            onAddTemplate({
                                name: newTemplateName,
                                sections: deepCopiedSections
                            });
                        }}
                        existingTemplateNames={templates.map(t => t.name)}
                        sourceTemplateName={copyTemplateData.templateName}
                    />
                )}

                {/* AI Generating Overlay */}
                {isAIGenerating && (
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
                        <div className="w-full max-w-sm p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg text-center">
                            <div className="mx-auto mb-4 h-12 w-12 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
                            <p className="text-sm text-gray-700 dark:text-gray-300 animate-pulse min-h-[1.5rem]">
                                {aiMessages[aiMessageIndex]}
                            </p>
                            {aiError && (
                                <p className="mt-3 text-xs text-red-600 dark:text-red-400">{aiError}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* AI Add Section Modal */}
                {showAIAddSectionModal?.open && (
                    <AIAddSectionModal
                        isOpen={showAIAddSectionModal.open}
                        onClose={() => setShowAIAddSectionModal(null)}
                        onStart={async ({ sectionName, experienceYears, description }) => {
                            setShowAIAddSectionModal(null);
                            setAiError(null);
                            setIsAIGenerating(true);
                            try {
                                if (!databaseService.isInitialized()) {
                                    try { await databaseService.init(); } catch { }
                                }
                                const connected = await databaseService.getGeminiConnected();
                                if (!connected) {
                                    throw new Error('AI is not connected. Configure Gemini API key in Settings.');
                                }

                                const prompt = (
                                    `You are an interviewer with 20+ years of experience.
Generate a single interview section named "${sectionName}" for a candidate with ${experienceYears}+ years of experience.
${description ? `Additional context: ${description}` : ''}

Requirements:
- Generate exactly 5 questions for this section.
- Output must be only valid JSON (no extra text) following this schema exactly:
{
  "name": "Section Name",
  "questions": [ { "text": "Question text", "answer": "Expected answer" } ]
}
`);

                                const res = await generateContent({ prompt, timeoutMs: 25000 });
                                const text = extractFirstText(res) || '';
                                const cleaned = sanitizeJson(text);
                                const parsed = JSON.parse(cleaned);
                                if (!parsed || !parsed.name || !Array.isArray(parsed.questions)) {
                                    throw new Error('AI response missing section structure');
                                }

                                const targetTemplate = templates.find(t => t.id === showAIAddSectionModal?.templateId);
                                if (!targetTemplate) throw new Error('Template not found');

                                const newSection: QuestionSection = {
                                    id: Date.now().toString() + Math.random(),
                                    name: String(parsed.name),
                                    questions: parsed.questions.map((q: any, idx: number) => ({
                                        id: Date.now().toString() + Math.random() + idx,
                                        text: String(q.text || '').trim(),
                                        section: String(parsed.name),
                                        answer: q.answer ? String(q.answer) : undefined,
                                        isAnswered: false
                                    }))
                                };

                                const updatedTemplate: QuestionTemplate = {
                                    ...targetTemplate,
                                    sections: [...targetTemplate.sections, newSection]
                                };
                                onUpdateTemplate(targetTemplate.id, updatedTemplate);
                            } catch (err: any) {
                                setAiError(err?.message || 'Failed to generate section');
                            } finally {
                                setIsAIGenerating(false);
                            }
                        }}
                    />
                )}

                {/* AI Add Question Modal */}
                {showAIAddQuestionModal?.open && (
                    <AIAddQuestionModal
                        isOpen={showAIAddQuestionModal.open}
                        onClose={() => setShowAIAddQuestionModal(null)}
                        sectionName={showAIAddQuestionModal.sectionName}
                        onStart={async ({ prompt }) => {
                            const targetTemplate = templates.find(t => t.id === showAIAddQuestionModal?.templateId);
                            const targetSection = targetTemplate?.sections.find(s => s.id === showAIAddQuestionModal?.sectionId);
                            setShowAIAddQuestionModal(null);
                            setAiError(null);
                            setIsAIGenerating(true);
                            try {
                                if (!databaseService.isInitialized()) {
                                    try { await databaseService.init(); } catch { }
                                }
                                const connected = await databaseService.getGeminiConnected();
                                if (!connected) {
                                    throw new Error('AI is not connected. Configure Gemini API key in Settings.');
                                }

                                const baseSectionName = targetSection?.name || 'General';
                                const aiPrompt = `You are an expert interviewer. Given this instruction, generate only JSON with an array of questions for the section "${baseSectionName}".\nInstruction: ${prompt}\n\nExpected JSON schema:\n{ "questions": [ { "text": "Question text", "answer": "Expected answer" } ] }`;

                                const res = await generateContent({ prompt: aiPrompt, timeoutMs: 25000 });
                                const text = extractFirstText(res) || '';
                                const cleaned = sanitizeJson(text);
                                const parsed = JSON.parse(cleaned);
                                if (!parsed || !Array.isArray(parsed.questions)) {
                                    throw new Error('AI response missing questions array');
                                }

                                if (!targetTemplate || !targetSection) throw new Error('Section not found');

                                const newQuestions = parsed.questions.map((q: any, idx: number) => ({
                                    id: Date.now().toString() + Math.random() + idx,
                                    text: String(q.text || '').trim(),
                                    section: baseSectionName,
                                    answer: q.answer ? String(q.answer) : undefined,
                                    isAnswered: false
                                }));

                                const updatedSection = {
                                    ...targetSection,
                                    questions: [...targetSection.questions, ...newQuestions]
                                };

                                const updatedTemplate: QuestionTemplate = {
                                    ...targetTemplate,
                                    sections: targetTemplate.sections.map(s => s.id === targetSection.id ? updatedSection : s)
                                };
                                onUpdateTemplate(targetTemplate.id, updatedTemplate);
                            } catch (err: any) {
                                setAiError(err?.message || 'Failed to generate questions');
                            } finally {
                                setIsAIGenerating(false);
                            }
                        }}
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
                    <EditTemplateQuestionModal
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
            </>
        </div>
    );
};

export default QuestionTemplates; 