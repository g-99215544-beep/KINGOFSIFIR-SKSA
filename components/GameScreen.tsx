import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RetroButton, RetroPanel } from './RetroUI';
import { soundService } from '../services/soundService';
import { Player, Question } from '../types';

interface GameScreenProps {
  player: Player;
  onEndGame: (score: number, correctCount: number) => void;
}

const GAME_DURATION = 60;
const BONUS_TIME_LIMIT = 5; // seconds
const QUESTION_TIME_LIMIT = 10; // seconds

const GameScreen: React.FC<GameScreenProps> = ({ player, onEndGame }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [lives, setLives] = useState(2);
  const [question, setQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<{text: string, color: string} | null>(null);
  const [combo, setCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [qNumDisplay, setQNumDisplay] = useState(1);

  // Refs for timers to avoid closure stale state
  const questionStartTimeRef = useRef<number>(0);
  const questionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const questionNumberRef = useRef(1);
  
  // Generate a new question
  const generateQuestion = useCallback(() => {
    if (questionTimeoutRef.current) clearTimeout(questionTimeoutRef.current);

    const qIdx = questionNumberRef.current;
    setQNumDisplay(qIdx);

    let min1 = 1, max1 = 9, min2 = 1, max2 = 9;

    if (qIdx <= 5) {
      // Soalan 1-5: Senang (1-5 x 1-5)
      min1 = 1; max1 = 5;
      min2 = 1; max2 = 5;
    } else if (qIdx <= 10) {
      // Soalan 6-10: Sederhana (2-7 x 2-7)
      min1 = 2; max1 = 7;
      min2 = 2; max2 = 7;
    } else {
      // Soalan 11+: Susah (4-9 x 4-9)
      min1 = 4; max1 = 9;
      min2 = 4; max2 = 9;
    }

    const num1 = Math.floor(Math.random() * (max1 - min1 + 1)) + min1;
    const num2 = Math.floor(Math.random() * (max2 - min2 + 1)) + min2;
    const answer = num1 * num2;
    
    // Generate unique distractors
    const options = new Set<number>();
    options.add(answer);
    
    while (options.size < 4) {
      const offset = Math.floor(Math.random() * 5) + 1;
      const wrong = answer + (Math.random() > 0.5 ? offset : -offset);
      if (wrong > 0 && wrong !== answer) options.add(wrong);
    }
    
    const shuffledOptions = Array.from(options).sort(() => Math.random() - 0.5);
    
    setQuestion({ num1, num2, answer, options: shuffledOptions });
    questionStartTimeRef.current = Date.now();
    questionNumberRef.current += 1;
    
    // Set timeout for the question
    questionTimeoutRef.current = setTimeout(() => {
      handleTimeUp();
    }, QUESTION_TIME_LIMIT * 1000);
    
  }, []);

  // Initial Start
  useEffect(() => {
    generateQuestion();
    return () => {
      if (questionTimeoutRef.current) clearTimeout(questionTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Game Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        if (prev <= 11) { // Tick sound for last 10 seconds
            soundService.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check Game Over by Time
  useEffect(() => {
    if (timeLeft === 0) {
      endGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const endGame = () => {
    if (questionTimeoutRef.current) clearTimeout(questionTimeoutRef.current);
    onEndGame(score, correctCount);
  };

  const showFloatingFeedback = (text: string, color: string) => {
    setFeedback({ text, color });
    setTimeout(() => setFeedback(null), 800);
  };

  const handleTimeUp = () => {
    soundService.playWrong();
    setLives((prev) => {
      const newLives = prev - 1;
      if (newLives < 0) {
        endGame();
        return 0;
      }
      return newLives;
    });
    setCombo(0);
    showFloatingFeedback('MASA TAMAT!', 'text-red-500');
    generateQuestion();
  };

  const handleAnswer = (selected: number) => {
    if (!question) return;
    
    const timeTaken = (Date.now() - questionStartTimeRef.current) / 1000;
    
    if (selected === question.answer) {
      soundService.playCorrect();
      let points = 10;
      
      // Speed Bonus
      if (timeTaken < BONUS_TIME_LIMIT) {
        points += 5;
        showFloatingFeedback('PANTAS! +15', 'text-yellow-300');
      } else {
        showFloatingFeedback('BETUL! +10', 'text-green-400');
      }
      
      // Combo
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > 0 && newCombo % 3 === 0) {
        points += 20;
        showFloatingFeedback('KOMBO! +20', 'text-sky-300');
      }

      setScore((prev) => prev + points);
      setCorrectCount(prev => prev + 1);
    } else {
      soundService.playWrong();
      setCombo(0);
      showFloatingFeedback('SALAH!', 'text-red-500');
      setLives((prev) => {
        const newLives = prev - 1;
        if (newLives < 0) {
            // Trigger game over via useEffect on lives change or immediate
            // We'll let the next render handle it or call endGame directly if critical
            return -1; 
        }
        return newLives;
      });
    }
    generateQuestion();
  };
  
  // Watch lives to trigger game over immediately
  useEffect(() => {
      if (lives < 0) {
          endGame();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lives]);

  return (
    <div className="relative w-full max-w-md h-full">
      <RetroPanel className="h-full flex flex-col justify-between relative overflow-hidden">
        
        {/* Header Stats */}
        <div className="flex justify-between items-center mb-4 font-press-start text-xs sm:text-sm">
          <div className="text-white truncate max-w-[50%]">{player.name}</div>
          <div className="flex space-x-1">
            {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
              <span key={i} className="text-red-500 text-lg drop-shadow-md">❤️</span>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center mb-6 font-press-start text-sm sm:text-base border-b-4 border-black pb-4">
          <div>SKOR: <span className="text-yellow-300">{score}</span></div>
          <div className="text-xs text-mario-question">Q: {qNumDisplay}</div>
          <div>MASA: <span className={`${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}</span></div>
        </div>

        {/* Question Area */}
        <div className="flex-1 flex flex-col justify-center items-center relative w-full">
            
            <div className="relative w-full mb-8">
                {/* Notification Badge - Positioned above question, small and non-intrusive */}
                {feedback && (
                    <div className="absolute -top-12 left-0 w-full flex justify-center z-10 pointer-events-none">
                         <div className={`font-press-start text-xs ${feedback.color} bg-black/80 px-3 py-2 border-2 border-white/30 rounded shadow-lg animate-bounce`}>
                             {feedback.text}
                         </div>
                    </div>
                )}

                <div className="bg-black/20 p-6 w-full text-center border-4 border-black rounded-lg">
                    <p className="text-5xl sm:text-6xl font-press-start text-white drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
                        {question ? `${question.num1}x${question.num2}` : '...'}
                    </p>
                </div>
            </div>
            
             {/* Question Timer Bar (Animation handled by CSS keyframes ideally, but inline style works for dynamic reset) */}
             <div className="w-full h-4 border-2 border-black bg-black mb-8 relative">
                 <div 
                   key={question ? `${question.num1}-${question.num2}-${combo}` : 'init'} // Force re-render for animation reset
                   className="h-full bg-yellow-400 origin-left"
                   style={{
                       animation: `shrink ${QUESTION_TIME_LIMIT}s linear forwards`
                   }}
                 />
                 <div className="absolute top-0 left-0 h-full w-full border-r-2 border-white/30" style={{ width: `${(BONUS_TIME_LIMIT / QUESTION_TIME_LIMIT) * 100}%`}}></div>
             </div>
        </div>

        {/* Answer Grid */}
        <div className="grid grid-cols-2 gap-4 mt-auto">
            {question?.options.map((opt, idx) => (
                <RetroButton 
                    key={idx} 
                    onClick={() => handleAnswer(opt)}
                    className="text-2xl sm:text-3xl py-6"
                >
                    {opt}
                </RetroButton>
            ))}
        </div>

      </RetroPanel>
      
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default GameScreen;