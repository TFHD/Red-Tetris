
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Room, Player, GameState } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

if (isProduction) {
  const clientPath = join(__dirname, '..', 'client');
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
    origin: isProduction ? false : 'http://localhost:3001',
    methods: ['GET', 'POST'],
  },
});

const rooms = new Map<string, Room>();

function ensureRoom(roomId: string): Room {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      players: new Map(),
      seed: Date.now(),
      started: false
    });
  }
  return rooms.get(roomId) as Room;
}

io.on('connection', (socket) => {
  console.log('connect', socket.id);

  socket.on('join', ({ roomId, name }, ack) => {
    console.log('join', roomId, name);
    try {
      const room = ensureRoom(roomId);
      if (room.players.size >= 2) {
        return ack && ack({ ok: false, roomId, reason: 'room_full' });
      }
      for (const player of room.players.values()) {
        if (player.name === name) {
          return ack && ack({ ok: false, roomId, reason: 'name_already_taken' });
        }
      }

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
      ack && ack({ ok: false, reason: 'server_error' });
    }
  });

  socket.on('input', ({ roomId }, ack) => {
    const room = rooms.get(roomId);
    if (!room) return ack && ack({ ok: false, reason: 'no_room' });

    ack && ack({ ok: true });
  });

  socket.on('sync_state', ({ roomId, state }: { roomId: string, state: GameState }, ack) => {
    const room = rooms.get(roomId);
    if (!room) return;
    let player = room.players.get(socket.id);
    if (!player) return;

    player = { ...player, ...state };
    socket.to(roomId).emit('opponent_state', { from: socket.id, state });
  });

  //Gestion de la penalite dans le bacck 
  socket.on('send_penalty', ({ roomId, lines }) => {
    console.log(`👉 Player ${socket.id} sending ${lines} penalty lines to room ${roomId}`);
    
    const room = rooms.get(roomId);
    if (!room) return;
    

    socket.to(roomId).emit('receive_penalty', { 
      from: socket.id, 
      lines: lines 
    });
  });

  socket.on('start_game', ({ roomId }) => {
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

  socket.on('end_game', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const gameOverPlayers = Array.from(room.players.values()).map((p: Player) => p.gameOver)

    if (gameOverPlayers.length == room.players.size) {
      room.started = false;
      io.in(roomId).emit('game_ended');
    }

    return;

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
  console.log(`Server listening on http://localhost:${PORT}`);
});