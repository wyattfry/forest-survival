const { WebSocketServer } = require('ws');
const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 3001;

function log(...args) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}

const MAX_NAME_LENGTH = 20;
const MAX_CLIENTS = 6;
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I, avoids ambiguity

const COLORS = [0x3f5fd6, 0xd63f3f, 0x3fd670, 0xd6b83f, 0x9a3fd6, 0x3fd6c9];

// Multiple rooms, each keyed by a short shareable code (see server/PROTOCOL.md).
// The host's game client is the single source of truth for world state; the server
// only relays messages, it never runs game logic.
const rooms = new Map(); // code -> { hostId, clients, started }

function send(ws, msg) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
}

function broadcast(room, msg, exceptId) {
  for (const [id, client] of room.clients) {
    if (id === exceptId) continue;
    send(client.ws, msg);
  }
}

function playerList(room) {
  return Array.from(room.clients.entries()).map(([id, c]) => ({
    id,
    color: c.color,
    name: c.name,
    isHost: id === room.hostId
  }));
}

function generateRoomCode() {
  let code;
  do {
    code = Array.from({ length: 4 }, () => ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]).join('');
  } while (rooms.has(code));
  return code;
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('sunday relay server\n');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const id = crypto.randomUUID();
  const query = new URL(req.url, 'http://localhost').searchParams;
  const name = (query.get('name') || 'Player').slice(0, MAX_NAME_LENGTH);
  const requestedCode = (query.get('room') || '').toUpperCase().trim();

  log(`connection ${id} name="${name}" requestedRoom="${requestedCode || '(new)'}"`);

  let code = requestedCode;
  let room;

  if (requestedCode) {
    room = rooms.get(requestedCode);
    if (!room) {
      log(`join-failed ${id}: room ${requestedCode} not found`);
      send(ws, { type: 'join-failed', reason: 'Room not found' });
      ws.close();
      return;
    }
    if (room.clients.size >= MAX_CLIENTS) {
      log(`join-failed ${id}: room ${requestedCode} full`);
      send(ws, { type: 'join-failed', reason: 'Room is full' });
      ws.close();
      return;
    }
  } else {
    code = generateRoomCode();
    room = {
      hostId: null,
      clients: new Map(),
      started: false
    };
    rooms.set(code, room);
    log(`created room ${code}`);
  }

  const color = COLORS[room.clients.size % COLORS.length];
  const isHost = room.clients.size === 0;

  room.clients.set(id, { ws, color, name });
  if (isHost) room.hostId = id;
  ws.roomCode = code;
  ws.clientId = id;

  log(`room ${code}: ${id} joined as ${isHost ? 'host' : 'guest'} (${room.clients.size} in room)`);

  send(ws, {
    type: 'welcome', id, isHost, color, name, code,
    players: playerList(room), started: room.started
  });
  broadcast(room, { type: 'player-joined', id, color, name, isHost }, id);

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      log(`room ${ws.roomCode}: malformed message from ${id}`);
      return;
    }

    const room = rooms.get(ws.roomCode);
    if (!room) return;

    switch (msg.type) {
      // Host tells the room the world is up and running (sent once BootScene has loaded).
      case 'start-game':
        if (id === room.hostId && !room.started) {
          room.started = true;
          log(`room ${ws.roomCode}: start-game from host ${id}`);
          broadcast(room, { type: 'start-game' }, id);
        }
        break;

      // Guest -> host only. Raw input (movement keys, pointer, action presses) for the
      // host's simulation to apply on that guest's behalf. Never broadcast to other guests.
      case 'input': {
        const host = room.clients.get(room.hostId);
        if (host && id !== room.hostId) send(host.ws, { ...msg, fromId: id });
        break;
      }

      // Host -> everyone. Periodic snapshot of world state (players, mobs, discrete
      // events since last tick). This is the only source of truth clients render from.
      case 'world-snapshot':
        if (id === room.hostId) broadcast(room, msg, id);
        break;

      // Host -> everyone. One-off world events (chat, death screen, day/night change)
      // that don't need to wait for the next snapshot tick.
      case 'world-event':
        if (id === room.hostId) broadcast(room, msg, id);
        break;

      default:
        log(`room ${ws.roomCode}: unknown message type "${msg.type}" from ${id}`);
        break;
    }
  });

  ws.on('close', () => {
    const room = rooms.get(ws.roomCode);
    if (!room) return;

    room.clients.delete(id);

    if (id === room.hostId) {
      log(`room ${ws.roomCode}: host ${id} left, tearing down room`);
      broadcast(room, { type: 'host-left' });
      rooms.delete(ws.roomCode);
      return;
    }

    log(`room ${ws.roomCode}: ${id} left (${room.clients.size} remaining)`);
    broadcast(room, { type: 'player-left', id });
    if (room.clients.size === 0) {
      log(`room ${ws.roomCode}: empty, removing`);
      rooms.delete(ws.roomCode);
    }
  });

  ws.on('error', (err) => {
    log(`room ${ws.roomCode}: socket error for ${id}: ${err.message}`);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  log(`sunday relay server listening on 0.0.0.0:${PORT}`);
});
