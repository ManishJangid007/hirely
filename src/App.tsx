import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CandidateList from './components/CandidateList';
import CandidateDetail from './components/CandidateDetail';
import QuestionTemplates from './components/QuestionTemplates';
import { Candidate, QuestionTemplate, AppState } from './types';

function App() {
  const [appState, setAppState] = useState<AppState>({
    candidates: [],
    questionTemplates: [],
    positions: ['Backend Developer', 'Frontend Developer', 'Full Stack Developer', 'DevOps Engineer', 'Data Scientist']
  });

  // Load data from localStorage on app start
  useEffect(() => {
    const savedCandidates = localStorage.getItem('candidates');
    const savedTemplates = localStorage.getItem('questionTemplates');
    const savedPositions = localStorage.getItem('positions');

    if (savedCandidates) {
      setAppState(prev => ({
        ...prev,
        candidates: JSON.parse(savedCandidates)
      }));
    }

    if (savedTemplates) {
      setAppState(prev => ({
        ...prev,
        questionTemplates: JSON.parse(savedTemplates)
      }));
    }

    if (savedPositions) {
      setAppState(prev => ({
        ...prev,
        positions: JSON.parse(savedPositions)
      }));
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('candidates', JSON.stringify(appState.candidates));
    localStorage.setItem('questionTemplates', JSON.stringify(appState.questionTemplates));
    localStorage.setItem('positions', JSON.stringify(appState.positions));
  }, [appState]);

  const addCandidate = (candidate: Omit<Candidate, 'id' | 'createdAt'>) => {
    const newCandidate: Candidate = {
      ...candidate,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setAppState(prev => ({
      ...prev,
      candidates: [...prev.candidates, newCandidate]
    }));
  };

  const updateCandidate = (id: string, updates: Partial<Candidate>) => {
    setAppState(prev => ({
      ...prev,
      candidates: prev.candidates.map(candidate =>
        candidate.id === id ? { ...candidate, ...updates } : candidate
      )
    }));
  };

  const deleteCandidate = (id: string) => {
    setAppState(prev => ({
      ...prev,
      candidates: prev.candidates.filter(candidate => candidate.id !== id)
    }));
  };

  const addPosition = (position: string) => {
    if (!appState.positions.includes(position)) {
      setAppState(prev => ({
        ...prev,
        positions: [...prev.positions, position]
      }));
    }
  };

  const removePosition = (position: string) => {
    setAppState(prev => ({
      ...prev,
      positions: prev.positions.filter(p => p !== position)
    }));
  };

  const addQuestionTemplate = (template: Omit<QuestionTemplate, 'id'>) => {
    const newTemplate: QuestionTemplate = {
      ...template,
      id: Date.now().toString()
    };
    setAppState(prev => ({
      ...prev,
      questionTemplates: [...prev.questionTemplates, newTemplate]
    }));
  };

  const updateQuestionTemplate = (id: string, updates: Partial<QuestionTemplate>) => {
    setAppState(prev => ({
      ...prev,
      questionTemplates: prev.questionTemplates.map(template =>
        template.id === id ? { ...template, ...updates } : template
      )
    }));
  };

  const deleteQuestionTemplate = (id: string) => {
    setAppState(prev => ({
      ...prev,
      questionTemplates: prev.questionTemplates.filter(template => template.id !== id)
    }));
  };

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
