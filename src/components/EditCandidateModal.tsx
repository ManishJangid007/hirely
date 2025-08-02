import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Candidate } from '../types';
import DatePicker from './DatePicker';

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

    useEffect(() => {
        if (candidate) {
            setFullName(candidate.fullName);
            setPosition(candidate.position);
            setExperienceYears(candidate.experience.years);
            setExperienceMonths(candidate.experience.months);
            setInterviewDate(candidate.interviewDate || '');
        } else {
            // Reset form when no candidate is selected
            setFullName('');
            setPosition('');
            setExperienceYears(0);
            setExperienceMonths(0);
            setInterviewDate('');
        }
    }, [candidate]);

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
            interviewDate: interviewDate || undefined
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
        }
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

                        <div>
                            <label htmlFor="position" className="form-label required">
                                Position
                            </label>
                            <select
                                id="position"
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                                className="form-select"
                                required
                            >
                                <option value="">Select a position</option>
                                {positions.map((pos) => (
                                    <option key={pos} value={pos}>
                                        {pos}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="interviewDate" className="form-label">
                                Interview Date
                            </label>
                            <DatePicker
                                key={candidate?.id || 'new'} // Force re-render when candidate changes
                                value={interviewDate}
                                onChange={setInterviewDate}
                                placeholder="Select interview date"
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