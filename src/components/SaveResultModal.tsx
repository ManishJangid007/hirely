import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Candidate, Question } from '../types';

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
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Save Interview Result</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Candidate Summary</h4>
                        <div className="bg-gray-50 p-3 rounded-md">
                            <p className="text-sm text-gray-900 font-medium">{candidate.fullName}</p>
                            <p className="text-sm text-gray-600">{candidate.position}</p>
                            <p className="text-sm text-gray-600">
                                {candidate.experience.years} years, {candidate.experience.months} months experience
                            </p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Interview Summary</h4>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-success-50 p-3 rounded-md">
                                <div className="text-2xl font-bold text-success-600">{getCorrectCount()}</div>
                                <div className="text-xs text-success-600">Correct</div>
                            </div>
                            <div className="bg-danger-50 p-3 rounded-md">
                                <div className="text-2xl font-bold text-danger-600">{getWrongCount()}</div>
                                <div className="text-xs text-danger-600">Wrong</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-md">
                                <div className="text-2xl font-bold text-gray-600">{getTotalCount()}</div>
                                <div className="text-xs text-gray-600">Total</div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                Interview Description
                            </label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the interview experience, candidate's strengths and weaknesses..."
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                rows={4}
                            />
                        </div>

                        <div>
                            <label htmlFor="result" className="block text-sm font-medium text-gray-700">
                                Final Result *
                            </label>
                            <select
                                id="result"
                                value={result}
                                onChange={(e) => setResult(e.target.value as 'Passed' | 'Rejected' | 'Maybe')}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                required
                            >
                                <option value="Passed">Passed</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Maybe">Maybe</option>
                            </select>
                        </div>

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
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
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