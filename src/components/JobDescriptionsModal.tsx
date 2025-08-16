import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, PencilIcon, TrashIcon, DocumentTextIcon, MagnifyingGlassIcon, SparklesIcon, EyeIcon, EllipsisVerticalIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { JobDescription } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { generateContent, extractFirstText } from '../services/ai';
import { databaseService } from '../services/database';

interface JobDescriptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobDescriptions: JobDescription[];
    onAddJobDescription: (jobDescription: Omit<JobDescription, 'id' | 'createdAt'>) => void;
    onUpdateJobDescription: (id: string, updates: Partial<JobDescription>) => void;
    onDeleteJobDescription: (id: string) => void;
}

const JobDescriptionsModal: React.FC<JobDescriptionsModalProps> = ({
    isOpen,
    onClose,
    jobDescriptions,
    onAddJobDescription,
    onUpdateJobDescription,
    onDeleteJobDescription
}) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [showAIForm, setShowAIForm] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedJobDescription, setSelectedJobDescription] = useState<JobDescription | null>(null);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [jdToDelete, setJdToDelete] = useState<JobDescription | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: ''
    });
    const [aiFormData, setAiFormData] = useState({
        title: '',
        prompt: ''
    });
    const [isAIGenerating, setIsAIGenerating] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [isGeminiConnected, setIsGeminiConnected] = useState<boolean>(false);

    // Check AI connection when modal opens
    useEffect(() => {
        if (isOpen) {
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
        }
    }, [isOpen]);

    // Sync form data with selectedJobDescription when it changes
    useEffect(() => {
        if (selectedJobDescription) {
            setFormData({
                title: selectedJobDescription.title,
                description: selectedJobDescription.description
            });
        }
    }, [selectedJobDescription]);

    // Filter job descriptions based on search term
    const filteredJobDescriptions = jobDescriptions.filter(jd =>
        jd.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.description.trim()) return;

        const title = formData.title.trim();
        const description = formData.description.trim();

        onAddJobDescription({
            title: title,
            description: description
        });

        // Clear the form data after successful submission
        setFormData({ title: '', description: '' });
        setShowAddForm(false);

        // Automatically open the view modal with the new JD
        // We need to create the full object for the modal
        const fullJobDescription: JobDescription = {
            id: Date.now().toString(),
            title: title,
            description: description,
            createdAt: new Date().toISOString()
        };
        setSelectedJobDescription(fullJobDescription);
        setShowEditModal(true);
        setIsEditing(false);
    };

    const composeJobDescriptionPrompt = (jobTitle: string, additionalPrompt: string) => {
        const jsonExample = `{
  "title": "Job Title",
  "description": "Detailed job description with requirements, responsibilities, and qualifications"
}`;

        return `You are head of management.

We need to hire an employee for the ${jobTitle} role. Create a detailed job description.

Additional context: ${additionalPrompt}

Requirements:
- Generate a comprehensive job description
- Include role overview, responsibilities, requirements, qualifications, and benefits
- Make it professional and detailed
- Output must be only valid JSON (no extra text) following this schema exactly:
${jsonExample}

The description should be well-structured and suitable for job postings.`;
    };

    const sanitizeJson = (raw: string): string => {
        // Trim any markdown fences or extra text
        const firstBrace = raw.indexOf('{');
        const lastBrace = raw.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            return raw.substring(firstBrace, lastBrace + 1);
        }
        return raw.trim();
    };

    const handleAISubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const title = aiFormData.title.trim();
        const prompt = aiFormData.prompt.trim();

        if (!title || !prompt) return;

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

            const aiPrompt = composeJobDescriptionPrompt(title, prompt);
            const res = await generateContent({ prompt: aiPrompt, timeoutMs: 30000 });
            const text = extractFirstText(res) || '';
            const cleaned = sanitizeJson(text);
            const parsed = JSON.parse(cleaned);

            if (!parsed || !parsed.title || !parsed.description) {
                throw new Error('AI response missing required fields (title or description)');
            }

            // Create new job description from AI response
            const newJobDescription: JobDescription = {
                id: Date.now().toString(),
                title: parsed.title,
                description: parsed.description,
                createdAt: new Date().toISOString()
            };

            // Add to database
            onAddJobDescription(newJobDescription);

            // Clear the form data after successful submission
            setAiFormData({ title: '', prompt: '' });
            setShowAIForm(false);

            // Automatically open the view modal with the new JD
            setSelectedJobDescription(newJobDescription);
            setShowEditModal(true);
            setIsEditing(false);

        } catch (err: any) {
            setAiError(err?.message || 'Failed to generate job description with AI');
        } finally {
            setIsAIGenerating(false);
        }
    };

    const handleEdit = (jd: JobDescription) => {
        setSelectedJobDescription(jd);
        setFormData({
            title: jd.title,
            description: jd.description
        });
        setIsEditing(false); // Start in view mode
        setShowEditModal(true);
    };

    const handleCancel = () => {
        setFormData({ title: '', description: '' });
        setShowAddForm(false);
    };

    const handleAICancel = () => {
        setAiFormData({ title: '', prompt: '' });
        setShowAIForm(false);
    };

    const exportAllJobDescriptions = () => {
        const data = {
            jobDescriptions: filteredJobDescriptions,
            exportedAt: new Date().toISOString(),
            totalCount: filteredJobDescriptions.length
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `job-descriptions-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const exportSingleJobDescription = (jd: JobDescription) => {
        const data = {
            jobDescription: jd,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${jd.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setOpenDropdown(null);
    };

    const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);

                let importedCount = 0;

                if (data.jobDescriptions && Array.isArray(data.jobDescriptions)) {
                    // Import multiple JDs

                    // Process imports sequentially to avoid conflicts
                    const processImports = async () => {
                        for (let i = 0; i < data.jobDescriptions.length; i++) {
                            const jd = data.jobDescriptions[i];
                            if (jd.title && jd.description) {
                                const newJD: Omit<JobDescription, 'id' | 'createdAt'> = {
                                    title: jd.title,
                                    description: jd.description
                                };
                                onAddJobDescription(newJD);
                                importedCount++;

                                // Small delay to ensure database operations don't conflict
                                await new Promise(resolve => setTimeout(resolve, 100));
                            }
                        }

                        if (importedCount > 0) {
                            setSuccessMessage(`Successfully imported ${importedCount} job descriptions!`);
                            setShowSuccessModal(true);
                        } else {
                            setSuccessMessage('No valid job descriptions found in the file.');
                            setShowSuccessModal(true);
                        }
                    };

                    processImports();
                } else if (data.jobDescription && data.jobDescription.title && data.jobDescription.description) {
                    // Import single JD
                    const newJD: Omit<JobDescription, 'id' | 'createdAt'> = {
                        title: data.jobDescription.title,
                        description: data.jobDescription.description
                    };
                    onAddJobDescription(newJD);
                    setSuccessMessage('Successfully imported 1 job description!');
                    setShowSuccessModal(true);
                } else {
                    alert('Invalid file format. Please check the file structure.');
                    return;
                }

                setShowImportModal(false);
            } catch (error) {
                console.error('Import error:', error);
                alert('Error reading file. Please check if it\'s a valid JSON file.');
            }
        };
        reader.readAsText(file);
    };

    const toggleDropdown = (jdId: string) => {
        setOpenDropdown(openDropdown === jdId ? null : jdId);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openDropdown && !(event.target as Element).closest('[data-dropdown]')) {
                setOpenDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdown]);

    const handleDelete = (jd: JobDescription) => {
        setJdToDelete(jd);
        setShowDeleteConfirmModal(true);
    };

    const handleSave = () => {
        if (!formData.title.trim() || !formData.description.trim()) return;

        if (selectedJobDescription) {
            const updatedData = {
                title: formData.title.trim(),
                description: formData.description.trim()
            };

            onUpdateJobDescription(selectedJobDescription.id, updatedData);

            // Update the local selectedJobDescription to show changes immediately
            setSelectedJobDescription({
                ...selectedJobDescription,
                ...updatedData
            });
        }

        setIsEditing(false);
        // Don't clear formData - keep it populated for potential future edits
    };

    const handleCancelEdit = () => {
        if (selectedJobDescription) {
            // Reset form data to the current selectedJobDescription values
            setFormData({
                title: selectedJobDescription.title,
                description: selectedJobDescription.description
            });
        }
        setIsEditing(false);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 pb-12 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Manage Job Descriptions
                        </h3>
                        <div className="flex items-center space-x-2">
                            {/* Import Button */}
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 p-1"
                                title="Import Job Descriptions"
                            >
                                <ArrowUpTrayIcon className="w-5 h-5" />
                            </button>

                            {/* Export All Button */}
                            <button
                                onClick={exportAllJobDescriptions}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 p-1"
                                title="Export All Job Descriptions"
                            >
                                <ArrowDownTrayIcon className="w-5 h-5" />
                            </button>

                            {/* Close Button */}
                            <button
                                onClick={() => {
                                    // Reset modal to initial state before closing
                                    setShowAddForm(false);
                                    setShowAIForm(false);
                                    setShowEditModal(false);
                                    setSelectedJobDescription(null);
                                    setIsEditing(false);
                                    setFormData({ title: '', description: '' });
                                    setAiFormData({ title: '', prompt: '' });
                                    setShowDeleteConfirmModal(false);
                                    setJdToDelete(null);
                                    onClose();
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>



                    {/* Add/Edit Form */}
                    {showAddForm && (
                        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                                Add New Job Description
                            </h4>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Job Title
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white dark:border-gray-500"
                                        placeholder="e.g., Senior Frontend Developer"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Job Description
                                    </label>
                                    <textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        rows={6}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white dark:border-gray-500"
                                        placeholder="Enter detailed job description..."
                                        required
                                    />
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        type="submit"
                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                                    >
                                        Add Job Description
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* AI Form */}
                    {showAIForm && (
                        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                                Create Job Description with AI
                            </h4>

                            {/* Error Message */}
                            {aiError && (
                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <p className="text-sm text-red-700 dark:text-red-300">{aiError}</p>
                                </div>
                            )}

                            <form onSubmit={handleAISubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="ai-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Job Title
                                    </label>
                                    <input
                                        type="text"
                                        id="ai-title"
                                        value={aiFormData.title}
                                        onChange={(e) => setAiFormData(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white dark:border-gray-500"
                                        placeholder="e.g., Senior Frontend Developer"
                                        required
                                        disabled={isAIGenerating}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="ai-prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Prompt
                                    </label>
                                    <textarea
                                        id="ai-prompt"
                                        value={aiFormData.prompt}
                                        onChange={(e) => setAiFormData(prev => ({ ...prev, prompt: e.target.value }))}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white dark:border-gray-500"
                                        placeholder="Describe the role, requirements, responsibilities, and any specific details you want the AI to consider..."
                                        required
                                        disabled={isAIGenerating}
                                    />
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        type="submit"
                                        disabled={isAIGenerating}
                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isAIGenerating ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <SparklesIcon className="w-4 h-4 mr-2" />
                                                Generate with AI
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAICancel}
                                        disabled={isAIGenerating}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Add Button and Search */}
                    {!showAddForm && !showAIForm && (
                        <div className="mb-6 flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => {
                                        // Clear form data and show add form
                                        setFormData({ title: '', description: '' });
                                        setShowAddForm(true);
                                    }}
                                    className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                                    title="Add Job Description"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                </button>

                                {isGeminiConnected && (
                                    <button
                                        onClick={() => {
                                            setShowAIForm(true);
                                            setShowAddForm(false);
                                        }}
                                        className="inline-flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                        title="AI Assistant"
                                    >
                                        <SparklesIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 max-w-xs ml-4 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search job descriptions..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white dark:border-gray-500 text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {/* Job Descriptions List - Only show when add form is not expanded */}
                    {!showAddForm && !showAIForm && (
                        <div className="space-y-4 flex-1 pb-8">
                            {filteredJobDescriptions.length === 0 ? (
                                searchTerm ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <DocumentTextIcon className="mx-auto h-12 w-12 mb-4" />
                                        <p>No job descriptions found for "{searchTerm}"</p>
                                        <p className="text-sm">Try adjusting your search terms.</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <DocumentTextIcon className="mx-auto h-12 w-12 mb-4" />
                                        <p>No job descriptions yet.</p>
                                        <p className="text-sm">Add your first job description to get started.</p>
                                    </div>
                                )
                            ) : (
                                filteredJobDescriptions.map((jd) => (
                                    <div
                                        key={jd.id}
                                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex-1">
                                                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                                    {jd.title}
                                                </h4>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    Created: {new Date(jd.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(jd)}
                                                    className="inline-flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                                    title="View/Edit"
                                                >
                                                    <EyeIcon className="w-4 h-4" />
                                                </button>

                                                {/* Three Dot Menu */}
                                                <div className="relative" data-dropdown>
                                                    <button
                                                        onClick={() => toggleDropdown(jd.id)}
                                                        className="inline-flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                                        title="More options"
                                                    >
                                                        <EllipsisVerticalIcon className="w-4 h-4" />
                                                    </button>

                                                    {/* Dropdown Menu */}
                                                    {openDropdown === jd.id && (
                                                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10">
                                                            <div className="py-1">
                                                                <button
                                                                    onClick={() => {
                                                                        exportSingleJobDescription(jd);
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                                                                >
                                                                    <ArrowDownTrayIcon className="w-4 h-4" />
                                                                    <span>Export</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        handleDelete(jd);
                                                                        setOpenDropdown(null);
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                                                                >
                                                                    <TrashIcon className="w-4 h-4" />
                                                                    <span>Delete</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}


                </div>

                {/* Edit/View Modal */}
                {showEditModal && selectedJobDescription && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[60]">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    {selectedJobDescription.title}
                                </h3>
                                <div className="flex items-center space-x-2">
                                    {!isEditing && (
                                        <button
                                            onClick={() => {
                                                // Populate form data with current values when entering edit mode
                                                setFormData({
                                                    title: selectedJobDescription.title,
                                                    description: selectedJobDescription.description
                                                });
                                                setIsEditing(true);
                                            }}
                                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                                            title="Edit"
                                        >
                                            <PencilIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            setShowEditModal(false);
                                            setSelectedJobDescription(null);
                                            setIsEditing(false);
                                            // Don't clear formData - preserve it for future edits
                                        }}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                                    >
                                        <XMarkIcon className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* Single View/Edit Section */}
                            <div className="mb-6">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Job Title
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white dark:border-gray-500"
                                            placeholder="e.g., Senior Frontend Developer"
                                            required
                                        />
                                    ) : (
                                        <p className="text-gray-900 dark:text-white font-medium">
                                            {selectedJobDescription.title}
                                        </p>
                                    )}
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Job Description
                                    </label>
                                    {isEditing ? (
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            rows={6}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white dark:border-gray-500"
                                            placeholder="Enter detailed job description..."
                                            required
                                        />
                                    ) : (
                                        <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                                            <p className="text-gray-900 dark:text-white whitespace-pre-wrap text-sm">
                                                {selectedJobDescription.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Created: {new Date(selectedJobDescription.createdAt).toLocaleDateString()}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {isEditing && (
                                <div className="flex justify-center space-x-3">
                                    <button
                                        onClick={handleSave}
                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}

                            {/* Close Button */}
                            <div className="flex justify-end">
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedJobDescription(null);
                                    }}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[70]">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Import Complete
                            </h3>
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center justify-center mb-4">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-center text-gray-700 dark:text-gray-300">
                                {successMessage}
                            </p>
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[70]">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Import Job Descriptions
                            </h3>
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Select a JSON file to import job descriptions. The file should contain either a single job description or an array of job descriptions.
                            </p>

                            <div className="flex justify-center">
                                <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200">
                                    <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                                    Choose File
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleImportFile}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteConfirmModal}
                onClose={() => {
                    setShowDeleteConfirmModal(false);
                    setJdToDelete(null);
                }}
                onConfirm={() => {
                    if (jdToDelete) {
                        onDeleteJobDescription(jdToDelete.id);
                    }
                    setShowDeleteConfirmModal(false);
                    setJdToDelete(null);
                }}
                title="Delete Job Description"
                message={jdToDelete ? `Are you sure you want to delete "${jdToDelete.title}"? This action cannot be undone.` : 'Are you sure you want to delete this job description? This action cannot be undone.'}
                confirmText="Delete"
                cancelText="Cancel"
                confirmButtonClass="bg-red-600 hover:bg-red-700"
            />
        </>
    );
};

export default JobDescriptionsModal;
