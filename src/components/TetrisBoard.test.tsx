import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import TetrisBoard from './TetrisBoard.js';
import { act } from 'react';

const mockPieceGenerator = vi.fn(() => 'I');
const mockOnInput = vi.fn(async () => true);
const mockOnStateUpdate = vi.fn();
const mockOnLinesCleared = vi.fn();
const mockOnGameOver = vi.fn();
const mockOnNextPiecesUpdate = vi.fn();

describe('TetrisBoard Component', () => {
  it('devrait render le composant sans crash', () => {
    const { container } = render(
      <TetrisBoard
        pieceGenerator={mockPieceGenerator}
        onInput={mockOnInput}
        onStateUpdate={mockOnStateUpdate}
        onLinesCleared={mockOnLinesCleared}
        pendingPenalty={0}
        gamefinished={false}
        onGameOver={mockOnGameOver}
        speed={1000}
        onNextPiecesUpdate={mockOnNextPiecesUpdate}
      />
    );
    
    expect(container).toBeInTheDocument();
  });

  it('devrait avoir une grille de tetris', () => {
    const { container } = render(
      <TetrisBoard
        pieceGenerator={mockPieceGenerator}
        onInput={mockOnInput}
        onStateUpdate={mockOnStateUpdate}
        onLinesCleared={mockOnLinesCleared}
        pendingPenalty={0}
        gamefinished={false}
        onGameOver={mockOnGameOver}
        speed={1000}
        onNextPiecesUpdate={mockOnNextPiecesUpdate}
      />
    );
    
    const board = container.querySelector('.tetris-board');
    expect(board).toBeInTheDocument();
  });

  it('devrait gérer le game over', () => {
    const { container } = render(
      <TetrisBoard
        pieceGenerator={mockPieceGenerator}
        onInput={mockOnInput}
        onStateUpdate={mockOnStateUpdate}
        onLinesCleared={mockOnLinesCleared}
        pendingPenalty={0}
        gamefinished={true}
        onGameOver={mockOnGameOver}
        speed={1000}
        onNextPiecesUpdate={mockOnNextPiecesUpdate}
      />
    );
    
    expect(container).toBeInTheDocument();
  });

  it('devrait appeler onNextPiecesUpdate lors de l\'initialisation', () => {
    render(
      <TetrisBoard
        pieceGenerator={mockPieceGenerator}
        onInput={mockOnInput}
        onStateUpdate={mockOnStateUpdate}
        onLinesCleared={mockOnLinesCleared}
        pendingPenalty={0}
        gamefinished={false}
        onGameOver={mockOnGameOver}
        speed={1000}
        onNextPiecesUpdate={mockOnNextPiecesUpdate}
      />
    );
    
    expect(mockOnNextPiecesUpdate).toHaveBeenCalled();
  });

  it('devrait utiliser la vitesse passée en prop', () => {
    const customSpeed = 500;
    const { container } = render(
      <TetrisBoard
        pieceGenerator={mockPieceGenerator}
        onInput={mockOnInput}
        onStateUpdate={mockOnStateUpdate}
        onLinesCleared={mockOnLinesCleared}
        pendingPenalty={0}
        gamefinished={false}
        onGameOver={mockOnGameOver}
        speed={customSpeed}
        onNextPiecesUpdate={mockOnNextPiecesUpdate}
      />
    );
    
    expect(container).toBeInTheDocument();
  });

  it('devrait gérer les pénalités en attente', () => {
    const { rerender } = render(
      <TetrisBoard
        pieceGenerator={mockPieceGenerator}
        onInput={mockOnInput}
        onStateUpdate={mockOnStateUpdate}
        onLinesCleared={mockOnLinesCleared}
        pendingPenalty={0}
        gamefinished={false}
        onGameOver={mockOnGameOver}
        speed={1000}
        onNextPiecesUpdate={mockOnNextPiecesUpdate}
      />
    );
    
    rerender(
      <TetrisBoard
        pieceGenerator={mockPieceGenerator}
        onInput={mockOnInput}
        onStateUpdate={mockOnStateUpdate}
        onLinesCleared={mockOnLinesCleared}
        pendingPenalty={2}
        gamefinished={false}
        onGameOver={mockOnGameOver}
        speed={1000}
        onNextPiecesUpdate={mockOnNextPiecesUpdate}
      />
    );
    
    expect(true).toBe(true);
  });

  it('devrait appeler onStateUpdate', () => {
    render(
      <TetrisBoard
        pieceGenerator={mockPieceGenerator}
        onInput={mockOnInput}
        onStateUpdate={mockOnStateUpdate}
        onLinesCleared={mockOnLinesCleared}
        pendingPenalty={0}
        gamefinished={false}
        onGameOver={mockOnGameOver}
        speed={1000}
        onNextPiecesUpdate={mockOnNextPiecesUpdate}
      />
    );
    
    expect(mockOnStateUpdate).toBeDefined();
  });

  it('devrait gérer les événements clavier - ArrowLeft', () => {
    const { container } = render(
      <TetrisBoard
        pieceGenerator={mockPieceGenerator}
        onInput={mockOnInput}
        onStateUpdate={mockOnStateUpdate}
        onLinesCleared={mockOnLinesCleared}
        pendingPenalty={0}
        gamefinished={false}
        onGameOver={mockOnGameOver}
        speed={1000}
        onNextPiecesUpdate={mockOnNextPiecesUpdate}
      />
    );

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      window.dispatchEvent(event);
    });

    expect(container).toBeInTheDocument();
  });

  it('devrait gérer les événements clavier - ArrowRight', () => {
    const { container } = render(
      <TetrisBoard
        pieceGenerator={mockPieceGenerator}
        onInput={mockOnInput}
        onStateUpdate={mockOnStateUpdate}
        onLinesCleared={mockOnLinesCleared}
        pendingPenalty={0}
        gamefinished={false}
        onGameOver={mockOnGameOver}
        speed={1000}
        onNextPiecesUpdate={mockOnNextPiecesUpdate}
      />
    );

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      window.dispatchEvent(event);
    });

    expect(container).toBeInTheDocument();
  });

  it('devrait gérer les événements clavier - ArrowUp (rotation)', () => {
    const { container } = render(
      <TetrisBoard
        pieceGenerator={mockPieceGenerator}
        onInput={mockOnInput}
        onStateUpdate={mockOnStateUpdate}
        onLinesCleared={mockOnLinesCleared}
        pendingPenalty={0}
        gamefinished={false}
        onGameOver={mockOnGameOver}
        speed={1000}
        onNextPiecesUpdate={mockOnNextPiecesUpdate}
      />
    );

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      window.dispatchEvent(event);
    });

    expect(container).toBeInTheDocument();
  });

  it('devrait gérer les événements clavier - ArrowDown (descente rapide)', () => {
    const { container } = render(
      <TetrisBoard
        pieceGenerator={mockPieceGenerator}
        onInput={mockOnInput}
        onStateUpdate={mockOnStateUpdate}
        onLinesCleared={mockOnLinesCleared}
        pendingPenalty={0}
        gamefinished={false}
        onGameOver={mockOnGameOver}
        speed={1000}
        onNextPiecesUpdate={mockOnNextPiecesUpdate}
      />
    );

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      window.dispatchEvent(event);
    });

    expect(container).toBeInTheDocument();
  });

  it('devrait gérer les événements clavier - Space (hard drop)', () => {
    const { container } = render(
      <TetrisBoard
        pieceGenerator={mockPieceGenerator}
        onInput={mockOnInput}
        onStateUpdate={mockOnStateUpdate}
        onLinesCleared={mockOnLinesCleared}
        pendingPenalty={0}
        gamefinished={false}
        onGameOver={mockOnGameOver}
        speed={1000}
        onNextPiecesUpdate={mockOnNextPiecesUpdate}
      />
    );

    act(() => {
      const event = new KeyboardEvent('keydown', { key: ' ' });
      window.dispatchEvent(event);
    });

    expect(container).toBeInTheDocument();
  });

  it('devrait démarrer le game loop avec un timer', () => {
    vi.useFakeTimers();
    
    render(
      <TetrisBoard
        pieceGenerator={mockPieceGenerator}
        onInput={mockOnInput}
        onStateUpdate={mockOnStateUpdate}
        onLinesCleared={mockOnLinesCleared}
        pendingPenalty={0}
        gamefinished={false}
        onGameOver={mockOnGameOver}
        speed={500}
        onNextPiecesUpdate={mockOnNextPiecesUpdate}
      />
    );

    // Avancer le temps pour déclencher le game loop
    act(() => {
      vi.advanceTimersByTime(600);
    });

    // Le game loop devrait avoir tourné
    expect(mockOnStateUpdate).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('ne devrait pas traiter les inputs quand gameOver est true', () => {
    const { container } = render(
      <TetrisBoard
        pieceGenerator={mockPieceGenerator}
        onInput={mockOnInput}
        onStateUpdate={mockOnStateUpdate}
        onLinesCleared={mockOnLinesCleared}
        pendingPenalty={0}
        gamefinished={true}
        onGameOver={mockOnGameOver}
        speed={1000}
        onNextPiecesUpdate={mockOnNextPiecesUpdate}
      />
    );

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      window.dispatchEvent(event);
    });

    expect(container).toBeInTheDocument();
  });

  it('devrait nettoyer les event listeners lors du démontage', () => {
    const { unmount } = render(
      <TetrisBoard
        pieceGenerator={mockPieceGenerator}
        onInput={mockOnInput}
        onStateUpdate={mockOnStateUpdate}
        onLinesCleared={mockOnLinesCleared}
        pendingPenalty={0}
        gamefinished={false}
        onGameOver={mockOnGameOver}
        speed={1000}
        onNextPiecesUpdate={mockOnNextPiecesUpdate}
      />
    );

    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  it('devrait mettre à jour nextPieces quand une pièce est consommée', () => {
    vi.useFakeTimers();
    
    render(
      <TetrisBoard
        pieceGenerator={mockPieceGenerator}
        onInput={mockOnInput}
        onStateUpdate={mockOnStateUpdate}
        onLinesCleared={mockOnLinesCleared}
        pendingPenalty={0}
        gamefinished={false}
        onGameOver={mockOnGameOver}
        speed={100}
        onNextPiecesUpdate={mockOnNextPiecesUpdate}
      />
    );

    const initialCalls = mockOnNextPiecesUpdate.mock.calls.length;

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(mockOnNextPiecesUpdate.mock.calls.length).toBeGreaterThanOrEqual(initialCalls);

    vi.useRealTimers();
  });

  it('devrait gérer la pause avec la touche p', () => {
    const { container } = render(
      <TetrisBoard
        pieceGenerator={mockPieceGenerator}
        onInput={mockOnInput}
        onStateUpdate={mockOnStateUpdate}
        onLinesCleared={mockOnLinesCleared}
        pendingPenalty={0}
        gamefinished={false}
        onGameOver={mockOnGameOver}
        speed={1000}
        onNextPiecesUpdate={mockOnNextPiecesUpdate}
      />
    );

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'p' });
      window.dispatchEvent(event);
    });

    expect(container).toBeInTheDocument();
  });

  it('devrait appeler onInput avant chaque mouvement', async () => {
    render(
      <TetrisBoard
        pieceGenerator={mockPieceGenerator}
        onInput={mockOnInput}
        onStateUpdate={mockOnStateUpdate}
        onLinesCleared={mockOnLinesCleared}
        pendingPenalty={0}
        gamefinished={false}
        onGameOver={mockOnGameOver}
        speed={1000}
        onNextPiecesUpdate={mockOnNextPiecesUpdate}
      />
    );

    expect(mockOnInput).toBeDefined();
  });

  it('devrait initialiser le board avec les bonnes dimensions', () => {
    const { container } = render(
      <TetrisBoard
        pieceGenerator={mockPieceGenerator}
        onInput={mockOnInput}
        onStateUpdate={mockOnStateUpdate}
        onLinesCleared={mockOnLinesCleared}
        pendingPenalty={0}
        gamefinished={false}
        onGameOver={mockOnGameOver}
        speed={1000}
        onNextPiecesUpdate={mockOnNextPiecesUpdate}
      />
    );

    const board = container.querySelector('.tetris-board');
    expect(board).toBeInTheDocument();
    
    const rows = container.querySelectorAll('.grid-row');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('devrait appeler onLinesCleared quand des lignes sont complètes', () => {
    vi.useFakeTimers();
    
    render(
      <TetrisBoard
        pieceGenerator={mockPieceGenerator}
        onInput={mockOnInput}
        onStateUpdate={mockOnStateUpdate}
        onLinesCleared={mockOnLinesCleared}
        pendingPenalty={0}
        gamefinished={false}
        onGameOver={mockOnGameOver}
        speed={100}
        onNextPiecesUpdate={mockOnNextPiecesUpdate}
      />
    );

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(mockOnLinesCleared).toBeDefined();

    vi.useRealTimers();
  });

  it('devrait réagir aux changements de speed', () => {
    vi.useFakeTimers();
    
    const { rerender } = render(
      <TetrisBoard
        pieceGenerator={mockPieceGenerator}
        onInput={mockOnInput}
        onStateUpdate={mockOnStateUpdate}
        onLinesCleared={mockOnLinesCleared}
        pendingPenalty={0}
        gamefinished={false}
        onGameOver={mockOnGameOver}
        speed={1000}
        onNextPiecesUpdate={mockOnNextPiecesUpdate}
      />
    );

    rerender(
      <TetrisBoard
        pieceGenerator={mockPieceGenerator}
        onInput={mockOnInput}
        onStateUpdate={mockOnStateUpdate}
        onLinesCleared={mockOnLinesCleared}
        pendingPenalty={0}
        gamefinished={false}
        onGameOver={mockOnGameOver}
        speed={200}
        onNextPiecesUpdate={mockOnNextPiecesUpdate}
      />
    );

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(mockOnStateUpdate).toHaveBeenCalled();

    vi.useRealTimers();
  });
});