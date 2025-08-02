import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CandidateList from './components/CandidateList';
import CandidateDetail from './components/CandidateDetail';
import QuestionTemplates from './components/QuestionTemplates';
import { Candidate, QuestionTemplate, AppState } from './types';
import { databaseService } from './services/database';

function App() {
  const [appState, setAppState] = useState<AppState>({
    candidates: [],
    questionTemplates: [],
    positions: ['Backend Developer', 'Frontend Developer', 'Full Stack Developer', 'DevOps Engineer', 'Data Scientist']
  });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize database and load data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await databaseService.init();
        await databaseService.migrateFromLocalStorage();

        const [candidates, templates, positions] = await Promise.all([
          databaseService.getCandidates(),
          databaseService.getQuestionTemplates(),
          databaseService.getPositions()
        ]);

        setAppState({
          candidates,
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

  const addCandidate = async (candidate: Omit<Candidate, 'id' | 'createdAt'>) => {
    const newCandidate: Candidate = {
      ...candidate,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    try {
      await databaseService.addCandidate(newCandidate);
      setAppState(prev => ({
        ...prev,
        candidates: [...prev.candidates, newCandidate]
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
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
    </Router>
  );
}

export default App;
