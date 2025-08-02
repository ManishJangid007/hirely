import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CandidateList from './components/CandidateList';
import CandidateDetail from './components/CandidateDetail';
import QuestionTemplates from './components/QuestionTemplates';
import BackupManager from './components/BackupManager';
import ConfirmationModal from './components/ConfirmationModal';
import Header from './components/Header';
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
        console.log('Starting app initialization...');

        // Retry database initialization up to 3 times
        let initAttempts = 0;
        let initSuccess = false;

        while (!initSuccess && initAttempts < 3) {
          try {
            await databaseService.init();
            initSuccess = true;
            console.log('Database initialized successfully on attempt', initAttempts + 1);
          } catch (error) {
            initAttempts++;
            console.error(`Database initialization attempt ${initAttempts} failed:`, error);
            if (initAttempts < 3) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }

        if (!initSuccess) {
          throw new Error('Database failed to initialize after 3 attempts');
        }

        console.log('Database initialized, loading data...');

        // Verify database is initialized
        if (!databaseService.isInitialized()) {
          throw new Error('Database failed to initialize properly');
        }

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

        console.log('Data loaded successfully:', {
          candidates: candidatesAfterRestore.length,
          templates: templates.length,
          positions: positions.length
        });

        // Small delay to ensure database is fully ready
        await new Promise(resolve => setTimeout(resolve, 100));

        setAppState({
          candidates: candidatesAfterRestore.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
          questionTemplates: templates,
          positions: positions.length > 0 ? positions : ['Backend Developer', 'Frontend Developer', 'Full Stack Developer', 'DevOps Engineer', 'Data Scientist']
        });
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Set loading to false even on error so app doesn't hang
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const addCandidate = async (candidate: Omit<Candidate, 'id' | 'createdAt'>) => {
    if (isLoading) {
      console.error('App is still loading, please wait');
      return;
    }

    // Wait for database to be initialized
    let attempts = 0;
    while (!databaseService.isInitialized() && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!databaseService.isInitialized()) {
      console.error('Database not initialized, cannot add candidate');
      return;
    }

    const newCandidate: Candidate = {
      ...candidate,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    try {
      await databaseService.addCandidate(newCandidate);

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
    if (isLoading) {
      console.error('App is still loading, please wait');
      return;
    }

    console.log('Attempting to add question template, database initialized:', databaseService.isInitialized());

    // Wait for database to be initialized
    let attempts = 0;
    while (!databaseService.isInitialized() && attempts < 20) {
      console.log(`Database not ready, attempt ${attempts + 1}/20`);
      await new Promise(resolve => setTimeout(resolve, 200));
      attempts++;
    }

    if (!databaseService.isInitialized()) {
      console.error('Database not initialized after 20 attempts, cannot add question template');
      // Fallback to localStorage for critical operations
      console.log('Using localStorage fallback for template addition');
      const newTemplate: QuestionTemplate = {
        ...template,
        id: Date.now().toString()
      };

      // Store in localStorage as fallback
      const existingTemplates = JSON.parse(localStorage.getItem('questionTemplates') || '[]');
      existingTemplates.push(newTemplate);
      localStorage.setItem('questionTemplates', JSON.stringify(existingTemplates));

      setAppState(prev => ({
        ...prev,
        questionTemplates: [...prev.questionTemplates, newTemplate]
      }));
      return;
    }

    console.log('Database is ready, proceeding with template addition');

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
      // Fallback to localStorage
      const existingTemplates = JSON.parse(localStorage.getItem('questionTemplates') || '[]');
      existingTemplates.push(newTemplate);
      localStorage.setItem('questionTemplates', JSON.stringify(existingTemplates));

      setAppState(prev => ({
        ...prev,
        questionTemplates: [...prev.questionTemplates, newTemplate]
      }));
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
          <Header onBackupClick={() => setShowBackupManager(true)} />

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
                    isLoading={isLoading}
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
