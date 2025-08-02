import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, TrashIcon, UserIcon, BriefcaseIcon, ClockIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, MinusCircleIcon } from '@heroicons/react/24/outline';
import { Candidate, QuestionTemplate } from '../types';
import AddCandidateModal from './AddCandidateModal';
import ManagePositionsModal from './ManagePositionsModal';

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
    const [showPositionsModal, setShowPositionsModal] = useState(false);
    const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);

    const getStatusColor = (status: Candidate['status']) => {
        switch (status) {
            case 'Passed':
                return 'bg-success-500 text-white';
            case 'Rejected':
                return 'bg-danger-500 text-white';
            case 'Maybe':
                return 'bg-warning-500 text-white';
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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Candidate Interviews</h1>
                            <p className="mt-1 text-sm text-gray-500">Manage your interview candidates</p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowPositionsModal(true)}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                <BriefcaseIcon className="w-4 h-4 mr-2" />
                                Manage Positions
                            </button>
                            <Link
                                to="/templates"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                Question Templates
                            </Link>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                <PlusIcon className="w-4 h-4 mr-2" />
                                Add Candidate
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {candidates.length === 0 ? (
                    <div className="text-center py-12">
                        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No candidates</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by adding your first candidate.</p>
                        <div className="mt-6">
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                <PlusIcon className="w-4 h-4 mr-2" />
                                Add Candidate
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {candidates.map((candidate) => (
                            <div key={candidate.id} className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                                    <UserIcon className="w-6 h-6 text-primary-600" />
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <h3 className="text-lg font-medium text-gray-900">{candidate.fullName}</h3>
                                                <p className="text-sm text-gray-500">{candidate.position}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                                                {getStatusIcon(candidate.status)}
                                                <span className="ml-1">{candidate.status}</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center text-sm text-gray-500">
                                        <ClockIcon className="w-4 h-4 mr-1" />
                                        {candidate.experience.years} years, {candidate.experience.months} months
                                    </div>

                                    <div className="mt-6 flex justify-between">
                                        <Link
                                            to={`/candidate/${candidate.id}`}
                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                        >
                                            View Details
                                        </Link>
                                        <button
                                            onClick={() => setCandidateToDelete(candidate)}
                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-danger-700 bg-danger-100 hover:bg-danger-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger-500"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
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
            />

            <ManagePositionsModal
                isOpen={showPositionsModal}
                onClose={() => setShowPositionsModal(false)}
                positions={positions}
                onAddPosition={onAddPosition}
                onRemovePosition={onRemovePosition}
            />

            {/* Delete Confirmation Modal */}
            {candidateToDelete && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-danger-100">
                                <TrashIcon className="h-6 w-6 text-danger-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Candidate</h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">
                                    Are you sure you want to remove {candidateToDelete.fullName}? This action cannot be undone.
                                </p>
                            </div>
                            <div className="items-center px-4 py-3">
                                <button
                                    onClick={handleDeleteCandidate}
                                    className="px-4 py-2 bg-danger-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-danger-600 focus:outline-none focus:ring-2 focus:ring-danger-300"
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={() => setCandidateToDelete(null)}
                                    className="mt-3 px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                                >
                                    Cancel
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