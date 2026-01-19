import React from 'react';
import { RetroButton, RetroPanel } from './RetroUI';

interface GameOverScreenProps {
  score: number;
  isScoreSaved: boolean;
  onRestart: () => void;
  onShowLeaderboard: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ 
  score, 
  isScoreSaved,
  onRestart, 
  onShowLeaderboard 
}) => {
  return (
    <RetroPanel className="w-full max-w-md text-center animate-slide-up">
      <h2 className="text-2xl sm:text-3xl font-press-start mb-6 text-red-500 text-shadow-retro">TAMAT!</h2>
      
      {!isScoreSaved && (
        <div className="bg-yellow-100 border-2 border-yellow-500 p-2 mb-4 animate-pulse">
           <p className="font-press-start text-[10px] text-yellow-800 leading-relaxed">
             MOD LATIHAN<br/>
             (Luar Waktu Sekolah)<br/>
             Markah tidak direkodkan.
           </p>
        </div>
      )}

      <div className="bg-black/20 p-4 mb-6 border-4 border-black/50">
        <p className="text-sm font-press-start mb-2">MARKAH ANDA</p>
        <p className="text-5xl sm:text-6xl font-press-start text-yellow-300 drop-shadow-md">{score}</p>
      </div>

      <div className="space-y-3">
        <RetroButton onClick={onRestart} fullWidth>
          MAIN SEMULA
        </RetroButton>
        <RetroButton onClick={onShowLeaderboard} variant="secondary" fullWidth>
          PAPAN MARKAH
        </RetroButton>
      </div>
    </RetroPanel>
  );
};

export default GameOverScreen;
