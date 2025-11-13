import { CellValue } from '../types';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export const PIECES : Record<string, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  O: [
    [0, 0, 0, 0],
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0]
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ],
};

export const COLORS : Record<string, string> = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000',
  G: '#808080',
  0: 'transparent',
};

/**
 * Générateur de pièces Tetris (LCG) basé sur une seed
 * Permet aux deux joueurs d'avoir les mêmes pièces dans le même ordre
 */
export function createPieceGenerator(seed?: number) : () => string {
  let current = seed || Date.now();
  const pieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

  return function() : string {
    // Linear Congruential Generator (LCG)
    // En gros c'est un algo qui génère des nombres aléatoires basé sur une seed
    // nouveau_nombre = (ancien_nombre * a + c) mod m
    // a, c et m sont des constantes (c'est des magics numbers, c'est les constantes officielles de l'algo)
    // m est le modulo 0x7fffffff = INT_MAX
    // a = 1103515245
    // c = 12345
    // m = 0x7fffffff
    current = (current * 1103515245 + 12345) & 0x7fffffff;
    return pieces[current % 7] as string;
  };
}

/**
 * Calcule le score basé sur le nombre de lignes
 */
export function calculateScore(lines: number) : number {
  const scoreTable : Record<number, number> = {
    1: 100,
    2: 300,
    3: 500,
    4: 800,
  };
  return scoreTable[lines] || 0;
}

//regle de penalite pris sur un jeu de tetris de la nintendo

export function calculatePenalty(lines: number) : number {
  const penaltyTable : Record<number, number> = {
    1: 0,  
    2: 1,  
    3: 2,  
    4: 4,  
  };
  return penaltyTable[lines] || 0;
}

/**
 * Crée une ligne grise avec un trou aléatoire
 * @param {number} holePosition - Position du trou (0-9), ou random si non fourni
 */
export function createPenaltyLine(holePosition?: number) : CellValue[] {
  const hole = holePosition !== undefined 
    ? holePosition 
    : Math.floor(Math.random() * BOARD_WIDTH);
  
  const line = Array(BOARD_WIDTH).fill('G');
  line[hole] = 0;
  
  return line;
}

/**
 * Ajoute des lignes de pénalité en bas du plateau
 * @param {Array} board - Plateau actuel
 * @param {number} count - Nombre de lignes à ajouter
 * @returns {Array} - Nouveau plateau avec pénalités
 */
export function addPenaltyLines(board: CellValue[][], count: number) : CellValue[][] {
  if (count <= 0) return board;
  
  const newBoard : CellValue[][] = [...board];
  
  const penaltyLines : CellValue[][] = [];
  for (let i : number = 0; i < count; i++) {
    penaltyLines.push(createPenaltyLine());
  }
  
  newBoard.splice(0, count);
  
  newBoard.push(...penaltyLines);
  
  return newBoard;
}