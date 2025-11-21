import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import OpponentBoard from './OpponentBoard.js';
import { CellValue } from '../types.js';

describe('OpponentBoard Component', () => {
  it('devrait render un board vide', () => {
    const emptyBoard: CellValue[][] = Array.from({ length: 20 }, () => 
      Array(10).fill(0)
    );
    
    const { container } = render(<OpponentBoard board={emptyBoard} />);
    expect(container.querySelector('.opponent-grid')).toBeInTheDocument();
  });

  it('devrait render un board avec des pièces', () => {
    const boardWithPieces: CellValue[][] = Array.from({ length: 20 }, () => 
      Array(10).fill(0)
    );
    boardWithPieces[19]![0] = 'I';
    boardWithPieces[19]![1] = 'I';
    
    const { container } = render(<OpponentBoard board={boardWithPieces} />);
    expect(container.querySelector('.opponent-grid')).toBeInTheDocument();
  });

  it('devrait gérer un board vide (tableau vide)', () => {
    const { container } = render(<OpponentBoard board={[]} />);
    expect(container).toBeInTheDocument();
  });
});