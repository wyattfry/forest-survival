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
| `welcome` | joining client | `id, isHost, color, name, code, players, started, worldConfig` | connection accepted, your assigned id/role and room settings |
| `join-failed` | joining client | `reason` | room not found / full; socket is closed after |
| `player-joined` | everyone else in room | `id, color, name, isHost` | someone joined |
| `player-left` | everyone else in room | `id` | a guest disconnected |
| `host-left` | everyone in room | — | host disconnected; room is torn down, guests should return to menu |
| `start-game` | everyone (relayed from host) | — | host's world has finished loading and is now live |
| `world-snapshot` | everyone (relayed from host) | game-defined | periodic (~10Hz) world state; see below |
| `world-event` | everyone (relayed from host) | game-defined | one-off event that shouldn't wait for the next snapshot tick |
| `chat-message` | everyone | `id, name, text` | a server-validated room chat message |

## Client -> server

| type | sent by | payload | server behavior |
|---|---|---|---|
| `world-config` | host only | `peaceful` | retained for later joiners and broadcast to connected guests |
| `start-game` | host only | — | marks room started, relayed to guests |
| `input` | guest only | game-defined (keys, pointer, action) | forwarded to host only, tagged with `fromId` |
| `world-snapshot` | host only | game-defined | broadcast to all guests |
| `world-event` | host only | game-defined | broadcast to all guests |
| `chat-message` | any player | `text` (max 200 characters) | stamps sender identity and broadcasts to the room |

Any other client that sends `world-snapshot`/`world-event`/`start-game` is ignored — the
server checks `fromId === room.hostId` before relaying.

Movement input currently uses this shape and is sent by guests at approximately 20 Hz:

```json
{
  "type": "input",
  "inputKind": "movement",
  "moveX": 0,
  "moveY": -1
}
```

The relay adds `fromId` before forwarding it to the host. The host normalizes the
vector, simulates the guest at the shared player speed, and stops movement if input is
stale for more than 250 ms.

Melee attacks are sent as a separate `input` shape naming the authoritative target:

```json
{
  "type": "input",
  "inputKind": "attack",
  "targetId": "skeleton-12"
}
```

The host looks up `targetId` among its live skeletons, checks the guest's
authoritative position is within range and not on attack cooldown, and applies
damage exactly as it would for its own local attacks. There is no direct reply —
the result (new hp, or removal) reaches the guest via the next `world-snapshot`.

Axe/pickaxe hits are sent the same way, with `inputKind` naming the tool and
`targetId` naming a resource node. Trees and rocks are placed deterministically by
the room-code-seeded generator, so every client can assign the same stable id at
scatter time (`tree-<index>` / `rock-<index>`) without the host ever transmitting
node positions:

```json
{
  "type": "input",
  "inputKind": "chop",
  "targetId": "tree-42"
}
```

(`inputKind: "mine"` for rocks — the shape is otherwise identical.) The host
validates range/cooldown as with attacks, applies the hit, and broadcasts the
result as a `world-event` rather than waiting for the next snapshot, since a
destroyed node needs everyone to remove it (and only the acting guest to gain the
resulting materials) before the next tick:

```json
{
  "type": "world-event",
  "kind": "node-hit",
  "nodeKind": "tree",
  "targetId": "tree-42",
  "forId": "<guest's client id>"
}
```

Every client applies the same visual hit/destruction to `targetId`; only the client
whose own id matches `forId` grants itself the resulting wood/stone/iron. The
host's own local chops/mines do not currently emit this event (see
`docs/multiplayer.md`).

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
