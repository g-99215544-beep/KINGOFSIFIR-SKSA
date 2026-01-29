import React, { useState } from 'react';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import GameOverScreen from './components/GameOverScreen';
import Leaderboard from './components/Leaderboard';
import { ScreenState, Player } from './types';
import { saveScore } from './services/storageService';

const App: React.FC = () => {
  const [screen, setScreen] = useState<ScreenState>(ScreenState.START);
  const [player, setPlayer] = useState<Player>({ name: '', className: '' });
  const [finalScore, setFinalScore] = useState(0);
  const [isScoreSaved, setIsScoreSaved] = useState(false); // New state to track if ranked

  const handleStartGame = (newPlayer: Player) => {
    setPlayer(newPlayer);
    setScreen(ScreenState.PLAYING);
  };

  const handleEndGame = async (score: number, correctCount: number) => {
    setFinalScore(score);
    // Cuba simpan markah. saveScore akan return false jika luar waktu sekolah.
    const saved = await saveScore(player.name, player.className, score);
    setIsScoreSaved(saved);
    setScreen(ScreenState.GAME_OVER);
  };

  const handleRestart = () => {
    setScreen(ScreenState.START);
    setFinalScore(0);
    setIsScoreSaved(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-pattern">
      
      {/* Background Decorative Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-10" 
           style={{
             backgroundImage: 'radial-gradient(#ffffff 2px, transparent 2px)',
             backgroundSize: '20px 20px'
           }}
      ></div>

      {screen === ScreenState.START && (
        <StartScreen 
          onStart={handleStartGame} 
          onShowLeaderboard={() => setScreen(ScreenState.LEADERBOARD)} 
        />
      )}

      {screen === ScreenState.PLAYING && (
        <GameScreen 
          player={player} 
          onEndGame={handleEndGame} 
        />
      )}

      {screen === ScreenState.GAME_OVER && (
        <GameOverScreen
          score={finalScore}
          isScoreSaved={isScoreSaved}
          playerName={player.name}
          playerClass={player.className}
          onRestart={handleRestart}
          onShowLeaderboard={() => setScreen(ScreenState.LEADERBOARD)}
        />
      )}

      {screen === ScreenState.LEADERBOARD && (
        <Leaderboard 
          onBack={() => setScreen(ScreenState.START)} 
        />
      )}
    </div>
  );
};

export default App;
