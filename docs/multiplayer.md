# Multiplayer implementation status

The relay server treats the room creator as the authoritative host. Guests send
input; only host snapshots and events are relayed to the room. See
`server/PROTOCOL.md` for the wire protocol.

## Implemented

- Room creation/joining, host/guest roles, disconnect handling, and a six-player cap.
- Remote player rendering and interpolation.
- Host-authoritative day/night timing through `cycleStartTime` snapshots.
- Deterministic static layout for trees, rocks, pools, and skeleton bases using a
  room-code-seeded random generator.
- Host-authoritative skeleton position, type, HP, and removal. Skeletons have stable
  IDs, guests do not run skeleton AI, and guest sprites interpolate toward 10 Hz host
  snapshots.
- Guest movement input is sent at 20 Hz. The host simulates bounded guest positions,
  includes every player in snapshots, and guests reconcile local prediction to host
  state.
- Guest melee (sword) attacks are sent as a validated `attack` intent (`inputKind:
  'attack', targetId`) rather than a local mutation. The host checks the target
  skeleton exists, is within range of the guest's authoritative position, and isn't
  on cooldown, then applies damage the same way local/host attacks do. The guest's
  own swing animation is cosmetic only; hp/removal flows back through the next
  world-snapshot.
- Guest axe/pickaxe hits are sent as a validated `chop`/`mine` intent (`targetId` is
  a stable per-node id assigned at scatter time, e.g. `tree-42`/`rock-17`, since trees
  and rocks are placed deterministically from the room-code-seeded generator). The
  host validates range/cooldown, applies the hit, and broadcasts a `node-hit`
  world-event naming which guest it was for; every client applies the same visual
  hit/destruction, but only the acting guest's own client grants itself the resulting
  wood/stone/iron so materials aren't duplicated. The host's own local chopping is
  still not broadcast to guests — see finding 3.

## Audit findings and remaining work

1. Host-side guest movement currently enforces world bounds but not collisions with
   trees, rocks, pools, structures, or mobs.
2. Guest bow/gun/thrown-item use is still a local mutation rather than a
   host-validated intent — melee and axe/pickaxe are migrated, ranged tool use is not.
   Ranged damage and obsidian mining can be overwritten or diverge.
3. Mutable world state is only partly synchronized: chop/mine hits from a guest now
   reach everyone via `node-hit`, but the host's own local chopping/mining is not
   broadcast at all, and dropped items, structures, filled containers, and smelting
   state remain entirely client-local.
4. Loot pickup and general inventory changes (other than the chop/mine resource
   grant above) are not host-authoritative.
5. Skeleton projectiles are not included in snapshots/events. Mob position and HP now
   agree, but guests do not yet render authoritative archer arrows or receive damage
   from a host-side guest-player simulation.
6. Gun, clone, and magic effects have no network representation.
7. Late join has no full mutable-world bootstrap beyond the periodic snapshot — a
   guest joining after trees/rocks were already chopped by others will still see them
   as intact until it happens to be hit again.
8. The client has no visible reconnect/error state after an unexpected disconnect.

## Recommended next slice

Broadcast the host's own local chop/mine/attack actions as the same `node-hit` /
attack-result events guest intents produce (currently only guest-originated hits
reach other clients), and give late joiners a full mutable-world bootstrap (already-
destroyed nodes, dropped items) instead of only the periodic snapshot.
