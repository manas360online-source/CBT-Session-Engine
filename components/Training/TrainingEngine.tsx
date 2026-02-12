import React, { useState, useEffect, useRef, useCallback } from 'react';
// Fix: Added IDs to the import list
import { TRAINING_LANGUAGES, LanguageConfig, Scene, IDs } from './trainingData';
import { ArrowLeft, Play, SkipBack, SkipForward, Lightbulb, User, GraduationCap, MapPin, CheckCircle2 } from 'lucide-react';

// ─── AVATAR SVGs ────────────────────────────────────────────
const TherapistAvatar = ({ speaking, expression = "neutral" }: { speaking: boolean; expression?: string }) => {
  const mouthPath = speaking ? "M 38 58 Q 42 63 46 58" : expression === "warm" ? "M 37 57 Q 42 60 47 57" : "M 38 57 L 46 57";
  const eyeL = expression === "concerned" ? "M 30 48 Q 32 46 34 48" : "M 30 49 L 34 49";
  const eyeR = expression === "concerned" ? "M 48 48 Q 50 46 52 48" : "M 48 49 L 52 49";
  return (
    <svg viewBox="0 0 84 120" style={{ width: "100%", height: "100%" }}>
      <ellipse cx="42" cy="30" rx="24" ry="22" fill="#3d2b1f" />
      <rect x="18" y="28" width="48" height="16" rx="8" fill="#3d2b1f" />
      <rect x="36" y="68" width="12" height="14" fill="#d4a574" />
      <ellipse cx="42" cy="100" rx="32" ry="22" fill="#f0f4f8" />
      <rect x="10" y="82" width="64" height="38" rx="10" fill="#f0f4f8" />
      <rect x="36" y="80" width="12" height="8" fill="#e2e8f0" />
      <ellipse cx="42" cy="46" rx="22" ry="24" fill="#d4a574" />
      <path d={eyeL} stroke="#2c2520" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d={eyeR} stroke="#2c2520" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M 28 42 Q 32 40 36 42" stroke="#3d2b1f" strokeWidth="1.8" fill="none" />
      <path d="M 46 42 Q 50 40 54 42" stroke="#3d2b1f" strokeWidth="1.8" fill="none" />
      <path d="M 41 50 L 40 55 L 43 55" stroke="#b8896a" strokeWidth="1.2" fill="none" />
      <path d={mouthPath} stroke="#c0776a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="20" cy="50" r="2.5" fill="#d4a060" />
      <circle cx="64" cy="50" r="2.5" fill="#d4a060" />
    </svg>
  );
};

const PatientAvatar = ({ speaking }: { speaking: boolean }) => {
  const mouthPath = speaking ? "M 36 56 Q 40 61 44 56" : "M 37 56 L 43 56";
  return (
    <svg viewBox="0 0 84 120" style={{ width: "100%", height: "100%" }}>
      <ellipse cx="42" cy="28" rx="23" ry="20" fill="#1a1a2e" />
      <rect x="36" y="66" width="12" height="14" fill="#c8956a" />
      <ellipse cx="42" cy="98" rx="30" ry="22" fill="#4a6fa5" />
      <rect x="12" y="80" width="60" height="38" rx="10" fill="#4a6fa5" />
      <path d="M 36 80 L 42 88 L 48 80" fill="#3d5a8a" />
      <ellipse cx="42" cy="44" rx="21" ry="23" fill="#c8956a" />
      <path d={speaking ? "M 30 47 Q 32 45 34 47" : "M 30 48 L 34 48"} stroke="#1a1a2e" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d={speaking ? "M 48 47 Q 50 45 52 47" : "M 48 48 L 52 48"} stroke="#1a1a2e" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M 28 42 Q 32 40 36 43" stroke="#1a1a2e" strokeWidth="1.8" fill="none" />
      <path d="M 46 43 Q 50 40 54 42" stroke="#1a1a2e" strokeWidth="1.8" fill="none" />
      <path d="M 41 50 L 40 54 L 43 54" stroke="#a87858" strokeWidth="1.2" fill="none" />
      <path d={mouthPath} stroke="#b06050" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 21 32 Q 20 22 28 20 Q 36 18 42 22 Q 48 18 56 20 Q 64 22 63 32" fill="#1a1a2e" />
    </svg>
  );
};

