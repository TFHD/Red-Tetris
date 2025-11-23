import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCORES_FILE = path.join(__dirname, '../../scores.json');

export interface ScoreEntry {
  name: string;
  score: number;
  lines: number;
  date: string;
  roomId: string;
}

/**
 * Initialise le fichier scores.json s'il n'existe pas
 */
async function ensureScoresFile(): Promise<void> {
  try {
    await fs.access(SCORES_FILE);
  } catch {
    await fs.writeFile(SCORES_FILE, JSON.stringify([], null, 2));
    console.log('Created scores.json file');
  }
}

/**
 * Récupère tous les scores
 */
export async function getScores(): Promise<ScoreEntry[]> {
  await ensureScoresFile();
  
  try {
    const data = await fs.readFile(SCORES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading scores:', error);
    return [];
  }
}

/**
 * Sauvegarde un nouveau score
 */
export async function saveScore(entry: Omit<ScoreEntry, 'date'>): Promise<void> {
  try {
    const scores = await getScores();
    
    const newEntry: ScoreEntry = {
      ...entry,
      date: new Date().toISOString(),
    };
    
    scores.push(newEntry);
    
    scores.sort((a, b) => b.score - a.score);
    
    await fs.writeFile(SCORES_FILE, JSON.stringify(scores, null, 2));
  } catch (error) {
    console.error('Error saving score:', error);
  }
}

/**
 * Récupère le top N des scores
 */
export async function getTopScores(limit: number = 10): Promise<ScoreEntry[]> {
  const scores = await getScores();
  return scores.slice(0, limit);
}

/**
 * Récupère les meilleurs scores d'un joueur spécifique
 */
export async function getPlayerBestScores(playerName: string, limit: number = 5): Promise<ScoreEntry[]> {
  const scores = await getScores();
  return scores
    .filter(score => score.name === playerName)
    .slice(0, limit);
}

/**
 * Efface tous les scores (utile pour les tests)
 */
export async function clearScores(): Promise<void> {
  await fs.writeFile(SCORES_FILE, JSON.stringify([], null, 2));
  console.log('Cleared all scores');
}

