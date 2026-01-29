import React, { useEffect, useState, useRef } from 'react';
import { RetroButton, RetroPanel, CrownIcon } from './RetroUI';
import { getScores } from '../services/storageService';
import { ScoreRecord } from '../types';

interface GameOverScreenProps {
  score: number;
  isScoreSaved: boolean;
  playerName: string;
  playerClass: string;
  onRestart: () => void;
  onShowLeaderboard: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({
  score,
  isScoreSaved,
  playerName,
  playerClass,
  onRestart,
  onShowLeaderboard
}) => {
  const [rankings, setRankings] = useState<ScoreRecord[]>([]);
  const [currentPlayerRank, setCurrentPlayerRank] = useState<number>(0);
  const [totalPlayers, setTotalPlayers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const currentPlayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadRankings = async () => {
      setIsLoading(true);
      const allScores = await getScores();
      // Sort descending by score
      allScores.sort((a, b) => b.score - a.score);
      setRankings(allScores);
      setTotalPlayers(allScores.length);

      // Find current player's rank
      // Since the scores are sorted, find the first occurrence with matching score
      // In case of ties, find the exact record by name and class
      let rank = 0;
      for (let i = 0; i < allScores.length; i++) {
        if (allScores[i].name === playerName &&
            allScores[i].className === playerClass &&
            allScores[i].score === score) {
          rank = i + 1;
          break;
        }
      }
      setCurrentPlayerRank(rank);
      setIsLoading(false);
    };

    if (isScoreSaved) {
      loadRankings();
    } else {
      setIsLoading(false);
    }
  }, [isScoreSaved, playerName, playerClass, score]);

  // Auto-scroll to current player's position
  useEffect(() => {
    if (!isLoading && currentPlayerRef.current) {
      currentPlayerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [isLoading, currentPlayerRank]);

  return (
    <RetroPanel className="w-full max-w-lg text-center animate-slide-up h-[85vh] flex flex-col">
      <h2 className="text-2xl sm:text-3xl font-press-start mb-4 text-red-500 text-shadow-retro">TAMAT!</h2>

      {!isScoreSaved && (
        <div className="bg-yellow-100 border-2 border-yellow-500 p-2 mb-4 animate-pulse">
           <p className="font-press-start text-[10px] text-yellow-800 leading-relaxed">
             MOD LATIHAN<br/>
             (Luar Waktu Sekolah)<br/>
             Markah tidak direkodkan.
           </p>
        </div>
      )}

      <div className="bg-black/20 p-3 mb-4 border-4 border-black/50">
        <p className="text-xs font-press-start mb-1">MARKAH ANDA</p>
        <p className="text-4xl sm:text-5xl font-press-start text-yellow-300 drop-shadow-md">{score}</p>
        {isScoreSaved && currentPlayerRank > 0 && (
          <p className="text-xs font-press-start mt-2 text-white">
            KEDUDUKAN: {currentPlayerRank}/{totalPlayers}
          </p>
        )}
      </div>

      {/* Rankings Display - Only show if score is saved */}
      {isScoreSaved && (
        <div className="flex-1 overflow-y-auto bg-black/20 border-4 border-black p-2 mb-4 space-y-2 custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="font-press-start text-xs text-yellow-300 animate-pulse">LOADING RANKING...</p>
            </div>
          ) : rankings.length === 0 ? (
            <p className="text-center font-press-start text-xs text-white mt-10">TIADA REKOD LAGI.</p>
          ) : (
            rankings.map((record, index) => {
              const isCurrentPlayer = record.name === playerName &&
                                     record.className === playerClass &&
                                     record.score === score &&
                                     (index + 1) === currentPlayerRank;

              return (
                <div
                  key={`${record.id}-${index}`}
                  ref={isCurrentPlayer ? currentPlayerRef : null}
                  className={`flex justify-between items-center p-3 border-2 transition-all ${
                    isCurrentPlayer
                      ? 'bg-green-400 border-green-600 scale-105 shadow-lg'
                      : index === 0
                        ? 'bg-yellow-400 border-black/50'
                        : 'bg-white border-black/50'
                  } text-black`}
                >
                  <div className="flex items-center gap-3">
                     <span className="font-press-start text-xs w-8">{index + 1}.</span>
                     <div className="flex flex-col text-left">
                        <span className={`font-press-start text-xs sm:text-sm ${isCurrentPlayer ? 'font-bold' : ''}`}>
                          {record.name}
                          {isCurrentPlayer && ' (ANDA)'}
                        </span>
                        <span className="font-press-start text-[10px] opacity-70">{record.className}</span>
                     </div>
                  </div>
                  <div className="font-press-start text-sm sm:text-base">
                    {record.score}
                    {index === 0 && <CrownIcon className="w-4 h-4 inline ml-1 -mt-1" />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <div className="space-y-3 mt-auto">
        <RetroButton onClick={onRestart} fullWidth>
          MAIN SEMULA
        </RetroButton>
        <RetroButton onClick={onShowLeaderboard} variant="secondary" fullWidth>
          PAPAN MARKAH PENUH
        </RetroButton>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #000;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #fcd834;
          border: 2px solid #000;
        }
      `}</style>
    </RetroPanel>
  );
};

export default GameOverScreen;
