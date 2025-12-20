import React, { useState } from 'react';
import { SessionTemplate, SessionResult } from '../types';
import { Plus, Play, Edit, Trash2, FileText, Download, Sparkles, Loader2, BarChart2, Share } from 'lucide-react';
import { generateSessionTemplate } from '../services/geminiService';

interface Props {
  templates: SessionTemplate[];
  results: SessionResult[];
  onCreate: () => void;
  onEdit: (t: SessionTemplate) => void;
  onDelete: (id: string) => void;
  onRun: (t: SessionTemplate) => void;
  onAddGenerated: (t: SessionTemplate) => void;
  onViewResults: () => void;
}

const Dashboard: React.FC<Props> = ({ templates, results, onCreate, onEdit, onDelete, onRun, onAddGenerated, onViewResults }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [genTopic, setGenTopic] = useState('');
  const [showGenModal, setShowGenModal] = useState(false);

  const handleGenerate = async () => {
    if (!genTopic) return;
    setIsGenerating(true);
    try {
      const template = await generateSessionTemplate(genTopic);
      onAddGenerated(template);
      setShowGenModal(false);
      setGenTopic('');
    } catch (e) {
      console.error(e);
      alert("Failed to generate session. Please check API Key or try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportTemplate = (t: SessionTemplate) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(t, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${t.title.replace(/\s+/g, '_')}_v${t.version}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Therapist Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your CBT session templates and patient activities.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onViewResults}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <BarChart2 size={18} />
            Session History
          </button>
          <button 
            onClick={() => setShowGenModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Sparkles size={18} />
            AI Generator
          </button>
          <button 
            onClick={onCreate}
            className="flex items-center gap-2 bg-primary hover:bg-teal-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            Create New
          </button>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
          <FileText size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No Templates Yet</h3>
          <p className="text-slate-500 mb-6">Create a new session template or use AI to generate one.</p>
          <button onClick={onCreate} className="text-primary font-semibold hover:underline">Create Manual Template</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(t => (
            <div key={t.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col group">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-2">
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">v{t.version}</span>
                   <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => handleExportTemplate(t)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Export JSON"><Share size={14} /></button>
                     <button onClick={() => onEdit(t)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Edit"><Edit size={14} /></button>
                     <button onClick={() => onDelete(t.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Delete"><Trash2 size={14} /></button>
                   </div>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2 truncate">{t.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-3">{t.description || 'No description.'}</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                   <span>{t.questions.length} Questions</span>
                   <span>•</span>
                   <span>Updated {new Date(t.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-xl flex gap-3">
                 <button onClick={() => onRun(t)} className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-primary hover:text-primary text-slate-700 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                   <Play size={16} /> Start Session
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Modal */}
      {showGenModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-6 text-indigo-600">
               <Sparkles className="animate-pulse" />
               <h2 className="text-xl font-bold text-slate-900">AI Session Generator</h2>
            </div>
            
            <p className="text-slate-500 mb-4 text-sm">
              Describe the clinical focus (e.g., "Social Anxiety Exposure", "Insomnia Intake") and Gemini will construct a structured CBT session for you.
            </p>

            <textarea 
               value={genTopic}
               onChange={(e) => setGenTopic(e.target.value)}
               placeholder="e.g. Cognitive restructuring for impostor syndrome..."
               className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-6 h-32"
               autoFocus
            />

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowGenModal(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancel</button>
              <button 
                onClick={handleGenerate} 
                disabled={isGenerating || !genTopic}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isGenerating && <Loader2 size={16} className="animate-spin" />}
                {isGenerating ? 'Generating...' : 'Generate Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;