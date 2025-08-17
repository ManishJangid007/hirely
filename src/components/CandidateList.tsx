import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, TrashIcon, UserIcon, BriefcaseIcon, ClockIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, MinusCircleIcon, PencilIcon, ClipboardDocumentIcon, CalendarIcon, DocumentTextIcon, DocumentIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { Candidate, QuestionTemplate, JobDescription } from '../types';
import AddCandidateModal from './AddCandidateModal';
import EditCandidateModal from './EditCandidateModal';
import ManagePositionsModal from './ManagePositionsModal';
import JobDescriptionsModal from './JobDescriptionsModal';
import ResultSummaryModal from './ResultSummaryModal';
import CandidateFilters from './CandidateFilters';

interface CandidateListProps {
    candidates: Candidate[];
    positions: string[];
    questionTemplates: QuestionTemplate[];
    jobDescriptions: JobDescription[];
    onAddCandidate: (candidate: Omit<Candidate, 'id' | 'createdAt'>) => void;
    onUpdateCandidate: (id: string, updates: Partial<Candidate>) => void;
    onDeleteCandidate: (id: string) => void;
    onAddPosition: (position: string) => void;
    onRemovePosition: (position: string) => void;
    onAddJobDescription: (jobDescription: Omit<JobDescription, 'id' | 'createdAt'>) => void;
    onUpdateJobDescription: (id: string, updates: Partial<JobDescription>) => void;
    onDeleteJobDescription: (id: string) => void;
}

