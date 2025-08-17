import React, { useState, useEffect, useRef } from 'react';
import {
    CloudArrowUpIcon,
    CloudArrowDownIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XMarkIcon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon
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
    const [isExportingData, setIsExportingData] = useState(false);
    const [isImportingData, setIsImportingData] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    const [showRestoreConfirmModal, setShowRestoreConfirmModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [backupVerification, setBackupVerification] = useState<{ complete: boolean; missing: string[] } | null>(null);
    const [showLocalStorageKeys, setShowLocalStorageKeys] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setBackupInfo(databaseService.getBackupInfo());
            // Verify backup completeness
            databaseService.verifyBackupCompleteness().then(setBackupVerification);
        }
    }, [isOpen]);

    const handleCreateBackup = async () => {
        setIsCreatingBackup(true);
        setMessage(null);

        try {
            await databaseService.createBackup();
            setBackupInfo(databaseService.getBackupInfo());
            // Refresh verification status
            databaseService.verifyBackupCompleteness().then(setBackupVerification);
            setMessage({ type: 'success', text: 'Complete backup created successfully! Including all settings, theme preferences, and localStorage data.' });
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
                setMessage({ type: 'success', text: 'Complete backup restored successfully! Including all settings, theme preferences, and localStorage data. Please refresh the page.' });
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

    const handleExportData = async () => {
        setIsExportingData(true);
        setMessage(null);

        try {
            // Use the new complete export method
            const exportData = await databaseService.exportCompleteData();

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `interview-app-complete-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setMessage({ type: 'success', text: 'Complete data exported successfully! Including theme settings, AI configuration, and all preferences.' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to export data. Please try again.' });
        } finally {
            setIsExportingData(false);
        }
    };

    const handleImportData = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImportingData(true);
        setMessage(null);

        try {
            const text = await file.text();
            const importData = JSON.parse(text);

            // Check if this is the new complete format
            if (importData.version === '2.0' && importData.themeSettings && importData.aiSettings) {
                // Use the new complete import method
                await databaseService.importCompleteData(importData);
                setMessage({ type: 'success', text: 'Complete data imported successfully! Including theme settings and AI configuration. Please refresh the page.' });
            } else if (importData.candidates && importData.questionTemplates && importData.positions) {
                // Legacy format - validate and import basic data
                if (!importData.candidates || !importData.questionTemplates || !importData.positions) {
                    throw new Error('Invalid data format');
                }

                // Clear existing data
                await databaseService.clearAllData();

                // Import candidates
                for (const candidate of importData.candidates) {
                    await databaseService.addCandidate(candidate);
                }

                // Import question templates
                for (const template of importData.questionTemplates) {
                    await databaseService.addQuestionTemplate(template);
                }

                // Import positions
                await databaseService.setPositions(importData.positions);

                // Import job descriptions if they exist
                if (importData.jobDescriptions) {
                    for (const jobDescription of importData.jobDescriptions) {
                        await databaseService.addJobDescription(jobDescription);
                    }
                }

                // Import interview results if they exist
                if (importData.interviewResults) {
                    for (const result of importData.interviewResults) {
                        await databaseService.addInterviewResult(result);
                    }
                }

                setMessage({ type: 'success', text: 'Legacy data imported successfully! Please refresh the page.' });
            } else {
                throw new Error('Invalid data format');
            }

            setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to import data. Please check the file format.' });
        } finally {
            setIsImportingData(false);
            // Reset file input
            if (event.target) {
                event.target.value = '';
            }
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-6 border w-[600px] shadow-lg rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
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
                                    Create regular backups to protect your data. <strong>New:</strong> Complete backups now include all settings and preferences!
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Backup Status & Actions */}
                        <div>
                            {/* Backup Status */}
                            <div className="mb-6">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Backup Status</h4>
                                {backupInfo.exists ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                            <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
                                            <div>
                                                <p className="text-sm font-medium text-green-800 dark:text-green-200">Backup Available</p>
                                                <p className="text-xs text-green-600 dark:text-green-400">
                                                    Last backup: {backupInfo.lastBackup ? formatDate(backupInfo.lastBackup) : 'Unknown'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Backup Verification */}
                                        {backupVerification && (
                                            <div className={`p-3 rounded-lg border ${backupVerification.complete
                                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                                                }`}>
                                                <div className="text-xs">
                                                    <div className={`font-medium ${backupVerification.complete
                                                        ? 'text-green-800 dark:text-green-200'
                                                        : 'text-yellow-800 dark:text-yellow-200'
                                                        }`}>
                                                        {backupVerification.complete ? '✓ Complete Backup' : '⚠ Incomplete Backup'}
                                                    </div>
                                                    {!backupVerification.complete && backupVerification.missing.length > 0 && (
                                                        <div className="text-yellow-700 dark:text-yellow-300 mt-1">
                                                            Missing: {backupVerification.missing.join(', ')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
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
                                    className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                    <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                                    {isCreatingBackup ? 'Creating Backup...' : 'Create Backup'}
                                </button>

                                <div className="flex space-x-2">
                                    <button
                                        onClick={handleRestoreBackup}
                                        disabled={!backupInfo.exists || isRestoringBackup}
                                        className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-primary-300 dark:border-primary-600 rounded-full shadow-sm text-sm font-medium text-primary-700 dark:text-primary-300 bg-white dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                    >
                                        <CloudArrowDownIcon className="w-4 h-4 mr-2" />
                                        {isRestoringBackup ? 'Restoring...' : 'Restore from Backup'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Export/Import & Info */}
                        <div>
                            {/* Complete Data Export/Import */}
                            <div className="mb-6">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Complete Data Export/Import</h4>
                                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                    <div className="text-xs text-blue-800 dark:text-blue-200">
                                        <strong>What's included:</strong> Candidates, questions, templates, positions, job descriptions, interview results, theme settings (light/dark mode + primary color), AI configuration (API keys), and all other preferences stored in your browser.
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <button
                                        onClick={handleExportData}
                                        disabled={isExportingData}
                                        className="w-full inline-flex items-center justify-center px-4 py-3 border border-primary-300 dark:border-primary-600 rounded-full shadow-sm text-sm font-medium text-primary-700 dark:text-primary-300 bg-white dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                    >
                                        <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                                        {isExportingData ? 'Exporting...' : 'Export Complete Data (JSON)'}
                                    </button>

                                    <button
                                        onClick={handleImportData}
                                        disabled={isImportingData}
                                        className="w-full inline-flex items-center justify-center px-4 py-3 border border-primary-300 dark:border-primary-600 rounded-full shadow-sm text-sm font-medium text-primary-700 dark:text-primary-300 bg-white dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                    >
                                        <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                                        {isImportingData ? 'Importing...' : 'Import Complete Data (JSON)'}
                                    </button>
                                </div>
                            </div>

                            {/* Info Section */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">How it works:</h4>
                                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                    <li>• Backups are stored in your browser's localStorage</li>
                                    <li>• Create backups regularly to protect your data</li>
                                    <li>• Restore from backup if data is lost</li>
                                    <li>• Backups are automatically created when you make changes</li>
                                    <li>• Export data as JSON files for external storage</li>
                                    <li>• Import data from previously exported JSON files</li>
                                    <li>• <strong>NEW:</strong> Complete backups include theme settings, AI configuration, and all preferences</li>
                                    <li>• <strong>NEW:</strong> Nothing is left behind - all localStorage data is preserved</li>
                                </ul>

                                {/* LocalStorage Keys Display */}
                                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={() => setShowLocalStorageKeys(!showLocalStorageKeys)}
                                        className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors duration-200"
                                    >
                                        {showLocalStorageKeys ? 'Hide' : 'Show'} current localStorage keys
                                    </button>

                                    {showLocalStorageKeys && (
                                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                                            <div className="text-gray-600 dark:text-gray-400 mb-1">Current localStorage keys:</div>
                                            <div className="space-y-1">
                                                {databaseService.getAllLocalStorageKeys().map(key => (
                                                    <div key={key} className="text-gray-500 dark:text-gray-500 font-mono">
                                                        • {key}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Message Display - Full Width */}
                    {message && (
                        <div className={`mt-6 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' :
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

                    {/* Hidden file input for import */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
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
                confirmButtonClass="bg-primary-600 hover:bg-primary-700"
            />
        </>
    );
};

export default BackupManager; 