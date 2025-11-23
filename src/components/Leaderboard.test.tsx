import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Leaderboard from './Leaderboard.js';
import { ScoreEntry } from '../types.js';

// Mock de Socket.io
const mockSocket = {
  emitWithAck: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
};

describe('Leaderboard Component', () => {
  const mockScores: ScoreEntry[] = [
    {
      name: 'Player1',
      roomId: 'test-room',
      score: 10000,
      lines: 100,
      date: '2024-01-01T12:00:00.000Z',
    },
    {
      name: 'Player2',
      roomId: 'test-room',
      score: 8000,
      lines: 80,
      date: '2024-01-02T12:00:00.000Z',
    },
    {
      name: 'Player3',
      roomId: 'test-room',
      score: 6000,
      lines: 60,
      date: '2024-01-03T12:00:00.000Z',
    },
    {
      name: 'Player4',
      roomId: 'test-room',
      score: 4000,
      lines: 40,
      date: '2024-01-04T12:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('devrait afficher "Chargement..." pendant le chargement', () => {
    mockSocket.emitWithAck.mockImplementation(
      () => new Promise(() => {})
    );

    render(<Leaderboard socket={mockSocket as any} />);

    expect(screen.getByText('🏆 Leaderboard')).toBeInTheDocument();
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('devrait afficher "Aucun score enregistré" quand il n\'y a pas de scores', async () => {
    mockSocket.emitWithAck.mockResolvedValue({ scores: [] });

    render(<Leaderboard socket={mockSocket as any} />);

    await waitFor(() => {
      expect(screen.getByText('Aucun score enregistré')).toBeInTheDocument();
    });

    expect(screen.getByText('🏆 Top 10')).toBeInTheDocument();
  });

  it('devrait afficher la liste des scores', async () => {
    mockSocket.emitWithAck.mockResolvedValue({ scores: mockScores });

    render(<Leaderboard socket={mockSocket as any} />);

    await waitFor(() => {
      expect(screen.getByText('Player1')).toBeInTheDocument();
    });

    expect(screen.getByText('Player2')).toBeInTheDocument();
    expect(screen.getByText('Player3')).toBeInTheDocument();
    expect(screen.getByText('Player4')).toBeInTheDocument();
  });

  it('devrait afficher les médailles pour le top 3', async () => {
    mockSocket.emitWithAck.mockResolvedValue({ scores: mockScores });

    render(<Leaderboard socket={mockSocket as any} />);

    await waitFor(() => {
      expect(screen.getByText('🥇')).toBeInTheDocument();
    });

    expect(screen.getByText('🥈')).toBeInTheDocument();
    expect(screen.getByText('🥉')).toBeInTheDocument();
    expect(screen.getByText('#4')).toBeInTheDocument();
  });

  it('devrait afficher les scores formatés avec "pts"', async () => {
    mockSocket.emitWithAck.mockResolvedValue({ scores: mockScores });

    render(<Leaderboard socket={mockSocket as any} />);

    await waitFor(() => {
      expect(screen.getByText('10,000 pts')).toBeInTheDocument();
    });

    expect(screen.getByText('8,000 pts')).toBeInTheDocument();
    expect(screen.getByText('6,000 pts')).toBeInTheDocument();
    expect(screen.getByText('4,000 pts')).toBeInTheDocument();
  });

  it('devrait afficher le nombre de lignes', async () => {
    mockSocket.emitWithAck.mockResolvedValue({ scores: mockScores });

    render(<Leaderboard socket={mockSocket as any} />);

    await waitFor(() => {
      expect(screen.getByText('100 lignes')).toBeInTheDocument();
    });

    expect(screen.getByText('80 lignes')).toBeInTheDocument();
    expect(screen.getByText('60 lignes')).toBeInTheDocument();
    expect(screen.getByText('40 lignes')).toBeInTheDocument();
  });

  it('devrait afficher les dates formatées', async () => {
    mockSocket.emitWithAck.mockResolvedValue({ scores: mockScores });

    render(<Leaderboard socket={mockSocket as any} />);

    await waitFor(() => {
      const dates = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(dates.length).toBeGreaterThan(0);
    });
  });

  it('devrait appliquer la classe "top-three" aux 3 premiers', async () => {
    mockSocket.emitWithAck.mockResolvedValue({ scores: mockScores });

    const { container } = render(<Leaderboard socket={mockSocket as any} />);

    await waitFor(() => {
      const topThreeEntries = container.querySelectorAll('.leaderboard-entry.top-three');
      expect(topThreeEntries.length).toBe(3);
    });
  });

  it('devrait écouter les mises à jour du leaderboard', async () => {
    mockSocket.emitWithAck.mockResolvedValue({ scores: mockScores });

    render(<Leaderboard socket={mockSocket as any} />);

    await waitFor(() => {
      expect(mockSocket.on).toHaveBeenCalledWith(
        'leaderboard_update',
        expect.any(Function)
      );
    });
  });

  it('devrait mettre à jour les scores lors d\'un événement leaderboard_update', async () => {
    mockSocket.emitWithAck.mockResolvedValue({ scores: mockScores });
    
    let updateCallback: any = null;
    mockSocket.on.mockImplementation((event: string, callback: any) => {
      if (event === 'leaderboard_update') {
        updateCallback = callback;
      }
    });

    render(<Leaderboard socket={mockSocket as any} />);

    await waitFor(() => {
      expect(screen.getByText('Player1')).toBeInTheDocument();
    });

    const newScores: ScoreEntry[] = [
      {
        name: 'NewPlayer',
        roomId: 'test-room',
        score: 15000,
        lines: 150,
        date: '2024-01-05T12:00:00.000Z',
      },
    ];

    if (updateCallback) {
      updateCallback({ scores: newScores });
    }

    await waitFor(() => {
      expect(screen.getByText('NewPlayer')).toBeInTheDocument();
    });

    expect(screen.getByText('15,000 pts')).toBeInTheDocument();
  });

  it('devrait se désabonner des événements lors du démontage', async () => {
    mockSocket.emitWithAck.mockResolvedValue({ scores: mockScores });

    const { unmount } = render(<Leaderboard socket={mockSocket as any} />);

    await waitFor(() => {
      expect(screen.getByText('Player1')).toBeInTheDocument();
    });

    unmount();

    expect(mockSocket.off).toHaveBeenCalledWith('leaderboard_update');
  });

  it('ne devrait rien faire si le socket est null', () => {
    render(<Leaderboard socket={null} />);

    expect(mockSocket.emitWithAck).not.toHaveBeenCalled();
    expect(mockSocket.on).not.toHaveBeenCalled();
  });

  it('devrait gérer les erreurs lors de la récupération des scores', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSocket.emitWithAck.mockRejectedValue(new Error('Network error'));

    render(<Leaderboard socket={mockSocket as any} />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching leaderboard:',
        expect.any(Error)
      );
    });

    expect(screen.getByText('Aucun score enregistré')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('devrait appeler emitWithAck avec les bons paramètres', async () => {
    mockSocket.emitWithAck.mockResolvedValue({ scores: mockScores });

    render(<Leaderboard socket={mockSocket as any} />);

    await waitFor(() => {
      expect(mockSocket.emitWithAck).toHaveBeenCalledWith('get_leaderboard', { limit: 10 });
    });
  });

  it('devrait gérer un tableau de scores vide dans la réponse', async () => {
    mockSocket.emitWithAck.mockResolvedValue({ scores: [] });

    render(<Leaderboard socket={mockSocket as any} />);

    await waitFor(() => {
      expect(screen.getByText('Aucun score enregistré')).toBeInTheDocument();
    });
  });

  it('devrait gérer l\'absence de scores dans la réponse', async () => {
    mockSocket.emitWithAck.mockResolvedValue({});

    render(<Leaderboard socket={mockSocket as any} />);

    await waitFor(() => {
      expect(screen.getByText('Aucun score enregistré')).toBeInTheDocument();
    });
  });
});

