import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, TrashIcon, UserIcon, BriefcaseIcon, ClockIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, MinusCircleIcon, PencilIcon, ClipboardDocumentIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { Candidate, QuestionTemplate } from '../types';
import AddCandidateModal from './AddCandidateModal';
import EditCandidateModal from './EditCandidateModal';
import ManagePositionsModal from './ManagePositionsModal';
import ResultSummaryModal from './ResultSummaryModal';
import CandidateFilters from './CandidateFilters';

interface CandidateListProps {
    candidates: Candidate[];
    positions: string[];
    questionTemplates: QuestionTemplate[];
    onAddCandidate: (candidate: Omit<Candidate, 'id' | 'createdAt'>) => void;
    onUpdateCandidate: (id: string, updates: Partial<Candidate>) => void;
    onDeleteCandidate: (id: string) => void;
    onAddPosition: (position: string) => void;
    onRemovePosition: (position: string) => void;
}

const CandidateList: React.FC<CandidateListProps> = ({
    candidates,
    positions,
    questionTemplates,
    onAddCandidate,
    onUpdateCandidate,
    onDeleteCandidate,
    onAddPosition,
    onRemovePosition
}) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPositionsModal, setShowPositionsModal] = useState(false);
    const [showResultSummaryModal, setShowResultSummaryModal] = useState(false);
    const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);
    const [candidateToEdit, setCandidateToEdit] = useState<Candidate | null>(null);
    const [candidateForSummary, setCandidateForSummary] = useState<Candidate | null>(null);
    const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>(candidates);

    useEffect(() => {
        setFilteredCandidates(candidates);
    }, [candidates]);

    const formatInterviewDate = (dateString?: string): string => {
        if (!dateString) return '';
        // Parse YYYY-MM-DD string to local date to avoid timezone issues
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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

    const getStatusIcon = (status: Candidate['status']) => {
        switch (status) {
            case 'Passed':
                return <CheckCircleIcon className="w-4 h-4" />;
            case 'Rejected':
                return <XCircleIcon className="w-4 h-4" />;
            case 'Maybe':
                return <ExclamationTriangleIcon className="w-4 h-4" />;
            default:
                return <MinusCircleIcon className="w-4 h-4" />;
        }
    };

    const handleDeleteCandidate = () => {
        if (candidateToDelete) {
            onDeleteCandidate(candidateToDelete.id);
            setCandidateToDelete(null);
        }
    };

    const hasInterviewResult = (candidate: Candidate) => {
        // Check if candidate has been interviewed (status is not "Not Interviewed")
        return candidate.status !== 'Not Interviewed';
    };

    const handleViewSummary = (candidate: Candidate) => {
        setCandidateForSummary(candidate);
        setShowResultSummaryModal(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
            {/* Actions + Filters sticky group */}
            <div className="sticky top-16 z-40">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 space-y-4 sm:space-y-0">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Candidate Interviews</h1>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your interview candidates</p>
                            </div>
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                                <button
                                    onClick={() => setShowPositionsModal(true)}
                                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                >
                                    <BriefcaseIcon className="w-4 h-4 mr-2" />
                                    <span className="hidden sm:inline">Manage Positions</span>
                                    <span className="sm:hidden">Positions</span>
                                </button>
                                <Link
                                    to="/templates"
                                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                >
                                    <span className="hidden sm:inline">Question Templates</span>
                                    <span className="sm:hidden">Templates</span>
                                </Link>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                                >
                                    <PlusIcon className="w-4 h-4 mr-2" />
                                    Add Candidate
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <CandidateFilters
                    candidates={candidates}
                    positions={positions}
                    onFiltersChange={setFilteredCandidates}
                />
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {filteredCandidates.length === 0 ? (
                    <div className="text-center py-12">
                        <UserIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                            {candidates.length === 0 ? 'No candidates' : 'No candidates match your filters'}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {candidates.length === 0 ? 'Get started by adding your first candidate.' : 'Try adjusting your search or filter criteria.'}
                        </p>
                        {candidates.length === 0 && (
                            <div className="mt-6">
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                                >
                                    <PlusIcon className="w-4 h-4 mr-2" />
                                    Add Candidate
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCandidates.map((candidate) => (
                            <div
                                key={candidate.id}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 card-hover animate-fade-in"
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                                {candidate.fullName}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                {candidate.position}
                                            </p>
                                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                                                <ClockIcon className="w-4 h-4 mr-1" />
                                                {candidate.experience.years} years, {candidate.experience.months} months
                                            </div>
                                            {candidate.interviewDate && (
                                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                    <CalendarIcon className="w-4 h-4 mr-1" />
                                                    {formatInterviewDate(candidate.interviewDate)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => {
                                                    setCandidateToEdit(candidate);
                                                    setShowEditModal(true);
                                                }}
                                                className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                                                title="Edit candidate"
                                            >
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => setCandidateToDelete(candidate)}
                                                className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                                                title="Delete candidate"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                                            {getStatusIcon(candidate.status)}
                                            <span className="ml-1">{candidate.status}</span>
                                        </span>
                                        <div className="flex space-x-2">
                                            {hasInterviewResult(candidate) && (
                                                <button
                                                    onClick={() => handleViewSummary(candidate)}
                                                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                                >
                                                    <ClipboardDocumentIcon className="w-4 h-4 mr-1" />
                                                    Summary
                                                </button>
                                            )}
                                            <Link
                                                to={`/candidate/${candidate.id}`}
                                                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                            >
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            <AddCandidateModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAddCandidate={onAddCandidate}
                positions={positions}
                questionTemplates={questionTemplates}
                candidates={candidates}
            />

            <EditCandidateModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setCandidateToEdit(null);
                }}
                onUpdateCandidate={onUpdateCandidate}
                candidate={candidateToEdit}
                positions={positions}
            />

            <ManagePositionsModal
                isOpen={showPositionsModal}
                onClose={() => setShowPositionsModal(false)}
                positions={positions}
                onAddPosition={onAddPosition}
                onRemovePosition={onRemovePosition}
            />

            {/* Result Summary Modal */}
            {candidateForSummary && (
                <ResultSummaryModal
                    isOpen={showResultSummaryModal}
                    onClose={() => {
                        setShowResultSummaryModal(false);
                        setCandidateForSummary(null);
                    }}
                    candidate={candidateForSummary}
                    questions={candidateForSummary.questions || []}
                />
            )}

            {/* Delete Confirmation Modal */}
            {candidateToDelete && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white dark:bg-gray-800">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                Delete Candidate
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Are you sure you want to remove "{candidateToDelete.fullName}"? This action cannot be undone.
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setCandidateToDelete(null)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteCandidate}
                                    className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CandidateList; 