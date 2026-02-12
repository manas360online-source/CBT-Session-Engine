import React, { useState, useEffect } from 'react';
import { ViewState, SessionTemplate, SessionResult } from './types';
import Dashboard from './components/Dashboard';
import SessionBuilder from './components/SessionBuilder';
import SessionRunner from './components/SessionRunner';
import ResultsView from './components/ResultsView';
import TrainingEngine from './components/Training/TrainingEngine';
import { getTemplates, saveTemplate, deleteTemplate, getResults, saveResult } from './services/storageService';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [results, setResults] = useState<SessionResult[]>([]);
  
  // Active state for editing/running
  const [activeTemplate, setActiveTemplate] = useState<SessionTemplate | null>(null);

  useEffect(() => {
    setTemplates(getTemplates());
    setResults(getResults());
  }, [view]); // Refresh when view changes

  const handleCreate = () => {
    setActiveTemplate(null);
    setView('BUILDER');
  };

  const handleEdit = (t: SessionTemplate) => {
    setActiveTemplate(t);
    setView('BUILDER');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplate(id);
      setTemplates(getTemplates());
    }
  };

  const handleRun = (t: SessionTemplate) => {
    setActiveTemplate(t);
    setView('RUNNER');
  };

  const handleSaveTemplate = (t: SessionTemplate) => {
    saveTemplate(t);
    setTemplates(getTemplates());
    setView('DASHBOARD');
  };
  
  const handlePreview = (t: SessionTemplate) => {
    setActiveTemplate(t);
    setView('PREVIEW');
  };

  const handleSessionComplete = (r: SessionResult) => {
    saveResult(r);
    setResults(getResults());
  };
  
  const handleAddGenerated = (t: SessionTemplate) => {
      saveTemplate(t);
      setTemplates(getTemplates());
  };

  return (
    <div className="min-h-screen bg-accent text-slate-900 font-sans">
      {view === 'DASHBOARD' && (
        <Dashboard 
          templates={templates} 
          results={results}
          onCreate={handleCreate}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRun={handleRun}
          onAddGenerated={handleAddGenerated}
          onViewResults={() => setView('RESULTS')}
          onEnterAcademy={() => setView('TRAINING')}
        />
      )}

      {view === 'BUILDER' && (
        <SessionBuilder 
          initialTemplate={activeTemplate}
          onSave={handleSaveTemplate}
          onCancel={() => setView('DASHBOARD')}
          onPreview={handlePreview}
        />
      )}

      {view === 'RUNNER' && activeTemplate && (
        <SessionRunner 
          template={activeTemplate}
          onComplete={handleSessionComplete}
          onExit={() => setView('DASHBOARD')}
          mode="live"
        />
      )}
      
      {view === 'PREVIEW' && activeTemplate && (
        <SessionRunner 
          template={activeTemplate}
          onComplete={() => {}}
          onExit={() => setView('BUILDER')}
          mode="preview"
        />
      )}

      {view === 'RESULTS' && (
          <ResultsView 
            results={results} 
            onBack={() => setView('DASHBOARD')} 
          />
      )}

      {view === 'TRAINING' && (
          <TrainingEngine 
            onBack={() => setView('DASHBOARD')}
          />
      )}
    </div>
  );
};

export default App;