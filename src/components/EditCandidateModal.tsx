import React, { useState, useEffect, useCallback, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Candidate } from '../types';
import DatePicker from './DatePicker';
import { databaseService } from '../services/database';
import { processResumeToJson } from '../services/ai';

interface EditCandidateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdateCandidate: (id: string, updates: Partial<Candidate>) => void;
    candidate: Candidate | null;
    positions: string[];
}

const EditCandidateModal: React.FC<EditCandidateModalProps> = ({
    isOpen,
    onClose,
    onUpdateCandidate,
    candidate,
    positions
}) => {
    const [fullName, setFullName] = useState('');
    const [position, setPosition] = useState('');
    const [experienceYears, setExperienceYears] = useState(0);
    const [experienceMonths, setExperienceMonths] = useState(0);
    const [interviewDate, setInterviewDate] = useState('');

    // Resume-related state variables
    const [isAIConnected, setIsAIConnected] = useState<boolean>(false);
    const [showJsonResumeModal, setShowJsonResumeModal] = useState(false);
    const [showManualEditModal, setShowManualEditModal] = useState(false);
    const [jsonResume, setJsonResume] = useState<string>('');
    const [parsedResume, setParsedResume] = useState<any>(null);
    const [isProcessingResume, setIsProcessingResume] = useState(false);
    const [resumeError, setResumeError] = useState<string>('');
    const [hasResume, setHasResume] = useState(false);

    // Refs to prevent state updates after unmounting and multiple simultaneous checks
    const isMountedRef = useRef(true);
    const isCheckingAIConnectionRef = useRef(false);

    useEffect(() => {
        if (candidate) {
            setFullName(candidate.fullName);
            setPosition(candidate.position);
            setExperienceYears(candidate.experience.years);
            setExperienceMonths(candidate.experience.months);
            setInterviewDate(candidate.interviewDate || '');

            // Set resume-related state from existing candidate data
            if (candidate.resume) {
                setJsonResume(JSON.stringify(candidate.resume, null, 2));
                setParsedResume(candidate.resume);
                setHasResume(true);
            } else {
                setJsonResume('');
                setParsedResume(null);
                setHasResume(false);
            }
        } else {
            // Reset form when no candidate is selected
            setFullName('');
            setPosition('');
            setExperienceYears(0);
            setExperienceMonths(0);
            setInterviewDate('');
            setJsonResume('');
            setParsedResume(null);
            setHasResume(false);
        }
    }, [candidate]);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!candidate || !fullName.trim() || !position.trim()) return;

        onUpdateCandidate(candidate.id, {
            fullName: fullName.trim(),
            position: position.trim(),
            experience: {
                years: experienceYears,
                months: experienceMonths
            },
            interviewDate: interviewDate || undefined,
            resume: hasResume ? parsedResume : undefined
        });
        onClose();
    };

    const handleClose = () => {
        // Reset form to current candidate's data when closing
        if (candidate) {
            setFullName(candidate.fullName);
            setPosition(candidate.position);
            setExperienceYears(candidate.experience.years);
            setExperienceMonths(candidate.experience.months);
            setInterviewDate(candidate.interviewDate || '');

            // Reset resume state to current candidate's data
            if (candidate.resume) {
                setJsonResume(JSON.stringify(candidate.resume, null, 2));
                setParsedResume(candidate.resume);
                setHasResume(true);
            } else {
                setJsonResume('');
                setParsedResume(null);
                setHasResume(false);
            }
        }
        onClose();
    };

    if (!isOpen || !candidate) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Edit Candidate</h3>
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
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="form-input"
                                placeholder="Enter candidate's full name"
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="form-label required">Position</label>
                            <select
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                                className="form-input"
                            >
                                <option value="">Select a position</option>
                                {positions.map(p => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="interviewDate" className="form-label">
                                Interview Date
                            </label>
                            <DatePicker
                                value={interviewDate}
                                onChange={setInterviewDate}
                                placeholder="Select interview date"
                                disableClickOutside={true}
                            />
                        </div>

                        <div>
                            <label className="form-label">
                                Experience
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="experienceYears" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Years
                                    </label>
                                    <input
                                        type="number"
                                        id="experienceYears"
                                        value={experienceYears}
                                        onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                                        className="form-input"
                                        min="0"
                                        max="50"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="experienceMonths" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Months
                                    </label>
                                    <input
                                        type="number"
                                        id="experienceMonths"
                                        value={experienceMonths}
                                        onChange={(e) => setExperienceMonths(parseInt(e.target.value) || 0)}
                                        className="form-input"
                                        min="0"
                                        max="11"
                                    />
                                </div>
                            </div>
                        </div>

                        {isAIConnected && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <label htmlFor="resume" className="form-label mb-0">
                                        Resume Upload (Optional)
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

                                {/* Edit JSON Resume Manually Button - Always visible */}
                                <div className="mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowManualEditModal(true)}
                                        className="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 underline cursor-pointer"
                                    >
                                        {hasResume ? 'Edit JSON Resume Manually' : 'Add JSON Resume Manually'}
                                    </button>
                                </div>

                                {/* Clear Resume Button (when has resume) */}
                                {hasResume && (
                                    <div className="mt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setHasResume(false);
                                                setParsedResume(null);
                                                setJsonResume('');
                                                setResumeError('');
                                                // Clear the file input
                                                const fileInput = document.getElementById('resume') as HTMLInputElement;
                                                if (fileInput) {
                                                    fileInput.value = '';
                                                }
                                            }}
                                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 underline cursor-pointer"
                                        >
                                            Clear Resume
                                        </button>
                                    </div>
                                )}

                                {/* Clear File Input Button (when no resume) */}
                                {!hasResume && (
                                    <div className="mt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                // Clear the file input
                                                const fileInput = document.getElementById('resume') as HTMLInputElement;
                                                if (fileInput) {
                                                    fileInput.value = '';
                                                }
                                            }}
                                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline cursor-pointer"
                                        >
                                            Clear File Selection
                                        </button>
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
                                Save Changes
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

            {/* Manual Edit JSON Resume Modal */}
            {showManualEditModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-auto max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                {hasResume ? 'Edit JSON Resume Manually' : 'Add JSON Resume Manually'}
                            </h3>
                            <button
                                onClick={() => setShowManualEditModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
                            <div className="mb-4">
                                <label htmlFor="manualJsonResume" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    JSON Resume Content:
                                </label>
                                <textarea
                                    id="manualJsonResume"
                                    value={jsonResume}
                                    onChange={(e) => {
                                        setJsonResume(e.target.value);
                                        // Clear error when user starts typing
                                        if (resumeError) {
                                            setResumeError('');
                                        }
                                    }}
                                    placeholder="Enter or paste your JSON resume here..."
                                    className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-mono text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 resize-none"
                                />
                            </div>

                            {/* JSON Validation Error Display */}
                            {resumeError && (
                                <div className="mb-4 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
                                    ❌ {resumeError}
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    <p>⚠️ Make sure the JSON is valid. Invalid JSON will not be saved.</p>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowManualEditModal(false)}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            try {
                                                // Validate JSON before saving
                                                const parsed = JSON.parse(jsonResume);
                                                setParsedResume(parsed);
                                                setHasResume(true);
                                                setResumeError('');
                                                setShowManualEditModal(false);
                                            } catch (error) {
                                                setResumeError('Invalid JSON format. Please check your syntax and try again.');
                                            }
                                        }}
                                        className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                                    >
                                        Save JSON Resume
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditCandidateModal; 