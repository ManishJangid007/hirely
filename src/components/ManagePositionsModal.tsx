import React, { useState } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import ConfirmationModal from './ConfirmationModal';

interface ManagePositionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    positions: string[];
    onAddPosition: (position: string) => void;
    onRemovePosition: (position: string) => void;
}

const ManagePositionsModal: React.FC<ManagePositionsModalProps> = ({
    isOpen,
    onClose,
    positions,
    onAddPosition,
    onRemovePosition
}) => {
    const [newPosition, setNewPosition] = useState('');
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [positionToDelete, setPositionToDelete] = useState<string | null>(null);

    const handleAddPosition = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPosition.trim() && !positions.includes(newPosition.trim())) {
            onAddPosition(newPosition.trim());
            setNewPosition('');
        }
    };

    const handleRemovePosition = (position: string) => {
        setPositionToDelete(position);
        setShowDeleteConfirmModal(true);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div className="mt-3">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Manage Positions</h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Add new position */}
                        <form onSubmit={handleAddPosition} className="mb-6">
                            <div className="flex space-x-3">
                                <input
                                    type="text"
                                    value={newPosition}
                                    onChange={(e) => setNewPosition(e.target.value)}
                                    placeholder="Enter new position"
                                    className="form-input flex-1"
                                />
                                <button
                                    type="submit"
                                    disabled={!newPosition.trim()}
                                    className="inline-flex items-center px-4 py-3 border border-transparent text-sm leading-4 font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </form>

                        {/* List of positions */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Current Positions</h4>
                            <div className="space-y-3">
                                {positions.map((position) => (
                                    <div
                                        key={position}
                                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                                    >
                                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{position}</span>
                                        <button
                                            onClick={() => handleRemovePosition(position)}
                                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {positions.length === 0 && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
                                        No positions added yet
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteConfirmModal}
                onClose={() => {
                    setShowDeleteConfirmModal(false);
                    setPositionToDelete(null);
                }}
                onConfirm={() => {
                    if (positionToDelete) {
                        onRemovePosition(positionToDelete);
                    }
                }}
                title="Remove Position"
                message={positionToDelete ? `Are you sure you want to remove "${positionToDelete}"? This will affect candidates using this position.` : ''}
                confirmText="Remove"
                cancelText="Cancel"
            />
        </>
    );
};

export default ManagePositionsModal; 