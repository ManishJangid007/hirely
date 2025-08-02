import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    PlusIcon,
    CheckIcon,
    XMarkIcon,
    TrashIcon,
    ClipboardDocumentIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Candidate, Question, QuestionTemplate } from '../types';
import AddQuestionModal from './AddQuestionModal';
import SaveResultModal from './SaveResultModal';
import ResultSummaryModal from './ResultSummaryModal';

interface CandidateDetailProps {
    candidates: Candidate[];
    questionTemplates: QuestionTemplate[];
    onUpdateCandidate: (id: string, updates: Partial<Candidate>) => void;
}

const CandidateDetail: React.FC<CandidateDetailProps> = ({
    candidates,
    questionTemplates,
    onUpdateCandidate
}) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const candidate = candidates.find(c => c.id === id);

    const [questions, setQuestions] = useState<Question[]>([]);
    const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
    const [showSaveResultModal, setShowSaveResultModal] = useState(false);
    const [showResultSummaryModal, setShowResultSummaryModal] = useState(false);

    useEffect(() => {
        // Load questions from localStorage
        const savedQuestions = localStorage.getItem(`questions_${id}`);
        if (savedQuestions) {
            setQuestions(JSON.parse(savedQuestions));
        }
    }, [id]);

    useEffect(() => {
        // Save questions to localStorage
        localStorage.setItem(`questions_${id}`, JSON.stringify(questions));
    }, [questions, id]);

    if (!candidate) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Candidate not found</h2>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    const addQuestion = (questionText: string, section: string, answer?: string) => {
        const newQuestion: Question = {
            id: Date.now().toString(),
            text: questionText,
            section: section || 'Other',
            answer: answer,
            isAnswered: false
        };
        setQuestions(prev => [...prev, newQuestion]);
    };

    const updateQuestion = (questionId: string, updates: Partial<Question>) => {
        setQuestions(prev => prev.map(q =>
            q.id === questionId ? { ...q, ...updates } : q
        ));
    };

    const deleteQuestion = (questionId: string) => {
        setQuestions(prev => prev.filter(q => q.id !== questionId));
    };

    const markQuestionCorrect = (questionId: string) => {
        updateQuestion(questionId, { isCorrect: true, isAnswered: true });
    };

    const markQuestionWrong = (questionId: string) => {
        updateQuestion(questionId, { isCorrect: false, isAnswered: true });
    };

    const undoQuestion = (questionId: string) => {
        updateQuestion(questionId, { isCorrect: undefined, isAnswered: false });
    };

    const getCorrectCount = () => questions.filter(q => q.isCorrect === true).length;
    const getWrongCount = () => questions.filter(q => q.isCorrect === false).length;
    const getRemainingCount = () => questions.filter(q => !q.isAnswered).length;

    const getQuestionsBySection = () => {
        const sections: { [key: string]: Question[] } = {};
        questions.forEach(question => {
            if (!sections[question.section]) {
                sections[question.section] = [];
            }
            sections[question.section].push(question);
        });
        return sections;
    };

    const handleSaveResult = (description: string, result: 'Passed' | 'Rejected' | 'Maybe') => {
        onUpdateCandidate(candidate.id, { status: result });
        // Save interview result to localStorage
        const interviewResult = {
            id: Date.now().toString(),
            candidateId: candidate.id,
            description,
            result,
            questions,
            createdAt: new Date().toISOString()
        };
        localStorage.setItem(`interview_result_${candidate.id}`, JSON.stringify(interviewResult));
        navigate('/');
    };

    const getStatusColor = (status: Candidate['status']) => {
        switch (status) {
            case 'Passed':
                return 'bg-green-500 text-white';
            case 'Rejected':
                return 'bg-red-500 text-white';
            case 'Maybe':
                return 'bg-yellow-500 text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/')}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200"
                            >
                                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                                Back
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{candidate.fullName}</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{candidate.position}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(candidate.status)}`}>
                                {candidate.status}
                            </span>
                            {candidate.status !== 'Not Interviewed' && (
                                <button
                                    onClick={() => setShowResultSummaryModal(true)}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200"
                                >
                                    <ClipboardDocumentIcon className="w-4 h-4 mr-2" />
                                    View Summary
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex space-x-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{getCorrectCount()}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Correct</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{getWrongCount()}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Wrong</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{getRemainingCount()}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Remaining</div>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowAddQuestionModal(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200"
                            >
                                <PlusIcon className="w-4 h-4 mr-2" />
                                Add Question
                            </button>
                            {questions.length > 0 && (
                                <button
                                    onClick={() => setShowSaveResultModal(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-all duration-200"
                                >
                                    <DocumentTextIcon className="w-4 h-4 mr-2" />
                                    Save Result
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Questions */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {questions.length === 0 ? (
                    <div className="text-center py-12">
                        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No questions</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding your first question.</p>
                        <div className="mt-6">
                            <button
                                onClick={() => setShowAddQuestionModal(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200"
                            >
                                <PlusIcon className="w-4 h-4 mr-2" />
                                Add Question
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Correct Answers Section */}
                        {questions.filter(q => q.isCorrect === true).length > 0 && (
                            <div>
                                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                    <CheckIcon className="w-5 h-5 text-success-600 mr-2" />
                                    Correct Answers
                                </h2>
                                <div className="space-y-4">
                                    {questions.filter(q => q.isCorrect === true).map((question, index) => (
                                        <QuestionCard
                                            key={question.id}
                                            question={question}
                                            questionNumber={index + 1}
                                            onUpdateAnswer={(answer) => updateQuestion(question.id, { answer })}
                                            onUndo={() => undoQuestion(question.id)}
                                            onDelete={() => deleteQuestion(question.id)}
                                            showUndo={true}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Wrong/Unanswered Section */}
                        {questions.filter(q => q.isCorrect === false || !q.isAnswered).length > 0 && (
                            <div>
                                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                    <XMarkIcon className="w-5 h-5 text-danger-600 mr-2" />
                                    Wrong/Unanswered Questions
                                </h2>
                                <div className="space-y-4">
                                    {questions.filter(q => q.isCorrect === false || !q.isAnswered).map((question, index) => (
                                        <QuestionCard
                                            key={question.id}
                                            question={question}
                                            questionNumber={index + 1}
                                            onUpdateAnswer={(answer) => updateQuestion(question.id, { answer })}
                                            onMarkCorrect={() => markQuestionCorrect(question.id)}
                                            onMarkWrong={() => markQuestionWrong(question.id)}
                                            onUndo={() => undoQuestion(question.id)}
                                            onDelete={() => deleteQuestion(question.id)}
                                            showUndo={question.isAnswered}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Questions by Section */}
                        {Object.entries(getQuestionsBySection()).map(([sectionName, sectionQuestions]) => (
                            <div key={sectionName}>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{sectionName}</h2>
                                <div className="space-y-4">
                                    {sectionQuestions.map((question, index) => (
                                        <QuestionCard
                                            key={question.id}
                                            question={question}
                                            questionNumber={index + 1}
                                            onUpdateAnswer={(answer) => updateQuestion(question.id, { answer })}
                                            onMarkCorrect={() => markQuestionCorrect(question.id)}
                                            onMarkWrong={() => markQuestionWrong(question.id)}
                                            onUndo={() => undoQuestion(question.id)}
                                            onDelete={() => deleteQuestion(question.id)}
                                            showUndo={question.isAnswered}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            <AddQuestionModal
                isOpen={showAddQuestionModal}
                onClose={() => setShowAddQuestionModal(false)}
                onAddQuestion={addQuestion}
                questionTemplates={questionTemplates}
            />

            <SaveResultModal
                isOpen={showSaveResultModal}
                onClose={() => setShowSaveResultModal(false)}
                onSaveResult={handleSaveResult}
                candidate={candidate}
                questions={questions}
            />

            <ResultSummaryModal
                isOpen={showResultSummaryModal}
                onClose={() => setShowResultSummaryModal(false)}
                candidate={candidate}
                questions={questions}
            />
        </div>
    );
};

// Question Card Component
interface QuestionCardProps {
    question: Question;
    questionNumber: number;
    onUpdateAnswer: (answer: string) => void;
    onMarkCorrect?: () => void;
    onMarkWrong?: () => void;
    onUndo?: () => void;
    onDelete: () => void;
    showUndo?: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
    question,
    questionNumber,
    onUpdateAnswer,
    onMarkCorrect,
    onMarkWrong,
    onUndo,
    onDelete,
    showUndo = false
}) => {
    return (
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow border p-6">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 text-sm font-medium rounded-full mr-3">
                        {questionNumber}
                    </span>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{question.text}</h3>
                </div>
                <button
                    onClick={onDelete}
                    className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="form-label">
                        Answer
                    </label>
                    <textarea
                        value={question.answer || ''}
                        onChange={(e) => onUpdateAnswer(e.target.value)}
                        placeholder="Enter the candidate's answer..."
                        className="form-textarea"
                        rows={3}
                    />
                </div>

                <div className="flex items-center space-x-3">
                    {onMarkCorrect && onMarkWrong && !question.isAnswered && (
                        <>
                            <button
                                onClick={onMarkCorrect}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                            >
                                <CheckIcon className="w-4 h-4 mr-1" />
                                Correct
                            </button>
                            <button
                                onClick={onMarkWrong}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                            >
                                <XMarkIcon className="w-4 h-4 mr-1" />
                                Wrong
                            </button>
                        </>
                    )}
                    {showUndo && onUndo && (
                        <button
                            onClick={onUndo}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 transition-all duration-200"
                        >
                            Undo
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CandidateDetail; 