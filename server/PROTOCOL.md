# Sunday multiplayer protocol

Plain JSON text frames over a single WebSocket per client: `{ "type": "...", ...payload }`.

The server is a dumb relay — it never runs game logic. The **host's client** (the player
who created the room) is the single source of truth for the world: trees, mobs, structures,
inventories, day/night. Guests never simulate the world themselves; they send input and
render whatever the host broadcasts.

## Connecting

`wss://<server>?room=<CODE>&name=<name>`

- Omit `room` to create a new room; the server assigns a 4-character code and returns it
  in `welcome`. The creator becomes host.
- Pass `room=<CODE>` to join an existing room as a guest.
- Max 6 clients per room.

## Server -> client

| type | sent to | payload | meaning |
|---|---|---|---|
| `welcome` | joining client | `id, isHost, color, name, code, players, started` | connection accepted, your assigned id/role |
| `join-failed` | joining client | `reason` | room not found / full; socket is closed after |
| `player-joined` | everyone else in room | `id, color, name, isHost` | someone joined |
| `player-left` | everyone else in room | `id` | a guest disconnected |
| `host-left` | everyone in room | — | host disconnected; room is torn down, guests should return to menu |
| `start-game` | everyone (relayed from host) | — | host's world has finished loading and is now live |
| `world-snapshot` | everyone (relayed from host) | game-defined | periodic (~10Hz) world state; see below |
| `world-event` | everyone (relayed from host) | game-defined | one-off event that shouldn't wait for the next snapshot tick |

## Client -> server

| type | sent by | payload | server behavior |
|---|---|---|---|
| `start-game` | host only | — | marks room started, relayed to guests |
| `input` | guest only | game-defined (keys, pointer, action) | forwarded to host only, tagged with `fromId` |
| `world-snapshot` | host only | game-defined | broadcast to all guests |
| `world-event` | host only | game-defined | broadcast to all guests |

Any other client that sends `world-snapshot`/`world-event`/`start-game` is ignored — the
server checks `fromId === room.hostId` before relaying.

## world-snapshot shape (suggested)

The server doesn't care about this shape — it's opaque payload. Suggested starting point:

```json
{
  "type": "world-snapshot",
  "players": [{ "id": "...", "x": 0, "y": 0, "hp": 20, "equipped": "sword" }],
  "mobs": [{ "id": "...", "kind": "skeleton", "x": 0, "y": 0, "hp": 5 }],
  "events": [{ "kind": "tree-destroyed", "x": 0, "y": 0 }]
}
```

`events` carries discrete, low-frequency world changes (tree chopped, item dropped,
structure placed) since the last snapshot, so guests don't need full-state diffing —
apply `events` once, then lerp toward the latest `players`/`mobs` positions each frame.
