import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSocket } from './useSocket.js';
import { io } from 'socket.io-client';

// Mock Socket.IO client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    close: vi.fn(),
    connected: true,
  })),
}));

describe('useSocket', () => {
  const mockUrl = 'http://localhost:3000';
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      close: vi.fn(),
      connected: true,
    };
    (io as any).mockReturnValue(mockSocket);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('devrait créer une instance socket', async () => {
    const handlers = {};
    const { result } = renderHook(() => useSocket(mockUrl, handlers));

    await waitFor(() => {
      expect(result.current).toBeTruthy();
    });

    expect(io).toHaveBeenCalledWith(mockUrl, expect.objectContaining({
      transports: ['websocket', 'polling'],
      reconnection: true,
    }));
  });

  it('devrait enregistrer le handler onConnect', () => {
    const onConnect = vi.fn();
    renderHook(() => useSocket(mockUrl, { onConnect }));

    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
  });

  it('devrait enregistrer le handler onDisconnect', () => {
    const onDisconnect = vi.fn();
    renderHook(() => useSocket(mockUrl, { onDisconnect }));

    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
  });

  it('devrait enregistrer le handler onRoomUpdate', () => {
    const onRoomUpdate = vi.fn();
    renderHook(() => useSocket(mockUrl, { onRoomUpdate }));

    expect(mockSocket.on).toHaveBeenCalledWith('room_update', expect.any(Function));
  });

  it('devrait enregistrer le handler onGameStarted', () => {
    const onGameStarted = vi.fn();
    renderHook(() => useSocket(mockUrl, { onGameStarted }));

    expect(mockSocket.on).toHaveBeenCalledWith('game_started', expect.any(Function));
  });

  it('devrait fermer le socket lors du cleanup', async () => {
    const handlers = {};
    const { unmount } = renderHook(() => useSocket(mockUrl, handlers));

    unmount();

    expect(mockSocket.close).toHaveBeenCalled();
  });

  it('devrait gérer tous les événements Socket.IO', () => {
    const handlers = {
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
      onError: vi.fn(),
      onRoomUpdate: vi.fn(),
      onPlayerJoined: vi.fn(),
      onPlayerLeft: vi.fn(),
      onGameStarted: vi.fn(),
      onOpponentState: vi.fn(),
      onReceivePenalty: vi.fn(),
      onGameOver: vi.fn(),
    };

    renderHook(() => useSocket(mockUrl, handlers));

    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('room_update', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('player_joined', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('player_left', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('game_started', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('opponent_state', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('receive_penalty', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('game_over', expect.any(Function));
  });

  it('devrait appeler onConnect quand le socket se connecte', () => {
    const onConnect = vi.fn();
    renderHook(() => useSocket(mockUrl, { onConnect }));

    const connectCall = (mockSocket.on as any).mock.calls.find((call: any[]) => call[0] === 'connect');
    expect(connectCall).toBeDefined();
    
    const connectCallback = connectCall[1];
    connectCallback();

    expect(onConnect).toHaveBeenCalledWith(mockSocket);
  });

  it('devrait appeler onDisconnect quand le socket se déconnecte', () => {
    const onDisconnect = vi.fn();
    renderHook(() => useSocket(mockUrl, { onDisconnect }));

    const disconnectCall = (mockSocket.on as any).mock.calls.find((call: any[]) => call[0] === 'disconnect');
    const disconnectCallback = disconnectCall[1];
    disconnectCallback('transport close');

    expect(onDisconnect).toHaveBeenCalledWith('transport close');
  });

  it('devrait appeler onError lors d\'une erreur de connexion', () => {
    const onError = vi.fn();
    renderHook(() => useSocket(mockUrl, { onError }));

    const errorCall = (mockSocket.on as any).mock.calls.find((call: any[]) => call[0] === 'connect_error');
    const errorCallback = errorCall[1];
    const error = new Error('Connection failed');
    errorCallback(error);

    expect(onError).toHaveBeenCalledWith(error);
  });

  it('devrait appeler onRoomUpdate avec des données', () => {
    const onRoomUpdate = vi.fn();
    renderHook(() => useSocket(mockUrl, { onRoomUpdate }));

    const roomUpdateCall = (mockSocket.on as any).mock.calls.find((call: any[]) => call[0] === 'room_update');
    const roomUpdateCallback = roomUpdateCall[1];
    const data = { players: [] };
    roomUpdateCallback(data);

    expect(onRoomUpdate).toHaveBeenCalledWith(data);
  });

  it('devrait appeler onPlayerJoined avec des données', () => {
    const onPlayerJoined = vi.fn();
    renderHook(() => useSocket(mockUrl, { onPlayerJoined }));

    const playerJoinedCall = (mockSocket.on as any).mock.calls.find((call: any[]) => call[0] === 'player_joined');
    const playerJoinedCallback = playerJoinedCall[1];
    const data = { id: '1', name: 'Player1' };
    playerJoinedCallback(data);

    expect(onPlayerJoined).toHaveBeenCalledWith(data);
  });

  it('devrait appeler onPlayerLeft avec des données', () => {
    const onPlayerLeft = vi.fn();
    renderHook(() => useSocket(mockUrl, { onPlayerLeft }));

    const playerLeftCall = (mockSocket.on as any).mock.calls.find((call: any[]) => call[0] === 'player_left');
    const playerLeftCallback = playerLeftCall[1];
    const data = { id: '1' };
    playerLeftCallback(data);

    expect(onPlayerLeft).toHaveBeenCalledWith(data);
  });

  it('devrait appeler onGameStarted avec des données', () => {
    const onGameStarted = vi.fn();
    renderHook(() => useSocket(mockUrl, { onGameStarted }));

    const gameStartedCall = (mockSocket.on as any).mock.calls.find((call: any[]) => call[0] === 'game_started');
    const gameStartedCallback = gameStartedCall[1];
    const data = { seed: 12345 };
    gameStartedCallback(data);

    expect(onGameStarted).toHaveBeenCalledWith(data);
  });

  it('devrait appeler onOpponentState avec des données', () => {
    const onOpponentState = vi.fn();
    renderHook(() => useSocket(mockUrl, { onOpponentState }));

    const opponentStateCall = (mockSocket.on as any).mock.calls.find((call: any[]) => call[0] === 'opponent_state');
    const opponentStateCallback = opponentStateCall[1];
    const data = { state: { board: [] } };
    opponentStateCallback(data);

    expect(onOpponentState).toHaveBeenCalledWith(data);
  });

  it('devrait appeler onReceivePenalty avec des données', () => {
    const onReceivePenalty = vi.fn();
    renderHook(() => useSocket(mockUrl, { onReceivePenalty }));

    const receivePenaltyCall = (mockSocket.on as any).mock.calls.find((call: any[]) => call[0] === 'receive_penalty');
    const receivePenaltyCallback = receivePenaltyCall[1];
    const data = { lines: 2 };
    receivePenaltyCallback(data);

    expect(onReceivePenalty).toHaveBeenCalledWith(data);
  });

  it('devrait appeler onGameOver avec des données', () => {
    const onGameOver = vi.fn();
    renderHook(() => useSocket(mockUrl, { onGameOver }));

    const gameOverCall = (mockSocket.on as any).mock.calls.find((call: any[]) => call[0] === 'game_over');
    const gameOverCallback = gameOverCall[1];
    const data = { winner: 'Player1' };
    gameOverCallback(data);

    expect(onGameOver).toHaveBeenCalledWith(data);
  });
});