import React, { useState, useEffect } from 'react';
import {
    CloudArrowUpIcon,
    CloudArrowDownIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { databaseService } from '../services/database';
import ConfirmationModal from './ConfirmationModal';

interface BackupManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

const BackupManager: React.FC<BackupManagerProps> = ({ isOpen, onClose }) => {
    const [backupInfo, setBackupInfo] = useState<{ exists: boolean; lastBackup?: string }>({ exists: false });
    const [isCreatingBackup, setIsCreatingBackup] = useState(false);
    const [isRestoringBackup, setIsRestoringBackup] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    const [showRestoreConfirmModal, setShowRestoreConfirmModal] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setBackupInfo(databaseService.getBackupInfo());
        }
    }, [isOpen]);

    const handleCreateBackup = async () => {
        setIsCreatingBackup(true);
        setMessage(null);

        try {
            await databaseService.createBackup();
            setBackupInfo(databaseService.getBackupInfo());
            setMessage({ type: 'success', text: 'Backup created successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to create backup. Please try again.' });
        } finally {
            setIsCreatingBackup(false);
        }
    };

    const handleRestoreBackup = async () => {
        setShowRestoreConfirmModal(true);
    };

    const confirmRestoreBackup = async () => {
        setIsRestoringBackup(true);
        setMessage(null);

        try {
            const success = await databaseService.restoreFromBackup();
            if (success) {
                setMessage({ type: 'success', text: 'Backup restored successfully! Please refresh the page.' });
                setTimeout(() => window.location.reload(), 2000);
            } else {
                setMessage({ type: 'error', text: 'No backup found or failed to restore.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to restore backup. Please try again.' });
        } finally {
            setIsRestoringBackup(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-6 border w-96 shadow-lg rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Data Backup & Recovery</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Warning Message */}
                    <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <div className="flex items-start">
                            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" />
                            <div>
                                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Important Notice</h4>
                                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                    Your data is stored locally in your browser. Clearing browser cache or switching devices will result in data loss.
                                    Create regular backups to protect your data.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Backup Status */}
                    <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Backup Status</h4>
                        {backupInfo.exists ? (
                            <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Backup Available</p>
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                        Last backup: {backupInfo.lastBackup ? formatDate(backupInfo.lastBackup) : 'Unknown'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                                <ExclamationTriangleIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">No Backup Found</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Create a backup to protect your data</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={handleCreateBackup}
                            disabled={isCreatingBackup}
                            className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                            {isCreatingBackup ? 'Creating Backup...' : 'Create Backup'}
                        </button>

                        <button
                            onClick={handleRestoreBackup}
                            disabled={!backupInfo.exists || isRestoringBackup}
                            className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            <CloudArrowDownIcon className="w-4 h-4 mr-2" />
                            {isRestoringBackup ? 'Restoring...' : 'Restore from Backup'}
                        </button>
                    </div>

                    {/* Message Display */}
                    {message && (
                        <div className={`mt-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' :
                            message.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
                                'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                            }`}>
                            <p className={`text-sm ${message.type === 'success' ? 'text-green-800 dark:text-green-200' :
                                message.type === 'error' ? 'text-red-800 dark:text-red-200' :
                                    'text-blue-800 dark:text-blue-200'
                                }`}>
                                {message.text}
                            </p>
                        </div>
                    )}

                    {/* Info Section */}
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">How it works:</h4>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            <li>• Backups are stored in your browser's localStorage</li>
                            <li>• Create backups regularly to protect your data</li>
                            <li>• Restore from backup if data is lost</li>
                            <li>• Backups are automatically created when you make changes</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Restore Confirmation Modal */}
            <ConfirmationModal
                isOpen={showRestoreConfirmModal}
                onClose={() => setShowRestoreConfirmModal(false)}
                onConfirm={confirmRestoreBackup}
                title="Restore from Backup"
                message="This will replace all current data with the backup. Are you sure?"
                confirmText="Restore"
                cancelText="Cancel"
                confirmButtonClass="bg-blue-600 hover:bg-blue-700"
            />
        </>
    );
};

export default BackupManager; 