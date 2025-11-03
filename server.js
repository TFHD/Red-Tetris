
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
}

const rooms = new Map();

function ensureRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      players: new Map(),
      gameState: {
        seed: Date.now(),
        started: false
      }
    });
  }
  return rooms.get(roomId);
}

io.on('connection', (socket) => {
  console.log('connect', socket.id);

  socket.on('join', ({ roomId, name }, ack) => {
    console.log('join', roomId, name);
    try {
      const room = ensureRoom(roomId);
      if (room.players.size >= 2) {
        return ack && ack({ ok: false, reason: 'room_full' });
      }
      for (const player of room.players.values()) {
        if (player.name === name) {
          return ack && ack({ ok: false, reason: 'name_already_taken' });
        }
      }

      room.players.set(socket.id, {
        id: socket.id,
        name: name || 'player',
        score: 0,
        lines: 0,
        //TODO: mettre un role host / guest
      });

      socket.join(roomId);
      socket.to(roomId).emit('player_joined', { id: socket.id, name });
      ack && ack({ ok: true, roomId, seed: room.gameState.seed });

      io.in(roomId).emit('room_update', {
        players: Array.from(room.players.values()).map(p => ({ id: p.id, name: p.name, score: p.score }))
      });
    } catch (err) {
      console.error(err);
      ack && ack({ ok: false, reason: 'server_error' });
    }
  });

  socket.on('input', ({ roomId, input }, ack) => {
    const room = rooms.get(roomId);
    if (!room) return ack && ack({ ok: false, reason: 'no_room' });

    socket.to(roomId).emit('opponent_input', { from: socket.id, input });

    ack && ack({ ok: true });
  });

  socket.on('sync_state', ({ roomId, state }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player) return;
    
    player.lastState = state;
    
    if (state.score !== undefined)
      player.score = state.score;
    if (state.lines !== undefined)
      player.lines = state.lines;
    
    socket.to(roomId).emit('opponent_state', { from: socket.id, state });
  });

  socket.on('start_game', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    room.gameState.started = true;
    io.in(roomId).emit('game_started', { seed: room.gameState.seed });
  });

  socket.on('disconnect', () => {
    console.log('disconnect', socket.id);
    //TODO: Si l'host se deco en pleine partie, il donne son role a un autre joueur
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.has(socket.id)) {
        room.players.delete(socket.id);
        socket.to(roomId).emit('player_left', { id: socket.id });
        if (room.players.size === 0) {
          rooms.delete(roomId);
        } else {
          io.in(roomId).emit('room_update', {
            players: Array.from(room.players.values()).map(p => ({ id: p.id, name: p.name, score: p.score }))
          });
        }
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});