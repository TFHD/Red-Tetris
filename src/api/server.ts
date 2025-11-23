
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Room, Player, JoinRequest, JoinResponse, InputRequest, InputResponse, SyncStateRequest, SyncStateResponse, SaveScoreRequest, LeaderboardResponse } from '../types.js';
import { ensureRoom, validateGameState } from './gameLogic.js';
import { saveScore, getTopScores, getPlayerBestScores } from './leaderboard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.VITE_PORT) || 3000;
const ADDRESS = process.env.VITE_ADDRESS || 'localhost';

if (isProduction) {
  const clientPath = join(__dirname, '..', 'client');
  console.log('Production mode - serving client from', clientPath);
  app.use(express.static(clientPath));

  app.get('/:room/:player', (req, res) => {
    res.sendFile(join(clientPath, 'index.html'));
  });

  app.get('/', (req, res) => {
    res.sendFile(join(clientPath, 'index.html'));
  });
}

const io = new Server(server, {
  cors: {
    origin: isProduction ? '*' : `http://${ADDRESS}:3001`,
    methods: ['GET', 'POST'],
  },
});

const rooms = new Map<string, Room>();

io.on('connection', (socket) => {
  console.log('connect', socket.id);

  socket.on('join', ({ roomId, name } : JoinRequest, ack : (response: JoinResponse) => void) => {
    console.log('join', roomId, name);
    try {
      const room = ensureRoom(roomId, rooms);
      if (room.players.size >= 4) return ack && ack({ ok: false, roomId, reason: 'room_full' });
      if (room.started) return ack && ack({ ok: false, roomId, reason: 'room_started' });
      if (name.length > 16) return ack && ack({ ok: false, roomId, reason: 'name_too_long' });

      for (const player of room.players.values())
        if (player.name === name)
          return ack && ack({ ok: false, roomId, reason: 'name_already_taken' });

      const isFirst = room.players.size === 0;


      room.players.set(socket.id, {
        id: socket.id,
        name: name || 'player',
        role: isFirst ? 'host' : 'guest',
        lastState: null,
        score: 0,
        lines: 0,
        gameOver: false
      });

      socket.join(roomId);
      socket.to(roomId).emit('player_joined', { id: socket.id, name });
      ack && ack({ ok: true, roomId, seed: room.seed });

      io.in(roomId).emit('room_update', {
        players: Array.from(room.players.values()).map((p: Player) => ({
          id: p.id,
          name: p.name,
          score: p.score,
          lines: p.lines,
          gameOver: p.gameOver,
          role: p.role
        }))
      });
    } catch (err) {
      console.error(err);
      ack && ack({ ok: false, roomId, reason: 'server_error' });
    }
  });

  socket.on('input', ({ roomId } : InputRequest, ack : (response: InputResponse) => void) => {
    const room = rooms.get(roomId);
    if (!room) return ack && ack({ ok: false, reason: 'no_room' });

    ack && ack({ ok: true });
  });

  socket.on('sync_state', ({ roomId, state }: SyncStateRequest, ack : (response: SyncStateResponse) => void) => {
    const room = rooms.get(roomId);
    if (!room) return ack && ack({ ok: false, reason: 'room_not_found' });

    let player = room.players.get(socket.id);
    if (!player) return ack && ack({ ok: false, reason: 'player_not_found' });

    const isValid = validateGameState(player, state);
    
    if (!isValid) {
      console.warn(`Invalid game state from ${socket.id} in room ${roomId}`);
      return ack && ack({ ok: false, reason: 'invalid_state' });
    }

    if (state.score !== undefined) player.score = state.score;
    if (state.lines !== undefined) player.lines = state.lines;
    if (state.gameOver !== undefined) player.gameOver = state.gameOver;
    player.lastState = state;

    socket.to(roomId).emit('opponent_state', { from: socket.id, state });
    
    ack && ack({ ok: true });
  });

  socket.on('send_penalty', ({ roomId, lines } : { roomId: string, lines: number }) => {
    console.log(`👉 Player ${socket.id} sending ${lines} penalty lines to room ${roomId}`);
    
    const room = rooms.get(roomId);
    if (!room) return;

    const playersList = Array.from(room.players.keys());
    const currentIndex = playersList.indexOf(socket.id);

    if (currentIndex === -1) return;
    if (playersList.length < 2) return;

    const nextIndexNotGameOver = (() => {
      let nextIndex = (currentIndex + 1) % playersList.length;
      let safetyCounter = 0;
      while (room.players.get(playersList[nextIndex]!)?.gameOver) {
        nextIndex = (nextIndex + 1) % playersList.length;
        safetyCounter++;
        if (safetyCounter > playersList.length) return -1;
      }
      return nextIndex;
    });

    const nextIndex = nextIndexNotGameOver();
    if (nextIndex === -1) return;

    const targetPlayerId = playersList[nextIndex]!;

    io.to(targetPlayerId).emit('receive_penalty', {
      from: socket.id, 
      lines: lines 
    });
  });

  socket.on('start_game', ({ roomId } : { roomId: string }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player || player.role !== 'host') {
      console.warn(`Player ${socket.id} tried to start game but is not host`);
      return;
    }

    if (room.started) {
      console.warn(`Room ${roomId} already started`);
      return;
    }
    room.started = true;

    io.in(roomId).emit('game_started', { seed: room.seed });
  });

  socket.on('end_game', ({ roomId } : { roomId: string }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const gameOverPlayers = Array.from(room.players.values()).map((p: Player) => p.gameOver)

    if (
      gameOverPlayers.length == room.players.size - 1 && room.players.size > 1 ||
      gameOverPlayers.length == room.players.size
    ) {
      room.started = false;
      room.seed = Date.now();
    }

    return;
  });

  socket.on('restart_game', ({ roomId } : { roomId: string }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player || player.role !== 'host') {
      console.warn(`Player ${socket.id} tried to restart game but is not host`);
      return;
    }

    for (const [playerId, player] of room.players.entries()) {
      player.score = 0;
      player.lines = 0;
      player.gameOver = false;
      player.lastState = null;
    }

    room.seed = Date.now();
    room.started = true;

    io.in(roomId).emit('game_restarted', { seed: room.seed });
    
    console.log(`Game restarted in room ${roomId} by host ${socket.id}`);
  });

  socket.on('save_score', async ({ roomId, name, score, lines }: SaveScoreRequest, ack?: (response: { ok: boolean }) => void) => {
    try {
      await saveScore({
        name,
        score,
        lines,
        roomId,
      });

      // Récupère le top 10 et l'envoie à toute la room
      const topScores = await getTopScores(10);
      io.in(roomId).emit('leaderboard_update', { scores: topScores } as LeaderboardResponse);
      
      ack && ack({ ok: true });
    } catch (error) {
      console.error('Error saving score:', error);
      ack && ack({ ok: false });
    }
  });

  socket.on('get_leaderboard', async (data: { limit?: number }, ack?: (response: LeaderboardResponse) => void) => {
    try {
      const limit = data?.limit || 10;
      const scores = await getTopScores(limit);
      ack && ack({ scores });
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      ack && ack({ scores: [] });
    }
  });

  socket.on('get_player_scores', async (data: { name: string, limit?: number }, ack?: (response: LeaderboardResponse) => void) => {
    try {
      const limit = data?.limit || 5;
      const scores = await getPlayerBestScores(data.name, limit);
      ack && ack({ scores });
    } catch (error) {
      console.error('Error getting player scores:', error);
      ack && ack({ scores: [] });
    }
  });

  socket.on('disconnect', () => {
    console.log('disconnect', socket.id);
    
    for (const [roomId, room] of rooms.entries()) {
      const player = room.players.get(socket.id);
      if (!player) continue;
      
      const wasHost = player.role === 'host';
      room.players.delete(socket.id);
      socket.to(roomId).emit('player_left', { id: socket.id });
      
      if (room.players.size === 0) {
        rooms.delete(roomId);
        continue;
      }
      
      if (wasHost) {
        const next = room.players.values().next().value;
        if (!next) continue;
        next.role = 'host';
        io.in(roomId).emit('host_assigned', { id: next.id, name: next.name });
      }
      
      io.in(roomId).emit('room_update', {
        players: Array.from(room.players.values()).map(p => ({
          id: p.id,
          name: p.name,
          score: p.score,
          role: p.role
        }))
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://${ADDRESS || 'localhost'}:${PORT}`);
});