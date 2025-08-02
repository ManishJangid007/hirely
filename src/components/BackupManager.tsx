import React, { useState, useEffect } from 'react';
import {
    CloudArrowUpIcon,
    CloudArrowDownIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { databaseService } from '../services/database';

interface BackupManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

const BackupManager: React.FC<BackupManagerProps> = ({ isOpen, onClose }) => {
    const [backupInfo, setBackupInfo] = useState<{ exists: boolean; lastBackup?: string }>({ exists: false });
    const [isCreatingBackup, setIsCreatingBackup] = useState(false);
    const [isRestoringBackup, setIsRestoringBackup] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

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
        if (!window.confirm('This will replace all current data with the backup. Are you sure?')) {
            return;
        }

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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-6 border w-96 shadow-lg rounded-lg bg-white">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Data Backup & Recovery</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Warning Message */}
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                        <div>
                            <h4 className="text-sm font-medium text-yellow-800">Important Notice</h4>
                            <p className="text-sm text-yellow-700 mt-1">
                                Your data is stored locally in your browser. Clearing browser cache or switching devices will result in data loss.
                                Create regular backups to protect your data.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Backup Status */}
                <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Backup Status</h4>
                    {backupInfo.exists ? (
                        <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircleIcon className="w-5 h-5 text-green-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-green-800">Backup Available</p>
                                <p className="text-xs text-green-600">
                                    Last backup: {backupInfo.lastBackup ? formatDate(backupInfo.lastBackup) : 'Unknown'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <ExclamationTriangleIcon className="w-5 h-5 text-gray-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-800">No Backup Found</p>
                                <p className="text-xs text-gray-600">Create a backup to protect your data</p>
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
                        className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        <CloudArrowDownIcon className="w-4 h-4 mr-2" />
                        {isRestoringBackup ? 'Restoring...' : 'Restore from Backup'}
                    </button>
                </div>

                {/* Message Display */}
                {message && (
                    <div className={`mt-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200' :
                            message.type === 'error' ? 'bg-red-50 border border-red-200' :
                                'bg-blue-50 border border-blue-200'
                        }`}>
                        <p className={`text-sm ${message.type === 'success' ? 'text-green-800' :
                                message.type === 'error' ? 'text-red-800' :
                                    'text-blue-800'
                            }`}>
                            {message.text}
                        </p>
                    </div>
                )}

                {/* Info Section */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">How it works:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Backups are stored in your browser's localStorage</li>
                        <li>• Create backups regularly to protect your data</li>
                        <li>• Restore from backup if data is lost</li>
                        <li>• Backups are automatically created when you make changes</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default BackupManager; 