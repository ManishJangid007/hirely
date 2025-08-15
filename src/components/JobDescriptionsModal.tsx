import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, PencilIcon, TrashIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { JobDescription } from '../types';
import ConfirmationModal from './ConfirmationModal';

interface JobDescriptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobDescriptions: JobDescription[];
    onAddJobDescription: (jobDescription: Omit<JobDescription, 'id' | 'createdAt'>) => void;
    onUpdateJobDescription: (id: string, updates: Partial<JobDescription>) => void;
    onDeleteJobDescription: (id: string) => void;
}

const JobDescriptionsModal: React.FC<JobDescriptionsModalProps> = ({
    isOpen,
    onClose,
    jobDescriptions,
    onAddJobDescription,
    onUpdateJobDescription,
    onDeleteJobDescription
}) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedJobDescription, setSelectedJobDescription] = useState<JobDescription | null>(null);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [jdToDelete, setJdToDelete] = useState<JobDescription | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: ''
    });

    // Sync form data with selectedJobDescription when it changes
    useEffect(() => {
        if (selectedJobDescription) {
            setFormData({
                title: selectedJobDescription.title,
                description: selectedJobDescription.description
            });
        }
    }, [selectedJobDescription]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.description.trim()) return;

        const title = formData.title.trim();
        const description = formData.description.trim();

        onAddJobDescription({
            title: title,
            description: description
        });

        // Clear the form data after successful submission
        setFormData({ title: '', description: '' });
        setShowAddForm(false);

        // Automatically open the view modal with the new JD
        // We need to create the full object for the modal
        const fullJobDescription: JobDescription = {
            id: Date.now().toString(),
            title: title,
            description: description,
            createdAt: new Date().toISOString()
        };
        setSelectedJobDescription(fullJobDescription);
        setShowEditModal(true);
        setIsEditing(false);
    };

    const handleEdit = (jd: JobDescription) => {
        setSelectedJobDescription(jd);
        setFormData({
            title: jd.title,
            description: jd.description
        });
        setIsEditing(false); // Start in view mode
        setShowEditModal(true);
    };

    const handleCancel = () => {
        setFormData({ title: '', description: '' });
        setShowAddForm(false);
    };

    const handleDelete = (jd: JobDescription) => {
        setJdToDelete(jd);
        setShowDeleteConfirmModal(true);
    };

    const handleSave = () => {
        if (!formData.title.trim() || !formData.description.trim()) return;

        if (selectedJobDescription) {
            const updatedData = {
                title: formData.title.trim(),
                description: formData.description.trim()
            };

            onUpdateJobDescription(selectedJobDescription.id, updatedData);

            // Update the local selectedJobDescription to show changes immediately
            setSelectedJobDescription({
                ...selectedJobDescription,
                ...updatedData
            });
        }

        setIsEditing(false);
        // Don't clear formData - keep it populated for potential future edits
    };

    const handleCancelEdit = () => {
        if (selectedJobDescription) {
            // Reset form data to the current selectedJobDescription values
            setFormData({
                title: selectedJobDescription.title,
                description: selectedJobDescription.description
            });
        }
        setIsEditing(false);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Manage Job Descriptions
                        </h3>
                        <button
                            onClick={() => {
                                // Reset modal to initial state before closing
                                setShowAddForm(false);
                                setShowEditModal(false);
                                setSelectedJobDescription(null);
                                setIsEditing(false);
                                setFormData({ title: '', description: '' });
                                setShowDeleteConfirmModal(false);
                                setJdToDelete(null);
                                onClose();
                            }}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>



                    {/* Add/Edit Form */}
                    {showAddForm && (
                        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                                Add New Job Description
                            </h4>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Job Title
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
                                        placeholder="e.g., Senior Frontend Developer"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Job Description
                                    </label>
                                    <textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        rows={6}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
                                        placeholder="Enter detailed job description..."
                                        required
                                    />
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        type="submit"
                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                                    >
                                        Add Job Description
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Add Button */}
                    {!showAddForm && (
                        <div className="mb-6">
                            <button
                                onClick={() => {
                                    // Clear form data and show add form
                                    setFormData({ title: '', description: '' });
                                    setShowAddForm(true);
                                }}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                            >
                                <PlusIcon className="w-4 h-4 mr-2" />
                                Add Job Description
                            </button>
                        </div>
                    )}

                    {/* Job Descriptions List */}
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {jobDescriptions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <DocumentTextIcon className="mx-auto h-12 w-12 mb-4" />
                                <p>No job descriptions yet.</p>
                                <p className="text-sm">Add your first job description to get started.</p>
                            </div>
                        ) : (
                            jobDescriptions.map((jd) => (
                                <div
                                    key={jd.id}
                                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                                {jd.title}
                                            </h4>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                Created: {new Date(jd.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleEdit(jd)}
                                                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                                title="View/Edit"
                                            >
                                                <PencilIcon className="w-4 h-4 mr-1" />
                                                View/Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(jd)}
                                                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                                title="Delete"
                                            >
                                                <TrashIcon className="w-4 h-4 mr-1" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Close Button */}
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={() => {
                                // Reset modal to initial state before closing
                                setShowAddForm(false);
                                setShowEditModal(false);
                                setSelectedJobDescription(null);
                                setIsEditing(false);
                                setFormData({ title: '', description: '' });
                                setShowDeleteConfirmModal(false);
                                setJdToDelete(null);
                                onClose();
                            }}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Edit/View Modal */}
                {showEditModal && selectedJobDescription && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[60]">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    {selectedJobDescription.title}
                                </h3>
                                <div className="flex items-center space-x-2">
                                    {!isEditing && (
                                        <button
                                            onClick={() => {
                                                // Populate form data with current values when entering edit mode
                                                setFormData({
                                                    title: selectedJobDescription.title,
                                                    description: selectedJobDescription.description
                                                });
                                                setIsEditing(true);
                                            }}
                                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                                            title="Edit"
                                        >
                                            <PencilIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            setShowEditModal(false);
                                            setSelectedJobDescription(null);
                                            setIsEditing(false);
                                            // Don't clear formData - preserve it for future edits
                                        }}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                                    >
                                        <XMarkIcon className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* Single View/Edit Section */}
                            <div className="mb-6">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Job Title
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
                                            placeholder="e.g., Senior Frontend Developer"
                                            required
                                        />
                                    ) : (
                                        <p className="text-gray-900 dark:text-white font-medium">
                                            {selectedJobDescription.title}
                                        </p>
                                    )}
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Job Description
                                    </label>
                                    {isEditing ? (
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            rows={6}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
                                            placeholder="Enter detailed job description..."
                                            required
                                        />
                                    ) : (
                                        <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                                            <p className="text-gray-900 dark:text-white whitespace-pre-wrap text-sm">
                                                {selectedJobDescription.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Created: {new Date(selectedJobDescription.createdAt).toLocaleDateString()}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {isEditing && (
                                <div className="flex justify-center space-x-3">
                                    <button
                                        onClick={handleSave}
                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}

                            {/* Close Button */}
                            <div className="flex justify-end">
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedJobDescription(null);
                                    }}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteConfirmModal}
                onClose={() => {
                    setShowDeleteConfirmModal(false);
                    setJdToDelete(null);
                }}
                onConfirm={() => {
                    if (jdToDelete) {
                        onDeleteJobDescription(jdToDelete.id);
                    }
                    setShowDeleteConfirmModal(false);
                    setJdToDelete(null);
                }}
                title="Delete Job Description"
                message={jdToDelete ? `Are you sure you want to delete "${jdToDelete.title}"? This action cannot be undone.` : 'Are you sure you want to delete this job description? This action cannot be undone.'}
                confirmText="Delete"
                cancelText="Cancel"
                confirmButtonClass="bg-red-600 hover:bg-red-700"
            />
        </>
    );
};

export default JobDescriptionsModal;
