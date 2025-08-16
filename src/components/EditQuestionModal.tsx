import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Question } from '../types';

interface EditQuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdateQuestion: (questionId: string, updates: Partial<Question>) => void;
    question: Question | null;
}

const EditQuestionModal: React.FC<EditQuestionModalProps> = ({
    isOpen,
    onClose,
    onUpdateQuestion,
    question
}) => {
    const [questionText, setQuestionText] = useState('');
    const [answer, setAnswer] = useState('');

    useEffect(() => {
        if (question) {
            setQuestionText(question.text);
            setAnswer(question.answer || '');
        }
    }, [question]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!question || !questionText.trim()) return;

        onUpdateQuestion(question.id, {
            text: questionText.trim(),
            answer: answer.trim() || undefined
        });
        onClose();
    };

    const handleClose = () => {
        if (question) {
            setQuestionText(question.text);
            setAnswer(question.answer || '');
        }
        onClose();
    };

    if (!isOpen || !question) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Edit Question</h3>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="questionText" className="form-label required">
                                Question
                            </label>
                            <textarea
                                id="questionText"
                                value={questionText}
                                onChange={(e) => setQuestionText(e.target.value)}
                                className="form-textarea"
                                placeholder="Enter the question..."
                                rows={3}
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label htmlFor="answer" className="form-label">
                                Expected Answer (Optional)
                            </label>
                            <textarea
                                id="answer"
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                className="form-textarea"
                                placeholder="Enter the expected answer..."
                                rows={3}
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-6">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditQuestionModal; 