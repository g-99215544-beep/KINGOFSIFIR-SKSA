import React, { useState, useEffect } from 'react';
import { RetroButton, RetroPanel, CrownIcon, TrophyIcon } from './RetroUI';
import { getTopScore, clearScores, getScores } from '../services/storageService';
import { Player } from '../types';
import { fetchClassData, ClassData } from '../services/firebaseService';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface StartScreenProps {
  onStart: (player: Player) => void;
  onShowLeaderboard: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, onShowLeaderboard }) => {
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [topScore, setTopScore] = useState<{name: string, score: number} | null>(null);
  
  // Data states
  const [allClassData, setAllClassData] = useState<ClassData | null>(null);
  const [classList, setClassList] = useState<string[]>([]);
  const [studentList, setStudentList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Admin states
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [pdfFilterClass, setPdfFilterClass] = useState('ALL');

  const loadTopScore = async () => {
    const record = await getTopScore();
    if (record) {
      setTopScore({ name: record.name, score: record.score });
    } else {
      setTopScore(null);
    }
  };

  useEffect(() => {
    // Load High Score
    loadTopScore();

    // Load Firebase Data
    const loadData = async () => {
      setIsLoading(true);
      const data = await fetchClassData();
      if (data) {
        setAllClassData(data);
        // Sort class names alphabetically
        setClassList(Object.keys(data).sort());
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Handle Class Selection
  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedClass = e.target.value;
    setClassName(selectedClass);
    setName(''); // Reset name when class changes
    
    if (selectedClass && allClassData && allClassData[selectedClass]) {
      setStudentList(allClassData[selectedClass].sort());
    } else {
      setStudentList([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && className.trim()) {
      onStart({ name: name.toUpperCase(), className: className.toUpperCase() });
    }
  };

  // --- Admin Functions ---

  const handleCrownClick = () => {
    setShowAdminAuth(true);
    setAdminPassword('');
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'admin123') {
      setShowAdminAuth(false);
      setShowAdminPanel(true);
      setPdfFilterClass('ALL'); // Reset filter on open
    } else {
      alert("KATA LALUAN SALAH!");
      setAdminPassword('');
    }
  };

  const handleResetData = async () => {
    if (window.confirm("ADAKAH ANDA PASTI? SEMUA REKOD MARKAH AKAN DIPADAM!")) {
      await clearScores();
      await loadTopScore(); // Refresh UI
      alert("REKOD TELAH DIPADAM!");
      setShowAdminPanel(false);
    }
  };

  const handleDownloadPDF = async () => {
    const doc = new jsPDF();
    let scores = await getScores(); // Async fetch
    let titleSuffix = "";
    
    let headRows: string[][] = [];
    let bodyRows: (string | number)[][] = [];
    let colStyles: any = {};

    if (pdfFilterClass === 'ALL') {
      // --- TOP 10 SEKOLAH ---
      // Logic: Only take top 10 best scores regardless of class
      titleSuffix = "TOP 10 TERBAIK SEKOLAH";
      
      scores.sort((a, b) => b.score - a.score);
      const top10 = scores.slice(0, 10);
      
      if (top10.length === 0) {
        alert("TIADA REKOD.");
        return;
      }

      headRows = [['No.', 'Nama', 'Kelas', 'Markah', 'Tarikh']];
      bodyRows = top10.map((s, index) => [
        index + 1,
        s.name,
        s.className,
        s.score,
        new Date(s.timestamp).toLocaleDateString()
      ]);
      
      colStyles = {
        0: { halign: 'center', cellWidth: 15 },
        3: { halign: 'center', cellWidth: 25 },
        4: { halign: 'center', cellWidth: 30 }
      };

    } else if (pdfFilterClass === 'SUMMARY_TOP3') {
      // --- TOP 3 SETIAP KELAS ---
      // Logic: Iterate all classes, find top 3 for each, add to list
      titleSuffix = "TOP 3 SETIAP KELAS";
      
      const classMap: Record<string, typeof scores> = {};
      
      // Group scores by class
      scores.forEach(s => {
        if (!classMap[s.className]) classMap[s.className] = [];
        classMap[s.className].push(s);
      });

      // Get list of classes and sort them
      const classes = Object.keys(classMap).sort();
      
      if (classes.length === 0) {
        alert("TIADA REKOD.");
        return;
      }

      // Structure: Class, Rank, Name, Score
      headRows = [['Kelas', 'Ked.', 'Nama', 'Markah']];
      
      classes.forEach(cls => {
        // Sort scores in class
        const clsScores = classMap[cls].sort((a, b) => b.score - a.score);
        // Take top 3
        const top3 = clsScores.slice(0, 3);
        
        top3.forEach((s, idx) => {
          bodyRows.push([
            cls,
            idx + 1,
            s.name,
            s.score
          ]);
        });
      });
      
      colStyles = {
        0: { cellWidth: 25 },
        1: { halign: 'center', cellWidth: 15 },
        3: { halign: 'center', cellWidth: 25 }
      };

    } else {
      // --- SPECIFIC CLASS (ALL STUDENTS) ---
      // Logic: Print all students in the selected class
      titleSuffix = `KELAS ${pdfFilterClass}`;
      
      scores = scores.filter(s => s.className === pdfFilterClass);
      scores.sort((a, b) => b.score - a.score);

      if (scores.length === 0) {
        alert("TIADA REKOD UNTUK KELAS INI.");
        return;
      }

      headRows = [['No.', 'Nama', 'Markah', 'Tarikh']];
      bodyRows = scores.map((s, index) => [
        index + 1,
        s.name,
        s.score,
        new Date(s.timestamp).toLocaleDateString()
      ]);

      colStyles = {
        0: { halign: 'center', cellWidth: 15 },
        2: { halign: 'center', cellWidth: 25 },
        3: { halign: 'center', cellWidth: 30 }
      };
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`JUARA SIFIR - ${titleSuffix}`, 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`Tarikh Cetakan: ${new Date().toLocaleDateString()}`, 105, 28, { align: "center" });

    autoTable(doc, {
      head: headRows,
      body: bodyRows,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [222, 100, 56], halign: 'center' },
      columnStyles: colStyles
    });

    const filename = `ranking-${pdfFilterClass.toLowerCase().replace(/\s/g, '-')}.pdf`;
    doc.save(filename);
  };

  return (
    <>
      <RetroPanel className="w-full max-w-md text-center animate-fade-in relative z-0 mt-8">
        <div className="flex justify-center mb-4">
          <div onClick={handleCrownClick} className="cursor-pointer hover:scale-110 transition-transform opacity-60 hover:opacity-100" title="Admin Login">
            <CrownIcon className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]" />
          </div>
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-press-start leading-relaxed mb-6 text-white text-shadow-md">
          JUARA SIFIR<br/><span className="text-xs sm:text-sm">SK SRI AMAN</span>
        </h1>

        <div className="relative bg-black/30 p-4 mb-6 text-xs sm:text-sm font-press-start text-white min-h-[4rem] flex items-center justify-center border-2 border-black/50">
          {/* Trophy/Ranking Icon - Attached to the Current Champion Panel */}
          <div 
            onClick={onShowLeaderboard}
            className="absolute -top-5 -right-3 z-10 cursor-pointer hover:scale-110 transition-transform"
            title="Papan Markah"
          >
             <div className="bg-white/10 p-1 rounded-full border-2 border-black/50 backdrop-blur-sm">
                <TrophyIcon className="w-8 h-8 animate-bounce drop-shadow-md" />
             </div>
          </div>

          {topScore ? (
            <div>
              <span className="text-yellow-300">JUARA SEMASA:</span><br/>
              {topScore.name} - {topScore.score}
            </div>
          ) : (
            "Jadilah Juara Pertama!"
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isLoading ? (
            <div className="font-press-start text-xs animate-pulse text-yellow-300 py-4">
              LOADING DATA...
            </div>
          ) : (
            <>
              <div className="relative">
                  <select 
                    value={className}
                    onChange={handleClassChange}
                    className="w-full font-press-start p-3 border-4 border-black shadow-retro-sm outline-none text-black text-center uppercase bg-white appearance-none cursor-pointer"
                    required
                  >
                    <option value="" disabled>PILIH KELAS</option>
                    {classList.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-black">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
              </div>

              <div className="relative">
                  <select 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full font-press-start p-3 border-4 border-black shadow-retro-sm outline-none text-black text-center uppercase bg-white appearance-none cursor-pointer ${!className ? 'opacity-50 cursor-not-allowed' : ''}`}
                    required
                    disabled={!className}
                  >
                    <option value="" disabled>PILIH NAMA</option>
                    {studentList.map(student => (
                      <option key={student} value={student}>{student}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-black">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
              </div>
            </>
          )}
          
          <div className="pt-4">
            <RetroButton 
                type="submit" 
                fullWidth 
                disabled={isLoading}
                className="text-xl py-5 shadow-retro-lg hover:-translate-y-1 transition-transform animate-pulse"
            >
              MULA SEKARANG
            </RetroButton>
          </div>
        </form>
      </RetroPanel>

      {/* Admin Login Modal */}
      {showAdminAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
           <RetroPanel className="w-full max-w-sm animate-bounce-in">
              <h3 className="font-press-start text-sm text-center mb-4 text-red-500">ADMIN LOGIN</h3>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                 <input 
                    type="password" 
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Kata Laluan"
                    className="w-full font-press-start p-2 text-center text-black"
                    autoFocus
                 />
                 <div className="flex gap-2">
                    <RetroButton type="button" variant="secondary" fullWidth onClick={() => setShowAdminAuth(false)}>BATAL</RetroButton>
                    <RetroButton type="submit" fullWidth>MASUK</RetroButton>
                 </div>
              </form>
           </RetroPanel>
        </div>
      )}

      {/* Admin Panel Modal */}
      {showAdminPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
           <RetroPanel className="w-full max-w-sm animate-bounce-in bg-gray-800 border-white">
              <h3 className="font-press-start text-sm text-center mb-6 text-yellow-300">PANEL ADMIN</h3>
              
              <div className="mb-4">
                  <label className="block font-press-start text-[10px] text-yellow-300 mb-2 text-left">PILIH CETAKAN:</label>
                  <div className="relative">
                    <select 
                        value={pdfFilterClass}
                        onChange={(e) => setPdfFilterClass(e.target.value)}
                        className="w-full font-press-start text-xs p-2 border-2 border-white bg-black text-white outline-none appearance-none cursor-pointer uppercase"
                    >
                        <option value="ALL">TOP 10 SEKOLAH</option>
                        <option value="SUMMARY_TOP3">JUARA KELAS (TOP 3)</option>
                        <option disabled>────────────────</option>
                        {classList.map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                        <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
              </div>

              <div className="space-y-4">
                 <RetroButton onClick={handleDownloadPDF} fullWidth className="bg-blue-500 hover:bg-blue-400 text-white">
                    CETAK PDF
                 </RetroButton>
                 <RetroButton onClick={handleResetData} variant="danger" fullWidth>
                    RESET RANKING
                 </RetroButton>
                 <div className="h-4"></div>
                 <RetroButton onClick={() => setShowAdminPanel(false)} variant="secondary" fullWidth>
                    TUTUP
                 </RetroButton>
              </div>
           </RetroPanel>
        </div>
      )}
    </>
  );
};

export default StartScreen;