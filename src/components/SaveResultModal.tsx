import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Candidate, Question } from '../types';
import { databaseService } from '../services/database';

interface SaveResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveResult: (description: string, result: 'Passed' | 'Rejected' | 'Maybe') => void;
    candidate: Candidate;
    questions: Question[];
}

const SaveResultModal: React.FC<SaveResultModalProps> = ({
    isOpen,
    onClose,
    onSaveResult,
    candidate,
    questions
}) => {
    const [description, setDescription] = useState('');
    const [result, setResult] = useState<'Passed' | 'Rejected' | 'Maybe'>('Passed');

    // Prefill from existing interview result if any
    useEffect(() => {
        const loadExisting = async () => {
            try {
                const existing = await databaseService.getInterviewResultByCandidateId(candidate.id);
                if (existing) {
                    setDescription(existing.description || '');
                    setResult(existing.result);
                    return;
                }
            } catch (error) {
                // ignore and fallback to localStorage
            }

            const saved = localStorage.getItem(`interview_result_${candidate.id}`);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setDescription(parsed.description || '');
                    setResult(parsed.result as 'Passed' | 'Rejected' | 'Maybe');
                } catch {
                    // ignore
                }
            }
        };

        if (isOpen) {
            loadExisting();
        }
    }, [isOpen, candidate.id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSaveResult(description, result);
        setDescription('');
        setResult('Passed');
    };

    const getCorrectCount = () => questions.filter(q => q.isCorrect === true).length;
    const getWrongCount = () => questions.filter(q => q.isCorrect === false).length;
    const getTotalCount = () => questions.length;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Save Interview Result</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Candidate Summary</h4>
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <p className="text-sm text-gray-900 dark:text-white font-medium">{candidate.fullName}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{candidate.position}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {candidate.experience.years} years, {candidate.experience.months} months experience
                            </p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Interview Summary</h4>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{getCorrectCount()}</div>
                                <div className="text-xs text-green-600 dark:text-green-400">Correct</div>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{getWrongCount()}</div>
                                <div className="text-xs text-red-600 dark:text-red-400">Wrong</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{getTotalCount()}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="description" className="form-label">
                                Interview Description
                            </label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the interview experience, candidate's strengths and weaknesses..."
                                className="form-textarea"
                                rows={4}
                            />
                        </div>

                        <div>
                            <label htmlFor="result" className="form-label required">
                                Final Result
                            </label>
                            <select
                                id="result"
                                value={result}
                                onChange={(e) => setResult(e.target.value as 'Passed' | 'Rejected' | 'Maybe')}
                                className="form-select"
                                required
                            >
                                <option value="Passed">Passed</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Maybe">Maybe</option>
                            </select>
                        </div>

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
                                Save Result
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SaveResultModal; 