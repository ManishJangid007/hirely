import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Candidate } from '../types';

interface EditCandidateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdateCandidate: (id: string, updates: Partial<Candidate>) => void;
    candidate: Candidate | null;
}

const EditCandidateModal: React.FC<EditCandidateModalProps> = ({
    isOpen,
    onClose,
    onUpdateCandidate,
    candidate
}) => {
    const [fullName, setFullName] = useState('');

    useEffect(() => {
        if (candidate) {
            setFullName(candidate.fullName);
        }
    }, [candidate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!candidate || !fullName.trim()) return;

        onUpdateCandidate(candidate.id, { fullName: fullName.trim() });
        onClose();
    };

    const handleClose = () => {
        setFullName(candidate?.fullName || '');
        onClose();
    };

    if (!isOpen || !candidate) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
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
        </div>
    );
};

export default EditCandidateModal; 