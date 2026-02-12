
import React, { useState, useEffect } from 'react';
import { SessionTemplate, SessionResult, Question, QuestionType } from '../types';
import { ArrowLeft, ArrowRight, CheckCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Props {
  template: SessionTemplate;
  onComplete: (result: SessionResult) => void;
  onExit: () => void;
  mode?: 'preview' | 'live';
}

const SessionRunner: React.FC<Props> = ({ template, onComplete, onExit, mode = 'live' }) => {
  const [currentQIndex, setCurrentQIndex] = useState(0); 
  const [currentQId, setCurrentQId] = useState<string>(template.questions[0]?.id || '');
  const [history, setHistory] = useState<string[]>([]); // Stack of previous question IDs to handle 'Back'
  
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [completed, setCompleted] = useState(false);

  // Derived current question
  const currentQ = template.questions.find(q => q.id === currentQId);

  // Progress calculation
  const progress = Math.round(((history.length) / Math.max(template.questions.length, 1)) * 100);

  const handleAnswer = (val: any) => {
    setAnswers(prev => ({ ...prev, [currentQId]: val }));
  };

  const getNextQuestionId = (): string | null => {
    if (!currentQ) return null;

    // Check branching
    if (currentQ.type === QuestionType.MCQ && currentQ.branches) {
      const selectedValue = answers[currentQId];
      const selectedOption = currentQ.options?.find(o => o.value === selectedValue);
      
      if (selectedOption) {
        const branch = currentQ.branches.find(b => b.optionId === selectedOption.id);
        if (branch && template.questions.some(q => q.id === branch.targetQuestionId)) {
            return branch.targetQuestionId;
        }
      }
    }

    // Default: Linear progression
    const currentIndex = template.questions.findIndex(q => q.id === currentQId);
    if (currentIndex < template.questions.length - 1) {
      return template.questions[currentIndex + 1].id;
    }

    return null; // End of session
  };

  const handleNext = () => {
    if (!currentQ) return;
    
    // Validation
    if (currentQ.required && (answers[currentQId] === undefined || answers[currentQId] === '')) {
      alert("Please answer this question to proceed.");
      return;
    }

    const nextId = getNextQuestionId();
    setHistory(prev => [...prev, currentQId]);

    if (nextId) {
      setCurrentQId(nextId);
    } else {
      finishSession();
    }
  };

  const handleBack = () => {
    if (history.length === 0) return;
    const newHistory = [...history];
    const prevId = newHistory.pop();
    setHistory(newHistory);
    if (prevId) setCurrentQId(prevId);
  };

  const finishSession = () => {
    setCompleted(true);
    const result: SessionResult = {
      sessionId: Math.random().toString(36).substr(2, 9),
      templateId: template.id,
      templateTitle: template.title,
      completedAt: new Date().toISOString(),
      answers,
      pathTaken: [...history, currentQId]
    };
    if (mode === 'live') {
      onComplete(result);
    }
  };

  const handleExitWithConfirmation = () => {
    if (history.length > 0 && !completed) {
      if (confirm("Are you sure you want to exit? Your progress will not be saved.")) {
        onExit();
      }
    } else {
      onExit();
    }
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-accent p-8">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Session Complete</h2>
            <p className="text-slate-500 mt-2">Thank you for completing the session. Your responses have been recorded.</p>
          </div>
          <div className="flex flex-col gap-3">
             {mode === 'preview' && (
                <button onClick={() => { setCompleted(false); setHistory([]); setCurrentQId(template.questions[0]?.id || ''); setAnswers({}); }} className="w-full py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
                  Restart Preview
                </button>
             )}
             <button onClick={onExit} className="w-full py-2 bg-primary text-white rounded-lg hover:bg-blue-700 font-medium">
               {mode === 'preview' ? 'Return to Editor' : 'Return to Dashboard'}
             </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQ) return <div>Error: Question not found</div>;

  return (
    <div className="flex flex-col h-full bg-accent">
      {/* Session Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 text-blue-700 p-1.5 rounded-lg">
             <CheckCircle size={18} />
          </div>
          <h1 className="text-lg font-bold text-slate-800 truncate max-w-[200px] md:max-w-md">{template.title}</h1>
        </div>
        <button 
          onClick={handleExitWithConfirmation}
          className="flex items-center gap-2 text-slate-400 hover:text-red-500 font-medium transition-colors text-sm"
          title="Exit Session"
        >
          <X size={20} />
          <span className="hidden md:inline">Exit</span>
        </button>
      </header>

      {/* Progress Header */}
      <div className="h-1.5 bg-slate-200">
        <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm p-8 md:p-12 min-h-[400px] flex flex-col">
          <div className="flex-1">
             <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-primary tracking-wider uppercase">
                    Question {history.length + 1}
                </span>
                {mode === 'preview' && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold uppercase">Preview</span>
                )}
             </div>
             
             <h2 className="text-2xl md:text-3xl font-medium text-slate-800 mb-4 leading-tight">
               {currentQ.prompt}
             </h2>
             
             {currentQ.description && (
               <p className="text-slate-500 mb-8 text-lg">{currentQ.description}</p>
             )}

             <div className="mt-8 space-y-4">
                {currentQ.type === QuestionType.TEXT && (
                  <textarea 
                    className="w-full p-4 text-lg border-2 border-slate-200 rounded-xl focus:border-primary focus:ring-0 outline-none resize-none min-h-[150px]"
                    placeholder="Type your answer here..."
                    value={answers[currentQId] || ''}
                    onChange={(e) => handleAnswer(e.target.value)}
                    autoFocus
                  />
                )}

                {currentQ.type === QuestionType.MCQ && (
                  <div className="grid gap-3">
                    {currentQ.options?.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => handleAnswer(opt.value)}
                        className={`text-left p-4 rounded-xl border-2 transition-all text-lg font-medium flex items-center justify-between group ${answers[currentQId] === opt.value ? 'border-primary bg-blue-50 text-primary' : 'border-slate-100 hover:border-slate-300 text-slate-700 bg-slate-50'}`}
                      >
                        {opt.label}
                        {answers[currentQId] === opt.value && <CheckCircle size={20} />}
                      </button>
                    ))}
                  </div>
                )}

                {currentQ.type === QuestionType.CHECKBOX && (
                  <div className="grid gap-3">
                     {currentQ.options?.map(opt => {
                        const currArr = (answers[currentQId] as string[]) || [];
                        const isSelected = currArr.includes(opt.value);
                        return (
                          <button
                            key={opt.id}
                            onClick={() => {
                              const newArr = isSelected ? currArr.filter(x => x !== opt.value) : [...currArr, opt.value];
                              handleAnswer(newArr);
                            }}
                            className={`text-left p-4 rounded-xl border-2 transition-all text-lg font-medium flex items-center justify-between ${isSelected ? 'border-primary bg-blue-50 text-primary' : 'border-slate-100 hover:border-slate-300 text-slate-700 bg-slate-50'}`}
                          >
                             {opt.label}
                             <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-primary border-primary text-white' : 'border-slate-400 bg-white'}`}>
                               {isSelected && <CheckCircle size={14} />}
                             </div>
                          </button>
                        );
                     })}
                  </div>
                )}

                {currentQ.type === QuestionType.SLIDER && (
                  <div className="py-8 px-4">
                    <input 
                      type="range"
                      min={currentQ.min || 0}
                      max={currentQ.max || 10}
                      step={currentQ.step || 1}
                      value={answers[currentQId] || (currentQ.min || 0)}
                      onChange={(e) => handleAnswer(Number(e.target.value))}
                      className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between mt-4 text-slate-500 font-medium">
                      <span>{currentQ.minLabel || currentQ.min}</span>
                      <span className="text-2xl text-primary font-bold">{answers[currentQId] || (currentQ.min || 0)}</span>
                      <span>{currentQ.maxLabel || currentQ.max}</span>
                    </div>
                  </div>
                )}
             </div>
          </div>
          
          <div className="mt-12 flex items-center justify-between border-t border-slate-100 pt-6">
            <button 
              onClick={handleBack}
              disabled={history.length === 0}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:hover:text-slate-400 font-medium transition-colors"
            >
              <ChevronLeft size={20} /> Back
            </button>
            <button 
               onClick={handleNext}
               className="bg-primary hover:bg-blue-800 text-white px-8 py-3 rounded-xl font-semibold shadow-md shadow-blue-200 transition-all flex items-center gap-2"
            >
               {getNextQuestionId() === null ? 'Finish Session' : 'Next Question'} <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionRunner;
