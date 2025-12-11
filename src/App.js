import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Zap, Brain, Settings, 
  ChevronLeft, Trophy, Check, X, Eye, 
  Loader2, Edit3, Lightbulb, Clock,
  Gamepad2, ClipboardList, TrendingUp, Play,
  Search as SearchIcon, CircleDashed, Languages, Download, Copy,
  User, ArrowRight, AlertTriangle, RotateCcw
} from 'lucide-react';

// ייבוא המילים מקובץ הדאטה
import { MASTER_WORDS } from './data'; 

// הגדרת הסטטוסים (לשימוש ויזואלי בלבד)
const VISUAL_STATUS = {
  UNSEEN: 'UNSEEN',
  LEARN: 'LEARN',
  WEAK: 'WEAK',
  KNOWN: 'KNOWN',
  DONE: 'DONE'
};

const DEFAULT_SETTINGS = {
  timerDuration: 5,
  panicThreshold: 1.0,
  showSettings: false
};

// --- HELPER FUNCTIONS ---

// אלגוריתם ערבוב מקצועי
const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

// תרגום ניקוד לסטטוס ויזואלי בעברית
const getHebrewLabel = (score) => {
  if (score === 0) return 'חדש';
  if (score <= 2) return 'למידה';
  if (score <= 4) return 'לחיזוק';
  if (score >= 10) return 'מומחה';
  return 'יודע';
};

// קבלת צבע לפי ניקוד
const getScoreColorClass = (score) => {
    if (score === 0) return 'gray';
    if (score <= 2) return 'indigo';
    if (score <= 4) return 'amber';
    if (score >= 10) return 'purple';
    return 'green';
};

// לוגיקת סבב ידני (עריכה)
const getNextManualScore = (currentScore) => {
    // Learn (0-2) -> Weak (3) -> Known (5) -> Learn (1)
    if (currentScore <= 2) return 3;
    if (currentScore <= 4) return 5;
    return 1;
};

// --- UI COMPONENTS ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled }) => {
  const base = "px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 select-none outline-none focus:outline-none ring-0 active:scale-95";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-200",
    outline: "bg-white border-2 border-gray-100 text-gray-700 hover:border-indigo-100 hover:text-indigo-600 shadow-sm",
    ghost: "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 p-2",
    warning: "bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200"
  };
  return (
    <button 
        disabled={disabled} 
        onClick={onClick} 
        className={`${base} ${variants[variant]} ${className} ${disabled ? 'opacity-50 grayscale' : ''}`}
        style={{ WebkitTapHighlightColor: 'transparent' }} 
    >
        {children}
    </button>
  );
};

const Header = ({ title, onBack, subtitle, extraLeft, onSettings }) => (
    <div className="bg-white px-4 py-4 shadow-sm border-b border-gray-100 sticky top-0 z-50 flex items-center justify-between" dir="rtl">
        <div className="flex items-center gap-3">
            {onBack && (
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
                    <ChevronLeft className="transform rotate-180" size={24}/>
                </button>
            )}
            <div>
                <h2 className="font-bold text-xl text-gray-800 leading-none">{title}</h2>
                {subtitle && <p className="text-xs text-gray-400 mt-1 font-medium">{subtitle}</p>}
            </div>
        </div>
        <div className="flex items-center gap-2 pl-1">
            {extraLeft}
            {onSettings && (
                <button onClick={onSettings} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                    <Settings size={20} />
                </button>
            )}
        </div>
    </div>
);

const SettingsModal = ({ settings, setSettings, onClose }) => {
    if (!settings.showSettings) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" dir="rtl" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Settings size={18}/> הגדרות משחק</h3>
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between mb-2">
                             <label className="text-sm font-medium text-gray-700">זמן למענה (שניות)</label>
                             <span className="font-bold text-indigo-600">{settings.timerDuration}</span>
                        </div>
                        <input 
                            type="range" min="3" max="15" 
                            value={settings.timerDuration} 
                            onChange={(e) => setSettings({...settings, timerDuration: Number(e.target.value)})}
                            className="w-full accent-indigo-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between mb-2">
                             <label className="text-sm font-medium text-gray-700">סף לחץ (שניות)</label>
                             <span className="font-bold text-red-500">{settings.panicThreshold}</span>
                        </div>
                        <input 
                            type="range" min="0.5" max="3" step="0.5"
                            value={settings.panicThreshold} 
                            onChange={(e) => setSettings({...settings, panicThreshold: Number(e.target.value)})}
                            className="w-full accent-red-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-xs text-gray-400 mt-1">מתחת לזמן זה, טעות תגרור ענישה כפולה.</p>
                    </div>
                </div>
                <Button onClick={onClose} className="w-full mt-6">שמור וסגור</Button>
            </div>
        </div>
    );
};

const getQuizFontSize = (text) => text.length > 8 ? '1.6rem' : '2.1rem'; 

// =================================================================================
// LOGIN VIEW
// =================================================================================
const LoginView = ({ onLogin }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim().length > 1) {
            onLogin(name.trim());
        }
    };

    return (
        <div className="h-[100dvh] bg-white flex flex-col items-center justify-center p-8 text-center" dir="rtl">
            <div className="mb-8 bg-indigo-50 p-6 rounded-full animate-bounce">
                <Brain size={64} className="text-indigo-600" />
            </div>
            
            <h1 className="text-4xl font-bold text-gray-800 mb-2">VocabMaster</h1>
            <p className="text-gray-500 mb-10 text-lg">המקום שלך לשלוט באוצר המילים</p>

            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
                <div className="relative">
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="איך לקרוא לך?" 
                        className="w-full bg-gray-50 border-2 border-gray-100 text-gray-800 text-lg rounded-2xl py-4 px-12 outline-none focus:border-indigo-500 focus:bg-white transition-all text-right"
                        autoFocus
                    />
                    <User className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-400" size={20}/>
                </div>

                <Button 
                    onClick={handleSubmit} 
                    disabled={name.trim().length < 2}
                    className="w-full py-4 text-xl shadow-xl shadow-indigo-100"
                >
                    התחל ללמוד <ArrowRight size={20} className="transform rotate-180"/>
                </Button>
            </form>
            
            <p className="mt-12 text-xs text-gray-400 font-medium">
                ✨ שכוייח לעויזר, אהרן, וג'מיני
            </p>
        </div>
    );
};

