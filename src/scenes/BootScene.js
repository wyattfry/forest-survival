import Phaser from 'phaser';
import { loadWorld, listWorlds, loadCharacter } from '../SaveManager.js';
import { preloadSounds } from '../SoundManager.js';
import { WORLD_WIDTH, WORLD_HEIGHT } from './boot/constants.js';
import { modsMethods } from './boot/mods.js';
import { rngMethods } from './boot/rng.js';
import { multiplayerMethods } from './boot/multiplayer.js';
import { persistenceMethods } from './boot/persistence.js';
import { playerMethods } from './boot/player.js';
import { itemTexturesMethods } from './boot/itemTextures.js';
import { terrainMethods } from './boot/terrain.js';
import { inventoryMethods } from './boot/inventory.js';
import { coinsMethods } from './boot/coins.js';
import { shopMethods } from './boot/shop.js';
import { hotbarMethods } from './boot/hotbar.js';
import { buildingMethods } from './boot/building.js';
import { daynightMethods } from './boot/daynight.js';
import { toolsMethods } from './boot/tools.js';
import { enemyTexturesMethods } from './boot/enemyTextures.js';
import { combatMethods } from './boot/combat.js';
import { settingsMethods } from './boot/settings.js';
import { projectilesMethods } from './boot/projectiles.js';
import { skeletonsMethods } from './boot/skeletons.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  init(data) {
    this.startMode = (data && data.mode) || 'new';
    this.worldId = data && data.worldId;
    this.worldName = (data && data.worldName) || 'World';

    if (this.startMode === 'load' && this.worldId) {
      const entry = listWorlds().find(w => w.id === this.worldId);
      this.peaceful = !!(entry && entry.peaceful);
      this.multiplayer = !!(entry && entry.multiplayer);
      this.cloneMod = !!(entry && entry.cloneMod);
      this.gunMod = !!(entry && entry.gunMod);
    } else {
      this.peaceful = !!(data && data.peaceful);
      this.multiplayer = !!(data && data.multiplayer);
      this.cloneMod = !!(data && data.cloneMod);
      this.gunMod = !!(data && data.gunMod);
    }

    // Multiplayer wiring: `network` is a connected NetworkManager passed from MenuScene
    // (host created a room, or guest joined one via room code). Host runs the real
    // simulation and broadcasts snapshots. Guests render authoritative mob state
    // from those snapshots while their local player remains client-controlled.
    this.network = data && data.network;
    this.isMultiplayerHost = !!(data && data.isHost);
    this.roomCode = data && data.roomCode;
    this.remotePlayers = new Map();

    const character = loadCharacter();
    this.characterName = character.name;
    this.characterColor = character.color;
    this.characterGender = character.gender;
    this.characterHair = character.hair;
    this.characterAge = character.age;
    this.characterGiant = !!character.giant;
    this.characterDwarf = !!character.dwarf;
    this.characterSkinTone = character.skinTone;
    this.characterHairColor = character.hairColor;
    this.characterHat = character.hat || 'none';
  }

  preload() {
    preloadSounds(this);
    this.load.spritesheet('campfire', 'assets/sprites/campfire.png', {
      frameWidth: 32,
      frameHeight: 32
    });
  }

  create() {
    this.cameras.main.setBackgroundColor('#2f5d3a');
    this.setupWorldRng();

    this.generateGroundTexture();
    this.generateTreeTextures();
    this.generateRockTextures();
    this.generatePlayerTexture();
    this.generateItemTextures();
    if (!this.anims.exists('campfire-burn')) {
      this.anims.create({
        key: 'campfire-burn',
        frames: this.anims.generateFrameNumbers('campfire', { start: 0, end: 7 }),
        frameRate: 11,
        repeat: -1
      });
    }
    this.generateLavaTexture();
    this.generateWaterTexture();
    this.generateObsidianTexture();

    this.buildTerrain();

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.scatterRocks();
    this.scatterTrees();
    this.scatterItems();
    this.createPlayer();

    this.setupCameraControls();
    this.setupInventory();
    this.setupToolUse();
    this.setupCombat();
    this.setupCoinCounter();
    this.scatterPools();
    this.setupWorldShop();
    if (!this.peaceful) {
      this.spawnSkeletons();
    } else {
      this.skeletons = [];
      this.skeletonBases = [];
    }
    this.setupThrowing();
    this.setupDayNightCycle();
    this.setupSettingsMenu();

    if (this.startMode === 'load' && this.worldId) {
      this.applySaveData(loadWorld(this.worldId));
    }

    this.setupAutosave();
    this.setupMultiplayer();
    this.setupCloneMod();

    if (this.gunMod && this.startMode === 'new') {
      this.grantStartingGuns();
    }
  }
}

Object.assign(BootScene.prototype,
  modsMethods,
  rngMethods,
  multiplayerMethods,
  persistenceMethods,
  playerMethods,
  itemTexturesMethods,
  terrainMethods,
  inventoryMethods,
  coinsMethods,
  shopMethods,
  hotbarMethods,
  buildingMethods,
  daynightMethods,
  toolsMethods,
  enemyTexturesMethods,
  combatMethods,
  settingsMethods,
  projectilesMethods,
  skeletonsMethods,
);
