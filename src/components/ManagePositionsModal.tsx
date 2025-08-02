import React, { useState } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

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

    const handleAddPosition = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPosition.trim() && !positions.includes(newPosition.trim())) {
            onAddPosition(newPosition.trim());
            setNewPosition('');
        }
    };

    const handleRemovePosition = (position: string) => {
        if (window.confirm(`Are you sure you want to remove "${position}"? This will affect candidates using this position.`)) {
            onRemovePosition(position);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Manage Positions</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Add new position */}
                    <form onSubmit={handleAddPosition} className="mb-6">
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={newPosition}
                                onChange={(e) => setNewPosition(e.target.value)}
                                placeholder="Enter new position"
                                className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            />
                            <button
                                type="submit"
                                disabled={!newPosition.trim()}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <PlusIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </form>

                    {/* List of positions */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Current Positions</h4>
                        <div className="space-y-2">
                            {positions.map((position) => (
                                <div
                                    key={position}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                                >
                                    <span className="text-sm text-gray-700">{position}</span>
                                    <button
                                        onClick={() => handleRemovePosition(position)}
                                        className="text-danger-600 hover:text-danger-800"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {positions.length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-4">
                                    No positions added yet
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagePositionsModal; 