// =================================================================================
// GAME 1: SWIPE GAME
// =================================================================================
const SwipeGame = ({ words, updateWord, setView, settings, setSettings }) => {
  const [queue, setQueue] = useState([]);
  const [sessionResults, setSessionResults] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [current, setCurrent] = useState(0);
  
  const [dragStart, setDragStart] = useState(null);
  const [offset, setOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPeeked, setIsPeeked] = useState(false); 
  const [feedback, setFeedback] = useState(null); 

  useEffect(() => {
    const totalWords = words.length;
    const touchedWords = words.filter(w => w.score > 0).length;
    const progressPercent = Math.round((touchedWords / totalWords) * 100);
    const unseen = words.filter(w => w.score === 0);
    const shouldMix = progressPercent > 80;

    let pool = [];
    if (unseen.length > 0 && !shouldMix) {
       pool = shuffleArray(unseen).slice(0, 20);
    } else {
       const learn = words.filter(w => w.score >= 1 && w.score <= 2);
       const weak = words.filter(w => w.score >= 3 && w.score <= 4);
       const known = words.filter(w => w.score >= 5).sort((a,b) => a.score - b.score);

       pool = [...shuffleArray(weak).slice(0, 8), ...shuffleArray(learn).slice(0, 8)];
       const remaining = 20 - pool.length;
       if (remaining > 0 && known.length > 0) pool = [...pool, ...known.slice(0, remaining)];
       if (pool.length < 20 && unseen.length > 0) pool = [...pool, ...shuffleArray(unseen).slice(0, 20 - pool.length)];
    }
    
    setQueue(shuffleArray(pool));
  }, []);

  const processSwipe = (direction) => {
      setIsAnimating(true);
      const word = queue[current];
      let newScore = word.score;

      if (direction === 'RIGHT') { 
          if (isPeeked) newScore = 3;
          else newScore = word.score < 5 ? 5 : word.score + 1;
      } else { 
          newScore = 1; 
      }
      
      setOffset(direction === 'RIGHT' ? 800 : -800);
      updateWord(word.id, { score: newScore });
      setSessionResults(prev => [...prev, { ...word, score: newScore }]);
      
      setTimeout(() => {
          setFeedback({ ...word, score: newScore });
          setOffset(0); 
          setIsPeeked(false);
          setIsAnimating(false);
      }, 200);
      
      setTimeout(() => {
          setFeedback(null);
          if (current < queue.length - 1) setCurrent(c => c + 1);
          else setShowSummary(true);
      }, 900); 
  };

  const handleTouchStart = (e) => { if(!isAnimating && !feedback) setDragStart(e.touches[0].clientX); };
  const handleTouchMove = (e) => { if(dragStart && !isAnimating && !feedback) setOffset(e.touches[0].clientX - dragStart); };
  const handleTouchEnd = () => {
    if (!dragStart || isAnimating || feedback) return;
    if (offset > 100) processSwipe('RIGHT');
    else if (offset < -100) processSwipe('LEFT');
    else setOffset(0); 
    setDragStart(null);
  };

  const toggleSpelling = (id) => {
      const currentFlag = words.find(w => w.id === id)?.flag_spelling;
      updateWord(id, { flag_spelling: !currentFlag });
  };

  // פונקציית עריכה בסיכום (הוחזרה!)
  const toggleStatusManual = (idx) => {
      const item = sessionResults[idx];
      const nextScore = getNextManualScore(item.score);
      const newResults = [...sessionResults];
      newResults[idx] = { ...item, score: nextScore };
      setSessionResults(newResults);
      updateWord(item.id, { score: nextScore });
  };

  if (showSummary) {
      return (
          <div className="h-[100dvh] bg-gray-50 flex flex-col text-right" dir="rtl">
              <Header title="סיכום סשן" onBack={() => setView('GAMES_MENU')} subtitle="תוצאות המיון" />
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {sessionResults.map((item, idx) => {
                      const isSpelling = words.find(w => w.id === item.id)?.flag_spelling;
                      const color = getScoreColorClass(item.score);
                      const statusLabel = getHebrewLabel(item.score);
                      return (
                        <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                            <div className="flex-1 ml-4 overflow-hidden">
                                <div className="font-bold text-gray-800 truncate">{item.english}</div>
                                <div className="text-sm text-gray-500">{item.hebrew}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => toggleSpelling(item.id)} className={`p-2 rounded-lg border ${isSpelling ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 'bg-gray-50 text-gray-300 border-gray-100'}`}>
                                    <Languages size={18}/>
                                </button>
                                <button onClick={() => toggleStatusManual(idx)} className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border transition-colors shrink-0 bg-${color}-50 text-${color}-700 border-${color}-200`}>
                                    {statusLabel} <Edit3 size={14} className="opacity-50"/>
                                </button>
                            </div>
                        </div>
                      );
                  })}
              </div>
              <div className="p-4 bg-white border-t border-gray-100"><Button onClick={() => setView('GAMES_MENU')} className="w-full py-4 text-lg">סיום וחזרה</Button></div>
          </div>
      );
  }

  if (queue.length === 0) return <div className="h-[100dvh] flex items-center justify-center bg-gray-50 text-indigo-600"><Loader2 className="animate-spin"/></div>;

  const word = queue[current];
  const dynamicFontSize = `${Math.min(3.5, 18 / word.english.length)}rem`;
  
  let cardStyle = "bg-white border-white";
  let overlayColor = "";
  if (offset > 50) { cardStyle = "bg-green-50 border-green-100"; overlayColor = "bg-green-500/10"; }
  else if (offset < -50) { cardStyle = "bg-red-50 border-red-100"; overlayColor = "bg-red-500/10"; }
  else if (isPeeked) { cardStyle = "bg-amber-50 border-amber-100"; }

  return (
    <div className="h-[100dvh] flex flex-col bg-gray-50" dir="rtl">
       <Header 
           title="Swipe" 
           onBack={() => setView('GAMES_MENU')} 
           subtitle={`${current + 1} מתוך ${queue.length}`} 
           onSettings={() => setSettings({...settings, showSettings: true})}
       />
       <SettingsModal settings={settings} setSettings={setSettings} onClose={() => setSettings({...settings, showSettings: false})} />

      <div className="flex-1 relative flex items-center justify-center perspective-1000 p-6 overflow-hidden">
          {!feedback && (
            <div 
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={() => { if (Math.abs(offset) <= 5 && !isAnimating && !feedback) setIsPeeked(true); }}
                style={{ transform: `translateX(${offset}px) rotate(${offset / 25}deg)`, transition: isAnimating ? 'transform 0.4s ease-out' : 'background-color 0.2s', cursor: 'grab' }}
                className={`w-full h-full max-h-[500px] rounded-[2rem] shadow-xl flex flex-col items-center justify-center p-8 relative border-4 select-none z-20 ${cardStyle}`}
            >
                {overlayColor && <div className={`absolute inset-0 rounded-[1.8rem] pointer-events-none transition-colors ${overlayColor}`}></div>}
                <div className="flex-1 flex flex-col items-center justify-center w-full text-center overflow-hidden z-10">
                    <h2 dir="ltr" style={{ fontSize: dynamicFontSize }} className="font-bold text-gray-800 leading-tight text-center w-full whitespace-nowrap overflow-hidden">
                        {word.english}
                    </h2>
                    <p className="text-gray-400 text-xl mt-4 bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">{word.partOfSpeech}</p>
                    {isPeeked && (
                        <div className="mt-8 animate-in fade-in zoom-in-95 duration-200 w-full">
                            <div className="h-px w-16 bg-gray-200 mx-auto mb-8"></div>
                            <h3 className="text-3xl font-bold text-indigo-600 mb-4">{word.hebrew}</h3>
                            <p className="text-amber-600 text-xs font-bold bg-amber-50 border border-amber-100 px-3 py-1 rounded-full inline-block">סומן לחיזוק</p>
                        </div>
                    )}
                </div>
                {!isPeeked && <p className="absolute bottom-8 text-gray-300 text-sm animate-pulse">לחץ להצצה בתרגום</p>}
            </div>
          )}
          {feedback && (
             <div className="absolute inset-0 flex flex-col items-center justify-center z-30 animate-in fade-in zoom-in-95 duration-200 bg-white/95 backdrop-blur-sm">
                 <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-sm ${getScoreColorClass(feedback.score) === 'green' ? 'bg-green-100 text-green-600' : getScoreColorClass(feedback.score) === 'amber' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                     {feedback.score >= 5 && <Check size={48}/>}
                     {feedback.score >= 3 && feedback.score < 5 && <Eye size={48}/>}
                     {feedback.score <= 2 && <X size={48}/>}
                 </div>
                 <h2 className="text-4xl font-bold text-gray-800 mb-2 px-2 text-center">{word.hebrew}</h2>
                 <h3 className="text-2xl text-gray-400 mb-8 font-medium px-4 text-center">{word.english}</h3>
             </div>
          )}
      </div>
    </div>
  );
};

// =================================================================================
// GAME 2: QUIZ GAME (FIXED: Scoring for Unseen)
// =================================================================================
const QuizGame = ({ words, updateWord, setView, settings, setSettings }) => {
    const [questions, setQuestions] = useState([]);
    const [current, setCurrent] = useState(0);
    const [timer, setTimer] = useState(settings.timerDuration);
    const [selectedOpt, setSelectedOpt] = useState(null); 
    const [feedback, setFeedback] = useState(null); 
    const [sessionResults, setSessionResults] = useState([]);
    const [showSummary, setShowSummary] = useState(false);
    const [scoreCount, setScoreCount] = useState(0);
    const [isPanic, setIsPanic] = useState(false);

    useEffect(() => {
        const totalWords = words.length;
        const touchedWords = words.filter(w => w.score > 0).length;
        const progress = Math.round((touchedWords / totalWords) * 100);

        let dist = { unseen: 0, learn: 0, weak: 0, known: 0 };
        if (progress <= 10) dist = { unseen: 100, learn: 0, weak: 0, known: 0 };
        else if (progress <= 30) dist = { unseen: 90, learn: 0, weak: 10, known: 0 };
        else if (progress <= 60) dist = { unseen: 65, learn: 10, weak: 20, known: 5 };
        else if (progress <= 90) dist = { unseen: 40, learn: 20, weak: 25, known: 15 };
        else if (progress <= 99) dist = { unseen: 10, learn: 30, weak: 35, known: 25 };
        else dist = { unseen: 0, learn: 30, weak: 40, known: 30 };

        const getPool = (min, max) => words.filter(w => w.score >= min && w.score <= max);
        const pools = {
            unseen: getPool(0, 0),
            learn: getPool(1, 2),
            weak: getPool(3, 4),
            known: getPool(5, 100).sort((a,b) => a.score - b.score) 
        };

        let qWords = [];
        const target = 20;

        Object.keys(dist).forEach(key => {
            const count = Math.floor((dist[key] / 100) * target);
            let pool = pools[key];
            if (key !== 'known') pool = shuffleArray(pool);
            qWords = [...qWords, ...pool.slice(0, count)];
        });

        if (qWords.length < target) {
            const usedIds = new Set(qWords.map(w => w.id));
            const backup = shuffleArray(words.filter(w => !usedIds.has(w.id)));
            qWords = [...qWords, ...backup.slice(0, target - qWords.length)];
        }
        
        const qList = shuffleArray(qWords).map(word => {
            const isEngQuestion = Math.random() > 0.5;
            const distractors = shuffleArray(words.filter(w => w.id !== word.id)).slice(0, 3);
            return {
                word,
                isEngQuestion,
                questionText: isEngQuestion ? word.english : word.hebrew,
                options: shuffleArray([...distractors, word]).map(o => ({
                    id: o.id, text: isEngQuestion ? o.hebrew : o.english
                }))
            };
        });
        setQuestions(qList);
    }, []);

    useEffect(() => {
        if (showSummary || feedback) return;
        if (timer <= 0) { handleAnswer(null, true); return; } 
        const interval = setInterval(() => setTimer(prev => Math.max(0, prev - 0.1)), 100);
        return () => clearInterval(interval);
    }, [timer, feedback, showSummary]);

    const handleAnswer = (option, isTimeout = false) => {
        const q = questions[current];
        const isCorrect = !isTimeout && option && option.id === q.word.id;
        const panic = timer < settings.panicThreshold;
        
        setSelectedOpt(option ? option.id : null);
        setFeedback(isCorrect ? 'CORRECT' : 'WRONG');
        setIsPanic(panic);

        const oldScore = q.word.score;
        let newScore = oldScore;

        if (isCorrect) {
            // FIX: אם המילה הייתה חדשה, קפוץ ישר ל-5 (KNOWN)
            if (oldScore === 0) newScore = 5;
            else newScore = oldScore + 1;
            setScoreCount(s => s + 1);
        } else {
            if (oldScore >= 10) newScore = 4;
            else if (oldScore >= 5) newScore = (!panic && !isTimeout) ? 3 : 2;
            else if (oldScore >= 3) newScore = (!panic && !isTimeout) ? oldScore - 1 : oldScore - 2;
            else newScore = 1; 
        }
        if (newScore < 1) newScore = 1;
        
        updateWord(q.word.id, { score: newScore });

        setSessionResults(prev => [...prev, { ...q.word, score: newScore }]);
        setTimeout(() => {
            if (current < questions.length - 1) {
                setCurrent(c => c + 1);
                setTimer(settings.timerDuration);
                setFeedback(null);
                setSelectedOpt(null);
                setIsPanic(false);
            } else {
                setShowSummary(true);
            }
        }, 1200); 
    };

    const toggleSpelling = (id) => {
        const currentFlag = words.find(w => w.id === id)?.flag_spelling;
        updateWord(id, { flag_spelling: !currentFlag });
    };

    const toggleStatusManual = (idx) => {
        const item = sessionResults[idx];
        const nextScore = getNextManualScore(item.score);
        const newResults = [...sessionResults];
        newResults[idx] = { ...item, score: nextScore };
        setSessionResults(newResults);
        updateWord(item.id, { score: nextScore });
    };

    if (showSummary) {
        return (
          <div className="h-[100dvh] bg-gray-50 flex flex-col text-right" dir="rtl">
              <Header title="סיכום מבחן" onBack={() => setView('GAMES_MENU')} subtitle={`ציון: ${scoreCount} מתוך 20`} />
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {sessionResults.map((item, idx) => {
                      const isSpelling = words.find(w => w.id === item.id)?.flag_spelling;
                      const color = getScoreColorClass(item.score);
                      const label = getHebrewLabel(item.score);
                      return (
                        <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                            <div className="flex-1 ml-4 overflow-hidden">
                                <div className="font-bold text-gray-800 truncate">{item.english}</div>
                                <div className="text-sm text-gray-500">{item.hebrew}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => toggleSpelling(item.id)} className={`p-2 rounded-lg border ${isSpelling ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 'bg-gray-50 text-gray-300 border-gray-100'}`}>
                                    <Languages size={18}/>
                                </button>
                                <button onClick={() => toggleStatusManual(idx)} className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border bg-${color}-50 text-${color}-700 border-${color}-200`}>
                                    {label} <Edit3 size={14} className="opacity-50"/>
                                </button>
                            </div>
                        </div>
                      );
                  })}
              </div>
              <div className="p-4 bg-white border-t border-gray-100">
                  <Button onClick={() => setView('GAMES_MENU')} className="w-full py-4 text-lg">חזור לתפריט</Button>
              </div>
          </div>
        );
    }

    if (questions.length === 0) return <div className="flex h-screen items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-indigo-600"/></div>;
    const q = questions[current];
    
    const TimerDisplay = () => (
        <div className={`flex items-center gap-1 font-bold ${timer < 2 ? 'text-red-500 animate-pulse' : 'text-indigo-600'}`}>
            <span className="text-lg">{Math.ceil(timer)}</span>
            <Clock size={16}/>
        </div>
    );

    return (
        <div className="h-[100dvh] flex flex-col bg-gray-50 text-right overflow-hidden" dir="rtl">
            <Header 
                title="Quiz" 
                onBack={() => setView('GAMES_MENU')} 
                subtitle={`${current + 1} / ${questions.length}`}
                extraLeft={<TimerDisplay/>}
                onSettings={() => setSettings({...settings, showSettings: true})}
            />
            <SettingsModal settings={settings} setSettings={setSettings} onClose={() => setSettings({...settings, showSettings: false})} />
            
            <div className="flex-none h-[35%] flex items-center justify-center w-full p-6 pb-2">
                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 w-full h-full flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
                    <h2 
                        dir="ltr" 
                        style={{ fontSize: q.isEngQuestion ? getQuizFontSize(q.questionText) : '2.2rem' }} 
                        className="font-bold text-gray-800 whitespace-nowrap w-full px-2 leading-tight"
                    >
                        {q.questionText}
                    </h2>
                    <p className="text-gray-400 mt-2 text-sm font-medium">בחר את התרגום הנכון</p>
                    
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
                         <div className={`h-full transition-all linear ${timer < 2 ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${(timer / settings.timerDuration) * 100}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-start gap-3 p-6 pt-2">
                {q.options.map((opt) => {
                    let btnClass = "bg-white border-2 border-gray-100 text-gray-600 hover:border-gray-200";
                    if (feedback) {
                        if (opt.id === q.word.id) btnClass = "bg-green-50 border-green-500 text-green-800 font-bold";
                        else if (opt.id === selectedOpt) btnClass = "bg-red-50 border-red-500 text-red-800";
                        else btnClass = "opacity-40 bg-gray-50 border-transparent grayscale";
                    }

                    return (
                        <button 
                            key={opt.id} 
                            disabled={feedback !== null} 
                            onClick={() => handleAnswer(opt)} 
                            className={`flex-1 rounded-2xl text-xl font-medium transition-all shadow-sm outline-none active:scale-95 ${btnClass}`}
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                            {opt.text}
                        </button>
                    );
                })}
            </div>
            {feedback === 'WRONG' && isPanic && (
                 <div className="absolute bottom-4 left-0 right-0 text-center text-red-500 font-bold animate-pulse">
                     <AlertTriangle size={16} className="inline mr-1"/> לחץ זמן! ענישה כפולה
                 </div>
            )}
        </div>
    );
};

// =================================================================================
// GAME 3: MATCH GAME (Fixed: Edit Button & Hebrew)
// =================================================================================
const MatchGame = ({ words, updateWord, setView }) => {
    const [board, setBoard] = useState(Array(12).fill(null));
    const [selected, setSelected] = useState([]);
    const [matchesFound, setMatchesFound] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [hintIndices, setHintIndices] = useState([]);
    const [showSummary, setShowSummary] = useState(false);
    const [sessionResults, setSessionResults] = useState([]);
    
    const sessionHistory = useRef(new Set()); 

    const getNextWord = (currentBoard) => {
        const activeCards = currentBoard.filter(c => c !== null);
        const hardCardsCount = activeCards.filter(c => c.wordScore >= 1 && c.wordScore <= 4).length;
        const totalActive = activeCards.length || 1;
        const hardRatio = hardCardsCount / totalActive;

        let targetPoolType = 'BALANCED';
        if (hardRatio > 0.6) targetPoolType = 'COOLDOWN'; 
        if (hardRatio < 0.2) targetPoolType = 'HEATUP';   

        const availableWords = words.filter(w => !sessionHistory.current.has(w.id));
        
        if (availableWords.length === 0) {
            sessionHistory.current.clear();
            return words[Math.floor(Math.random() * words.length)];
        }

        const pools = {
            unseen: availableWords.filter(w => w.score === 0),
            hard: availableWords.filter(w => w.score >= 1 && w.score <= 4),
            known: availableWords.filter(w => w.score >= 5).sort((a,b) => a.score - b.score) 
        };

        let finalPool = [];
        if (targetPoolType === 'COOLDOWN') {
            if (pools.unseen.length > 0) finalPool = [...finalPool, ...pools.unseen];
            if (pools.known.length > 0) finalPool = [...finalPool, ...pools.known];
            if (finalPool.length === 0) finalPool = availableWords; 
        } else if (targetPoolType === 'HEATUP') {
            if (pools.hard.length > 0) finalPool = pools.hard;
            else finalPool = [...pools.unseen, ...pools.known];
        } else {
            const rand = Math.random();
            if (rand < 0.2 && pools.unseen.length) finalPool = pools.unseen;
            else if (rand < 0.7 && pools.hard.length) finalPool = pools.hard;
            else if (pools.known.length) finalPool = pools.known;
            else finalPool = availableWords;
        }

        if (finalPool.length === 0) finalPool = availableWords;
        const selectedWord = finalPool[Math.floor(Math.random() * finalPool.length)];
        sessionHistory.current.add(selectedWord.id);
        return selectedWord;
    };

    const createCard = (word, type) => ({
        id: `c_${word.id}_${type}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        wordId: word.id,
        text: type === 'EN' ? word.english : word.hebrew,
        type,
        wordScore: word.score 
    });

    const refillBoard = (currentBoard) => {
        let nextBoard = [...currentBoard];
        let emptyIndices = nextBoard.map((c, i) => c === null ? i : -1).filter(i => i !== -1);
        if (emptyIndices.length === 0) return nextBoard;

        const newCardsBuffer = [];
        const activeCards = nextBoard.filter(c => c !== null);
        
        // אתחול ראשוני (4 זוגות + 4 יתומים)
        if (activeCards.length === 0) {
            const initWords = [];
            while(initWords.length < 8) {
                const w = getNextWord(nextBoard);
                if(!initWords.find(exist => exist.id === w.id)) initWords.push(w);
            }
            for (let i = 0; i < 4; i++) {
                newCardsBuffer.push(createCard(initWords[i], 'EN'));
                newCardsBuffer.push(createCard(initWords[i], 'HE'));
            }
            newCardsBuffer.push(createCard(initWords[4], 'EN'));
            newCardsBuffer.push(createCard(initWords[5], 'EN'));
            newCardsBuffer.push(createCard(initWords[6], 'HE'));
            newCardsBuffer.push(createCard(initWords[7], 'HE'));

        } else {
            // מילוי שוטף - מקסימום 50% יתומים נסגרים
            const idCounts = {};
            activeCards.forEach(c => idCounts[c.wordId] = (idCounts[c.wordId] || 0) + 1);
            let availableOrphans = activeCards.filter(c => idCounts[c.wordId] === 1);

            const enCount = activeCards.filter(c => c.type === 'EN').length;
            const heCount = activeCards.filter(c => c.type === 'HE').length;
            let neededEn = 6 - enCount;
            let neededHe = 6 - heCount;

            let slots = emptyIndices.length;
            const maxOrphansToMatch = Math.max(1, Math.floor(slots / 2));
            let orphansMatchedThisRefill = 0;

            while (slots > 0) {
                let cardAdded = false;

                // עדיפות 1: סגירת יתום
                if (availableOrphans.length > 0 && orphansMatchedThisRefill < maxOrphansToMatch) {
                    
                    const candidates = availableOrphans.filter(o => {
                        const neededType = o.type === 'EN' ? 'HE' : 'EN';
                        return neededType === 'EN' ? neededEn > 0 : neededHe > 0;
                    });

                    if (candidates.length > 0) {
                        const orphan = candidates[Math.floor(Math.random() * candidates.length)];
                        const typeToAdd = orphan.type === 'EN' ? 'HE' : 'EN';
                        const w = words.find(x => x.id === orphan.wordId);
                        
                        if (w) {
                            newCardsBuffer.push(createCard(w, typeToAdd));
                            if (typeToAdd === 'EN') neededEn--; else neededHe--;
                            
                            const orphanIndexInAvailable = availableOrphans.findIndex(o => o.id === orphan.id);
                            if (orphanIndexInAvailable > -1) availableOrphans.splice(orphanIndexInAvailable, 1);
                            
                            cardAdded = true;
                            orphansMatchedThisRefill++;
                        }
                    }
                }

                // עדיפות 2: מילה חדשה כבודדת
                if (!cardAdded) {
                    const newWord = getNextWord(nextBoard);
                    let typeToAdd = 'EN';
                    if (neededHe > neededEn) typeToAdd = 'HE';
                    else if (neededEn > neededHe) typeToAdd = 'EN';
                    else typeToAdd = Math.random() > 0.5 ? 'EN' : 'HE';

                    newCardsBuffer.push(createCard(newWord, typeToAdd));
                    if (typeToAdd === 'EN') neededEn--; else neededHe--;
                }
                slots--;
            }
        }

        const shuffledBuffer = shuffleArray(newCardsBuffer);
        emptyIndices.forEach((boardIndex, i) => {
            nextBoard[boardIndex] = shuffledBuffer[i];
        });

        return nextBoard;
    };

    useEffect(() => { setBoard(refillBoard(Array(12).fill(null))); }, []);

    const handleCardClick = (card, index) => {
        if (isLocked || !card) return;
        if (selected.length === 1 && selected[0].index === index) { setSelected([]); return; }
        if (selected.find(s => s.index === index)) return;
        
        const newSelected = [...selected, { ...card, index }];
        setSelected(newSelected);

        if (newSelected.length === 2) {
            setIsLocked(true);
            const [c1, c2] = newSelected;
            const w1 = words.find(w => w.id === c1.wordId);

            if (c1.wordId === c2.wordId && c1.type !== c2.type) {
                // SUCCESS
                setMatchesFound(p => p + 1);
                
                let newScore = w1.score;
                if (w1.score === 0) newScore = 5; 
                else newScore = w1.score + 1;
                
                updateWord(c1.wordId, { score: newScore });
                addToSummary(c1.wordId, newScore);

                setTimeout(() => {
                    const nextBoard = [...board];
                    nextBoard[c1.index] = null;
                    nextBoard[c2.index] = null;
                    setBoard(refillBoard(nextBoard));
                    setSelected([]);
                    setIsLocked(false);
                    setHintIndices([]);
                }, 400);

            } else {
                // FAILURE
                [c1, c2].forEach(c => {
                    const w = words.find(x => x.id === c.wordId);
                    let newScore = w.score;
                    if (w.score === 0) newScore = 1; 
                    else newScore = Math.max(1, w.score - 1); 
                    updateWord(c.wordId, { score: newScore });
                    addToSummary(c.wordId, newScore);
                });

                setTimeout(() => {
                    const nextBoard = [...board];
                    const idsToBurn = [c1.wordId, c2.wordId];
                    for (let i = 0; i < nextBoard.length; i++) {
                        if (nextBoard[i] && idsToBurn.includes(nextBoard[i].wordId)) nextBoard[i] = null; 
                    }
                    setBoard(refillBoard(nextBoard));
                    setSelected([]);
                    setIsLocked(false);
                }, 1000);
            }
        }
    };

    const handleHint = () => {
        if (hintIndices.length > 0 || isLocked) return;
        let pairIndices = [];
        for (let i = 0; i < board.length; i++) {
            if (!board[i]) continue;
            for (let j = i + 1; j < board.length; j++) {
                if (board[j] && board[i].wordId === board[j].wordId) { pairIndices = [i, j]; break; }
            }
            if (pairIndices.length > 0) break;
        }
        if (pairIndices.length === 2) {
            setHintIndices(pairIndices);
            setTimeout(() => setHintIndices([]), 800);
        }
    };

    const addToSummary = (wordId, score) => {
        setSessionResults(prev => {
            const word = words.find(w => w.id === wordId);
            if (!word) return prev;
            return [...prev.filter(item => item.id !== wordId), { ...word, score }];
        });
    };

    const toggleStatusManual = (idx) => {
        const item = sessionResults[idx];
        const nextScore = getNextManualScore(item.score);
        const newResults = [...sessionResults];
        newResults[idx] = { ...item, score: nextScore };
        setSessionResults(newResults);
        updateWord(item.id, { score: nextScore });
    };

    const toggleSpelling = (id) => {
        const currentFlag = words.find(w => w.id === id)?.flag_spelling;
        updateWord(id, { flag_spelling: !currentFlag });
    };

    if (showSummary) {
        return (
            <div className="h-[100dvh] bg-gray-50 flex flex-col text-right" dir="rtl">
                <Header title="סיכום משחק" onBack={() => setView('GAMES_MENU')} subtitle={`בוצעו ${matchesFound} התאמות`} />
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {sessionResults.map((item, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                            <div><div className="font-bold text-gray-800">{item.english}</div><div className="text-sm text-gray-500">{item.hebrew}</div></div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => toggleSpelling(item.id)} className={`p-2 rounded-lg border ${words.find(w => w.id === item.id)?.flag_spelling ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 'bg-gray-50 text-gray-300 border-gray-100'}`}>
                                    <Languages size={18}/>
                                </button>
                                <button onClick={() => toggleStatusManual(idx)} className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border bg-${getScoreColorClass(item.score)}-50 text-${getScoreColorClass(item.score)}-700 border-${getScoreColorClass(item.score)}-200`}>
                                    {getHebrewLabel(item.score)} <Edit3 size={14} className="opacity-50"/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-white border-t border-gray-100"><Button onClick={() => setView('GAMES_MENU')} className="w-full py-4 text-lg">חזור לתפריט</Button></div>
            </div>
        );
    }

    return (
        <div className="h-[100dvh] bg-gray-50 flex flex-col text-right" dir="rtl">
             <Header title="Match" onBack={() => setShowSummary(true)} subtitle={`זוגות שנמצאו: ${matchesFound}`} extraLeft={<button onClick={handleHint} className="bg-amber-100 text-amber-700 p-2 rounded-full hover:bg-amber-200 transition-colors"><Lightbulb size={20}/></button>} />
            <div className="grid grid-cols-3 gap-3 p-4 content-start flex-1 overflow-y-auto">
                {board.map((card, idx) => {
                    if (!card) return <div key={idx} className="h-28 rounded-2xl bg-gray-100/50 border-2 border-dashed border-gray-200"></div>;
                    const isSelected = selected.find(s => s.index === idx);
                    const isHinted = hintIndices.includes(idx);
                    const isWrong = selected.length === 2 && selected[0].wordId !== selected[1].wordId && isSelected;
                    return (
                        <button key={card.id} onClick={() => handleCardClick(card, idx)} className={`h-28 rounded-2xl font-bold shadow-sm text-sm p-1 break-words flex items-center justify-center transition-all border-b-4 active:border-b-0 active:translate-y-1 outline-none focus:outline-none ring-0 select-none ${isWrong ? 'bg-red-500 text-white border-red-700 animate-shake' : isHinted ? 'bg-amber-100 text-amber-800 border-amber-300 ring-4 ring-amber-400 scale-105' : isSelected ? 'bg-indigo-600 text-white border-indigo-800 scale-95' : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-200 hover:text-indigo-600'}`}>{card.text}</button>
                    );
                })}
            </div>
            <div className="p-4 bg-white border-t border-gray-100"><Button onClick={() => setShowSummary(true)} variant="outline" className="w-full">סיום משחק</Button></div>
        </div>
    );
};

