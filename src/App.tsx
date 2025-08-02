import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CandidateList from './components/CandidateList';
import CandidateDetail from './components/CandidateDetail';
import QuestionTemplates from './components/QuestionTemplates';
import BackupManager from './components/BackupManager';
import ThemeToggle from './components/ThemeToggle';
import ConfirmationModal from './components/ConfirmationModal';
import { Candidate, QuestionTemplate, AppState } from './types';
import { databaseService } from './services/database';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  const [appState, setAppState] = useState<AppState>({
    candidates: [],
    questionTemplates: [],
    positions: ['Backend Developer', 'Frontend Developer', 'Full Stack Developer', 'DevOps Engineer', 'Data Scientist']
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [showRestoreConfirmModal, setShowRestoreConfirmModal] = useState(false);

  // Initialize database and load data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await databaseService.init();

        // Try to restore from backup if IndexedDB is empty
        const backupInfo = databaseService.getBackupInfo();
        const candidates = await databaseService.getCandidates();

        if (candidates.length === 0 && backupInfo.exists) {
          setShowRestoreConfirmModal(true);
        }

        await databaseService.migrateFromLocalStorage();

        const [candidatesAfterRestore, templates, positions] = await Promise.all([
          databaseService.getCandidates(),
          databaseService.getQuestionTemplates(),
          databaseService.getPositions()
        ]);

        setAppState({
          candidates: candidatesAfterRestore.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
          questionTemplates: templates,
          positions: positions.length > 0 ? positions : ['Backend Developer', 'Frontend Developer', 'Full Stack Developer', 'DevOps Engineer', 'Data Scientist']
        });
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const addCandidate = async (candidate: Omit<Candidate, 'id' | 'createdAt'>, importedQuestions?: any[]) => {
    const newCandidate: Candidate = {
      ...candidate,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    try {
      await databaseService.addCandidate(newCandidate);

      // If questions were imported, save them to localStorage for the new candidate
      if (importedQuestions && importedQuestions.length > 0) {
        console.log('Saving imported questions:', importedQuestions);
        console.log('Candidate ID:', newCandidate.id);
        localStorage.setItem(`questions_${newCandidate.id}`, JSON.stringify(importedQuestions));

        // Verify the questions were saved
        const savedQuestions = localStorage.getItem(`questions_${newCandidate.id}`);
        console.log('Saved questions verification:', savedQuestions);
      }

      setAppState(prev => ({
        ...prev,
        candidates: [...prev.candidates, newCandidate].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      }));
    } catch (error) {
      console.error('Failed to add candidate:', error);
    }
  };

  const updateCandidate = async (id: string, updates: Partial<Candidate>) => {
    try {
      const updatedCandidate = appState.candidates.find(c => c.id === id);
      if (updatedCandidate) {
        const newCandidate = { ...updatedCandidate, ...updates };
        await databaseService.updateCandidate(newCandidate);
        setAppState(prev => ({
          ...prev,
          candidates: prev.candidates.map(candidate =>
            candidate.id === id ? newCandidate : candidate
          )
        }));
      }
    } catch (error) {
      console.error('Failed to update candidate:', error);
    }
  };

  const deleteCandidate = async (id: string) => {
    try {
      await databaseService.deleteCandidate(id);
      setAppState(prev => ({
        ...prev,
        candidates: prev.candidates.filter(candidate => candidate.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete candidate:', error);
    }
  };

  const addPosition = async (position: string) => {
    if (!appState.positions.includes(position)) {
      const newPositions = [...appState.positions, position];
      try {
        await databaseService.setPositions(newPositions);
        setAppState(prev => ({
          ...prev,
          positions: newPositions
        }));
      } catch (error) {
        console.error('Failed to add position:', error);
      }
    }
  };

  const removePosition = async (position: string) => {
    const newPositions = appState.positions.filter(p => p !== position);
    try {
      await databaseService.setPositions(newPositions);
      setAppState(prev => ({
        ...prev,
        positions: newPositions
      }));
    } catch (error) {
      console.error('Failed to remove position:', error);
    }
  };

  const addQuestionTemplate = async (template: Omit<QuestionTemplate, 'id'>) => {
    const newTemplate: QuestionTemplate = {
      ...template,
      id: Date.now().toString()
    };

    try {
      await databaseService.addQuestionTemplate(newTemplate);
      setAppState(prev => ({
        ...prev,
        questionTemplates: [...prev.questionTemplates, newTemplate]
      }));
    } catch (error) {
      console.error('Failed to add question template:', error);
    }
  };

  const updateQuestionTemplate = async (id: string, updates: Partial<QuestionTemplate>) => {
    try {
      const updatedTemplate = appState.questionTemplates.find(t => t.id === id);
      if (updatedTemplate) {
        const newTemplate = { ...updatedTemplate, ...updates };
        await databaseService.updateQuestionTemplate(newTemplate);
        setAppState(prev => ({
          ...prev,
          questionTemplates: prev.questionTemplates.map(template =>
            template.id === id ? newTemplate : template
          )
        }));
      }
    } catch (error) {
      console.error('Failed to update question template:', error);
    }
  };

  const deleteQuestionTemplate = async (id: string) => {
    try {
      await databaseService.deleteQuestionTemplate(id);
      setAppState(prev => ({
        ...prev,
        questionTemplates: prev.questionTemplates.filter(template => template.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete question template:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          {/* Global Navigation Bar */}
          <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Hirely
                  </h1>
                </div>

                <div className="flex items-center space-x-4">
                  <ThemeToggle />
                  <button
                    onClick={() => setShowBackupManager(true)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    <span className="hidden sm:inline">Backup</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content with top padding for fixed nav */}
          <div className="pt-16">
            <Routes>
              <Route
                path="/"
                element={
                  <CandidateList
                    candidates={appState.candidates}
                    positions={appState.positions}
                    questionTemplates={appState.questionTemplates}
                    onAddCandidate={addCandidate}
                    onUpdateCandidate={updateCandidate}
                    onDeleteCandidate={deleteCandidate}
                    onAddPosition={addPosition}
                    onRemovePosition={removePosition}
                  />
                }
              />
              <Route
                path="/candidate/:id"
                element={
                  <CandidateDetail
                    candidates={appState.candidates}
                    questionTemplates={appState.questionTemplates}
                    onUpdateCandidate={updateCandidate}
                  />
                }
              />
              <Route
                path="/templates"
                element={
                  <QuestionTemplates
                    templates={appState.questionTemplates}
                    onAddTemplate={addQuestionTemplate}
                    onUpdateTemplate={updateQuestionTemplate}
                    onDeleteTemplate={deleteQuestionTemplate}
                  />
                }
              />
            </Routes>
          </div>

          {/* Backup Manager Modal */}
          <BackupManager
            isOpen={showBackupManager}
            onClose={() => setShowBackupManager(false)}
          />

          {/* Restore Confirmation Modal */}
          <ConfirmationModal
            isOpen={showRestoreConfirmModal}
            onClose={() => setShowRestoreConfirmModal(false)}
            onConfirm={async () => {
              await databaseService.restoreFromBackup();
              setShowRestoreConfirmModal(false);
            }}
            title="Restore from Backup"
            message="No data found in the database, but a backup is available. Would you like to restore from backup?"
            confirmText="Restore"
            cancelText="Skip"
            confirmButtonClass="bg-blue-600 hover:bg-blue-700"
          />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
