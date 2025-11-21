import { describe, it, expect } from 'vitest';
import {
  calculateScore,
  calculatePenalty,
  createPieceGenerator,
  createPenaltyLine,
  addPenaltyLines,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  PIECES,
  COLORS,
} from './tetris.js';

describe('tetris utils', () => {
  describe('calculateScore', () => {
    it('devrait retourner 100 points pour 1 ligne', () => {
      expect(calculateScore(1)).toBe(100);
    });

    it('devrait retourner 300 points pour 2 lignes', () => {
      expect(calculateScore(2)).toBe(300);
    });

    it('devrait retourner 500 points pour 3 lignes', () => {
      expect(calculateScore(3)).toBe(500);
    });

    it('devrait retourner 800 points pour 4 lignes', () => {
      expect(calculateScore(4)).toBe(800);
    });

    it('devrait retourner 0 pour 0 ligne', () => {
      expect(calculateScore(0)).toBe(0);
    });

    it('devrait retourner 0 pour un nombre invalide', () => {
      expect(calculateScore(5)).toBe(0);
    });
  });

  describe('calculatePenalty', () => {
    it('devrait retourner 0 pénalité pour 1 ligne', () => {
      expect(calculatePenalty(1)).toBe(0);
    });

    it('devrait retourner 1 pénalité pour 2 lignes', () => {
      expect(calculatePenalty(2)).toBe(1);
    });

    it('devrait retourner 2 pénalités pour 3 lignes', () => {
      expect(calculatePenalty(3)).toBe(2);
    });

    it('devrait retourner 4 pénalités pour 4 lignes', () => {
      expect(calculatePenalty(4)).toBe(4);
    });

    it('devrait retourner 0 pour un nombre invalide', () => {
      expect(calculatePenalty(0)).toBe(0);
      expect(calculatePenalty(5)).toBe(0);
    });
  });

  describe('createPieceGenerator', () => {
    it('devrait générer des pièces valides', () => {
      const generator = createPieceGenerator(12345);
      const piece = generator();
      expect(['I', 'O', 'T', 'S', 'Z', 'J', 'L']).toContain(piece);
    });

    it('devrait générer les mêmes pièces avec la même seed', () => {
      const generator1 = createPieceGenerator(12345);
      const generator2 = createPieceGenerator(12345);
      
      const pieces1 = Array.from({ length: 10 }, () => generator1());
      const pieces2 = Array.from({ length: 10 }, () => generator2());
      
      expect(pieces1).toEqual(pieces2);
    });

    it('devrait générer des pièces différentes avec des seeds différentes', () => {
      const generator1 = createPieceGenerator(12345);
      const generator2 = createPieceGenerator(67890);
      
      const pieces1 = Array.from({ length: 10 }, () => generator1());
      const pieces2 = Array.from({ length: 10 }, () => generator2());
      
      expect(pieces1).not.toEqual(pieces2);
    });

    it('devrait utiliser Date.now() si aucune seed n\'est fournie', () => {
      const generator = createPieceGenerator();
      const piece = generator();
      expect(['I', 'O', 'T', 'S', 'Z', 'J', 'L']).toContain(piece);
    });
  });

  describe('createPenaltyLine', () => {
    it('devrait créer une ligne de largeur BOARD_WIDTH', () => {
      const line = createPenaltyLine(5);
      expect(line).toHaveLength(BOARD_WIDTH);
    });

    it('devrait avoir un trou à la position spécifiée', () => {
      const holePosition = 5;
      const line = createPenaltyLine(holePosition);
      expect(line[holePosition]).toBe(0);
    });

    it('devrait remplir les autres cases avec "G"', () => {
      const holePosition = 5;
      const line = createPenaltyLine(holePosition);
      
      line.forEach((cell, index) => {
        if (index !== holePosition) {
          expect(cell).toBe('G');
        }
      });
    });

    it('devrait créer un trou aléatoire si aucune position n\'est fournie', () => {
      const line = createPenaltyLine();
      const zeroCount = line.filter(cell => cell === 0).length;
      expect(zeroCount).toBe(1);
    });
  });

  describe('addPenaltyLines', () => {
    const createEmptyBoard = () => Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));

    it('devrait retourner le plateau inchangé si count est 0', () => {
      const board = createEmptyBoard();
      const result = addPenaltyLines(board, 0);
      expect(result).toEqual(board);
    });

    it('devrait retourner le plateau inchangé si count est négatif', () => {
      const board = createEmptyBoard();
      const result = addPenaltyLines(board, -1);
      expect(result).toEqual(board);
    });

    it('devrait ajouter le bon nombre de lignes de pénalité', () => {
      const board = createEmptyBoard();
      const result = addPenaltyLines(board, 2);
      
      // Les 2 dernières lignes doivent être des lignes de pénalité
      const lastLine = result[BOARD_HEIGHT - 1];
      const secondLastLine = result[BOARD_HEIGHT - 2];
      
      expect(lastLine?.filter(cell => cell === 'G').length).toBe(BOARD_WIDTH - 1);
      expect(secondLastLine?.filter(cell => cell === 'G').length).toBe(BOARD_WIDTH - 1);
    });

    it('devrait supprimer les lignes du haut quand on ajoute des pénalités', () => {
      const board = createEmptyBoard();
      const originalLength = board.length;
      const result = addPenaltyLines(board, 2);
      
      expect(result.length).toBe(originalLength);
    });
  });

  describe('constantes', () => {
    it('BOARD_WIDTH devrait être 10', () => {
      expect(BOARD_WIDTH).toBe(10);
    });

    it('BOARD_HEIGHT devrait être 20', () => {
      expect(BOARD_HEIGHT).toBe(20);
    });

    it('PIECES devrait contenir toutes les pièces Tetris', () => {
      const pieceTypes = Object.keys(PIECES);
      expect(pieceTypes).toEqual(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);
    });

    it('COLORS devrait contenir les couleurs pour toutes les pièces', () => {
      expect(COLORS).toHaveProperty('I');
      expect(COLORS).toHaveProperty('O');
      expect(COLORS).toHaveProperty('T');
      expect(COLORS).toHaveProperty('S');
      expect(COLORS).toHaveProperty('Z');
      expect(COLORS).toHaveProperty('J');
      expect(COLORS).toHaveProperty('L');
      expect(COLORS).toHaveProperty('G');
      expect(COLORS).toHaveProperty('0');
    });
  });
});