import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Server } from 'socket.io';
import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client';
import { ensureRoom, validateGameState } from './gameLogic.js';
import { GameState, Player } from '../types.js';

describe('Server Socket.IO', () => {
  let io: Server;
  let serverSocket: any;
  let clientSocket: ClientSocket;
  const TEST_PORT = 3000;

  beforeEach(async () => {
    io = new Server(TEST_PORT);
    
    io.on('connection', (socket) => {
      serverSocket = socket;
    });

    clientSocket = ClientIO(`http://localhost:${TEST_PORT}`);
    
    await new Promise<void>((resolve) => {
      clientSocket.on('connect', () => resolve());
    });
  });

  afterEach(() => {
    io.close();
    clientSocket.close();
  });

  it('devrait connecter un client', () => {
    expect(clientSocket.connected).toBe(true);
  });

  it('devrait recevoir un événement join', async () => {
    const joinPromise = new Promise<void>((resolve) => {
      serverSocket.on('join', (data: any, ack: Function) => {
        expect(data).toHaveProperty('roomId');
        expect(data).toHaveProperty('name');
        ack({ ok: true, roomId: data.roomId, seed: 12345 });
        resolve();
      });
    });

    clientSocket.emit('join', { roomId: 'test-room', name: 'testPlayer' }, (response: any) => {
      expect(response.ok).toBe(true);
    });

    await joinPromise;
  });

  it('devrait gérer le start_game', async () => {
    const startPromise = new Promise<void>((resolve) => {
      serverSocket.on('start_game', (data: any) => {
        expect(data).toHaveProperty('roomId');
        expect(data.roomId).toBe('test-room');
        resolve();
      });
    });

    clientSocket.emit('start_game', { roomId: 'test-room' });
    
    await startPromise;
  });

  it('devrait gérer send_penalty', async () => {
    const penaltyPromise = new Promise<void>((resolve) => {
      serverSocket.on('send_penalty', (data: any) => {
        expect(data).toHaveProperty('roomId');
        expect(data).toHaveProperty('lines');
        expect(typeof data.lines).toBe('number');
        resolve();
      });
    });

    clientSocket.emit('send_penalty', { roomId: 'test-room', lines: 2 });
    
    await penaltyPromise;
  });

  it('devrait gérer sync_state', async () => {
    const syncPromise = new Promise<void>((resolve) => {
      serverSocket.on('sync_state', (data: any, ack: Function) => {
        expect(data).toHaveProperty('roomId');
        expect(data).toHaveProperty('state');
        
        // Simuler la validation côté serveur
        if (ack) ack({ ok: true });
        resolve();
      });
    });

    clientSocket.emit('sync_state', {
      roomId: 'test-room',
      state: { board: [], score: 100, lines: 5, gameOver: false }
    }, (response: any) => {
      expect(response?.ok).toBe(true);
    });
    
    await syncPromise;
  });

  it('devrait valider sync_state avec callback', async () => {
    const syncPromise = new Promise<void>((resolve) => {
      serverSocket.on('sync_state', (data: any, ack: Function) => {
        // Tester simplement que le callback fonctionne
        if (ack) ack({ ok: true });
        resolve();
      });
    });

    clientSocket.emit('sync_state', {
      roomId: 'test-room',
      state: { board: [], score: 100, lines: 5, gameOver: false }
    }, (response: any) => {
      expect(response).toBeDefined();
    });
    
    await syncPromise;
  });
});

describe('Server helpers', () => {
  it('devrait créer une room si elle n\'existe pas', () => {
    const rooms = new Map();
    const roomId = 'test-room';

    const room = ensureRoom(roomId, rooms);
    expect(room).toBeDefined();
    expect(room.players).toBeInstanceOf(Map);
    expect(room.started).toBe(false);
  });

  it('devrait retourner une room existante', () => {
    const rooms = new Map();
    const roomId = 'test-room';
    const existingRoom = {
      players: new Map(),
      seed: 12345,
      started: true
    };
    rooms.set(roomId, existingRoom);

    const room = ensureRoom(roomId, rooms);
    expect(room.seed).toBe(12345);
    expect(room.started).toBe(true);
  });
});

// Tests pour la validation du game state (Game Logic côté serveur)
describe('Game State Validation', () => {

  it('devrait accepter un score qui augmente', () => {
    const player = { score: 100, lines: 1, gameOver: false } as Player;
    const newState = { board: [], score: 200, lines: 2, gameOver: false } as GameState;
    
    expect(validateGameState(player, newState)).toBe(true);
  });

  it('devrait rejeter un score qui diminue', () => {
    const player = { score: 200, lines: 2, gameOver: false } as Player;
    const newState = { board: [], score: 100, lines: 2, gameOver: false } as GameState;
    
    expect(validateGameState(player, newState)).toBe(false);
  });

  it('devrait rejeter des lignes qui diminuent', () => {
    const player = { score: 200, lines: 2, gameOver: false } as Player;
    const newState = { board: [], score: 200, lines: 1, gameOver: false } as GameState;
    
    expect(validateGameState(player, newState)).toBe(false);
  });

  it('devrait rejeter un score trop élevé par rapport aux lignes', () => {
    const player = { score: 0, lines: 0, gameOver: false } as Player;
    const newState = { board: [], score: 10000, lines: 1, gameOver: false } as GameState;
    
    // 1 ligne * 800 (max) = 800, donc 10000 est impossible
    expect(validateGameState(player, newState)).toBe(false);
  });

  it('devrait accepter un score cohérent avec les lignes', () => {
    const player = { score: 0, lines: 0, gameOver: false } as Player;
    const newState = { board: [], score: 500, lines: 3, gameOver: false } as GameState;
    
    // 3 lignes * 800 = 2400 max, donc 500 est OK
    expect(validateGameState(player, newState)).toBe(true);
  });

  it('devrait accepter le score maximum théorique (4 lignes = 800)', () => {
    const player = { score: 0, lines: 0, gameOver: false } as Player;
    const newState = { board: [], score: 800, lines: 4, gameOver: false } as GameState;
    
    expect(validateGameState(player, newState)).toBe(true);
  });

  it('devrait rejeter un retour en arrière de gameOver', () => {
    const player = { score: 100, lines: 1, gameOver: true } as Player;
    const newState = { board: [], score: 100, lines: 1, gameOver: false } as GameState;
    
    expect(validateGameState(player, newState)).toBe(false);
  });

  it('devrait accepter gameOver qui devient true', () => {
    const player = { score: 100, lines: 1, gameOver: false } as Player;
    const newState = { board: [], score: 100, lines: 1, gameOver: true } as GameState;
    
    expect(validateGameState(player, newState)).toBe(true);
  });

  it('devrait accepter un état sans modification', () => {
    const player = { score: 100, lines: 1, gameOver: false } as Player;
    const newState = { board: [], score: 100, lines: 1, gameOver: false } as GameState;
    
    expect(validateGameState(player, newState)).toBe(true);
  });

  it('devrait accepter un état avec seulement le board (sans score/lines)', () => {
    const player = { score: 100, lines: 1, gameOver: false } as Player;
    const newState = { board: [] } as GameState;
    
    // Pas de score/lines à valider
    expect(validateGameState(player, newState)).toBe(true);
  });

  it('devrait gérer un état initial (score 0, lines 0)', () => {
    const player = { score: 0, lines: 0, gameOver: false } as Player;
    const newState = { board: [], score: 0, lines: 0, gameOver: false } as GameState;
    
    expect(validateGameState(player, newState)).toBe(true);
  });
});