// =================================================================================
// GAME 4: SPELLING BEE (שימוש בנתונים החדשים)
// =================================================================================
const SpellingGame = ({ words, updateWord, setView }) => {
    const [queue, setQueue] = useState([]);
    const [current, setCurrent] = useState(0);
    const [input, setInput] = useState('');
    const [feedback, setFeedback] = useState(null); 
    const [showSummary, setShowSummary] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
        const pool = words.filter(w => w.flag_spelling === true);
        setQueue(pool.sort(() => Math.random() - 0.5));
    }, []);

    const handleCheck = (e) => {
        e?.preventDefault();
        if (!input.trim() || feedback) return;

        const word = queue[current];
        const isCorrect = input.trim().toLowerCase() === word.english.toLowerCase();

        if (isCorrect) {
            setFeedback('CORRECT');
            setScore(s => s + 1);
            if (word.score < 10) updateWord(word.id, { score: word.score + 1 });
        } else {
            setFeedback('WRONG');
        }

        setTimeout(() => {
            if (current < queue.length - 1) {
                setCurrent(c => c + 1);
                setInput('');
                setFeedback(null);
            } else {
                setShowSummary(true);
            }
        }, 2000); 
    };

    if (queue.length === 0) {
        return (
            <div className="h-[100dvh] bg-gray-50 flex flex-col items-center justify-center text-center p-6" dir="rtl">
                <div className="bg-indigo-50 p-6 rounded-full mb-6">
                    <Edit3 size={48} className="text-indigo-600"/>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">רשימת האיות ריקה</h2>
                <p className="text-gray-500 mb-8 max-w-xs">
                    כדי להתאמן באיות, עליך לסמן מילים באייקון <Languages size={16} className="inline"/> במסך "התקדמות".
                </p>
                <Button onClick={() => setView('PROGRESS')} className="w-full">עבור להתקדמות</Button>
                <Button variant="ghost" onClick={() => setView('TASKS')} className="mt-2">חזור</Button>
            </div>
        );
    }

    if (showSummary) {
        return (
            <div className="h-[100dvh] bg-gray-50 flex flex-col text-right" dir="rtl">
                <Header title="סיכום איות" onBack={() => setView('TASKS')} subtitle={`הצלחות: ${score} מתוך ${queue.length}`} />
                <div className="flex-1 flex flex-col items-center justify-center p-6">
                    <Trophy size={64} className="text-yellow-500 mb-6 animate-bounce"/>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">כל הכבוד!</h2>
                    <p className="text-gray-500 mb-8">סיימת את סבב האיות הנוכחי.</p>
                    <Button onClick={() => setView('TASKS')} className="w-full py-4 text-lg">חזור לתפריט</Button>
                </div>
            </div>
        );
    }

    const word = queue[current];

    return (
        <div className="h-[100dvh] flex flex-col bg-gray-50" dir="rtl">
            <Header title="אימון איות" onBack={() => setView('TASKS')} subtitle={`${current + 1} / ${queue.length}`} />

            <div className="flex-1 flex flex-col p-6 items-center">
                <div className="w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center mb-8 min-h-[200px]">
                    <h2 className="text-4xl font-bold text-gray-800 mb-2 text-center">{word.hebrew}</h2>
                    <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-sm">{word.partOfSpeech}</span>
                </div>

                <form onSubmit={handleCheck} className="w-full max-w-sm relative">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={feedback !== null}
                            autoFocus
                            placeholder="הקלד באנגלית..."
                            dir="ltr"
                            className={`w-full text-center text-2xl font-bold py-4 px-4 rounded-2xl border-2 outline-none transition-all shadow-sm
                                ${feedback === 'CORRECT' ? 'bg-green-50 border-green-500 text-green-700' : 
                                  feedback === 'WRONG' ? 'bg-red-50 border-red-500 text-red-700' : 
                                  'bg-white border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50'}`}
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                            {feedback === 'CORRECT' && <Check className="text-green-500" size={28}/>}
                            {feedback === 'WRONG' && <X className="text-red-500" size={28}/>}
                        </div>
                    </div>

                    {feedback === 'WRONG' && (
                        <div className="mt-4 text-center animate-in fade-in slide-in-from-top-2">
                            <p className="text-gray-400 text-sm mb-1">התשובה הנכונה:</p>
                            <p className="text-2xl font-bold text-indigo-600 tracking-wide" dir="ltr">{word.english}</p>
                        </div>
                    )}

                    {!feedback && (
                        <Button onClick={handleCheck} disabled={!input} className="w-full mt-6 py-4 text-lg shadow-lg shadow-indigo-200">
                            בדיקה
                        </Button>
                    )}
                </form>
            </div>
            <div className="h-[20vh]"></div>
        </div>
    );
};

