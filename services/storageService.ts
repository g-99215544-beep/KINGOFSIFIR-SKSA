import { ScoreRecord } from '../types';
import { saveScoreToFirebase, getScoresFromFirebase, clearAllScoresFirebase } from './firebaseService';

// Now purely an async wrapper for Firebase

export const saveScore = async (name: string, className: string, score: number): Promise<void> => {
  await saveScoreToFirebase(name, className, score);
};

export const getScores = async (): Promise<ScoreRecord[]> => {
  return await getScoresFromFirebase();
};

export const getTopScore = async (): Promise<ScoreRecord | null> => {
  const scores = await getScoresFromFirebase();
  if (scores.length === 0) return null;
  // Sort descending
  scores.sort((a, b) => b.score - a.score);
  return scores[0];
};

export const clearScores = async (): Promise<void> => {
  await clearAllScoresFirebase();
};