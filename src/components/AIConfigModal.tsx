import React, { useEffect, useState } from 'react';
import { XMarkIcon, SparklesIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { databaseService } from '../services/database';
import { generateContent } from '../services/ai';

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIConfigModal: React.FC<AIConfigModalProps> = ({ isOpen, onClose }) => {
  const [saving, setSaving] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const gKey = await databaseService.getGeminiApiKey();
        setGeminiApiKey(gKey || '');
      } catch {
        // ignore
      }
    };
    if (isOpen) {
      setTestStatus('idle');
      setTestMessage(null);
      load();
    }
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!databaseService.isInitialized()) {
        try { await databaseService.init(); } catch { }
      }
      await databaseService.setGeminiApiKey(geminiApiKey.trim());
      if (testStatus === 'success') {
        await databaseService.setGeminiConnected(true);
      }
      setTimeout(onClose, 800);
    } catch (err) {
      setTestStatus('error');
      setTestMessage('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!geminiApiKey.trim()) return;
    setTestStatus('testing');
    setTestMessage(null);
    try {
      if (!databaseService.isInitialized()) {
        try { await databaseService.init(); } catch { }
      }
      const res = await generateContent({ prompt: 'Hi', overrideApiKey: geminiApiKey.trim(), timeoutMs: 10000 });
      if (res && res.candidates && res.candidates.length > 0) {
        setTestStatus('success');
        setTestMessage('Linked to Gemini');
        try {
          await databaseService.setGeminiApiKey(geminiApiKey.trim());
          await databaseService.setGeminiConnected(true);
        } catch { }
      } else {
        setTestStatus('error');
        setTestMessage('Unable to verify key');
        try { await databaseService.setGeminiConnected(false); } catch { }
      }
    } catch (e) {
      setTestStatus('error');
      setTestMessage('Verification failed');
      try { await databaseService.setGeminiConnected(false); } catch { }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="mt-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">AI Configuration</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Google Gemini Section */}
            <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center mb-3">
                {/* Google logo SVG */}
                <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.593 32.91 29.195 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.157 7.957 3.043l5.657-5.657C33.64 6.053 28.993 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20c10.493 0 19-8.507 19-19 0-1.262-.13-2.493-.389-3.667z" />
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.464 15.548 18.845 12 24 12c3.059 0 5.842 1.157 7.957 3.043l5.657-5.657C33.64 6.053 28.993 4 24 4 16.318 4 9.641 8.337 6.306 14.691z" />
                  <path fill="#4CAF50" d="M24 44c5.136 0 9.75-1.969 13.261-5.177l-6.091-5.155C29.112 35.426 26.671 36 24 36c-5.176 0-9.566-3.106-11.29-7.48l-6.533 5.034C9.476 39.74 16.227 44 24 44z" />
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.55 4.085-5.598 7-11.303 7-5.176 0-9.566-3.106-11.29-7.48l-6.533 5.034C9.476 39.74 16.227 44 24 44c10.493 0 19-8.507 19-19 0-1.262-.13-2.493-.389-3.667z" />
                </svg>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Google Gemini</h4>
              </div>
              <label htmlFor="geminiKey" className="form-label">Gemini API Key</label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input
                    id="geminiKey"
                    type={showKey ? 'text' : 'password'}
                    className={`form-input pr-10 ${testStatus === 'success' ? 'border-green-500 focus:ring-green-500' : testStatus === 'error' ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                    placeholder="Enter your Gemini API key"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(v => !v)}
                    className="absolute inset-y-0 right-2 flex items-center text-gray-500 dark:text-gray-300"
                    aria-label={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
                {geminiApiKey && (
                  <button
                    type="button"
                    onClick={handleTest}
                    disabled={testStatus === 'testing'}
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm border whitespace-nowrap ${testStatus === 'success' ? 'border-green-600 text-green-700 dark:text-green-400' :
                      testStatus === 'error' ? 'border-red-600 text-red-700 dark:text-red-400' :
                        'border-gray-300 text-gray-700 dark:text-gray-300'
                      }`}
                  >
                    {testStatus === 'testing' ? 'Testing…' : 'Test'}
                  </button>
                )}
              </div>
              {testMessage && (
                <p className={`mt-2 text-sm ${testStatus === 'success' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {testMessage}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
            {/* No global success toast */}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIConfigModal;


