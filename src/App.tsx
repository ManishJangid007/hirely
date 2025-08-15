import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CandidateList from './components/CandidateList';
import CandidateDetail from './components/CandidateDetail';
import QuestionTemplates from './components/QuestionTemplates';
import BackupManager from './components/BackupManager';
import ConfirmationModal from './components/ConfirmationModal';
import Header from './components/Header';
import { Candidate, QuestionTemplate, AppState, JobDescription } from './types';
import { databaseService } from './services/database';
import { ThemeProvider } from './contexts/ThemeContext';
// Import seeder to make it available globally
import './scripts/seeder';

function App() {
  const [appState, setAppState] = useState<AppState>({
    candidates: [],
    questionTemplates: [],
    positions: ['Backend Developer', 'Frontend Developer', 'Full Stack Developer', 'DevOps Engineer', 'Data Scientist'],
    jobDescriptions: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [showRestoreConfirmModal, setShowRestoreConfirmModal] = useState(false);

  // Initialize database and load data
  useEffect(() => {
    const initializeApp = async () => {
      try {


        // Retry database initialization up to 3 times
        let initAttempts = 0;
        let initSuccess = false;

        while (!initSuccess && initAttempts < 3) {
          try {
            await databaseService.init();
            initSuccess = true;

          } catch (error) {
            initAttempts++;

            if (initAttempts < 3) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }

        if (!initSuccess) {
          throw new Error('Database failed to initialize after 3 attempts');
        }



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

        const [candidatesAfterRestore, templates, positions, jobDescriptions] = await Promise.all([
          databaseService.getCandidates(),
          databaseService.getQuestionTemplates(),
          databaseService.getPositions(),
          databaseService.getJobDescriptions()
        ]);



        // Small delay to ensure database is fully ready
        await new Promise(resolve => setTimeout(resolve, 100));

        setAppState({
          candidates: candidatesAfterRestore.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
          questionTemplates: templates,
          positions: positions.length > 0 ? positions : ['Backend Developer', 'Frontend Developer', 'Full Stack Developer', 'DevOps Engineer', 'Data Scientist'],
          jobDescriptions: jobDescriptions || []
        });
      } catch (error) {

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

      return;
    }

    // Wait for database to be initialized
    let attempts = 0;
    while (!databaseService.isInitialized() && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!databaseService.isInitialized()) {

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

    }
  };

  const addJobDescription = async (jobDescription: Omit<JobDescription, 'id' | 'createdAt'>) => {
    const newJobDescription: JobDescription = {
      ...jobDescription,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    try {
      await databaseService.addJobDescription(newJobDescription);
      setAppState(prev => ({
        ...prev,
        jobDescriptions: [...prev.jobDescriptions, newJobDescription]
      }));
    } catch (error) {

    }
  };

  const updateJobDescription = async (id: string, updates: Partial<JobDescription>) => {
    try {
      await databaseService.updateJobDescription(id, updates);
      setAppState(prev => ({
        ...prev,
        jobDescriptions: prev.jobDescriptions.map(jd =>
          jd.id === id ? { ...jd, ...updates } : jd
        )
      }));
    } catch (error) {

    }
  };

  const deleteJobDescription = async (id: string) => {
    try {
      await databaseService.deleteJobDescription(id);
      setAppState(prev => ({
        ...prev,
        jobDescriptions: prev.jobDescriptions.filter(jd => jd.id !== id)
      }));
    } catch (error) {

    }
  };

  const addQuestionTemplate = async (template: Omit<QuestionTemplate, 'id'>) => {
    if (isLoading) {

      return;
    }



    // Wait for database to be initialized
    let attempts = 0;
    while (!databaseService.isInitialized() && attempts < 20) {

      await new Promise(resolve => setTimeout(resolve, 200));
      attempts++;
    }

    if (!databaseService.isInitialized()) {

      // Fallback to localStorage for critical operations

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
      // Ensure database is initialized (retry then attempt on-demand init)
      let attempts = 0;
      while (!databaseService.isInitialized() && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 150));
        attempts++;
      }
      if (!databaseService.isInitialized()) {
        try { await databaseService.init(); } catch { }
      }

      const updatedTemplate = appState.questionTemplates.find(t => t.id === id);
      if (!updatedTemplate) return;

      const newTemplate = { ...updatedTemplate, ...updates };

      if (!databaseService.isInitialized()) {

        // Fallback to localStorage
        const existingTemplates: QuestionTemplate[] = JSON.parse(localStorage.getItem('questionTemplates') || '[]');
        const idx = existingTemplates.findIndex(t => t.id === id);
        if (idx >= 0) {
          existingTemplates[idx] = newTemplate as QuestionTemplate;
        } else {
          existingTemplates.push(newTemplate as QuestionTemplate);
        }
        localStorage.setItem('questionTemplates', JSON.stringify(existingTemplates));
        setAppState(prev => ({
          ...prev,
          questionTemplates: prev.questionTemplates.map(template =>
            template.id === id ? (newTemplate as QuestionTemplate) : template
          )
        }));
        return;
      }
      await databaseService.updateQuestionTemplate(newTemplate);
      setAppState(prev => ({
        ...prev,
        questionTemplates: prev.questionTemplates.map(template =>
          template.id === id ? (newTemplate as QuestionTemplate) : template
        )
      }));
    } catch (error) {

    }
  };

  const deleteQuestionTemplate = async (id: string) => {
    try {
      // Ensure database is initialized before delete
      let attempts = 0;
      while (!databaseService.isInitialized() && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 150));
        attempts++;
      }
      if (!databaseService.isInitialized()) {
        try { await databaseService.init(); } catch { }
      }

      if (!databaseService.isInitialized()) {

        const existingTemplates: QuestionTemplate[] = JSON.parse(localStorage.getItem('questionTemplates') || '[]');
        const filtered = existingTemplates.filter(t => t.id !== id);
        localStorage.setItem('questionTemplates', JSON.stringify(filtered));
      } else {
        await databaseService.deleteQuestionTemplate(id);
      }
      setAppState(prev => ({
        ...prev,
        questionTemplates: prev.questionTemplates.filter(template => template.id !== id)
      }));
    } catch (error) {

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

          {/* Main Content without any top padding */}
          <div className="h-full">
            <Routes>
              <Route
                path="/"
                element={
                  <CandidateList
                    candidates={appState.candidates}
                    positions={appState.positions}
                    questionTemplates={appState.questionTemplates}
                    jobDescriptions={appState.jobDescriptions}
                    onAddCandidate={addCandidate}
                    onUpdateCandidate={updateCandidate}
                    onDeleteCandidate={deleteCandidate}
                    onAddPosition={addPosition}
                    onRemovePosition={removePosition}
                    onAddJobDescription={addJobDescription}
                    onUpdateJobDescription={updateJobDescription}
                    onDeleteJobDescription={deleteJobDescription}
                  />
                }
              />
              <Route
                path="/candidate/:id"
                element={
                  <CandidateDetail
                    candidates={appState.candidates}
                    questionTemplates={appState.questionTemplates}
                    positions={appState.positions}
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