const CandidateList: React.FC<CandidateListProps> = ({
    candidates,
    positions,
    questionTemplates,
    jobDescriptions,
    onAddCandidate,
    onUpdateCandidate,
    onDeleteCandidate,
    onAddPosition,
    onRemovePosition,
    onAddJobDescription,
    onUpdateJobDescription,
    onDeleteJobDescription
}) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPositionsModal, setShowPositionsModal] = useState(false);
    const [showResultSummaryModal, setShowResultSummaryModal] = useState(false);
    const [showJobDescriptionsModal, setShowJobDescriptionsModal] = useState(false);
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);
    const [candidateToEdit, setCandidateToEdit] = useState<Candidate | null>(null);
    const [candidateForSummary, setCandidateForSummary] = useState<Candidate | null>(null);
    const [candidateForResume, setCandidateForResume] = useState<Candidate | null>(null);
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

    const handleViewResume = (candidate: Candidate) => {
        setCandidateForResume(candidate);
        setShowResumeModal(true);
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
                                    className="group relative inline-flex items-center justify-center w-12 h-12 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-700 hover:duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 hover:w-auto hover:pl-0 hover:pr-4 origin-right"
                                    title="Manage Positions"
                                >
                                    {/* Centered icon for circular state */}
                                    <BriefcaseIcon className="w-5 h-5 group-hover:opacity-0" />

                                    {/* Expanded state with icon and text */}
                                    <div className="hidden group-hover:flex items-center justify-center w-full transition-all duration-500">
                                        <BriefcaseIcon className="w-5 h-5 flex-shrink-0" />
                                        <span className="ml-2 whitespace-nowrap overflow-hidden">
                                            <span className="hidden sm:inline">Manage Positions</span>
                                            <span className="sm:hidden">Positions</span>
                                        </span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setShowJobDescriptionsModal(true)}
                                    className="group relative inline-flex items-center justify-center w-12 h-12 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-700 hover:duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 hover:w-auto hover:pl-0 hover:pr-4 origin-right"
                                    title="Job Descriptions"
                                >
                                    {/* Centered icon for circular state */}
                                    <DocumentTextIcon className="w-5 h-5 group-hover:opacity-0" />

                                    {/* Expanded state with icon and text */}
                                    <div className="hidden group-hover:flex items-center justify-center w-full transition-all duration-500">
                                        <DocumentTextIcon className="w-5 h-5 flex-shrink-0" />
                                        <span className="ml-2 whitespace-nowrap overflow-hidden">
                                            <span className="hidden sm:inline">Job Descriptions</span>
                                            <span className="sm:hidden">JDs</span>
                                        </span>
                                    </div>
                                </button>
                                <Link
                                    to="/templates"
                                    className="group relative inline-flex items-center justify-center w-12 h-12 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-700 hover:duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 hover:w-auto hover:pl-0 hover:pr-4 origin-right"
                                    title="Question Templates"
                                >
                                    {/* Centered icon for circular state */}
                                    <DocumentDuplicateIcon className="w-5 h-5 group-hover:opacity-0" />

                                    {/* Expanded state with icon and text */}
                                    <div className="hidden group-hover:flex items-center justify-center w-full transition-all duration-500">
                                        <DocumentDuplicateIcon className="w-5 h-5 flex-shrink-0" />
                                        <span className="ml-2 whitespace-nowrap overflow-hidden">
                                            <span className="hidden sm:inline">Question Templates</span>
                                            <span className="sm:hidden">Templates</span>
                                        </span>
                                    </div>
                                </Link>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="group relative inline-flex items-center justify-center w-12 h-12 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-700 hover:duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover:w-auto hover:pl-0 hover:pr-4 origin-right"
                                    title="Add Candidate"
                                >
                                    {/* Centered icon for circular state */}
                                    <PlusIcon className="w-5 h-5 group-hover:opacity-0" />

                                    {/* Expanded state with icon and text */}
                                    <div className="hidden group-hover:flex items-center justify-center w-full transition-all duration-500">
                                        <PlusIcon className="w-5 h-5 flex-shrink-0" />
                                        <span className="ml-2 whitespace-nowrap overflow-hidden">
                                            Add Candidate
                                        </span>
                                    </div>
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
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
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
                                className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 card-hover animate-fade-in cursor-pointer"
                                onClick={() => window.location.href = `/candidate/${candidate.id}`}
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
                                        {/* Status pill moved to top right */}
                                        <span className={`inline-flex items-center px-2 py-1.5 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                                            {getStatusIcon(candidate.status)}
                                            <span className="ml-1">{candidate.status}</span>
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        {/* Summary button moved to bottom left */}
                                        <div className="flex space-x-2">
                                            {hasInterviewResult(candidate) && (
                                                <div className="group relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewSummary(candidate);
                                                        }}
                                                        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                                        title="View Interview Summary"
                                                    >
                                                        <ClipboardDocumentIcon className="w-4 h-4 mr-1" />
                                                        Summary
                                                    </button>
                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                        View Interview Summary
                                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {/* Action icons moved to bottom right */}
                                        <div className="flex space-x-2">
                                            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors duration-200 group relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCandidateToEdit(candidate);
                                                        setShowEditModal(true);
                                                    }}
                                                    className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors duration-200"
                                                    title="Edit Candidate"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                    Edit Candidate
                                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                                                </div>
                                            </div>
                                            {candidate.resume && (
                                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors duration-200 group relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewResume(candidate);
                                                        }}
                                                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                                                        title={`View ${candidate.fullName}'s Resume`}
                                                    >
                                                        <DocumentIcon className="w-4 h-4" />
                                                    </button>
                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                        View Resume
                                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors duration-200 group relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCandidateToDelete(candidate);
                                                    }}
                                                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                                                    title="Delete Candidate"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                    Delete Candidate
                                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                                                </div>
                                            </div>
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

            <JobDescriptionsModal
                isOpen={showJobDescriptionsModal}
                onClose={() => setShowJobDescriptionsModal(false)}
                jobDescriptions={jobDescriptions}
                onAddJobDescription={onAddJobDescription}
                onUpdateJobDescription={onUpdateJobDescription}
                onDeleteJobDescription={onDeleteJobDescription}
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
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteCandidate}
                                    className="px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Resume Modal */}
            {showResumeModal && candidateForResume && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-auto max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Resume - {candidateForResume.fullName}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowResumeModal(false);
                                    setCandidateForResume(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                            >
                                <XCircleIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Parsed Resume Object:</h4>
                                <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words overflow-x-auto">
                                    {JSON.stringify(candidateForResume.resume, null, 2)}
                                </pre>
                            </div>

                            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                                <p>This is the AI-generated JSON resume for {candidateForResume.fullName}.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CandidateList; 