
import React, { useState, useEffect } from 'react';
import { SessionTemplate, Question, QuestionType, Option } from '../types';
import { Plus, Trash2, Save, ArrowLeft, MoreVertical, GripVertical, AlertCircle, GitBranch, Eye } from 'lucide-react';

interface Props {
  initialTemplate?: SessionTemplate | null;
  onSave: (template: SessionTemplate) => void;
  onCancel: () => void;
  onPreview: (template: SessionTemplate) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const SessionBuilder: React.FC<Props> = ({ initialTemplate, onSave, onCancel, onPreview }) => {
  const [template, setTemplate] = useState<SessionTemplate>(
    initialTemplate || {
      id: generateId(),
      title: 'New Session',
      description: '',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: []
    }
  );

  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  const addQuestion = () => {
    const newQ: Question = {
      id: generateId(),
      type: QuestionType.TEXT,
      prompt: 'New Question',
      required: false
    };
    setTemplate(prev => ({ ...prev, questions: [...prev.questions, newQ] }));
    setActiveQuestionId(newQ.id);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setTemplate(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === id ? { ...q, ...updates } : q)
    }));
  };

  const deleteQuestion = (id: string) => {
    setTemplate(prev => ({
      ...prev,
      questions: prev.questions
        .filter(q => q.id !== id)
        .map(q => ({
          ...q,
          // Cleanup branches that point to the deleted question to prevent broken flows
          branches: q.branches?.filter(b => b.targetQuestionId !== id)
        }))
    }));
    if (activeQuestionId === id) setActiveQuestionId(null);
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === template.questions.length - 1) return;

    const newQuestions = [...template.questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
    
    setTemplate(prev => ({ ...prev, questions: newQuestions }));
  };

  const addOption = (qId: string) => {
    const q = template.questions.find(fq => fq.id === qId);
    if (!q) return;
    const newOpt: Option = { id: generateId(), label: 'New Option', value: 'value' };
    updateQuestion(qId, { options: [...(q.options || []), newOpt] });
  };

  const updateOption = (qId: string, optId: string, updates: Partial<Option>) => {
    const q = template.questions.find(fq => fq.id === qId);
    if (!q || !q.options) return;
    const newOptions = q.options.map(o => o.id === optId ? { ...o, ...updates } : o);
    updateQuestion(qId, { options: newOptions });
  };

  const removeOption = (qId: string, optId: string) => {
    const q = template.questions.find(fq => fq.id === qId);
    if (!q || !q.options) return;
    
    // Also remove any branch associated with this option
    const newBranches = q.branches?.filter(b => b.optionId !== optId) || [];
    
    updateQuestion(qId, { 
        options: q.options.filter(o => o.id !== optId),
        branches: newBranches
    });
  };

  const handleBranchChange = (qId: string, optionId: string, targetId: string) => {
      const q = template.questions.find(fq => fq.id === qId);
      if (!q) return;
      
      let newBranches = q.branches ? [...q.branches] : [];
      // Remove existing branch for this option if any
      newBranches = newBranches.filter(b => b.optionId !== optionId);
      
      if (targetId) {
        newBranches.push({ optionId, targetQuestionId: targetId });
      }
      
      updateQuestion(qId, { branches: newBranches });
  };

  const handleSave = () => {
    const isExisting = !!initialTemplate;
    const newVersion = isExisting ? template.version + 1 : 1;
    
    onSave({
      ...template,
      version: newVersion,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="flex flex-col h-full bg-accent">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Session Builder</h1>
            <p className="text-xs text-slate-500">v{template.version} • {template.questions.length} Questions</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={() => onPreview(template)}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Eye size={18} />
            Preview
          </button>
           <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Save size={18} />
            Save Template
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar / Config */}
        <div className="w-80 border-r border-slate-200 bg-white overflow-y-auto p-6 flex-shrink-0">
          <h2 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-4">Session Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input 
                type="text" 
                value={template.title}
                onChange={(e) => setTemplate({...template, title: e.target.value})}
                className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea 
                value={template.description}
                onChange={(e) => setTemplate({...template, description: e.target.value})}
                rows={4}
                className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
              />
            </div>
            
            <div className="pt-4 border-t border-slate-100">
               <div className="flex items-center gap-2 mb-2">
                 <AlertCircle size={16} className="text-amber-500" />
                 <span className="text-xs font-medium text-slate-600">Branching Logic</span>
               </div>
               <p className="text-xs text-slate-400">
                 Configure question flow by setting 'Go To' targets on Multiple Choice options within the question editor.
               </p>
            </div>
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 overflow-y-auto bg-accent p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {template.questions.map((q, idx) => (
              <div 
                key={q.id} 
                className={`bg-white rounded-xl shadow-sm border-2 transition-all ${activeQuestionId === q.id ? 'border-primary ring-4 ring-blue-50' : 'border-transparent hover:border-slate-200'}`}
                onClick={() => setActiveQuestionId(q.id)}
              >
                {/* Question Header */}
                <div className="flex items-center gap-4 p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                    <div className="flex flex-col gap-1">
                        <button onClick={(e) => { e.stopPropagation(); moveQuestion(idx, 'up'); }} disabled={idx === 0} className="text-slate-400 hover:text-primary disabled:opacity-30">▲</button>
                        <button onClick={(e) => { e.stopPropagation(); moveQuestion(idx, 'down'); }} disabled={idx === template.questions.length - 1} className="text-slate-400 hover:text-primary disabled:opacity-30">▼</button>
                    </div>
                    <span className="font-mono text-sm text-slate-400">Q{idx + 1}</span>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={q.prompt}
                        onChange={(e) => updateQuestion(q.id, { prompt: e.target.value })}
                        className="w-full bg-transparent font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
                        placeholder="Enter question prompt..."
                      />
                    </div>
                    <select 
                      value={q.type}
                      onChange={(e) => updateQuestion(q.id, { type: e.target.value as QuestionType })}
                      className="text-xs font-medium bg-white border border-slate-200 rounded-md py-1 px-2 text-slate-600"
                    >
                      {Object.values(QuestionType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteQuestion(q.id); }}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                </div>

                {/* Question Body (Config based on type) */}
                {activeQuestionId === q.id && (
                  <div className="p-6 space-y-4 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Helper Text (Optional)</label>
                      <input 
                        type="text"
                        value={q.description || ''}
                        onChange={(e) => updateQuestion(q.id, { description: e.target.value })}
                        className="w-full border-b border-slate-200 py-1 text-sm focus:border-primary focus:outline-none"
                        placeholder="Additional context for the patient..."
                      />
                    </div>

                    {/* Type Specific Configs */}
                    {(q.type === QuestionType.MCQ || q.type === QuestionType.CHECKBOX) && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="block text-xs font-medium text-slate-500 uppercase">Options {q.type === QuestionType.MCQ && "& Logic"}</label>
                        </div>
                        {q.options?.map((opt, oIdx) => (
                          <div key={opt.id} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                            <input 
                              value={opt.label}
                              onChange={(e) => updateOption(q.id, opt.id, { label: e.target.value, value: e.target.value })}
                              className="flex-1 border border-slate-200 rounded px-2 py-1 text-sm"
                              placeholder="Option Label"
                            />
                            {/* Branching UI for MCQ */}
                            {q.type === QuestionType.MCQ && (
                                <div className="flex items-center gap-1 bg-slate-50 rounded px-1">
                                    <GitBranch size={14} className="text-slate-400" />
                                    <select 
                                      className="text-xs border-transparent bg-transparent rounded py-1 px-1 text-slate-500 focus:bg-white focus:border-slate-200 outline-none w-[140px]"
                                      value={q.branches?.find(b => b.optionId === opt.id)?.targetQuestionId || ''}
                                      onChange={(e) => handleBranchChange(q.id, opt.id, e.target.value)}
                                      title="Select which question to jump to if this option is selected"
                                    >
                                        <option value="">Continue to next</option>
                                        {template.questions.map((tq, tIdx) => {
                                            if (tq.id === q.id) return null; // Can't jump to self
                                            return (
                                                <option key={tq.id} value={tq.id}>
                                                    Jump to Q{tIdx + 1}: {tq.prompt.substring(0, 15)}{tq.prompt.length > 15 ? '...' : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            )}
                            <button onClick={() => removeOption(q.id, opt.id)} className="text-slate-300 hover:text-red-500">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => addOption(q.id)} className="text-xs text-primary font-medium hover:underline flex items-center gap-1 mt-2">
                          <Plus size={14} /> Add Option
                        </button>
                      </div>
                    )}

                    {q.type === QuestionType.SLIDER && (
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                         <div>
                            <label className="text-xs text-slate-500">Min Value</label>
                            <input type="number" value={q.min || 1} onChange={(e) => updateQuestion(q.id, { min: parseInt(e.target.value)})} className="w-full border rounded p-1 text-sm" />
                         </div>
                         <div>
                            <label className="text-xs text-slate-500">Max Value</label>
                            <input type="number" value={q.max || 10} onChange={(e) => updateQuestion(q.id, { max: parseInt(e.target.value)})} className="w-full border rounded p-1 text-sm" />
                         </div>
                         <div>
                            <label className="text-xs text-slate-500">Min Label</label>
                            <input type="text" value={q.minLabel || ''} onChange={(e) => updateQuestion(q.id, { minLabel: e.target.value})} className="w-full border rounded p-1 text-sm" placeholder="e.g. Low" />
                         </div>
                         <div>
                            <label className="text-xs text-slate-500">Max Label</label>
                            <input type="text" value={q.maxLabel || ''} onChange={(e) => updateQuestion(q.id, { maxLabel: e.target.value})} className="w-full border rounded p-1 text-sm" placeholder="e.g. High" />
                         </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                       <input 
                         type="checkbox" 
                         id={`req-${q.id}`}
                         checked={q.required}
                         onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                         className="rounded text-primary focus:ring-primary"
                       />
                       <label htmlFor={`req-${q.id}`} className="text-sm text-slate-600">Required Question</label>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            <button 
              onClick={addQuestion}
              className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 font-medium"
            >
              <Plus size={20} />
              Add Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionBuilder;
