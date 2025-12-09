import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Zap, Brain, Settings, 
  ChevronLeft, Trophy, Check, X, Eye, 
  Loader2, Edit3, Lightbulb, Clock,
  Gamepad2, ClipboardList, TrendingUp, Play,
  Search as SearchIcon, CircleDashed, Languages, Download, Copy,
  User, ArrowRight
} from 'lucide-react';

// ייבוא המילים מקובץ הדאטה
import { MASTER_WORDS } from './data'; 

// הגדרת הסטטוסים
const STATUS = {
  UNSEEN: 'UNSEEN',
  LEARN: 'LEARN',
  WEAK: 'WEAK',
  KNOWN: 'KNOWN',
  DONE: 'DONE'
};

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

const Header = ({ title, onBack, subtitle, extraLeft }) => (
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
        {extraLeft && <div className="pl-1">{extraLeft}</div>}
    </div>
);

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
const SwipeGame = ({ progress, updateWord, setView }) => {
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
    const pool = MASTER_WORDS.filter(w => (progress[w.id]?.status || STATUS.UNSEEN) === STATUS.UNSEEN);
    if (pool.length < 5) pool.push(...MASTER_WORDS.filter(w => progress[w.id]?.status === STATUS.LEARN));
    if (pool.length === 0) pool.push(...MASTER_WORDS);
    setQueue(pool.sort(() => Math.random() - 0.5).slice(0, 20));
  }, []);

  const processSwipe = (direction) => {
      setIsAnimating(true);
      let newStatus = STATUS.LEARN;
      if (isPeeked) newStatus = direction === 'RIGHT' ? STATUS.WEAK : STATUS.LEARN;
      else newStatus = direction === 'RIGHT' ? STATUS.KNOWN : STATUS.LEARN;
      
      setOffset(direction === 'RIGHT' ? 800 : -800);
      const word = queue[current];
      updateWord(word.id, { status: newStatus });
      setSessionResults(prev => [...prev, { ...word, status: newStatus }]);
      setTimeout(() => {
          setFeedback({ status: newStatus, ...word });
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

  const toggleStatus = (idx) => {
      const item = sessionResults[idx];
      const cycle = [STATUS.LEARN, STATUS.WEAK, STATUS.KNOWN];
      const nextStatus = cycle[(cycle.indexOf(item.status) + 1) % cycle.length];
      const newResults = [...sessionResults];
      newResults[idx] = { ...item, status: nextStatus };
      setSessionResults(newResults);
      updateWord(item.id, { status: nextStatus });
  };

  const toggleSpelling = (id) => {
      const currentFlag = progress[id]?.flag_spelling;
      updateWord(id, { flag_spelling: !currentFlag });
  };

  if (showSummary) {
      return (
          <div className="h-[100dvh] bg-gray-50 flex flex-col text-right" dir="rtl">
              <Header title="סיכום סשן" onBack={() => setView('GAMES_MENU')} subtitle="תוצאות המיון" />
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {sessionResults.map((item, idx) => {
                      const isSpelling = progress[item.id]?.flag_spelling;
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
                                <button onClick={() => toggleStatus(idx)} className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border transition-colors shrink-0 outline-none ${item.status === STATUS.KNOWN ? 'bg-green-50 text-green-700 border-green-200' : item.status === STATUS.WEAK ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                    {item.status === STATUS.KNOWN ? 'יודע' : item.status === STATUS.WEAK ? 'לחיזוק' : 'ללמידה'}
                                    <Edit3 size={14} className="opacity-50"/>
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
       <Header title="Swipe" onBack={() => setView('GAMES_MENU')} subtitle={`${current + 1} מתוך ${queue.length}`} />
       
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
                    <h2 
                        dir="ltr" 
                        style={{ fontSize: dynamicFontSize }} 
                        className="font-bold text-gray-800 leading-tight text-center w-full whitespace-nowrap overflow-hidden"
                    >
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
                 <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-sm ${feedback.status === STATUS.KNOWN ? 'bg-green-100 text-green-600' : feedback.status === STATUS.WEAK ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                     {feedback.status === STATUS.KNOWN && <Check size={48}/>}
                     {feedback.status === STATUS.WEAK && <Eye size={48}/>}
                     {feedback.status === STATUS.LEARN && <X size={48}/>}
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
// GAME 2: QUIZ GAME
// =================================================================================
const QuizGame = ({ progress, updateWord, setView }) => {
    const [questions, setQuestions] = useState([]);
    const [current, setCurrent] = useState(0);
    const [timer, setTimer] = useState(5);
    const [selectedOpt, setSelectedOpt] = useState(null); 
    const [feedback, setFeedback] = useState(null); 
    const [sessionResults, setSessionResults] = useState([]);
    const [showSummary, setShowSummary] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
        let pool = MASTER_WORDS.filter(w => progress[w.id]?.status === STATUS.LEARN || progress[w.id]?.status === STATUS.WEAK);
        if (pool.length < 20) {
            const others = MASTER_WORDS.filter(w => !pool.includes(w));
            pool = [...pool, ...others];
        }
        pool = pool.sort(() => Math.random() - 0.5).slice(0, 20);
        const qList = pool.map(word => {
            const isEngQuestion = Math.random() > 0.5;
            const distractors = MASTER_WORDS.filter(w => w.id !== word.id).sort(() => Math.random() - 0.5).slice(0, 3);
            return {
                word,
                isEngQuestion,
                questionText: isEngQuestion ? word.english : word.hebrew,
                options: [...distractors, word].sort(() => Math.random() - 0.5).map(o => ({
                    id: o.id, text: isEngQuestion ? o.hebrew : o.english
                }))
            };
        });
        setQuestions(qList);
    }, []);

    useEffect(() => {
        if (showSummary || feedback) return;
        if (timer <= 0) { handleAnswer(null); return; }
        const interval = setInterval(() => setTimer(prev => Math.max(0, prev - 0.1)), 100);
        return () => clearInterval(interval);
    }, [timer, feedback, showSummary]);

    const handleAnswer = (option) => {
        const q = questions[current];
        const isCorrect = option && option.id === q.word.id;
        setSelectedOpt(option ? option.id : null);
        setFeedback(isCorrect ? 'CORRECT' : 'WRONG');

        let newStatus = progress[q.word.id]?.status || STATUS.UNSEEN;
        const streak = progress[q.word.id]?.streak || 0;
        let finalStatus = newStatus;

        if (isCorrect) {
            setScore(s => s + 1);
            if (newStatus === STATUS.UNSEEN) finalStatus = STATUS.KNOWN; 
            else if (newStatus === STATUS.LEARN && streak >= 1) finalStatus = STATUS.WEAK;
            else if (newStatus === STATUS.WEAK && streak >= 1) finalStatus = STATUS.KNOWN;
            updateWord(q.word.id, { status: finalStatus, streak: streak + 1 });
        } else {
            finalStatus = newStatus === STATUS.KNOWN ? STATUS.WEAK : STATUS.LEARN;
            updateWord(q.word.id, { status: finalStatus, streak: 0 });
        }

        setSessionResults(prev => [...prev, { ...q.word, status: finalStatus }]);
        setTimeout(() => {
            if (current < questions.length - 1) {
                setCurrent(c => c + 1);
                setTimer(5);
                setFeedback(null);
                setSelectedOpt(null);
            } else {
                setShowSummary(true);
            }
        }, 700); 
    };

    const toggleStatus = (idx) => {
      const item = sessionResults[idx];
      const nextStatus = [STATUS.LEARN, STATUS.WEAK, STATUS.KNOWN][([STATUS.LEARN, STATUS.WEAK, STATUS.KNOWN].indexOf(item.status) + 1) % 3];
      const newResults = [...sessionResults];
      newResults[idx] = { ...item, status: nextStatus };
      setSessionResults(newResults);
      updateWord(item.id, { status: nextStatus });
    };

    const toggleSpelling = (id) => {
        const currentFlag = progress[id]?.flag_spelling;
        updateWord(id, { flag_spelling: !currentFlag });
    };

    if (showSummary) {
        return (
          <div className="h-[100dvh] bg-gray-50 flex flex-col text-right" dir="rtl">
              <Header title="סיכום מבחן" onBack={() => setView('GAMES_MENU')} subtitle={`ציון: ${score} מתוך 20`} />
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {sessionResults.map((item, idx) => {
                      const isSpelling = progress[item.id]?.flag_spelling;
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
                                <button onClick={() => toggleStatus(idx)} className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border shrink-0 ${item.status === STATUS.KNOWN ? 'bg-green-50 text-green-700 border-green-200' : item.status === STATUS.WEAK ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                    {item.status === STATUS.KNOWN ? 'יודע' : item.status === STATUS.WEAK ? 'לחיזוק' : 'ללמידה'}
                                    <Edit3 size={14} className="opacity-50"/>
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
            />
            
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
                         <div className={`h-full transition-all linear ${timer < 2 ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${(timer / 5) * 100}%` }}></div>
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
        </div>
    );
};

// =================================================================================
// GAME 3: MATCH GAME
// =================================================================================
const MatchGame = ({ progress, updateWord, setView }) => {
    const [board, setBoard] = useState([]);
    const [selected, setSelected] = useState([]);
    const [matchesFound, setMatchesFound] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [hintIndices, setHintIndices] = useState([]); 
    const [showSummary, setShowSummary] = useState(false);
    const [sessionResults, setSessionResults] = useState([]);

    useEffect(() => { initBoard(); }, []);

    const initBoard = () => {
        const pool = [...MASTER_WORDS].sort(() => Math.random() - 0.5);
        const pairs = pool.slice(0, 3); 
        const singlesA = pool.slice(3, 6); 
        const singlesB = pool.slice(6, 9); 
        const cards = [];
        pairs.forEach(w => { cards.push(createCard(w.id, 'EN')); cards.push(createCard(w.id, 'HE')); });
        singlesA.forEach(w => cards.push(createCard(w.id, 'EN')));
        singlesB.forEach(w => cards.push(createCard(w.id, 'HE')));
        setBoard(cards.sort(() => Math.random() - 0.5));
    };

    const createCard = (wordId, type) => {
        const w = MASTER_WORDS.find(x => x.id === wordId);
        return {
            id: `c_${w.id}_${type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            wordId: w.id, text: type === 'EN' ? w.english : w.hebrew, type: type, createdAt: Date.now()
        };
    };

    const refillSlots = (indicesToFill) => {
        const remainingCards = board.filter((_, idx) => !indicesToFill.includes(idx));
        const enCount = remainingCards.filter(c => c.type === 'EN').length;
        const heCount = remainingCards.filter(c => c.type === 'HE').length;
        let targetEn = 6 - enCount, targetHe = 6 - heCount;
        const newCards = [];
        const lonelyCards = remainingCards.filter(c => !remainingCards.some(other => other.wordId === c.wordId && other.type !== c.type));

        if (lonelyCards.length > 0) {
            const rescueTarget = lonelyCards.sort((a,b) => a.createdAt - b.createdAt)[0];
            const neededType = rescueTarget.type === 'EN' ? 'HE' : 'EN';
            if ((neededType === 'EN' && targetEn > 0) || (neededType === 'HE' && targetHe > 0)) {
                newCards.push(createCard(rescueTarget.wordId, neededType));
                if (neededType === 'EN') targetEn--; else targetHe--;
            }
        }
        const existingIds = new Set([...remainingCards.map(c => c.wordId), ...newCards.map(c => c.wordId)]);
        while (targetEn > 0 || targetHe > 0) {
            const w = MASTER_WORDS[Math.floor(Math.random() * MASTER_WORDS.length)];
            if (!existingIds.has(w.id)) {
                if (targetEn > 0) { newCards.push(createCard(w.id, 'EN')); targetEn--; existingIds.add(w.id); } 
                else if (targetHe > 0) { newCards.push(createCard(w.id, 'HE')); targetHe--; existingIds.add(w.id); }
            }
        }
        const nextBoard = [...board];
        const shuffledNew = newCards.sort(() => Math.random() - 0.5);
        indicesToFill.forEach((idx, i) => nextBoard[idx] = shuffledNew[i]);
        setBoard(nextBoard);
        if (!nextBoard.some((c1, i) => nextBoard.some((c2, j) => i !== j && c1.wordId === c2.wordId))) setShowSummary(true);
    };

    const handleCardClick = (card, index) => {
        if (isLocked) return;
        if (selected.length === 1 && selected[0].index === index) { setSelected([]); return; }
        if (selected.find(s => s.index === index)) return;
        
        const newSelected = [...selected, { ...card, index }];
        setSelected(newSelected);

        if (newSelected.length === 2) {
            setIsLocked(true);
            const [c1, c2] = newSelected;
            if (c1.wordId === c2.wordId && c1.type !== c2.type) {
                setMatchesFound(p => p + 1);
                updateWord(c1.wordId, { status: STATUS.KNOWN }); 
                addToSummary(c1.wordId, STATUS.KNOWN); 
                setTimeout(() => { refillSlots([c1.index, c2.index]); setSelected([]); setIsLocked(false); setHintIndices([]); }, 400);
            } else {
                updateWord(c1.wordId, { status: STATUS.LEARN });
                updateWord(c2.wordId, { status: STATUS.LEARN });
                addToSummary(c1.wordId, STATUS.LEARN); 
                addToSummary(c2.wordId, STATUS.LEARN); 
                setTimeout(() => {
                    const indicesToRemove = [c1.index, c2.index];
                    board.forEach((c, idx) => {
                        if (idx !== c1.index && idx !== c2.index && (c.wordId === c1.wordId || c.wordId === c2.wordId)) indicesToRemove.push(idx);
                    });
                    refillSlots(indicesToRemove); setSelected([]); setIsLocked(false);
                }, 1000);
            }
        }
    };

    const handleHint = () => {
        if (hintIndices.length > 0 || isLocked) return;
        let foundIndices = [];
        for (let i = 0; i < board.length; i++) {
            for (let j = i + 1; j < board.length; j++) {
                if (board[i].wordId === board[j].wordId) { foundIndices = [i, j]; break; }
            }
            if (foundIndices.length > 0) break;
        }
        if (foundIndices.length === 2) {
            const wordId = board[foundIndices[0]].wordId;
            const newStatus = (progress[wordId]?.status || STATUS.UNSEEN) === STATUS.KNOWN ? STATUS.WEAK : STATUS.LEARN;
            updateWord(wordId, { status: newStatus, streak: 0 });
            addToSummary(wordId, newStatus); 
            setHintIndices(foundIndices); setTimeout(() => setHintIndices([]), 500);
        }
    };

    const addToSummary = (wordId, status) => {
        setSessionResults(prev => {
            const word = MASTER_WORDS.find(w => w.id === wordId);
            if (!word) return prev;
            return [...prev.filter(item => item.id !== wordId), { ...word, status }];
        });
    };

    const toggleSummaryStatus = (idx) => {
        const item = sessionResults[idx];
        const nextStatus = [STATUS.LEARN, STATUS.WEAK, STATUS.KNOWN][([STATUS.LEARN, STATUS.WEAK, STATUS.KNOWN].indexOf(item.status) + 1) % 3];
        const newResults = [...sessionResults]; newResults[idx] = { ...item, status: nextStatus };
        setSessionResults(newResults); updateWord(item.id, { status: nextStatus });
    };

    const toggleSpelling = (id) => {
        const currentFlag = progress[id]?.flag_spelling;
        updateWord(id, { flag_spelling: !currentFlag });
    };

    if (showSummary) {
        return (
            <div className="h-[100dvh] bg-gray-50 flex flex-col text-right" dir="rtl">
                <Header title="סיכום משחק" onBack={() => setView('GAMES_MENU')} subtitle={`בוצעו ${matchesFound} התאמות`} />
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {sessionResults.length === 0 && <div className="text-center text-gray-400 mt-10">לא בוצעו מהלכים.</div>}
                    {sessionResults.map((item, idx) => {
                        const isSpelling = progress[item.id]?.flag_spelling;
                        return (
                            <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                                <div><div className="font-bold text-gray-800">{item.english}</div><div className="text-sm text-gray-500">{item.hebrew}</div></div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => toggleSpelling(item.id)} className={`p-2 rounded-lg border ${isSpelling ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 'bg-gray-50 text-gray-300 border-gray-100'}`}>
                                        <Languages size={18}/>
                                    </button>
                                    <button onClick={() => toggleSummaryStatus(idx)} className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border shrink-0 ${item.status === STATUS.KNOWN ? 'bg-green-50 text-green-700 border-green-200' : item.status === STATUS.WEAK ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                        {item.status === STATUS.KNOWN ? 'יודע' : item.status === STATUS.WEAK ? 'לחיזוק' : 'ללמידה'}
                                        <Edit3 size={14} className="opacity-50"/>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="p-4 bg-white border-t border-gray-100"><Button onClick={() => setView('GAMES_MENU')} className="w-full py-4 text-lg">חזור לתפריט</Button></div>
            </div>
        );
    }

    return (
        <div className="h-[100dvh] bg-gray-50 flex flex-col text-right" dir="rtl">
             <Header 
                title="Match" 
                onBack={() => setShowSummary(true)} 
                subtitle={`זוגות שנמצאו: ${matchesFound}`}
                extraLeft={
                    <button onClick={handleHint} className="bg-amber-100 text-amber-700 p-2 rounded-full hover:bg-amber-200 transition-colors">
                        <Lightbulb size={20}/>
                    </button>
                }
            />
            
            <div className="grid grid-cols-3 gap-3 p-4 content-start flex-1 overflow-y-auto">
                {board.map((card, idx) => {
                    const isSelected = selected.find(s => s.index === idx);
                    const isHinted = hintIndices.includes(idx);
                    const isWrong = selected.length === 2 && selected[0].wordId !== selected[1].wordId && isSelected;
                    
                    return (
                        <button 
                            key={card.id || idx}
                            onClick={() => handleCardClick(card, idx)}
                            className={`h-28 rounded-2xl font-bold shadow-sm text-sm p-1 break-words flex items-center justify-center transition-all border-b-4 active:border-b-0 active:translate-y-1 outline-none focus:outline-none ring-0
                                ${isWrong ? 'bg-red-500 text-white border-red-700 animate-shake' : 
                                  isHinted ? 'bg-amber-100 text-amber-800 border-amber-300 ring-2 ring-amber-400 scale-105' :
                                  isSelected ? 'bg-indigo-600 text-white border-indigo-800 scale-95' : 
                                  'bg-white text-gray-700 border-gray-200 hover:border-indigo-200 hover:text-indigo-600'}
                            `}
                        >
                            {card.text}
                        </button>
                    );
                })}
            </div>
            <div className="p-4 bg-white border-t border-gray-100">
                <Button onClick={() => setShowSummary(true)} variant="outline" className="w-full">סיום משחק</Button>
            </div>
        </div>
    );
};

// =================================================================================
// GAME 4: SPELLING BEE
// =================================================================================
const SpellingGame = ({ progress, updateWord, setView }) => {
    const [queue, setQueue] = useState([]);
    const [current, setCurrent] = useState(0);
    const [input, setInput] = useState('');
    const [feedback, setFeedback] = useState(null); // null, 'CORRECT', 'WRONG'
    const [showSummary, setShowSummary] = useState(false);
    const [score, setScore] = useState(0);

    // טעינת מילים שסומנו לאיות
    useEffect(() => {
        const pool = MASTER_WORDS.filter(w => progress[w.id]?.flag_spelling === true);
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
// WORD BANK VIEW
// =================================================================================
const WordBankView = ({ setView, progress, updateWord }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTab, setFilterTab] = useState('ALL'); 

    const stats = {
        ALL: MASTER_WORDS.length,
        KNOWN: MASTER_WORDS.filter(w => (progress[w.id]?.status === STATUS.KNOWN)).length,
        WEAK: MASTER_WORDS.filter(w => (progress[w.id]?.status === STATUS.WEAK)).length,
        LEARN: MASTER_WORDS.filter(w => (!progress[w.id]?.status || progress[w.id]?.status === STATUS.UNSEEN || progress[w.id]?.status === STATUS.LEARN)).length
    };

    const filteredWords = MASTER_WORDS.filter(word => {
        const status = progress[word.id]?.status || STATUS.UNSEEN;
        const matchesSearch = word.english.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              word.hebrew.includes(searchTerm);
        
        if (!matchesSearch) return false;

        if (filterTab === 'ALL') return true;
        if (filterTab === 'KNOWN') return status === STATUS.KNOWN;
        if (filterTab === 'WEAK') return status === STATUS.WEAK;
        if (filterTab === 'LEARN') return (status === STATUS.UNSEEN || status === STATUS.LEARN);
        return true;
    });

    const getStatusIcon = (status) => {
        switch(status) {
            case STATUS.KNOWN: return <Check size={18} className="text-green-500"/>;
            case STATUS.WEAK: return <Eye size={18} className="text-amber-500"/>;
            case STATUS.LEARN: return <BookOpen size={18} className="text-indigo-400"/>;
            default: return <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>;
        }
    };

    return (
        <div className="h-[100dvh] flex flex-col bg-gray-50" dir="rtl">
            <Header title="מאגר מילים" onBack={() => setView('DASHBOARD')} subtitle={`סה"כ ${stats.ALL} מילים`} />

            <div className="bg-white p-4 shadow-sm z-10 space-y-3">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="חפש מילה באנגלית או בעברית..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-100 text-gray-800 rounded-xl py-3 px-10 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-right"
                    />
                    <div className="absolute top-3 right-3 text-gray-400">
                        <SearchIcon size={20}/> 
                    </div>
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute top-3 left-3 text-gray-400">
                            <X size={20}/>
                        </button>
                    )}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {[
                        { id: 'ALL', label: 'הכל', count: stats.ALL },
                        { id: 'KNOWN', label: 'יודע', count: stats.KNOWN, color: 'green' },
                        { id: 'WEAK', label: 'לחיזוק', count: stats.WEAK, color: 'amber' },
                        { id: 'LEARN', label: 'ללמידה', count: stats.LEARN, color: 'indigo' }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setFilterTab(tab.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2 border
                                ${filterTab === tab.id 
                                    ? `bg-${tab.color || 'gray'}-100 text-${tab.color || 'gray'}-800 border-${tab.color || 'gray'}-300` 
                                    : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'}`}
                        >
                            {tab.label} <span className="text-xs opacity-60">({tab.count})</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredWords.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10 flex flex-col items-center">
                        <div className="bg-gray-100 p-4 rounded-full mb-3"><SearchIcon size={32} className="opacity-50"/></div>
                        <p>לא נמצאו מילים תואמות</p>
                    </div>
                ) : (
                    filteredWords.map(word => {
                        const status = progress[word.id]?.status || STATUS.UNSEEN;
                        const isSpelling = progress[word.id]?.flag_spelling;
                        return (
                            <div key={word.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center group active:scale-[0.99] transition-transform">
                                <div className="flex-1 flex flex-col items-start text-right">
                                    <span className="font-bold text-gray-800 text-lg leading-tight" dir="ltr">{word.english}</span>
                                    <span className="text-gray-500 text-sm mt-0.5">{word.hebrew}</span>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); updateWord(word.id, { flag_spelling: !isSpelling }); }}
                                        className={`p-2 rounded-lg transition-colors border ${isSpelling ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 'bg-gray-50 text-gray-300 border-gray-100'}`}
                                    >
                                        <Languages size={18}/>
                                    </button>
                                    <span className="text-xs font-medium text-gray-300 bg-gray-50 px-2 py-1 rounded-md min-w-[3rem] text-center">
                                        {word.partOfSpeech}
                                    </span>
                                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50">
                                        {getStatusIcon(status)}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

// =================================================================================
// PROGRESS VIEW
// =================================================================================
const ProgressView = ({ setView, progress, updateWord }) => {
    const [activeTab, setActiveTab] = useState('UNSEEN'); // UNSEEN, LEARN, WEAK, KNOWN
    const [showSpellingOnly, setShowSpellingOnly] = useState(false); // Filter toggle
    const [editingWord, setEditingWord] = useState(null);

    const stats = {
        total: MASTER_WORDS.length,
        known: MASTER_WORDS.filter(w => progress[w.id]?.status === STATUS.KNOWN).length,
        weak: MASTER_WORDS.filter(w => progress[w.id]?.status === STATUS.WEAK).length,
        learn: MASTER_WORDS.filter(w => progress[w.id]?.status === STATUS.LEARN).length,
        unseen: MASTER_WORDS.filter(w => !progress[w.id]?.status || progress[w.id]?.status === STATUS.UNSEEN).length,
        spelling: MASTER_WORDS.filter(w => progress[w.id]?.flag_spelling).length
    };

    const displayWords = MASTER_WORDS.filter(w => {
        if (showSpellingOnly) {
            return progress[w.id]?.flag_spelling === true;
        }

        const s = progress[w.id]?.status || STATUS.UNSEEN;
        if (activeTab === 'KNOWN') return s === STATUS.KNOWN;
        if (activeTab === 'WEAK') return s === STATUS.WEAK;
        if (activeTab === 'LEARN') return s === STATUS.LEARN;
        if (activeTab === 'UNSEEN') return s === STATUS.UNSEEN;
        return false;
    });

    const handleManualUpdate = (newStatus) => {
        if (editingWord) {
            updateWord(editingWord.id, { status: newStatus, streak: 0 });
            setEditingWord(null);
        }
    };

    const toggleSpellingFlag = (e, wordId) => {
        e.stopPropagation();
        const current = progress[wordId]?.flag_spelling || false;
        updateWord(wordId, { flag_spelling: !current });
    };

    const TabButton = ({ id, label, color, icon: Icon, count }) => (
        <button 
            onClick={() => { setActiveTab(id); setShowSpellingOnly(false); }} 
            className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all border-2
            ${activeTab === id && !showSpellingOnly 
                ? `bg-${color}-50 border-${color}-200 text-${color}-700 shadow-sm` 
                : 'bg-white border-transparent text-gray-400 hover:bg-gray-50'}`}
        >
            <span className="text-xl font-bold">{count}</span>
            <span className="text-xs font-medium flex items-center gap-1"><Icon size={12}/> {label}</span>
        </button>
    );

    return (
        <div className="h-[100dvh] flex flex-col bg-gray-50" dir="rtl">
            <Header 
                title={showSpellingOnly ? "רשימת איות" : "התקדמות"} 
                onBack={() => setView('DASHBOARD')} 
                subtitle={showSpellingOnly ? "מילים שסומנו לתרגול איות" : "ניהול סטטוסים"}
                extraLeft={
                    <button 
                        onClick={() => setShowSpellingOnly(!showSpellingOnly)}
                        className={`p-2 rounded-lg font-bold transition-all flex items-center gap-2 text-sm border
                        ${showSpellingOnly 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                            : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}
                    >
                        <Languages size={18}/> {showSpellingOnly ? 'סגור איות' : 'רשימת איות'}
                    </button>
                }
            />

            {!showSpellingOnly && (
                <div className="p-4 grid grid-cols-4 gap-2">
                    <TabButton id="UNSEEN" label="חדש" count={stats.unseen} color="gray" icon={CircleDashed}/>
                    <TabButton id="LEARN" label="ללמידה" count={stats.learn} color="indigo" icon={BookOpen}/>
                    <TabButton id="WEAK" label="לחיזוק" count={stats.weak} color="amber" icon={Eye}/>
                    <TabButton id="KNOWN" label="יודע" count={stats.known} color="green" icon={Check}/>
                </div>
            )}

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                {displayWords.length === 0 ? (
                    <div className="text-center text-gray-400 mt-20 flex flex-col items-center">
                        <div className="bg-gray-100 p-4 rounded-full mb-3"><CircleDashed size={32} className="opacity-50"/></div>
                        <p>{showSpellingOnly ? 'לא סומנו מילים לאיות' : 'אין מילים ברשימה זו'}</p>
                    </div>
                ) : (
                    displayWords.map(word => {
                         const isSpelling = progress[word.id]?.flag_spelling;
                         return (
                            <div 
                                key={word.id} 
                                onClick={() => setEditingWord(word)}
                                className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center group active:scale-[0.99] transition-transform cursor-pointer"
                            >
                                <div className="text-right">
                                    <div className="font-bold text-gray-800 text-lg leading-tight" dir="ltr">{word.english}</div>
                                    <div className="text-gray-500 text-sm">{word.hebrew}</div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={(e) => toggleSpellingFlag(e, word.id)}
                                        className={`p-2 rounded-full transition-colors border ${isSpelling ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 'bg-gray-50 text-gray-300 border-transparent hover:border-gray-200'}`}
                                    >
                                        <Languages size={18}/>
                                    </button>
                                    <div className="w-8 h-8 flex items-center justify-center text-gray-300">
                                        <Edit3 size={18}/>
                                    </div>
                                </div>
                            </div>
                         );
                    })
                )}
            </div>

            {editingWord && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setEditingWord(null)}>
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-800" dir="ltr">{editingWord.english}</h3>
                            <p className="text-gray-500">{editingWord.hebrew}</p>
                            <div className="mt-4 inline-block bg-gray-100 px-3 py-1 rounded-full text-xs font-bold text-gray-500">
                                עריכת סטטוס
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <Button variant="outline" onClick={() => handleManualUpdate(STATUS.KNOWN)} className="w-full border-green-200 hover:bg-green-50 text-green-700 justify-between">
                                <span>יודע (KNOWN)</span> <Check size={18} className="bg-green-200 rounded-full p-0.5"/>
                            </Button>
                            <Button variant="outline" onClick={() => handleManualUpdate(STATUS.WEAK)} className="w-full border-amber-200 hover:bg-amber-50 text-amber-700 justify-between">
                                <span>לחיזוק (WEAK)</span> <Eye size={18} className="bg-amber-200 rounded-full p-0.5"/>
                            </Button>
                            <Button variant="outline" onClick={() => handleManualUpdate(STATUS.LEARN)} className="w-full border-indigo-200 hover:bg-indigo-50 text-indigo-700 justify-between">
                                <span>ללמידה (LEARN)</span> <BookOpen size={18} className="bg-indigo-200 rounded-full p-0.5"/>
                            </Button>
                             <Button variant="outline" onClick={() => handleManualUpdate(STATUS.UNSEEN)} className="w-full border-gray-200 hover:bg-gray-50 text-gray-500 justify-between">
                                <span>לא נראה (UNSEEN)</span> <CircleDashed size={18} className="bg-gray-200 rounded-full p-0.5"/>
                            </Button>
                        </div>

                        <button onClick={() => setEditingWord(null)} className="mt-6 w-full py-3 text-gray-400 font-bold hover:text-gray-600">
                            ביטול
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// =================================================================================
// TASKS VIEW (משימות ותרגול + מחולל משופר)
// =================================================================================
const TasksView = ({ setView, progress }) => {
    const [learnCount, setLearnCount] = useState(10);
    const [reviewCount, setReviewCount] = useState(20);
    const [generatedList, setGeneratedList] = useState(null);
    const [isCopied, setIsCopied] = useState(false);

    const availableStats = {
        learn: MASTER_WORDS.filter(w => progress[w.id]?.status === STATUS.LEARN).length,
        weak: MASTER_WORDS.filter(w => progress[w.id]?.status === STATUS.WEAK).length,
        known: MASTER_WORDS.filter(w => progress[w.id]?.status === STATUS.KNOWN).length
    };
    
    const totalActive = availableStats.learn + availableStats.weak + availableStats.known;
    const isPoolEmpty = totalActive < 5;

    const generateList = () => {
        let poolLearn = MASTER_WORDS.filter(w => progress[w.id]?.status === STATUS.LEARN);
        let poolWeak = MASTER_WORDS.filter(w => progress[w.id]?.status === STATUS.WEAK);
        let poolKnown = MASTER_WORDS.filter(w => progress[w.id]?.status === STATUS.KNOWN);

        let listA = poolLearn.sort(() => Math.random() - 0.5).slice(0, learnCount);
        if (listA.length < learnCount) {
            const needed = learnCount - listA.length;
            const fromWeak = poolWeak.sort(() => Math.random() - 0.5).slice(0, needed);
            listA = [...listA, ...fromWeak];
        }

        const usedIds = new Set(listA.map(w => w.id));
        let poolReview = [...poolWeak, ...poolKnown].filter(w => !usedIds.has(w.id));
        let listB = poolReview.sort(() => Math.random() - 0.5).slice(0, reviewCount);

        const date = new Date().toLocaleDateString('he-IL');
        
        let content = `📅 רשימת תרגול - VocabMaster\nתאריך: ${date}\n`;
        content += `===================================\n\n`;
        
        if (listA.length > 0) {
            content += `🔵 מיקוד למידה (${listA.length} מילים)\n`;
            content += `-----------------------------------\n`;
            listA.forEach((w, i) => content += `${i+1}. ${w.english}  -  ${w.hebrew}\n`);
            content += `\n\n`;
        }

        if (listB.length > 0) {
            content += `🟢 חזרה ושינון (${listB.length} מילים)\n`;
            content += `-----------------------------------\n`;
            listB.forEach((w, i) => content += `${i+1}. ${w.english}  -  ${w.hebrew}\n`);
        }

        if (listA.length === 0 && listB.length === 0) {
            content = "לא נמצאו מילים מתאימות לייצוא על פי ההגדרות.";
        }

        setGeneratedList(content);
        setIsCopied(false);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedList);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const downloadFile = () => {
        const element = document.createElement("a");
        const file = new Blob(['\uFEFF' + generatedList], {type: 'text/plain;charset=utf-8'});
        element.href = URL.createObjectURL(file);
        element.download = `Vocab_List_${new Date().toLocaleDateString('he-IL').replace(/\./g,'-')}.txt`;
        document.body.appendChild(element);
        element.click();
    };

    return (
        <div className="h-[100dvh] flex flex-col bg-gray-50" dir="rtl">
            <Header title="משימות ותרגול" onBack={() => setView('DASHBOARD')} subtitle="כלים ללמידה אקטיבית" />
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                <Button 
                    variant="outline" 
                    onClick={() => setView('GAME_SPELLING')} 
                    className="w-full py-6 text-xl justify-between px-6 group border-b-4 active:border-b-2 active:translate-y-0.5 border-indigo-100 hover:border-indigo-200"
                >
                    <div className="flex flex-col items-start gap-1">
                        <span className="flex items-center gap-3 font-bold text-gray-800">
                            <Edit3 className="text-indigo-600" size={24}/> אימון איות
                        </span>
                        <span className="text-xs text-gray-400 font-normal mr-9">הקלדת מילים שסומנו לאיות</span>
                    </div>
                    <Play size={20} className="text-gray-300 group-hover:text-indigo-600 transform rotate-180"/>
                </Button>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-4 border-b pb-4">
                        <ClipboardList className="text-teal-600" size={24}/>
                        <h2 className="text-xl font-bold text-gray-800">מחולל משימות</h2>
                    </div>

                    {isPoolEmpty ? (
                        <div className="text-center py-6 bg-red-50 rounded-xl border border-red-100">
                            <CircleDashed className="mx-auto text-red-300 mb-2" size={32}/>
                            <h3 className="font-bold text-red-800">המאגרים ריקים</h3>
                            <p className="text-sm text-red-600 mt-1 px-4">
                                כדי לייצר משימות, עליך קודם לסווג מילים ממאגר "חדש" (Unseen) במשחק המיון.
                            </p>
                            <Button onClick={() => setView('GAME_SWIPE')} className="mt-4 mx-auto text-sm" variant="danger">עבור למיון מילים</Button>
                        </div>
                    ) : (
                        <>
                            {!generatedList && (
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="font-bold text-gray-700">מיקוד למידה</label>
                                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-sm font-bold">{learnCount}</span>
                                        </div>
                                        <input 
                                            type="range" min="10" max="30" step="1" 
                                            value={learnCount} 
                                            onChange={(e) => setLearnCount(parseInt(e.target.value))}
                                            className="w-full accent-blue-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">מושך מ-'ללמידה' ומשלים מ-'לחיזוק'</p>
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="font-bold text-gray-700">חזרה ותרגול</label>
                                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-sm font-bold">{reviewCount}</span>
                                        </div>
                                        <input 
                                            type="range" min="10" max="100" step="5" 
                                            value={reviewCount} 
                                            onChange={(e) => setReviewCount(parseInt(e.target.value))}
                                            className="w-full accent-green-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">מושך מ-'לחיזוק' ו-'יודע'</p>
                                    </div>

                                    <Button onClick={generateList} className="w-full py-4 text-lg bg-teal-600 hover:bg-teal-700 shadow-teal-200">
                                        צור רשימה
                                    </Button>
                                </div>
                            )}

                            {generatedList && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm font-mono whitespace-pre-wrap h-64 overflow-y-auto mb-4 text-gray-800 leading-relaxed" dir="ltr">
                                        {generatedList}
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <Button onClick={copyToClipboard} variant="outline" className={`flex-1 ${isCopied ? 'border-green-500 text-green-600 bg-green-50' : ''}`}>
                                            {isCopied ? <Check size={18}/> : <Copy size={18}/>}
                                            {isCopied ? 'הועתק!' : 'העתק'}
                                        </Button>
                                        <Button onClick={downloadFile} variant="outline" className="flex-1">
                                            <Download size={18}/> קובץ
                                        </Button>
                                    </div>
                                    <button onClick={() => setGeneratedList(null)} className="w-full mt-4 text-gray-400 text-sm hover:text-gray-600">
                                        צור רשימה חדשה
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// =================================================================================
// SUB-VIEWS (Games Menu)
// =================================================================================

const GamesMenuView = ({ setView }) => (
    <div className="h-[100dvh] flex flex-col bg-gray-50" dir="rtl">
        <Header title="מבדקים ומשחקים" onBack={() => setView('DASHBOARD')} subtitle="בחר משחק" />
        <div className="p-6 space-y-4">
             <Button variant="outline" onClick={() => setView('GAME_SWIPE')} className="w-full py-6 text-xl justify-between px-6 group border-b-4 active:border-b-2 active:translate-y-0.5">
                <span className="flex items-center gap-3"><BookOpen className="text-indigo-600"/> Swipe</span>
                <Play size={16} className="text-gray-300 group-hover:text-indigo-600 transform rotate-180"/>
            </Button>
            <Button variant="outline" onClick={() => setView('GAME_QUIZ')} className="w-full py-6 text-xl justify-between px-6 group border-b-4 active:border-b-2 active:translate-y-0.5">
                <span className="flex items-center gap-3"><Zap className="text-orange-500"/> Quiz</span>
                <Play size={16} className="text-gray-300 group-hover:text-orange-500 transform rotate-180"/>
            </Button>
            <Button variant="outline" onClick={() => setView('GAME_MATCH')} className="w-full py-6 text-xl justify-between px-6 group border-b-4 active:border-b-2 active:translate-y-0.5">
                <span className="flex items-center gap-3"><Brain className="text-purple-600"/> Match</span>
                <Play size={16} className="text-gray-300 group-hover:text-purple-600 transform rotate-180"/>
            </Button>
        </div>
    </div>
);

// =================================================================================
// MAIN DASHBOARD (מעודכן עם קרדיט)
// =================================================================================

const DashboardView = ({ setView, user }) => {
    const MenuCard = ({ icon: Icon, title, subtitle, color, onClick }) => (
        <button 
            onClick={onClick}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform h-40 w-full group outline-none focus:outline-none"
        >
            <div className={`p-4 rounded-full bg-${color}-50 group-hover:bg-${color}-100 transition-colors`}>
                <Icon size={32} className={`text-${color}-600 stroke-[1.5]`} />
            </div>
            <div className="text-center">
                <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
                <p className="text-gray-400 text-xs mt-1">{subtitle}</p>
            </div>
        </button>
    );

    return (
        <div className="h-[100dvh] bg-gray-50 flex flex-col font-sans" dir="rtl">
            <div className="bg-white p-6 pt-12 pb-6 shadow-sm border-b border-gray-100 sticky top-0 z-10">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">שלום, {user}</h1>
                        <p className="text-gray-400 text-sm">המשימה: 700 מילים</p>
                    </div>
                    <button className="text-gray-300 hover:text-indigo-600 transition-colors"><Settings size={28} strokeWidth={1.5}/></button>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-indigo-600 h-full w-[10%] rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)]"></div>
                </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto flex flex-col">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <MenuCard icon={BookOpen} title="מאגר מילים" subtitle="כל הרשימה" color="indigo" onClick={() => setView('WORD_BANK')}/>
                    <MenuCard icon={Gamepad2} title="מבדקים" subtitle="בחן את עצמך" color="indigo" onClick={() => setView('GAMES_MENU')}/>
                    <MenuCard icon={ClipboardList} title="משימות" subtitle="תרגול וייצוא" color="indigo" onClick={() => setView('TASKS')}/>
                    <MenuCard icon={TrendingUp} title="התקדמות" subtitle="ניהול ידע" color="indigo" onClick={() => setView('PROGRESS')}/>
                </div>
                
                {/* כאן הוספנו את הקרדיט בתחתית התפריט */}
                <div className="mt-auto pt-4 text-center">
                    <p className="text-[10px] text-gray-300">
                        גרסה 3.1 • נבנה באהבה
                    </p>
                    <p className="text-xs text-gray-400 font-medium mt-1">
                        ✨ שכוייח לעויזר, אהרן, וג'מיני
                    </p>
                </div>
            </div>
        </div>
    );
};

// --- APP ROOT ---
export default function VocabMasterApp() {
  const [view, setView] = useState('DASHBOARD');
  const [progress, setProgress] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedProgress = localStorage.getItem('vocab_offline_progress');
    const savedUser = localStorage.getItem('vocab_user_name');
    
    if (savedProgress) setProgress(JSON.parse(savedProgress));
    if (savedUser) setUser(savedUser);
  }, []);

  const updateWord = (id, updates) => {
    const newProgress = { ...progress };
    newProgress[id] = { ...(newProgress[id] || {}), ...updates };
    setProgress(newProgress);
    localStorage.setItem('vocab_offline_progress', JSON.stringify(newProgress));
  };

  const handleLogin = (name) => {
      setUser(name);
      localStorage.setItem('vocab_user_name', name);
      setView('DASHBOARD');
  };

  if (!user) {
      return <LoginView onLogin={handleLogin} />;
  }

  switch (view) {
      case 'DASHBOARD': return <DashboardView setView={setView} user={user} />;
      case 'WORD_BANK': return <WordBankView setView={setView} progress={progress} updateWord={updateWord} />;
      case 'GAMES_MENU': return <GamesMenuView setView={setView} />;
      case 'TASKS': return <TasksView setView={setView} progress={progress} />;
      case 'GAME_SPELLING': return <SpellingGame progress={progress} updateWord={updateWord} setView={setView} />;
      case 'PROGRESS': return <ProgressView setView={setView} progress={progress} updateWord={updateWord} />;
      case 'GAME_SWIPE': return <SwipeGame progress={progress} updateWord={updateWord} setView={setView} />;
      case 'GAME_QUIZ': return <QuizGame progress={progress} updateWord={updateWord} setView={setView} />;
      case 'GAME_MATCH': return <MatchGame progress={progress} updateWord={updateWord} setView={setView} />;
      default: return <DashboardView setView={setView} user={user} />;
  }
}