import Phaser from 'phaser';
import RemotePlayer from '../../entities/RemotePlayer.js';
import { WORLD_WIDTH, WORLD_HEIGHT } from './constants.js';

export const multiplayerMethods = {
  setupMultiplayer() {
    if (!this.network) return;

    this.hostGuestStates = new Map();
    this.nextInputTime = 0;
    this.showRoomCodeHud();
    this.setupMultiplayerChat();

    this.network.on('player-joined', (msg) => this.addRemotePlayer(msg));
    this.network.on('player-left', (msg) => this.removeRemotePlayer(msg.id));
    this.network.on('host-left', () => this.handleHostLeft());
    this.network.on('disconnected', () => this.handleNetworkDisconnected());
    this.network.on('chat-message', (msg) => this.addChatMessage(msg));

    // Any players already in the room when we connected (host sees guests who
    // joined before it started the world; a guest sees players already present).
    this.network.players.forEach((p) => {
      if (p.id !== this.network.id) this.addRemotePlayer(p);
    });

    if (this.isMultiplayerHost) {
      this.network.on('input', (msg) => this.handleRemoteInput(msg));
      this.network.send('world-config', { peaceful: this.peaceful });
      this.network.send('start-game', {});
      this.nextSnapshotTime = 0;
    } else {
      this.network.on('world-snapshot', (msg) => this.applyWorldSnapshot(msg));
      this.network.on('world-event', (msg) => this.applyWorldEvent(msg));
    }

    this.events.on('shutdown', () => {
      this.destroyMultiplayerChat();
      if (this.network) this.network.disconnect();
    });
  },

  setupMultiplayerChat() {
    this.chatMessages = [];
    this.chatLogText = this.add.text(12, this.scale.height - 54, '', {
      fontFamily: 'Arial', fontSize: '13px', color: '#ffffff',
      backgroundColor: 'rgba(20,20,20,0.72)', padding: { x: 8, y: 6 },
      wordWrap: { width: 320 }
    }).setOrigin(0, 1).setScrollFactor(0).setDepth(2600000);

    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 200;
    input.placeholder = 'Chat — press Enter to send';
    input.setAttribute('aria-label', 'Multiplayer chat message');
    Object.assign(input.style, {
      position: 'absolute', boxSizing: 'border-box', zIndex: '20',
      fontFamily: 'Arial', fontSize: '13px', padding: '7px 9px',
      color: '#ffffff', background: 'rgba(26,26,26,0.92)',
      border: '1px solid #666666', borderRadius: '4px', outline: 'none'
    });

    input.addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Enter') {
        event.preventDefault();
        const text = input.value.trim();
        if (text) this.network.send('chat-message', { text });
        input.value = '';
        input.blur();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        input.value = '';
        input.blur();
      }
    });

    document.body.appendChild(input);
    this.chatHtmlInput = input;
    this.chatFocusHandler = (event) => {
      if (event.key !== 'Enter' || document.activeElement === input) return;
      event.preventDefault();
      event.stopPropagation();
      input.focus();
    };
    window.addEventListener('keydown', this.chatFocusHandler, true);
    this.positionMultiplayerChat();
    this.chatResizeHandler = () => this.positionMultiplayerChat();
    this.scale.on('resize', this.chatResizeHandler);
  },

  positionMultiplayerChat() {
    if (!this.chatHtmlInput || !this.chatLogText) return;
    const rect = this.game.canvas.getBoundingClientRect();
    const scaleX = rect.width / this.scale.width;
    const scaleY = rect.height / this.scale.height;
    this.chatHtmlInput.style.left = `${window.scrollX + rect.left + 12 * scaleX}px`;
    this.chatHtmlInput.style.top = `${window.scrollY + rect.top + (this.scale.height - 40) * scaleY}px`;
    this.chatHtmlInput.style.width = `${300 * scaleX}px`;
    this.chatHtmlInput.style.height = `${32 * scaleY}px`;
    this.chatLogText.setPosition(12, this.scale.height - 48);
  },

  addChatMessage(msg) {
    if (!msg || typeof msg.text !== 'string') return;
    const name = msg.name || 'Player';
    this.chatMessages.push(`${name}: ${msg.text}`);
    this.chatMessages = this.chatMessages.slice(-8);
    this.chatLogText.setText(this.chatMessages.join('\n'));
  },

  destroyMultiplayerChat() {
    if (this.chatHtmlInput) {
      this.chatHtmlInput.remove();
      this.chatHtmlInput = null;
    }
    if (this.chatFocusHandler) {
      window.removeEventListener('keydown', this.chatFocusHandler, true);
      this.chatFocusHandler = null;
    }
    if (this.chatResizeHandler) {
      this.scale.off('resize', this.chatResizeHandler);
      this.chatResizeHandler = null;
    }
  },

  showRoomCodeHud() {
    if (!this.roomCode) return;

    this.roomCodeText = this.add.text(0, 0, `Room: ${this.roomCode}`, {
      fontFamily: 'Arial', fontSize: '14px', color: '#ffffff',
      backgroundColor: 'rgba(26,26,26,0.85)', padding: { x: 8, y: 5 }
    }).setScrollFactor(0).setDepth(2500000);

    const position = () => this.roomCodeText.setPosition(12, 12);
    position();
    this.scale.on('resize', position);
  },

  addRemotePlayer(info) {
    if (this.remotePlayers.has(info.id)) return;
    const spawn = this.player ? { x: this.player.x, y: this.player.y } : { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };
    const remote = new RemotePlayer(this, spawn.x, spawn.y, info.color, info.name, !!info.isHost);
    this.remotePlayers.set(info.id, remote);
    if (this.isMultiplayerHost && !info.isHost) {
      this.hostGuestStates.set(info.id, {
        id: info.id, x: spawn.x, y: spawn.y, hp: 20,
        moveX: 0, moveY: 0, lastInputTime: this.time.now
      });
    }
  },

  removeRemotePlayer(id) {
    const remote = this.remotePlayers.get(id);
    if (!remote) return;
    remote.destroy();
    this.remotePlayers.delete(id);
    this.hostGuestStates.delete(id);
  },

  handleHostLeft() {
    if (this.isMultiplayerHost) return;
    // The host disconnecting ends the session for guests — there is no world
    // without the host's simulation. Return everyone to the menu.
    this.exitToMenu();
  },

  handleNetworkDisconnected() {
    // Connection dropped; nothing else to reconcile since guests don't hold
    // authoritative state. Leave the scene running so the player isn't yanked
    // out mid-action, but the room code HUD makes the disconnect state visible
    // via the browser console for now.
  },

  // Host-only: validate guest movement input. The host integrates this direction
  // state each frame and publishes the resulting authoritative position.
  handleRemoteInput(msg) {
    const state = this.hostGuestStates.get(msg.fromId);
    if (!state) return;
    if (msg.inputKind === 'movement') {
      const moveX = Number(msg.moveX);
      const moveY = Number(msg.moveY);
      if (!Number.isFinite(moveX) || !Number.isFinite(moveY)) return;
      const length = Math.hypot(moveX, moveY);
      state.moveX = length > 1 ? moveX / length : Phaser.Math.Clamp(moveX, -1, 1);
      state.moveY = length > 1 ? moveY / length : Phaser.Math.Clamp(moveY, -1, 1);
      state.lastInputTime = this.time.now;
    } else if (msg.inputKind === 'attack') {
      this.handleRemoteAttack(state, msg);
    } else if (msg.inputKind === 'chop' || msg.inputKind === 'mine') {
      this.handleRemoteResourceHit(state, msg);
    }
  },

  // Host-only: validate a guest's melee attack intent against authoritative
  // positions before applying damage, so a guest can't claim hits it isn't in
  // range for. The guest's own local hit/animation is purely cosmetic.
  handleRemoteAttack(guestState, msg) {
    const skeleton = this.skeletons.find(s => s.networkId === msg.targetId);
    if (!skeleton || skeleton.dead) return;
    const range = 60; // slightly above the local 50px range to tolerate lag.
    const dist = Phaser.Math.Distance.Between(guestState.x, guestState.y, skeleton.sprite.x, skeleton.sprite.y);
    if (dist > range) return;
    const now = this.time.now;
    if (guestState.lastAttackTime && now - guestState.lastAttackTime < 350) return;
    guestState.lastAttackTime = now;
    this.damageSkeleton(skeleton);
  },

  // Host-only: validate a guest's chop/mine intent against authoritative node state
  // and the guest's authoritative position, then apply the hit exactly as a local
  // hit would. The resulting hit/destruction and, if the node was destroyed, the
  // resource grant are broadcast as a world-event so every client (including the
  // guest that landed the hit) stays in sync — the guest never mutates the node or
  // its own inventory locally.
  handleRemoteResourceHit(guestState, msg) {
    const kind = msg.inputKind === 'chop' ? 'tree' : 'rock';
    const list = kind === 'tree' ? this.choppableTrees : this.breakableRocks;
    const target = list.find(t => t.networkId === msg.targetId);
    if (!target) return;

    const range = 70; // slightly above the local 60px use range to tolerate lag.
    const dist = Phaser.Math.Distance.Between(guestState.x, guestState.y, target.x, target.y);
    if (dist > range) return;

    const now = this.time.now;
    if (guestState.lastToolTime && now - guestState.lastToolTime < 350) return;
    guestState.lastToolTime = now;

    // Apply on the host without granting the host's own inventory — the resource
    // grant belongs to the guest named in forId, applied when they receive this
    // event back (see applyNodeHitEvent).
    this.hitTarget(target, kind, false);

    this.network.send('world-event', {
      kind: 'node-hit',
      nodeKind: kind,
      targetId: msg.targetId,
      forId: guestState.id
    });
  },

  sendLocalMovementInput() {
    if (!this.network || this.isMultiplayerHost || this.time.now < this.nextInputTime) return;
    this.nextInputTime = this.time.now + 50;
    const velocity = this.player.body.velocity;
    const length = Math.hypot(velocity.x, velocity.y);
    this.network.send('input', {
      inputKind: 'movement',
      moveX: length > 0 ? velocity.x / length : 0,
      moveY: length > 0 ? velocity.y / length : 0
    });
  },

  updateHostGuestStates() {
    if (!this.network || !this.isMultiplayerHost) return;
    const dt = Math.min(this.game.loop.delta, 100) / 1000;
    const speed = 220;
    this.hostGuestStates.forEach((state, id) => {
      if (this.time.now - state.lastInputTime > 250) {
        state.moveX = 0;
        state.moveY = 0;
      }
      state.x = Phaser.Math.Clamp(state.x + state.moveX * speed * dt, 20, WORLD_WIDTH - 20);
      state.y = Phaser.Math.Clamp(state.y + state.moveY * speed * dt, 20, WORLD_HEIGHT - 20);
      const remote = this.remotePlayers.get(id);
      if (remote) remote.applyState(state);
    });
  },

  reconcileLocalPlayer() {
    if (!this.localAuthoritativeState) return;
    const state = this.localAuthoritativeState;
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, state.x, state.y);
    if (distance > 120) {
      this.player.setPosition(state.x, state.y);
    } else if (distance > 6) {
      this.player.x = Phaser.Math.Linear(this.player.x, state.x, 0.12);
      this.player.y = Phaser.Math.Linear(this.player.y, state.y, 0.12);
    }
  },

  // Host-only: broadcasts all authoritative player and mob state plus day/night.
  broadcastWorldSnapshot() {
    if (!this.network || !this.isMultiplayerHost || !this.player) return;
    if (this.time.now < (this.nextSnapshotTime || 0)) return;
    this.nextSnapshotTime = this.time.now + 100;

    const players = [
      { id: this.network.id, x: this.player.x, y: this.player.y, hp: this.playerHp },
      ...Array.from(this.hostGuestStates.values(), state => ({
        id: state.id, x: state.x, y: state.y, hp: state.hp
      }))
    ];

    this.network.send('world-snapshot', {
      players,
      mobs: this.skeletons.map((skeleton) => ({
        id: skeleton.networkId,
        kind: skeleton.type,
        x: skeleton.sprite.x,
        y: skeleton.sprite.y,
        hp: skeleton.hp,
        maxHp: skeleton.maxHp
      })),
      cycleStartTime: this.cycleStartTime
    });
  },

  // Guest-only: applies a host snapshot by updating/creating RemotePlayer ghosts
  // for every player in it (including the host), and syncing day/night state.
  applyWorldSnapshot(msg) {
    (msg.players || []).forEach((p) => {
      if (p.id === this.network.id) {
        this.localAuthoritativeState = p;
        return;
      }
      let remote = this.remotePlayers.get(p.id);
      if (!remote) {
        const known = this.network.players.find(pl => pl.id === p.id);
        this.addRemotePlayer({ id: p.id, color: known?.color, name: known?.name, isHost: p.id === this.network.hostId });
        remote = this.remotePlayers.get(p.id);
      }
      if (remote) remote.applyState(p);
    });

    if (typeof msg.cycleStartTime === 'number') {
      this.cycleStartTime = msg.cycleStartTime;
    }

    this.applyMobSnapshot(msg.mobs || []);
  },

  applyMobSnapshot(mobs) {
    const byId = new Map(this.skeletons.map(skeleton => [skeleton.networkId, skeleton]));
    const liveIds = new Set();

    mobs.forEach((state) => {
      const skeleton = byId.get(state.id);
      if (!skeleton || state.kind !== skeleton.type) return;
      liveIds.add(state.id);
      skeleton.networkTargetX = state.x;
      skeleton.networkTargetY = state.y;
      skeleton.hp = Phaser.Math.Clamp(state.hp, 0, skeleton.maxHp);
      skeleton.hits = skeleton.maxHp - skeleton.hp;
    });

    this.skeletons.slice().forEach((skeleton) => {
      if (!liveIds.has(skeleton.networkId)) this.removeSkeleton(skeleton);
    });
  },

  // Guest-only: one-off world events relayed from the host. Currently handles the
  // result of a validated chop/mine intent; see class-level note about guests still
  // running the rest of their own local world.
  applyWorldEvent(msg) {
    if (msg.kind === 'node-hit') this.applyNodeHitEvent(msg);
  },

  // Guest-only: applies the host's authoritative result of a chop/mine intent —
  // whichever guest's hit this was, everyone applies the same visual hit/destruction
  // via hitTarget, but only the guest named in `forId` (the one whose intent this
  // was) has hitTarget grant the resulting resources, so materials aren't
  // duplicated across clients.
  applyNodeHitEvent(msg) {
    const list = msg.nodeKind === 'tree' ? this.choppableTrees : this.breakableRocks;
    const target = list.find(t => t.networkId === msg.targetId);
    if (!target) return;

    this.hitTarget(target, msg.nodeKind, msg.forId === this.network.id);
  },

  updateRemotePlayers() {
    this.remotePlayers.forEach((remote) => remote.update());
  },
};