interface Props {
  onBack: () => void;
}

const TrainingEngine: React.FC<Props> = ({ onBack }) => {
  const [view, setView] = useState<'LANDING' | 'PLAYBACK' | 'COMPLETE'>('LANDING');
  const [langCode, setLangCode] = useState('en');
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [messageIdx, setMessageIdx] = useState(-1);
  const [completedSceneIds, setCompletedSceneIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('academy_completed_scenes');
    return saved ? JSON.parse(saved) : [];
  });
  // Using any to store the timer reference to avoid NodeJS namespace issues in browser environments
  const timerRef = useRef<any>(null);

  const lang = TRAINING_LANGUAGES.find(l => l.code === langCode) || TRAINING_LANGUAGES[0];
  const scene = lang.scenes[currentSceneIdx];
  const visibleMessages = scene.conversation.slice(0, messageIdx + 1);
  const lastMsg = visibleMessages[visibleMessages.length - 1];
  const therapistSpeaking = lastMsg?.speaker === "therapist" && isPlaying;
  const patientSpeaking = lastMsg?.speaker === "patient" && isPlaying;
  const isLastScene = currentSceneIdx === lang.scenes.length - 1;
  const isLastMsg = messageIdx === scene.conversation.length - 1;

  useEffect(() => {
    localStorage.setItem('academy_completed_scenes', JSON.stringify(completedSceneIds));
  }, [completedSceneIds]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  const playScene = useCallback(() => {
    setIsPlaying(true);
    setMessageIdx(-1);
    setShowTip(false);
    let i = 0;
    const msgs = scene.conversation;
    const scheduleNext = () => {
      const delay = i === 0 ? 800 : msgs[i].delay - msgs[i - 1].delay;
      timerRef.current = setTimeout(() => {
        setMessageIdx(i);
        if (i < msgs.length - 1) { 
          i++; 
          scheduleNext(); 
        } else { 
          setIsPlaying(false); 
          setCompletedSceneIds(prev => Array.from(new Set([...prev, scene.id]))); 
        }
      }, Math.max(delay, 1500));
    };
    scheduleNext();
  }, [scene]);

  useEffect(() => {
    clearTimer();
    if (isPlaying) playScene();
    return clearTimer;
  }, [currentSceneIdx]);

  useEffect(() => {
    if (view === 'PLAYBACK' && !isPlaying) playScene();
  }, [view]);

  const startTraining = (code: string) => {
    setLangCode(code);
    setCurrentSceneIdx(0);
    setMessageIdx(-1);
    setIsPlaying(false);
    setView('PLAYBACK');
  };

  const goToScene = (idx: number) => {
    clearTimer();
    setIsPlaying(false);
    setCurrentSceneIdx(idx);
    setMessageIdx(-1);
    setShowTip(false);
    setTimeout(() => playScene(), 300);
  };

  const isModuleComplete = (l: LanguageConfig) => l.scenes.every(s => completedSceneIds.includes(s.id));
  const calculateOverallProgress = () => TRAINING_LANGUAGES.filter(isModuleComplete).length;

  if (view === 'LANDING') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20 overflow-x-hidden">
        {/* Professional Header - Indigo/Purple Gradient */}
        <div className="bg-gradient-to-br from-[#667eea] to-[#764ba2] px-6 py-20 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-[-50px] right-[-50px] w-64 h-64 rounded-full bg-white/10 blur-[80px]" />
          <div className="absolute bottom-[-30px] left-[-30px] w-48 h-48 rounded-full bg-white/5 blur-[60px]" />
          
          <div className="relative z-10 max-w-4xl mx-auto">
            <p className="text-white/80 text-xs font-bold tracking-[4px] uppercase mb-4 drop-shadow-sm">MANAS360 Therapist Academy</p>
            <h1 className="text-5xl font-extrabold text-white mb-6 drop-shadow-lg flex items-center justify-center gap-4">
               🎬 Model CBT Session Training
            </h1>
            <p className="text-lg text-white/90 max-w-2xl mx-auto leading-relaxed mb-10 opacity-90">
              Watch professional CBT sessions demonstrating language, etiquette, 
              diplomatic handling, and the powerful 5Whys framework
            </p>

            <div className="flex flex-wrap justify-center gap-10 mt-12 border-t border-white/10 pt-10">
              {[
                { label: 'Languages', value: '5' },
                { label: 'Animated Scenes', value: '25' },
                { label: 'Minutes Total', value: '~50' },
                { label: 'Framework', value: '5Whys' }
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                  <div className="text-[10px] text-white/60 uppercase tracking-widest font-black">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Segmented Progress Hub */}
        <div className="max-w-6xl mx-auto -mt-8 px-6 relative z-20">
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between border border-slate-100 gap-8">
            <div className="flex items-center gap-5">
              <div className="bg-blue-50 p-4 rounded-2xl text-primary shadow-inner">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-1">Academy Progress</p>
                <p className="text-xl font-black text-slate-800">
                  <span className="text-primary text-3xl font-black">{calculateOverallProgress()}</span> <span className="text-slate-300 mx-1">/</span> 5 <span className="text-slate-400 font-bold ml-2">Modules Certified</span>
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 flex-1 max-w-md">
              {TRAINING_LANGUAGES.map((l) => (
                <div 
                  key={l.code}
                  className={`flex-1 h-2.5 rounded-full transition-all duration-700 shadow-sm ${
                    isModuleComplete(l) ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2]' : 'bg-slate-100'
                  }`}
                  title={l.label}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Selection Grid - Updated to lg:grid-cols-5 to show all in one row on desktop */}
        <div className="max-w-[90rem] mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Select Your Language</h2>
            <p className="text-slate-500 font-medium">Choose the language you'll be conducting therapy sessions in</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {TRAINING_LANGUAGES.map(l => (
              <div 
                key={l.code} 
                onClick={() => startTraining(l.code)}
                className={`bg-white border-[3px] ${l.themeColor} rounded-[2rem] p-6 cursor-pointer transition-all duration-500 relative overflow-hidden group hover:-translate-y-4 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] hover:border-transparent ${l.hoverGradient} shadow-sm flex flex-col`}
              >
                {isModuleComplete(l) && (
                  <div className="absolute top-4 right-4 bg-[#28a745] text-white text-[8px] font-black uppercase px-2 py-1 rounded-full shadow-lg z-10 flex items-center gap-1">
                    <CheckCircle2 size={10} /> ✓
                  </div>
                )}
                
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-4xl drop-shadow-md group-hover:scale-110 transition-transform duration-500 shrink-0">
                    {l.code === 'en' ? '🇬🇧' : '🇮🇳'}
                  </span>
                  <div className="overflow-hidden">
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-white transition-colors duration-300 truncate">
                      {l.nativeLabel}
                    </h3>
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest group-hover:text-white/70 transition-colors duration-300 truncate">
                      {l.label}
                    </p>
                  </div>
                </div>

                <div className="bg-[#f5f5f5] px-3 py-1.5 rounded-full inline-flex items-center gap-2 mb-6 group-hover:bg-white/20 transition-colors duration-300 self-start">
                  <MapPin size={12} className="text-slate-400 group-hover:text-white" />
                  <span className="text-[9px] font-black text-slate-500 group-hover:text-white uppercase tracking-wider truncate max-w-[120px]">{l.region}</span>
                </div>

                <p className="text-slate-600 font-medium text-xs leading-relaxed mb-6 group-hover:text-white transition-colors duration-300 line-clamp-3">
                  {l.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-6 mt-auto">
                  {l.stats.split(' • ').slice(0, 2).map((stat, i) => (
                    <span key={i} className="px-2 py-1 bg-[#f5f5f5] rounded-lg text-[8px] font-black text-slate-500 group-hover:bg-white/10 group-hover:text-white transition-colors uppercase tracking-widest">
                      {stat}
                    </span>
                  ))}
                </div>

                <button 
                  className={`w-full py-3 rounded-xl font-black text-[10px] flex items-center justify-center gap-2 transition-all shadow-xl group-hover:shadow-white/20 uppercase tracking-widest ${l.btnColor} text-white group-hover:bg-white group-hover:text-slate-900`}
                >
                  <Play size={12} fill="currentColor" /> Start
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Curriculum Board */}
        <div className="bg-white border-t border-slate-100 px-6 py-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
               <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">What You'll Learn</h2>
               <p className="text-slate-400 font-medium">Core therapeutic competencies demonstrated in these modules</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {[
                  { icon: '🎯', title: 'Opening Impressions', desc: 'How to create trust in the first 60 seconds of a session.' },
                  { icon: '🤝', title: 'Building Rapport', desc: 'Active listening and empathy techniques for patient connection.' },
                  { icon: '🧠', title: '5Whys Framework', desc: 'Identifying root causes with professional compassion.' },
                  { icon: '⚡', title: 'Handling Emotions', desc: 'Diplomatic responses to sudden emotional spikes and crises.' },
                  { icon: '🚪', title: 'Exit Impressions', desc: 'Closing with empowerment, clear homework, and structured hope.' },
                  { icon: '💬', title: 'Professional Language', desc: "Essential do's and don'ts of therapeutic verbal communication." }
              ].map((item, i) => (
                  <div key={i} className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 hover:border-primary/20 hover:shadow-xl transition-all duration-500 group">
                      <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">{item.icon}</div>
                      <h4 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{item.title}</h4>
                      <p className="text-slate-500 text-sm leading-relaxed font-medium">{item.desc}</p>
                  </div>
              ))}
            </div>
          </div>
        </div>

        {/* Global Footer */}
        <div className="bg-[#333] py-10 px-6 text-center">
           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
              MANAS360 Therapist Training • Module 2: CBT + 5Whys Fundamentals • 
              <span className="text-blue-500 ml-2">Complete all 5 languages for certification</span>
           </p>
           <button onClick={onBack} className="mt-8 flex items-center gap-2 mx-auto text-white/30 hover:text-white transition-all font-black text-[10px] uppercase tracking-[3px]">
              <ArrowLeft size={14} /> Back to Dashboard
           </button>
        </div>
      </div>
    );
  }

  if (view === 'COMPLETE') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1612] to-[#2c2420] text-[#f5ede6] flex flex-col items-center justify-center p-10 text-center" style={{ fontFamily: lang.fontFamily }}>
        <div className="text-7xl mb-8 animate-bounce">✅</div>
        <h1 className="text-4xl font-bold mb-4">{lang.ui.sessionComplete}</h1>
        <p className="text-[#a89e93] text-lg max-w-lg mx-auto mb-10 leading-relaxed">
          You've watched the full model CBT session. Review the key takeaways below before continuing.
        </p>
        <div className="bg-white/5 border border-white/10 rounded-3xl p-10 max-w-xl w-full text-left backdrop-blur-sm">
          <p className="text-xs font-black uppercase tracking-[3px] text-[#8a7e73] mb-6">{lang.ui.takeaways}</p>
          <div className="space-y-4">
             {[
               "Open with warmth, name, and safety — not the problem.",
               "Reflect feelings before exploring thoughts.",
               "Use evidence-based questioning, not correction.",
               "5 Whys uncovers root beliefs, not surface behaviors.",
               "Close with summary, small homework, and genuine warmth."
             ].map((t, i) => (
                <div key={i} className="flex gap-4 items-start">
                   <div className="w-2 h-2 rounded-full bg-[#7c6b5d] mt-2 shrink-0" />
                   <p className="text-[#d4c8be] leading-relaxed">{t}</p>
                </div>
             ))}
          </div>
        </div>
        <div className="flex gap-4 mt-12">
           <button onClick={() => goToScene(0)} className="px-8 py-3 bg-white/10 border border-white/15 rounded-xl text-[#d4c8be] font-bold hover:bg-white/20 transition-all">
              {lang.ui.replay}
           </button>
           <button onClick={() => setView('LANDING')} className="px-10 py-3 bg-gradient-to-r from-[#7c6b5d] to-[#6b5a4a] rounded-xl text-white font-bold shadow-2xl hover:scale-105 transition-all">
              {lang.ui.backToMenu}
           </button>
        </div>
      </div>
    );
  }

  // --- PLAYBACK VIEW ---
  return (
    <div className="min-h-screen bg-[#1a1612] text-[#e8e4dc] flex flex-col" style={{ fontFamily: lang.fontFamily }}>
      {/* Playback Header */}
      <div className="bg-[#1e1a18] border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
        <button onClick={() => { clearTimer(); setIsPlaying(false); setView('LANDING'); }} className="flex items-center gap-2 text-[#7a7068] hover:text-white transition-colors font-bold text-xs uppercase tracking-widest">
           ← {lang.ui.back}
        </button>
        <div className="flex items-center gap-4">
          {lang.scenes.map((s, i) => (
            <div 
              key={s.id} 
              className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSceneIdx ? 'w-8 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : completedSceneIds.includes(s.id) ? 'w-3 bg-green-500/50' : 'w-2 bg-white/10'}`} 
            />
          ))}
        </div>
        <div className="text-[10px] font-black uppercase tracking-[2px] text-[#5a5048]">
           {currentSceneIdx + 1} {lang.ui.of} {lang.scenes.length}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden max-w-5xl mx-auto w-full px-6 py-10 gap-8">
        {/* Title Block */}
        <div className="text-center animate-in fade-in slide-in-from-top-4">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-4">
             <span className="text-xl">{scene.icon}</span>
             <span className="text-[10px] font-black text-[#8a7e73] uppercase tracking-[3px]">{scene.phase}</span>
          </div>
          <h2 className="text-4xl font-bold mb-2 tracking-tight text-white">{scene.title}</h2>
          <p className="text-[#7a7068] italic text-lg">{scene.subtitle}</p>
        </div>

        {/* Avatar Stage Area */}
        <div className="flex justify-center items-end gap-12 min-h-[160px] border-b border-white/5 pb-6">
           <div className="flex flex-col items-center gap-3 group">
              <div className={`w-24 h-32 transition-all duration-500 ${therapistSpeaking ? 'scale-110 -translate-y-2' : 'opacity-40 scale-95'}`}>
                 <TherapistAvatar speaking={therapistSpeaking} expression={scene.id === IDs.CLOSING ? 'warm' : scene.id === IDs.WHY ? 'concerned' : 'neutral'} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[2px] ${therapistSpeaking ? 'text-blue-400' : 'text-[#5a5048]'}`}>{lang.ui.therapistName}</span>
           </div>

           <div className="flex-1 flex items-center justify-center min-h-[100px]">
              {lastMsg ? (
                <div className={`p-6 rounded-[2rem] shadow-2xl animate-in zoom-in-95 fade-in duration-300 max-w-[340px] border relative ${lastMsg.speaker === 'therapist' ? 'bg-[#3d5a4c]/20 border-[#3d5a4c]/40 rounded-tl-none' : 'bg-[#4a6fa5]/20 border-[#4a6fa5]/40 rounded-tr-none'}`}>
                   <p className="text-white text-base leading-relaxed">{lastMsg.text}</p>
                   <div className={`absolute top-0 ${lastMsg.speaker === 'therapist' ? '-left-2' : '-right-2'} w-4 h-4 border-l border-t rotate-45 ${lastMsg.speaker === 'therapist' ? 'bg-[#1e2a22] border-[#3d5a4c]/40' : 'bg-[#222a36] border-[#4a6fa5]/40'}`} />
                </div>
              ) : (
                <div className="flex gap-2 items-center opacity-20">
                   <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                   <div className="w-2 h-2 rounded-full bg-white animate-pulse delay-75" />
                   <div className="w-2 h-2 rounded-full bg-white animate-pulse delay-150" />
                </div>
              )}
           </div>

           <div className="flex flex-col items-center gap-3 group">
              <div className={`w-24 h-32 transition-all duration-500 ${patientSpeaking ? 'scale-110 -translate-y-2' : 'opacity-40 scale-95'}`}>
                 <PatientAvatar speaking={patientSpeaking} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[2px] ${patientSpeaking ? 'text-blue-400' : 'text-[#5a5048]'}`}>{lang.ui.patientName}</span>
           </div>
        </div>

        {/* Scrollable Conversation Log */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-4 scroll-smooth scrollbar-hide">
           {visibleMessages.map((msg, i) => (
             <div key={i} className={`flex gap-5 animate-in fade-in slide-in-from-bottom-2 duration-500 ${msg.speaker === 'therapist' ? '' : 'flex-row-reverse'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 shadow-lg text-white ${msg.speaker === 'therapist' ? 'bg-[#7c6b5d]' : 'bg-[#4a6fa5]'}`}>
                   {msg.speaker === 'therapist' ? (lang.code === 'en' ? 'M' : 'मी') : (lang.code === 'en' ? 'R' : 'రా')}
                </div>
                <div className={`max-w-[80%] flex flex-col ${msg.speaker === 'therapist' ? '' : 'items-end'}`}>
                   <span className="text-[10px] font-black text-[#5a5048] mb-1.5 uppercase tracking-widest">{msg.name}</span>
                   <div className={`p-4 rounded-2xl text-sm leading-relaxed border ${msg.speaker === 'therapist' ? 'bg-white/5 border-white/10 text-white rounded-tl-none' : 'bg-blue-500/10 border-blue-500/20 text-white rounded-tr-none'}`}>
                      {msg.text}
                   </div>
                   {msg.highlight && (
                     <div className="mt-2 inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                        <Lightbulb size={12} className="text-yellow-400" />
                        <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">🏷 {msg.highlight}</span>
                     </div>
                   )}
                </div>
             </div>
           ))}
        </div>

        {/* Dynamic Tip Panel */}
        <div className="mt-auto">
          <button 
            onClick={() => setShowTip(!showTip)}
            className={`w-full p-6 rounded-3xl border transition-all flex items-start gap-5 text-left group ${showTip ? 'bg-[#7c6b5d]/10 border-[#7c6b5d]/30' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
          >
            <div className="bg-yellow-500/20 p-3 rounded-2xl text-yellow-400 group-hover:scale-110 transition-transform">
               <Lightbulb size={24} />
            </div>
            <div className="flex-1">
               <p className="text-[10px] font-black uppercase tracking-[3px] text-[#8a7e73] mb-1">{scene.tip.title}</p>
               <p className={`text-sm leading-relaxed transition-all ${showTip ? 'text-white' : 'text-[#a89e93] line-clamp-1'}`}>{scene.tip.content}</p>
            </div>
            <div className="pt-4 text-[#5a5048]">
               {showTip ? '▲ ' + lang.ui.hide : '▼ ' + lang.ui.show}
            </div>
          </button>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-6 py-4">
           <button 
             onClick={() => goToScene(currentSceneIdx - 1)} 
             disabled={currentSceneIdx === 0}
             className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all disabled:opacity-5"
           >
              <SkipBack size={20} />
           </button>

           <button 
             onClick={() => isPlaying ? (clearTimer(), setIsPlaying(false)) : playScene()}
             className={`px-16 py-4 rounded-[1.5rem] font-black text-xs tracking-[3px] uppercase transition-all shadow-2xl flex items-center gap-4 ${isPlaying ? 'bg-white/10 border border-white/15 text-white' : 'bg-blue-600 text-white shadow-blue-900/40 hover:scale-105 active:scale-95'}`}
           >
              {isPlaying ? <>{lang.ui.pause}</> : <><Play size={18} fill="currentColor" /> {messageIdx === -1 ? lang.ui.play : lang.ui.replay}</>}
           </button>

           <button 
             onClick={() => isLastScene && isLastMsg ? setView('COMPLETE') : goToScene(currentSceneIdx + 1)} 
             className={`p-4 rounded-2xl transition-all border ${isLastScene && isLastMsg ? 'bg-green-600 border-green-500 text-white animate-pulse' : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'}`}
           >
              {isLastScene && isLastMsg ? <CheckCircle2 size={20} /> : <SkipForward size={20} />}
           </button>
        </div>
      </div>
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
};

export default TrainingEngine;