// =================================================================================
// WORD BANK & PROGRESS & TASKS (Views Updated for Score)
// =================================================================================

const WordBankView = ({ setView, words, updateWord }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTab, setFilterTab] = useState('ALL'); 

    const stats = {
        ALL: words.length,
        KNOWN: words.filter(w => w.score >= 5).length,
        WEAK: words.filter(w => w.score >= 3 && w.score <= 4).length,
        LEARN: words.filter(w => w.score >= 1 && w.score <= 2).length
    };

    const filteredWords = words.filter(word => {
        const score = word.score;
        const matchesSearch = word.english.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              word.hebrew.includes(searchTerm);
        
        if (!matchesSearch) return false;

        if (filterTab === 'ALL') return true;
        if (filterTab === 'KNOWN') return score >= 5;
        if (filterTab === 'WEAK') return score >= 3 && score <= 4;
        if (filterTab === 'LEARN') return score <= 2;
        return true;
    });

    const getStatusIcon = (score) => {
        if (score >= 5) return <Check size={18} className="text-green-500"/>;
        if (score >= 3) return <Eye size={18} className="text-amber-500"/>;
        if (score >= 1) return <BookOpen size={18} className="text-indigo-400"/>;
        return <CircleDashed size={18} className="text-gray-300"/>;
    };

    return (
        <div className="h-[100dvh] flex flex-col bg-gray-50" dir="rtl">
            <Header title="מאגר מילים" onBack={() => setView('DASHBOARD')} subtitle={`סה"כ ${stats.ALL} מילים`} />
            <div className="bg-white p-4 shadow-sm z-10 space-y-3">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="חפש מילה..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-100 text-gray-800 rounded-xl py-3 px-10 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-right"
                    />
                    <div className="absolute top-3 right-3 text-gray-400"><SearchIcon size={20}/></div>
                    {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute top-3 left-3 text-gray-400"><X size={20}/></button>}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {[{ id: 'ALL', label: 'הכל', count: stats.ALL }, { id: 'KNOWN', label: 'יודע', count: stats.KNOWN, color: 'green' }, { id: 'WEAK', label: 'לחיזוק', count: stats.WEAK, color: 'amber' }, { id: 'LEARN', label: 'ללמידה', count: stats.LEARN, color: 'indigo' }].map(tab => (
                        <button key={tab.id} onClick={() => setFilterTab(tab.id)} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2 border ${filterTab === tab.id ? `bg-${tab.color || 'gray'}-100 text-${tab.color || 'gray'}-800 border-${tab.color || 'gray'}-300` : 'bg-white text-gray-500 border-gray-100'}`}>{tab.label} <span className="text-xs opacity-60">({tab.count})</span></button>
                    ))}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredWords.map(word => (
                    <div key={word.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                        <div className="text-right">
                            <div className="font-bold text-gray-800 text-lg leading-tight" dir="ltr">{word.english}</div>
                            <div className="text-gray-500 text-sm mt-0.5">{word.hebrew}</div>
                        </div>
                        <div className="flex items-center gap-3">
                             <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50">{getStatusIcon(word.score)}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ProgressView = ({ setView, words, updateWord }) => {
    const [activeTab, setActiveTab] = useState('UNSEEN');
    const [showSpellingOnly, setShowSpellingOnly] = useState(false);
    const [editingWord, setEditingWord] = useState(null);

    const stats = {
        known: words.filter(w => w.score >= 5).length,
        weak: words.filter(w => w.score >= 3 && w.score <= 4).length,
        learn: words.filter(w => w.score >= 1 && w.score <= 2).length,
        unseen: words.filter(w => w.score === 0).length,
    };

    const displayWords = words.filter(w => {
        if (showSpellingOnly) return w.flag_spelling === true;
        const score = w.score;
        if (activeTab === 'KNOWN') return score >= 5;
        if (activeTab === 'WEAK') return score >= 3 && score <= 4;
        if (activeTab === 'LEARN') return score >= 1 && score <= 2;
        if (activeTab === 'UNSEEN') return score === 0;
        return false;
    });

    const handleManualUpdate = (newScore) => {
        if (editingWord) {
            updateWord(editingWord.id, { score: newScore });
            setEditingWord(null);
        }
    };

    const toggleSpellingFlag = (e, wordId) => {
        e.stopPropagation();
        const current = words.find(w => w.id === wordId)?.flag_spelling || false;
        updateWord(wordId, { flag_spelling: !current });
    };

    return (
        <div className="h-[100dvh] flex flex-col bg-gray-50" dir="rtl">
             <Header title={showSpellingOnly ? "רשימת איות" : "התקדמות"} onBack={() => setView('DASHBOARD')} subtitle="ניהול סטטוסים" 
                 extraLeft={<button onClick={() => setShowSpellingOnly(!showSpellingOnly)} className={`p-2 rounded-lg font-bold flex items-center gap-2 text-sm border ${showSpellingOnly ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'}`}><Languages size={18}/> {showSpellingOnly ? 'סגור' : 'איות'}</button>}
             />
             {!showSpellingOnly && (
                <div className="p-4 grid grid-cols-4 gap-2">
                    <button onClick={() => setActiveTab('UNSEEN')} className={`flex-1 flex flex-col items-center py-3 rounded-xl border-2 ${activeTab === 'UNSEEN' ? 'bg-gray-50 border-gray-200 text-gray-700' : 'bg-white border-transparent text-gray-400'}`}><span className="text-xl font-bold">{stats.unseen}</span><span className="text-xs">חדש</span></button>
                    <button onClick={() => setActiveTab('LEARN')} className={`flex-1 flex flex-col items-center py-3 rounded-xl border-2 ${activeTab === 'LEARN' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-transparent text-gray-400'}`}><span className="text-xl font-bold">{stats.learn}</span><span className="text-xs">למידה</span></button>
                    <button onClick={() => setActiveTab('WEAK')} className={`flex-1 flex flex-col items-center py-3 rounded-xl border-2 ${activeTab === 'WEAK' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-transparent text-gray-400'}`}><span className="text-xl font-bold">{stats.weak}</span><span className="text-xs">לחיזוק</span></button>
                    <button onClick={() => setActiveTab('KNOWN')} className={`flex-1 flex flex-col items-center py-3 rounded-xl border-2 ${activeTab === 'KNOWN' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-transparent text-gray-400'}`}><span className="text-xl font-bold">{stats.known}</span><span className="text-xs">יודע</span></button>
                </div>
             )}
             <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                 {displayWords.map(word => (
                     <div key={word.id} onClick={() => setEditingWord(word)} className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer">
                         <div className="text-right">
                             <div className="font-bold text-gray-800 text-lg" dir="ltr">{word.english}</div>
                             <div className="text-gray-500 text-sm">{word.hebrew}</div>
                         </div>
                         <div className="flex items-center gap-3">
                             <button onClick={(e) => toggleSpellingFlag(e, word.id)} className={`p-2 rounded-full border ${word.flag_spelling ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 'bg-gray-50 text-gray-300 border-transparent'}`}><Languages size={16}/></button>
                             <Edit3 size={18} className="text-gray-300"/>
                         </div>
                     </div>
                 ))}
             </div>
             {editingWord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={() => setEditingWord(null)}>
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-gray-800 text-center mb-6" dir="ltr">{editingWord.english}</h3>
                        <div className="space-y-3">
                            <Button variant="outline" onClick={() => handleManualUpdate(5)} className="w-full border-green-200 text-green-700 justify-between"><span>יודע (KNOWN)</span> <Check size={18}/></Button>
                            <Button variant="outline" onClick={() => handleManualUpdate(3)} className="w-full border-amber-200 text-amber-700 justify-between"><span>לחיזוק (WEAK)</span> <Eye size={18}/></Button>
                            <Button variant="outline" onClick={() => handleManualUpdate(1)} className="w-full border-indigo-200 text-indigo-700 justify-between"><span>למידה (LEARN)</span> <BookOpen size={18}/></Button>
                            <Button variant="outline" onClick={() => handleManualUpdate(0)} className="w-full border-gray-200 text-gray-500 justify-between"><span>חדש (UNSEEN)</span> <CircleDashed size={18}/></Button>
                        </div>
                        <button onClick={() => setEditingWord(null)} className="mt-6 w-full py-3 text-gray-400 font-bold">ביטול</button>
                    </div>
                </div>
             )}
        </div>
    );
};

