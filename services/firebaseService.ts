import { initializeApp, getApp, getApps } from 'firebase/app';
import { getDatabase, ref, get, child, set, remove } from 'firebase/database';
import { ScoreRecord } from '../types';

// --- CONFIG 1: King of Sifir (Untuk Simpan Markah) ---
const scoreConfig = {
  apiKey: "AIzaSyDem01lvBz6pnQO2v97WhXe6mjQML4JQ3Q",
  authDomain: "king-of-sifir.firebaseapp.com",
  databaseURL: "https://king-of-sifir-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "king-of-sifir",
  storageBucket: "king-of-sifir.firebasestorage.app",
  messagingSenderId: "1062770360330",
  appId: "1:1062770360330:web:d0004ce218effbf5da1ff3",
  measurementId: "G-0FVQ446Z7H"
};

// --- CONFIG 2: Kehadiran Murid (Untuk Senarai Nama/Kelas) ---
const classDataConfig = {
  apiKey: "AIzaSyDbCgDz2vK2BZUpwM3iDWJcPQSptVcNkv4",
  authDomain: "kehadiran-murid-6ece0.firebaseapp.com",
  databaseURL: "https://kehadiran-murid-6ece0-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kehadiran-murid-6ece0",
  storageBucket: "kehadiran-murid-6ece0.firebasestorage.app",
  messagingSenderId: "223849234784",
  appId: "1:223849234784:web:e1471ded7ea17ba60bde05",
  measurementId: "G-4DY138HKTW"
};

// Initialize Apps
// Semak jika app sudah wujud untuk mengelakkan error "App already exists"
let scoreApp;
if (getApps().length === 0) {
  scoreApp = initializeApp(scoreConfig); // Default app
} else {
  scoreApp = getApp(); 
}

let classDataApp;
try {
  classDataApp = getApp("classDataApp");
} catch (e) {
  classDataApp = initializeApp(classDataConfig, "classDataApp"); // Named app
}

// Dapatkan instance Database yang berasingan
const dbScores = getDatabase(scoreApp);
const dbClassData = getDatabase(classDataApp);

export interface ClassData {
  [className: string]: string[];
}

// Fetch class data MENGGUNAKAN dbClassData (Kehadiran Murid)
export const fetchClassData = async (): Promise<ClassData | null> => {
  try {
    const dbRef = ref(dbClassData);
    // Mengambil data dari path 'config/classes/classData' dalam projek Kehadiran
    const snapshot = await get(child(dbRef, 'config/classes/classData'));
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      console.warn("No class data available in Kehadiran DB");
      return null;
    }
  } catch (error) {
    console.error("Error fetching class data:", error);
    return null;
  }
};

// Save score MENGGUNAKAN dbScores (King of Sifir)
export const saveScoreToFirebase = async (name: string, className: string, score: number): Promise<void> => {
    // Sanitize keys
    const safeName = name.replace(/[.#$[\]]/g, "_");
    const safeClass = className.replace(/[.#$[\]]/g, "_");
    const recordKey = `${safeClass}_${safeName}`;
    
    const dbRef = ref(dbScores, `scores/${recordKey}`);
    
    try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
            const currentData = snapshot.val();
            // LOGIC: Hanya update jika markah baharu lebih tinggi
            if (score > currentData.score) {
                 await set(dbRef, {
                    id: recordKey,
                    name,
                    className,
                    score,
                    timestamp: Date.now()
                });
            }
        } else {
            // Create rekod baharu
            await set(dbRef, {
                id: recordKey,
                name,
                className,
                score,
                timestamp: Date.now()
            });
        }
    } catch (e) {
        console.error("Error saving score to Firebase", e);
    }
};

// Get scores MENGGUNAKAN dbScores (King of Sifir)
export const getScoresFromFirebase = async (): Promise<ScoreRecord[]> => {
    try {
        const dbRef = ref(dbScores, 'scores');
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            return Object.values(data) as ScoreRecord[];
        }
        return [];
    } catch (e) {
        console.error("Error fetching scores from Firebase", e);
        return [];
    }
}

// Clear scores MENGGUNAKAN dbScores (King of Sifir)
export const clearAllScoresFirebase = async (): Promise<void> => {
    try {
        const dbRef = ref(dbScores, 'scores');
        await remove(dbRef);
    } catch (e) {
        console.error("Error clearing scores in Firebase", e);
    }
}