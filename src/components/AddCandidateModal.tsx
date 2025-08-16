import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { XMarkIcon, DocumentDuplicateIcon, UserIcon } from '@heroicons/react/24/outline';
import { Candidate, QuestionTemplate } from '../types';
import DatePicker from './DatePicker';
import Select from './Select';
import { databaseService } from '../services/database';
import { processResumeToJson } from '../services/ai';

interface AddCandidateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddCandidate: (candidate: Omit<Candidate, 'id' | 'createdAt'>) => void;
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
        experienceMonths: 0,
        interviewDate: ''
    });
    const [showQuestionImport, setShowQuestionImport] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [selectedCandidate, setSelectedCandidate] = useState<string>('');
    const [importType, setImportType] = useState<'template' | 'candidate' | null>(null);
    const [isAIConnected, setIsAIConnected] = useState<boolean>(false);
    const [showJsonResumeModal, setShowJsonResumeModal] = useState(false);
    const [jsonResume, setJsonResume] = useState<string>('');
    const [parsedResume, setParsedResume] = useState<any>(null);
    const [isProcessingResume, setIsProcessingResume] = useState(false);
    const [resumeError, setResumeError] = useState<string>('');
    const [hasResume, setHasResume] = useState(false);

    // Refs to prevent state updates after unmounting and multiple simultaneous checks
    const isMountedRef = useRef(true);
    const isCheckingAIConnectionRef = useRef(false);

    // Check AI connection status when modal opens
    useEffect(() => {
        const checkAIConnection = async () => {
            // Prevent multiple simultaneous checks
            if (isCheckingAIConnectionRef.current) return;
            isCheckingAIConnectionRef.current = true;

            try {
                // Wait for database to be initialized
                let attempts = 0;
                while (!databaseService.isInitialized() && attempts < 10 && isMountedRef.current) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }

                if (!isMountedRef.current) return;

                if (!databaseService.isInitialized()) {
                    console.warn('Database not initialized after waiting, defaulting to disconnected');
                    if (isMountedRef.current) {
                        setIsAIConnected(false);
                    }
                    return;
                }

                const connected = await databaseService.getGeminiConnected();
                if (isMountedRef.current) {
                    setIsAIConnected(connected || false);
                }
            } catch (error) {
                console.warn('AI connection check failed, defaulting to disconnected:', error);
                if (isMountedRef.current) {
                    setIsAIConnected(false);
                }
            } finally {
                isCheckingAIConnectionRef.current = false;
            }
        };

        if (isOpen) {
            // Reset mounted ref when modal opens
            isMountedRef.current = true;
            checkAIConnection();
        }

        // Cleanup function
        return () => {
            isMountedRef.current = false;
        };
    }, [isOpen]);

    // Debug logging to help identify any remaining issues
    useEffect(() => {
        if (isOpen) {
            console.log('AddCandidateModal opened with:', {
                positionsCount: positions.length,
                templatesCount: questionTemplates.length,
                candidatesCount: candidates.length
            });
        }
    }, [isOpen, positions.length, questionTemplates.length, candidates.length]);

    // Memoize options to prevent unnecessary re-renders
    const positionOptions = useMemo(() => [
        { value: '', label: 'Select a position' },
        ...positions.map(p => ({ value: p, label: p }))
    ], [positions]);

    const templateOptions = useMemo(() => {
        return [
            { value: '', label: 'Choose a template' },
            ...questionTemplates.map(t => ({ value: t.id, label: t.name }))
        ];
    }, [questionTemplates]);

    const candidateOptions = useMemo(() => [
        { value: '', label: 'Choose a candidate' },
        ...candidates.map(c => ({ value: c.id, label: `${c.fullName} - ${c.position}` }))
    ], [candidates]);

    // Ensure selectedTemplate is valid
    const validSelectedTemplate = useMemo(() => {
        if (!selectedTemplate) return '';
        const templateExists = templateOptions.some(opt => opt.value === selectedTemplate);
        return templateExists ? selectedTemplate : '';
    }, [selectedTemplate, templateOptions]);

    const resetForm = useCallback(() => {
        setFormData({
            fullName: '',
            position: '',
            experienceYears: 0,
            experienceMonths: 0,
            interviewDate: ''
        });
        setShowQuestionImport(false);
        setSelectedTemplate('');
        setSelectedCandidate('');
        setImportType(null);
        setJsonResume('');
        setParsedResume(null);
        setResumeError('');
        setHasResume(false);
    }, []);

    // Handle resume file processing
    const handleResumeUpload = useCallback(async (file: File) => {
        if (!isAIConnected) {
            setResumeError('AI is not connected. Please configure Gemini API key in Settings.');
            return;
        }

        setIsProcessingResume(true);
        setResumeError('');

        try {
            // Wait for database to be initialized
            let attempts = 0;
            while (!databaseService.isInitialized() && attempts < 10 && isMountedRef.current) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            if (!isMountedRef.current) return;

            if (!databaseService.isInitialized()) {
                throw new Error('Database not ready. Please try again.');
            }

            const jsonResult = await processResumeToJson(file);

            // Parse the JSON string into an object
            let parsedResume;
            try {
                parsedResume = JSON.parse(jsonResult);
            } catch (parseError) {
                console.error('Failed to parse JSON resume:', parseError);
                throw new Error('AI generated invalid JSON. Please try again.');
            }

            if (isMountedRef.current) {
                setJsonResume(jsonResult); // Keep the string for display in modal
                setParsedResume(parsedResume); // Store the parsed object
                setHasResume(true);
            }
        } catch (error: any) {
            if (isMountedRef.current) {
                setResumeError(error.message || 'Failed to process resume');
            }
        } finally {
            if (isMountedRef.current) {
                setIsProcessingResume(false);
            }
        }
    }, [isAIConnected]);

    // Use useCallback to prevent function recreation on every render
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fullName || !formData.position) return;

        // Ensure database is ready
        if (!databaseService.isInitialized()) {
            alert('Database not ready. Please wait a moment and try again.');
            return;
        }

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
            }
        } else if (importType === 'candidate' && selectedCandidate) {
            const sourceCandidate = candidates.find(c => c.id === selectedCandidate);
            if (sourceCandidate && sourceCandidate.questions) {
                // Copy questions from the source candidate
                importedQuestions = sourceCandidate.questions.map((q: any) => ({
                    ...q,
                    id: Date.now().toString() + Math.random(), // Generate new ID
                    isAnswered: false,
                    isCorrect: undefined
                }));
            }
        }

        onAddCandidate({
            fullName: formData.fullName,
            position: formData.position,
            status: 'Not Interviewed',
            experience: {
                years: formData.experienceYears,
                months: formData.experienceMonths
            },
            interviewDate: formData.interviewDate || undefined,
            questions: importedQuestions,
            resume: hasResume ? parsedResume : undefined
        });

        resetForm();
        onClose();
    }, [formData.fullName, formData.position, formData.experienceYears, formData.experienceMonths, formData.interviewDate, importType, selectedTemplate, selectedCandidate, hasResume, parsedResume, onAddCandidate, onClose, resetForm]);

    const handleInputChange = useCallback((field: string, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    const handleClose = useCallback(() => {
        resetForm();
        onClose();
    }, [resetForm, onClose]);

    const handleImportTypeChange = useCallback((type: 'template' | 'candidate' | null) => {
        setImportType(type);
        // Reset selections when changing import type
        setSelectedTemplate('');
        setSelectedCandidate('');
    }, []);

    const handleTemplateChange = useCallback((value: string) => {
        // Prevent rapid successive calls using ref
        if (value === selectedTemplate) return;
        setSelectedTemplate(value);
    }, []);

    const handleCandidateChange = useCallback((value: string) => {
        setSelectedCandidate(value);
    }, []);

    const toggleQuestionImport = useCallback(() => {
        setShowQuestionImport(prev => !prev);
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-11/12 sm:w-96 shadow-lg rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 modal-content">
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Add New Candidate</h3>
                        <button
                            onClick={handleClose}
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
                            <label className="form-label required">Position</label>
                            <Select
                                value={formData.position}
                                onChange={(val) => handleInputChange('position', val)}
                                options={positionOptions}
                                placeholder="Select a position"
                            />
                        </div>

                        <div>
                            <label htmlFor="interviewDate" className="form-label">
                                Interview Date
                            </label>
                            <DatePicker
                                value={formData.interviewDate}
                                onChange={(date) => handleInputChange('interviewDate', date)}
                                placeholder="Select interview date"
                            />
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

                        {isAIConnected && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <label htmlFor="resume" className="form-label mb-0">
                                        Resume Upload
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => window.open('https://aistudio.google.com/apikey', '_blank')}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-colors duration-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50 dark:hover:bg-amber-900/50 dark:hover:border-amber-600/50 cursor-pointer"
                                        title="Click to manage your API key and monitor usage"
                                    >
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        Monitor API usage
                                    </button>
                                </div>
                                <input
                                    type="file"
                                    id="resume"
                                    accept=".pdf,.docx"
                                    disabled={isProcessingResume}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            // Check file size (20MB = 20 * 1024 * 1024 bytes)
                                            if (file.size > 20 * 1024 * 1024) {
                                                setResumeError('File size must be under 20MB');
                                                e.target.value = '';
                                                return;
                                            }
                                            // Check file type
                                            if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
                                                setResumeError('Only PDF and DOCX files are allowed');
                                                e.target.value = '';
                                                return;
                                            }
                                            // File is valid, process it with AI
                                            setResumeError('');
                                            handleResumeUpload(file);
                                        }
                                    }}
                                    className="form-input file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Accepted formats: PDF, DOCX (Max size: 20MB)
                                </p>

                                {/* View JSON Resume Label */}
                                {hasResume && (
                                    <div className="mt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowJsonResumeModal(true)}
                                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline cursor-pointer"
                                        >
                                            View JSON Resume
                                        </button>
                                    </div>
                                )}

                                {/* Error Display */}
                                {resumeError && (
                                    <div className="mt-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md">
                                        {resumeError}
                                    </div>
                                )}
                            </div>
                        )}

                        {(questionTemplates.length > 0 || candidates.length > 0) && (
                            <div>
                                <button
                                    type="button"
                                    onClick={toggleQuestionImport}
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
                                                        onClick={() => handleImportTypeChange('template')}
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
                                                        onClick={() => handleImportTypeChange('candidate')}
                                                        className={`w-full text-left px-3 py-2 rounded-lg border ${importType === 'candidate'
                                                            ? 'border-blue-500 bg-blue-900 text-blue-200'
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
                                                    value={validSelectedTemplate}
                                                    onChange={(e) => handleTemplateChange(e.target.value)}
                                                    className="form-input"
                                                >
                                                    {templateOptions.map(option => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
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
                                                <Select
                                                    value={selectedCandidate}
                                                    onChange={handleCandidateChange}
                                                    options={candidateOptions}
                                                    placeholder="Choose a candidate"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
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
                                Add Candidate
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Full Screen Processing Overlay */}
            {isProcessingResume && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[60]">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-xl max-w-md mx-4 text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Processing Resume
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Converting your resume to JSON format using AI. This may take a few moments...
                        </p>
                    </div>
                </div>
            )}

            {/* JSON Resume Modal */}
            {showJsonResumeModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-auto max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                AI-Generated JSON Resume
                            </h3>
                            <button
                                onClick={() => setShowJsonResumeModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Raw JSON:</h4>
                                <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words overflow-x-auto mb-4">
                                    {jsonResume}
                                </pre>

                                {parsedResume && (
                                    <>
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Parsed Object:</h4>
                                        <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words overflow-x-auto">
                                            {JSON.stringify(parsedResume, null, 2)}
                                        </pre>
                                    </>
                                )}
                            </div>

                            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                                <p>This JSON resume was generated by AI using the Gemini API. The parsed object will be saved to the database.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddCandidateModal; 