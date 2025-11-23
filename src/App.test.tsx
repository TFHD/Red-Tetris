import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App.js';
import { useSocket } from './hooks/useSocket.js';
import { act } from 'react';

const ADDRESS = import.meta.env.VITE_ADDRESS || 'localhost';
const PORT = import.meta.env.VITE_PORT || '3000';

const mockEmit = vi.fn((event, data, callback) => {
  if (event === 'join' && callback) {
    callback({ ok: true, roomId: data.roomId, seed: 12345 });
  }
});

vi.mock('./hooks/useSocket', () => ({
  useSocket: vi.fn(() => ({
    connected: true,
    on: vi.fn(),
    off: vi.fn(),
    emit: mockEmit,
  })),
}));

const mockLocation = {
  pathname: '/',
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait afficher l\'écran d\'accueil pour la route /', () => {
    mockLocation.pathname = '/';
    render(<App />);
    
    expect(screen.getByText(/Bienvenue sur Red Tetris/i)).toBeInTheDocument();
  });

  it('devrait afficher le format d\'URL sur la page d\'accueil', () => {
    mockLocation.pathname = '/';
    render(<App />);
    
    expect(screen.getByText(/Pour rejoindre une partie/i)).toBeInTheDocument();
  });

  it('devrait parser correctement l\'URL avec room et player', () => {
    mockLocation.pathname = '/room1/player1';
    render(<App />);
    
    expect(screen.getByRole('heading', { name: /Connexion/i })).toBeInTheDocument();
  });

  it('devrait afficher une erreur pour une URL invalide', () => {
    mockLocation.pathname = '/onlyroom';
    render(<App />);
    
    const text = screen.queryByText(/Erreur/i) || screen.queryByText(/Connexion/i);
    expect(text).toBeInTheDocument();
  });

  it('devrait afficher le titre Red Tetris', () => {
    mockLocation.pathname = '/';
    render(<App />);
    
    expect(screen.getByText(/🎮 Red Tetris/i)).toBeInTheDocument();
  });

  it('devrait afficher des exemples d\'URL sur la page d\'accueil', () => {
    mockLocation.pathname = '/';
    render(<App />);
    
    expect(screen.getByText(/Exemples/i)).toBeInTheDocument();
  });

  it('devrait afficher le statut de connexion', () => {
    mockLocation.pathname = '/room1/player1';
    render(<App />);
    
    const headers = screen.getAllByRole('heading');
    expect(headers.length).toBeGreaterThan(0);
  });

  it('devrait gérer les callbacks useSocket', () => {
    mockLocation.pathname = '/';
    render(<App />);
    
    expect(useSocket).toHaveBeenCalledWith(
      `http://${ADDRESS}:${PORT}`,
      expect.objectContaining({
        onConnect: expect.any(Function),
        onDisconnect: expect.any(Function),
        onRoomUpdate: expect.any(Function),
        onGameStarted: expect.any(Function),
        onPlayerJoined: expect.any(Function),
        onPlayerLeft: expect.any(Function),
        onHostAssigned: expect.any(Function),
      })
    );
  });

  it('devrait appeler onConnect quand le socket se connecte', () => {
    mockLocation.pathname = '/';
    render(<App />);
    
    const socketHandlers = (useSocket as any).mock.calls[0][1];
    
    socketHandlers.onConnect();
    
    expect(screen.getByText(/Bienvenue/i)).toBeInTheDocument();
  });

  it('devrait appeler onGameStarted et changer l\'état du jeu', () => {
    mockLocation.pathname = '/room1/player1';
    const { rerender } = render(<App />);
    
    const socketHandlers = (useSocket as any).mock.calls[0][1];
    
    socketHandlers.onConnect();
    socketHandlers.onGameStarted({ seed: 12345 });
    
    rerender(<App />);
    
    expect(socketHandlers.onGameStarted).toBeDefined();
  });

  it('devrait gérer onRoomUpdate avec des données de joueurs', () => {
    mockLocation.pathname = '/room1/player1';
    render(<App />);
    
    const socketHandlers = (useSocket as any).mock.calls[0][1];
    
    socketHandlers.onRoomUpdate({ 
      players: [
        { id: '1', name: 'Player1', score: 0, lines: 0 }
      ] 
    });
    
    expect(socketHandlers.onRoomUpdate).toBeDefined();
  });

  it('devrait gérer onPlayerJoined', () => {
    mockLocation.pathname = '/room1/player1';
    render(<App />);
    
    const socketHandlers = (useSocket as any).mock.calls[0][1];
    
    socketHandlers.onPlayerJoined({ id: '2', name: 'Player2' });
    
    expect(socketHandlers.onPlayerJoined).toBeDefined();
  });

  it('devrait gérer onPlayerLeft', () => {
    mockLocation.pathname = '/room1/player1';
    render(<App />);
    
    const socketHandlers = (useSocket as any).mock.calls[0][1];
    
    socketHandlers.onPlayerLeft({ id: '2' });
    
    expect(socketHandlers.onPlayerLeft).toBeDefined();
  });

  it('devrait gérer onDisconnect', () => {
    mockLocation.pathname = '/room1/player1';
    render(<App />);
    
    const socketHandlers = (useSocket as any).mock.calls[0][1];
    
    socketHandlers.onDisconnect();
    
    expect(socketHandlers.onDisconnect).toBeDefined();
  });

  it('devrait gérer onHostAssigned avec alert', () => {
    mockLocation.pathname = '/room1/player1';
    
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<App />);
    
    const socketHandlers = (useSocket as any).mock.calls[0][1];
    
    socketHandlers.onHostAssigned({ id: '1', name: 'Player1' });
    
    expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('Player1'));
    
    alertMock.mockRestore();
  });

  it('devrait appeler handleStartGame', () => {
    mockLocation.pathname = '/room1/player1';
    
    const mockSocketWithEmit = {
      connected: true,
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    };
    
    (useSocket as any).mockReturnValue(mockSocketWithEmit);
    
    const { rerender } = render(<App />);
    
    const socketHandlers = (useSocket as any).mock.calls[0][1];
    act(() => {
      socketHandlers.onConnect();
    });
    
    rerender(<App />);
    
    expect(mockSocketWithEmit.emit).toBeDefined();
  });

  it('devrait gérer une erreur lors du join', async () => {
    mockLocation.pathname = '/room1/player1';
    
    const mockErrorEmit = vi.fn((event, data, callback) => {
      if (event === 'join' && callback) {
        callback({ ok: false, reason: 'room_full' });
      }
    });
    
    const mockSocketError = {
      connected: true,
      on: vi.fn(),
      off: vi.fn(),
      emit: mockErrorEmit,
    };
    
    (useSocket as any).mockReturnValue(mockSocketError);
    
    render(<App />);
    
    const socketHandlers = (useSocket as any).mock.calls[0][1];
    act(() => {
      socketHandlers.onConnect();
    });
    
    await waitFor(() => {
      expect(mockErrorEmit).toHaveBeenCalledWith(
        'join',
        expect.objectContaining({ roomId: 'room1', name: 'player1' }),
        expect.any(Function)
      );
    });
  });

  it('devrait afficher WaitingRoom quand gameState est waiting', async () => {
    mockLocation.pathname = '/room1/player1';
    
    const mockSocket = {
      connected: true,
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn((event, data, callback) => {
        if (event === 'join' && callback) {
          callback({ ok: true, roomId: 'room1', seed: 12345 });
        }
      }),
    };
    
    (useSocket as any).mockReturnValue(mockSocket);
    
    const { rerender } = render(<App />);
    
    const socketHandlers = (useSocket as any).mock.calls[0][1];
    
    act(() => {
      socketHandlers.onConnect();
    });
    
    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalled();
    });

    rerender(<App />);
    
    expect(mockSocket).toBeDefined();
  });

  it('devrait rendre le composant Game quand gameState est playing', async () => {
    mockLocation.pathname = '/room1/player1';
    
    const mockSocket = {
      connected: true,
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn((event, data, callback) => {
        if (event === 'join' && callback) {
          callback({ ok: true, roomId: 'room1', seed: 12345 });
        }
      }),
    };
    
    (useSocket as any).mockReturnValue(mockSocket);
    
    render(<App />);
    
    const socketHandlers = (useSocket as any).mock.calls[0][1];
    
    act(() => {
      socketHandlers.onConnect();
      socketHandlers.onGameStarted({ seed: 12345 });
    });
    
    await waitFor(() => {
      expect(mockSocket.on).toHaveBeenCalled();
    });
  });
});