const TasksView = ({ setView, words }) => {
    const [learnCount, setLearnCount] = useState(10);
    const [reviewCount, setReviewCount] = useState(20);
    const [generatedList, setGeneratedList] = useState(null);

    const generateList = () => {
        const poolLearn = words.filter(w => w.score >= 1 && w.score <= 2);
        const poolWeak = words.filter(w => w.score >= 3 && w.score <= 4);
        const poolKnown = words.filter(w => w.score >= 5);

        let listA = poolLearn.sort(() => Math.random() - 0.5).slice(0, learnCount);
        if (listA.length < learnCount) {
            listA = [...listA, ...poolWeak.sort(() => Math.random() - 0.5).slice(0, learnCount - listA.length)];
        }
        const usedIds = new Set(listA.map(w => w.id));
        const poolReview = [...poolWeak, ...poolKnown].filter(w => !usedIds.has(w.id));
        const listB = poolReview.sort(() => Math.random() - 0.5).slice(0, reviewCount);

        const date = new Date().toLocaleDateString('he-IL');
        let content = `📅 רשימת תרגול\nתאריך: ${date}\n===================\n\n`;
        if (listA.length > 0) { content += `🔵 מיקוד למידה (${listA.length})\n---\n`; listA.forEach((w, i) => content += `${i+1}. ${w.english} - ${w.hebrew}\n`); content += `\n`; }
        if (listB.length > 0) { content += `🟢 חזרה (${listB.length})\n---\n`; listB.forEach((w, i) => content += `${i+1}. ${w.english} - ${w.hebrew}\n`); }
        setGeneratedList(content);
    };

    return (
        <div className="h-[100dvh] flex flex-col bg-gray-50" dir="rtl">
            <Header title="משימות" onBack={() => setView('DASHBOARD')} subtitle="מחולל תרגול" />
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                 <Button variant="outline" onClick={() => setView('GAME_SPELLING')} className="w-full py-6 text-xl justify-between px-6 border-indigo-100">
                    <span className="flex items-center gap-3 font-bold text-gray-800"><Edit3 className="text-indigo-600"/> אימון איות</span>
                    <Play size={20} className="text-gray-300 transform rotate-180"/>
                </Button>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex gap-2"><ClipboardList className="text-teal-600"/> מחולל משימות</h2>
                    {!generatedList ? (
                        <div className="space-y-6">
                             <div><label className="font-bold text-gray-700 block mb-2">מיקוד למידה: {learnCount}</label><input type="range" min="5" max="30" value={learnCount} onChange={e=>setLearnCount(Number(e.target.value))} className="w-full accent-blue-600"/></div>
                             <div><label className="font-bold text-gray-700 block mb-2">חזרה: {reviewCount}</label><input type="range" min="10" max="50" value={reviewCount} onChange={e=>setReviewCount(Number(e.target.value))} className="w-full accent-green-600"/></div>
                             <Button onClick={generateList} className="w-full bg-teal-600 hover:bg-teal-700">צור רשימה</Button>
                        </div>
                    ) : (
                        <div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm font-mono whitespace-pre-wrap h-64 overflow-y-auto mb-4" dir="ltr">{generatedList}</div>
                            <div className="flex gap-2">
                                <Button onClick={() => navigator.clipboard.writeText(generatedList)} variant="outline" className="flex-1"><Copy size={18}/> העתק</Button>
                                <Button onClick={() => setGeneratedList(null)} variant="ghost">חדש</Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const GamesMenuView = ({ setView }) => (
    <div className="h-[100dvh] flex flex-col bg-gray-50" dir="rtl">
        <Header title="מבדקים" onBack={() => setView('DASHBOARD')} subtitle="בחר משחק" />
        <div className="p-6 space-y-4">
             <Button variant="outline" onClick={() => setView('GAME_SWIPE')} className="w-full py-6 text-xl justify-between px-6"><span className="flex items-center gap-3"><BookOpen className="text-indigo-600"/> Swipe</span><Play size={16} className="text-gray-300 transform rotate-180"/></Button>
             <Button variant="outline" onClick={() => setView('GAME_QUIZ')} className="w-full py-6 text-xl justify-between px-6"><span className="flex items-center gap-3"><Zap className="text-orange-500"/> Quiz</span><Play size={16} className="text-gray-300 transform rotate-180"/></Button>
             <Button variant="outline" onClick={() => setView('GAME_MATCH')} className="w-full py-6 text-xl justify-between px-6"><span className="flex items-center gap-3"><Brain className="text-purple-600"/> Match</span><Play size={16} className="text-gray-300 transform rotate-180"/></Button>
        </div>
    </div>
);

const DashboardView = ({ setView, user }) => {
    const MenuCard = ({ icon: Icon, title, subtitle, color, onClick }) => (
        <button onClick={onClick} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform h-40 w-full outline-none">
            <div className={`p-4 rounded-full bg-${color}-50`}><Icon size={32} className={`text-${color}-600`} /></div>
            <div className="text-center"><h3 className="font-bold text-gray-800 text-lg">{title}</h3><p className="text-gray-400 text-xs mt-1">{subtitle}</p></div>
        </button>
    );

    return (
        <div className="h-[100dvh] bg-gray-50 flex flex-col font-sans" dir="rtl">
            <div className="bg-white p-6 pt-12 pb-6 shadow-sm border-b border-gray-100 sticky top-0 z-10">
                <div className="flex justify-between items-center mb-4">
                    <div><h1 className="text-2xl font-bold text-gray-800">שלום, {user}</h1><p className="text-gray-400 text-sm">המשימה: 700 מילים</p></div>
                    <Settings size={28} className="text-gray-300"/>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden"><div className="bg-indigo-600 h-full w-[10%] rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)]"></div></div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto flex flex-col">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <MenuCard icon={BookOpen} title="מאגר מילים" subtitle="כל הרשימה" color="indigo" onClick={() => setView('WORD_BANK')}/>
                    <MenuCard icon={Gamepad2} title="מבדקים" subtitle="בחן את עצמך" color="indigo" onClick={() => setView('GAMES_MENU')}/>
                    <MenuCard icon={ClipboardList} title="משימות" subtitle="תרגול וייצוא" color="indigo" onClick={() => setView('TASKS')}/>
                    <MenuCard icon={TrendingUp} title="התקדמות" subtitle="ניהול ידע" color="indigo" onClick={() => setView('PROGRESS')}/>
                </div>
                <div className="mt-auto pt-4 text-center">
                    <p className="text-[10px] text-gray-300">גרסה 4.0 • נבנה באהבה</p>
                    <p className="text-xs text-gray-400 font-medium mt-1">✨ שכוייח לעויזר, אהרן, וג'מיני</p>
                </div>
            </div>
        </div>
    );
};

// --- APP ROOT ---
export default function VocabMasterApp() {
  const [view, setView] = useState('DASHBOARD');
  const [words, setWords] = useState([]); // Array of word objects with Score
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('vocab_user_name');
    const savedSettings = localStorage.getItem('vocab_settings');
    const savedProgress = JSON.parse(localStorage.getItem('vocab_offline_progress') || '{}');
    
    // --- MIGRATION LOGIC (STATUS -> SCORE) ---
    const initializedWords = MASTER_WORDS.map(word => {
        const userWord = savedProgress[word.id];
        let score = 0; // Default Unseen
        let flag_spelling = false;

        if (userWord) {
             // Case A: New format
             if (typeof userWord.score === 'number') {
                 score = userWord.score;
                 flag_spelling = userWord.flag_spelling || false;
             } 
             // Case B: Old format migration
             else if (userWord.status) {
                 switch(userWord.status) {
                     case 'DONE': score = 10; break;
                     case 'KNOWN': score = 5; break;
                     case 'WEAK': score = 3; break;
                     case 'LEARN': score = 1; break;
                     default: score = 0;
                 }
                 flag_spelling = userWord.flag_spelling || false;
             }
        }
        return { ...word, score, flag_spelling };
    });

    setWords(initializedWords);
    if (savedUser) setUser(savedUser);
    if (savedSettings) setSettings({...DEFAULT_SETTINGS, ...JSON.parse(savedSettings)});
    setLoading(false);
  }, []);

  // Save changes
  useEffect(() => {
    if (!loading && words.length > 0) {
        const progressMap = words.reduce((acc, word) => {
            if (word.score > 0 || word.flag_spelling) {
                acc[word.id] = { score: word.score, flag_spelling: word.flag_spelling };
            }
            return acc;
        }, {});
        localStorage.setItem('vocab_offline_progress', JSON.stringify(progressMap));
    }
  }, [words, loading]);

  useEffect(() => {
      localStorage.setItem('vocab_settings', JSON.stringify(settings));
  }, [settings]);

  const updateWord = (id, updates) => {
      setWords(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const handleLogin = (name) => {
      setUser(name);
      localStorage.setItem('vocab_user_name', name);
      setView('DASHBOARD');
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600"/></div>;

  if (!user) {
      return <LoginView onLogin={handleLogin} />;
  }

  switch (view) {
      case 'DASHBOARD': return <DashboardView setView={setView} user={user} />;
      case 'WORD_BANK': return <WordBankView setView={setView} words={words} updateWord={updateWord} />;
      case 'GAMES_MENU': return <GamesMenuView setView={setView} />;
      case 'TASKS': return <TasksView setView={setView} words={words} />;
      case 'GAME_SPELLING': return <SpellingGame words={words} updateWord={updateWord} setView={setView} />;
      case 'PROGRESS': return <ProgressView setView={setView} words={words} updateWord={updateWord} />;
      case 'GAME_SWIPE': return <SwipeGame words={words} updateWord={updateWord} setView={setView} settings={settings} setSettings={setSettings} />;
      case 'GAME_QUIZ': return <QuizGame words={words} updateWord={updateWord} setView={setView} settings={settings} setSettings={setSettings} />;
      case 'GAME_MATCH': return <MatchGame words={words} updateWord={updateWord} setView={setView} />;
      default: return <DashboardView setView={setView} user={user} />;
  }
}