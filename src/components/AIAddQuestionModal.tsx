import React, { useEffect, useState, useCallback } from 'react';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { generateContent, extractFirstText } from '../services/ai';
import { databaseService } from '../services/database';

interface AIAddQuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (params: { prompt: string; deleteExisting: boolean }) => void;
    sectionName?: string;
    sectionQuestions?: Array<{ text: string; answer?: string }>;
}

const AIAddQuestionModal: React.FC<AIAddQuestionModalProps> = ({ isOpen, onClose, onStart, sectionName, sectionQuestions = [] }) => {
    const [prompt, setPrompt] = useState('');
    const [deleteExisting, setDeleteExisting] = useState(true);
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

    const generateReversePrompt = useCallback(async () => {
        if (sectionQuestions.length === 0) return;

        setIsGeneratingPrompt(true);
        try {
            const questionsText = sectionQuestions.map((q, index) =>
                `${index + 1}. Question: ${q.text}${q.answer ? `\n   Answer: ${q.answer}` : ''}`
            ).join('\n\n');

            const aiPrompt = `I generated some questions for ${sectionName || 'this section'}. Can you create a prompt that will generate these same or very similar questions, so I can offer that prompt to my users for adjustment so they may generate more tuned questions?

${questionsText}

Please provide only the prompt text without any additional explanation or formatting at the start or end.`;

            const res = await generateContent({ prompt: aiPrompt, timeoutMs: 25000 });
            const text = extractFirstText(res) || '';

            if (text.trim()) {
                setPrompt(text.trim());
            } else {
                throw new Error('AI response was empty');
            }
        } catch (error: any) {
            console.error('Error generating reverse prompt:', error);
            // Fallback to a basic template if AI fails
            const questionsText = sectionQuestions.map((q, index) =>
                `${index + 1}. Question: ${q.text}${q.answer ? `\n   Answer: ${q.answer}` : ''}`
            ).join('\n\n');

            const fallbackPrompt = `Generate ${sectionQuestions.length} questions similar to these for ${sectionName || 'this section'}:

${questionsText}

Focus on the same topic, difficulty level, and style.`;

            setPrompt(fallbackPrompt);
        } finally {
            setIsGeneratingPrompt(false);
        }
    }, [sectionQuestions, sectionName]);

    const checkAIConnectionAndGeneratePrompt = useCallback(async () => {
        try {
            // Check AI connection first
            if (!databaseService.isInitialized()) {
                try { await databaseService.init(); } catch { }
            }
            const connected = await databaseService.getGeminiConnected();

            // Only generate prompt if AI is connected
            if (connected) {
                await generateReversePrompt();
            }
        } catch {
            // AI connection failed, don't generate prompt
        }
    }, [generateReversePrompt]);

    useEffect(() => {
        if (isOpen) {
            setPrompt('');
            // Keep deleteExisting as true (default) - don't reset it

            // Check AI connection and generate reverse prompt if available
            if (sectionQuestions.length > 0) {
                checkAIConnectionAndGeneratePrompt();
            }
        }
    }, [isOpen, sectionQuestions, checkAIConnectionAndGeneratePrompt]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        onStart({ prompt: prompt.trim(), deleteExisting });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="mt-1">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <SparklesIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">AI Question</h3>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {sectionName && (
                        <p className="text-xs mb-2 text-gray-600 dark:text-gray-300">Section: <span className="font-medium">{sectionName}</span></p>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="form-label">Options</label>
                            <div className="flex items-center space-x-2">
                                <input
                                    id="deleteExisting"
                                    type="checkbox"
                                    checked={deleteExisting}
                                    onChange={(e) => setDeleteExisting(e.target.checked)}
                                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 checked:bg-primary-600 checked:border-primary-600"
                                />
                                <label htmlFor="deleteExisting" className="text-sm text-gray-700 dark:text-gray-300">
                                    Delete existing questions in this section and replace with new ones
                                </label>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="aiQuestionPrompt" className="form-label required">
                                Prompt
                                {isGeneratingPrompt && (
                                    <span className="ml-2 text-xs text-primary-600 dark:text-primary-400">
                                        (Generating reverse prompt...)
                                    </span>
                                )}
                            </label>
                            {prompt && !isGeneratingPrompt && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 italic">
                                    Below is an AI-generated prompt based on your existing questions. Feel free to modify it to better suit your needs and generate more tailored questions.
                                </p>
                            )}
                            <textarea
                                id="aiQuestionPrompt"
                                className="form-textarea"
                                rows={5}
                                placeholder={isGeneratingPrompt ? "Generating reverse prompt..." : "Describe what questions you want (e.g., 8 advanced React hooks questions with concise answers)."}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                required
                                disabled={isGeneratingPrompt}
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-primary-300 dark:border-primary-600 rounded-full shadow-sm text-sm font-medium text-primary-700 dark:text-primary-800 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!prompt.trim()}
                                className="px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 transition-all duration-200"
                            >
                                Generate
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AIAddQuestionModal;


