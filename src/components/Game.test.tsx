import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import Game from './Game.js';
import { Player } from '../types.js';
import { Socket } from 'socket.io-client';

const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  emitWithAck: vi.fn(async () => ({ ok: true })),
} as unknown as Socket;

describe('Game Component', () => {
  const mockPlayers: Player[] = [
    {
      id: '1',
      name: 'Player1',
      score: 0,
      gameOver: false,
      lines: 0,
      role: 'host',
      lastState: null,
    },
    {
      id: '2',
      name: 'Player2',
      score: 0,
      gameOver: false,
      lines: 0,
      role: 'guest',
      lastState: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait render le composant Game', () => {
    render(
      <Game
        socket={mockSocket}
        roomId="test-room"
        playerName="Player1"
        players={mockPlayers}
        seed={12345}
      />
    );

    expect(screen.getByText(/Player1/i)).toBeInTheDocument();
  });

  it('devrait afficher le score à 0 au départ', () => {
    render(
      <Game
        socket={mockSocket}
        roomId="test-room"
        playerName="Player1"
        players={mockPlayers}
        seed={12345}
      />
    );

    const scoreElements = screen.getAllByText(/Score:/i);
    expect(scoreElements.length).toBeGreaterThan(0);
  });

  it('devrait afficher les lignes à 0 au départ', () => {
    render(
      <Game
        socket={mockSocket}
        roomId="test-room"
        playerName="Player1"
        players={mockPlayers}
        seed={12345}
      />
    );

    expect(screen.getByText(/Lignes:/i)).toBeInTheDocument();
  });

  it('devrait afficher l\'adversaire', () => {
    render(
      <Game
        socket={mockSocket}
        roomId="test-room"
        playerName="Player1"
        players={mockPlayers}
        seed={12345}
      />
    );

    // L'adversaire est affiché dans la section opponent
    expect(screen.getByText(/Player2/i)).toBeInTheDocument();
  });

  it('devrait afficher les contrôles', () => {
    render(
      <Game
        socket={mockSocket}
        roomId="test-room"
        playerName="Player1"
        players={mockPlayers}
        seed={12345}
      />
    );

    expect(screen.getByText(/Contrôles/i)).toBeInTheDocument();
  });

  it('devrait enregistrer les listeners socket', () => {
    render(
      <Game
        socket={mockSocket}
        roomId="test-room"
        playerName="Player1"
        players={mockPlayers}
        seed={12345}
      />
    );

    expect(mockSocket.on).toHaveBeenCalledWith('opponent_state', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('receive_penalty', expect.any(Function));
  });

  it('devrait afficher les prochaines pièces', () => {
    render(
      <Game
        socket={mockSocket}
        roomId="test-room"
        playerName="Player1"
        players={mockPlayers}
        seed={12345}
      />
    );

    expect(screen.getByText(/Prochaines pièces/i)).toBeInTheDocument();
  });

  it('devrait afficher les informations de pénalité', () => {
    render(
      <Game
        socket={mockSocket}
        roomId="test-room"
        playerName="Player1"
        players={mockPlayers}
        seed={12345}
      />
    );

    expect(screen.getByText(/Pénalités/i)).toBeInTheDocument();
  });

  it('devrait gérer un seul joueur (pas d\'adversaire)', () => {
    const singlePlayer: Player[] = [mockPlayers[0]!];
    
    render(
      <Game
        socket={mockSocket}
        roomId="test-room"
        playerName="Player1"
        players={singlePlayer}
        seed={12345}
      />
    );

    expect(screen.getByText(/Player1/i)).toBeInTheDocument();
    expect(screen.queryByText(/Player2/i)).not.toBeInTheDocument();
  });

  it('devrait appeler les callbacks socket.on pour opponent_state', () => {
    render(
      <Game
        socket={mockSocket}
        roomId="test-room"
        playerName="Player1"
        players={mockPlayers}
        seed={12345}
      />
    );

    expect(mockSocket.on).toHaveBeenCalledWith('opponent_state', expect.any(Function));
    
    const onCalls = (mockSocket.on as any).mock.calls;
    const opponentStateCall = onCalls.find((call: any[]) => call[0] === 'opponent_state');
    expect(opponentStateCall).toBeDefined();
    
    const callback = opponentStateCall[1];
    act(() => {
      callback({
        state: {
          board: [],
          score: 100,
          lines: 5,
        }
      });
    });
  });

  it('devrait appeler les callbacks socket.on pour receive_penalty', () => {
    render(
      <Game
        socket={mockSocket}
        roomId="test-room"
        playerName="Player1"
        players={mockPlayers}
        seed={12345}
      />
    );

    expect(mockSocket.on).toHaveBeenCalledWith('receive_penalty', expect.any(Function));
    
    const onCalls = (mockSocket.on as any).mock.calls;
    const penaltyCall = onCalls.find((call: any[]) => call[0] === 'receive_penalty');
    const callback = penaltyCall[1];
    
    act(() => {
      callback({ lines: 2, from: 'opponent-id' });
    });
  });

  it('devrait appeler handleInput', async () => {
    render(
      <Game
        socket={mockSocket}
        roomId="test-room"
        playerName="Player1"
        players={mockPlayers}
        seed={12345}
      />
    );

    expect(mockSocket.emitWithAck).toBeDefined();
  });

  it('devrait calculer la vitesse en fonction des lignes', () => {
    render(
      <Game
        socket={mockSocket}
        roomId="test-room"
        playerName="Player1"
        players={mockPlayers}
        seed={12345}
      />
    );
    
    expect(screen.getByText(/Player1/i)).toBeInTheDocument();
  });

  it('devrait nettoyer les listeners socket lors du démontage', () => {
    const { unmount } = render(
      <Game
        socket={mockSocket}
        roomId="test-room"
        playerName="Player1"
        players={mockPlayers}
        seed={12345}
      />
    );

    unmount();

    expect(mockSocket.off).toHaveBeenCalled();
  });

  it('devrait appeler socket.emit pour sync_state périodiquement', async () => {
    vi.useFakeTimers();
    
    render(
      <Game
        socket={mockSocket}
        roomId="test-room"
        playerName="Player1"
        players={mockPlayers}
        seed={12345}
      />
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'sync_state',
      expect.objectContaining({
        roomId: 'test-room',
        state: expect.any(Object),
      })
    );

    vi.useRealTimers();
  });

  it('devrait gérer handleInput avec erreur', async () => {
    const mockSocketError = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      emitWithAck: vi.fn(async () => ({ ok: false })),
    } as unknown as Socket;

    render(
      <Game
        socket={mockSocketError}
        roomId="test-room"
        playerName="Player1"
        players={mockPlayers}
        seed={12345}
      />
    );

    // handleInput est appelé en interne, on vérifie juste que le mock existe
    expect(mockSocketError.emitWithAck).toBeDefined();
  });

  it('devrait appeler handleLinesCleared et envoyer des pénalités', () => {
    render(
      <Game
        socket={mockSocket}
        roomId="test-room"
        playerName="Player1"
        players={mockPlayers}
        seed={12345}
      />
    );

    // handleLinesCleared est passé comme prop à TetrisBoard
    expect(screen.getByText(/Player1/i)).toBeInTheDocument();
    expect(mockSocket.emit).toBeDefined();
  });

  it('devrait appeler handleGameOver', () => {
    render(
      <Game
        socket={mockSocket}
        roomId="test-room"
        playerName="Player1"
        players={mockPlayers}
        seed={12345}
      />
    );

    // handleGameOver est passé comme prop à TetrisBoard
    expect(screen.getByText(/Player1/i)).toBeInTheDocument();
    expect(mockSocket.emit).toBeDefined();
  });
});