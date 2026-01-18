import React, { useEffect, useState } from 'react';
import { RetroButton, RetroPanel, CrownIcon } from './RetroUI';
import { getScores } from '../services/storageService';
import { ScoreRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface LeaderboardProps {
  onBack: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadScores = async () => {
      setIsLoading(true);
      const allScores = await getScores();
      // Sort desc by default
      allScores.sort((a, b) => b.score - a.score);
      setScores(allScores);
      
      // Extract unique classes from scores for the dropdown
      const uniqueClasses = Array.from(new Set(allScores.map(s => s.className))).sort();
      setAvailableClasses(uniqueClasses);
      setIsLoading(false);
    };
    loadScores();
  }, []);

  const filteredScores = filter === 'ALL' 
    ? scores 
    : scores.filter(s => s.className === filter);

  // Take top 5 for chart
  const chartData = filteredScores.slice(0, 5).map(s => ({
    name: s.name.substring(0, 6), // Truncate for chart
    score: s.score
  }));

  return (
    <RetroPanel className="w-full max-w-lg h-[80vh] flex flex-col">
      <div className="text-center mb-4">
        <h2 className="text-xl sm:text-2xl font-press-start text-white">PAPAN MARKAH</h2>
        <div className="w-16 h-1 bg-black mx-auto mt-2 mb-4"></div>

        {/* Filter Controls */}
        <div className="flex justify-center items-center gap-2 mb-2">
            <label className="font-press-start text-xs text-white">FILTER:</label>
            <div className="relative">
                <select 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="font-press-start text-xs p-2 border-2 border-black shadow-retro-sm outline-none text-black appearance-none pr-8 bg-white cursor-pointer uppercase"
                >
                    <option value="ALL">SEMUA (SEKOLAH)</option>
                    {availableClasses.map(cls => (
                        <option key={cls} value={cls}>KELAS {cls}</option>
                    ))}
                </select>
                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-black">
                  <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
             <p className="font-press-start text-xs text-yellow-300 animate-pulse">LOADING DATA...</p>
        </div>
      ) : (
        <>
          {/* Recharts Visualization for Top 5 */}
          {filteredScores.length > 0 ? (
            <div className="h-40 w-full bg-white/90 border-4 border-black mb-4 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" tick={{fontSize: 10, fontFamily: '"Press Start 2P"'}} />
                    <YAxis hide />
                    <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ fontFamily: '"Press Start 2P"', fontSize: '10px', border: '2px solid black' }}
                    />
                    <Bar dataKey="score" fill="#de6438">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#fcd834' : '#5c94fc'} stroke="black" strokeWidth={2} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
            </div>
          ) : (
             <div className="h-40 w-full bg-black/20 border-4 border-black mb-4 flex items-center justify-center">
                 <p className="font-press-start text-xs text-white">TIADA DATA</p>
             </div>
          )}

          {/* Scrollable List */}
          <div className="flex-1 overflow-y-auto bg-black/20 border-4 border-black p-2 mb-4 space-y-2 custom-scrollbar">
            {filteredScores.length === 0 ? (
              <p className="text-center font-press-start text-xs text-white mt-10">TIADA REKOD LAGI.</p>
            ) : (
              filteredScores.map((record, index) => (
                <div 
                  key={record.id} 
                  className={`flex justify-between items-center p-3 border-2 border-black/50 ${index === 0 ? 'bg-yellow-400 text-black' : 'bg-white text-black'}`}
                >
                  <div className="flex items-center gap-3">
                     <span className="font-press-start text-xs w-6">{index + 1}.</span>
                     <div className="flex flex-col text-left">
                        <span className="font-press-start text-xs sm:text-sm font-bold">{record.name}</span>
                        <span className="font-press-start text-[10px] opacity-70">{record.className}</span>
                     </div>
                  </div>
                  <div className="font-press-start text-sm sm:text-base">
                    {record.score}
                    {index === 0 && <CrownIcon className="w-4 h-4 inline ml-1 -mt-1" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <RetroButton onClick={onBack} variant="secondary" fullWidth>
        KEMBALI
      </RetroButton>
      
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

export default Leaderboard;