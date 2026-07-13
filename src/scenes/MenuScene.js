import Phaser from 'phaser';
import { listWorlds, hasSave, createWorld, worldNameTaken, deleteWorld, isModInstalled, installMod, uninstallMod, loadCharacter, saveCharacter } from '../SaveManager.js';
import { MALE_HAIR_STYLES, FEMALE_HAIR_STYLES, drawHairShape, ageToScale, HAIR_COLORS, SKIN_TONES } from '../HairStyles.js';
import { HAT_STYLES, drawHatShape } from '../Hats.js';
import NetworkManager from '../net/NetworkManager.js';

const PEACEFUL_MOD_ID = 'peaceful-mode';
const CLONE_MOD_ID = 'clone-mod';
const GUN_MOD_ID = 'gun-mod';

const MODS = [
  { id: PEACEFUL_MOD_ID, name: 'Peaceful Mode', desc: 'No hostile enemies spawn' },
  { id: CLONE_MOD_ID, name: 'Clone Mod', desc: 'Spawn a following clone of yourself' },
  { id: GUN_MOD_ID, name: 'Gun Mod', desc: 'Start with an AK-47, FAMAS, and Glock-17' }
];

const CHARACTER_COLORS = [
  0x3f5fd6, 0xd63f3f, 0x3fd670, 0xd6b83f, 0x9a3fd6, 0x3fd6c9,
  0xe08a3f, 0xd63fa0, 0x4fd6ff, 0x8f8f8f, 0x2a2a2e, 0xffffff,
  0x6b4a2a, 0x3fd63f, 0xff6b6b, 0x6b3ad6
];

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#1c2b1a');
    this.stage = 'start';

    this.title = this.add.text(0, 0, 'Forest Survival', {
      fontFamily: 'Arial', fontSize: '48px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    const btnStyle = {
      fontFamily: 'Arial', fontSize: '22px', color: '#ffffff',
      backgroundColor: '#3a6b3a', padding: { x: 28, y: 12 }
    };
    const btnStyleDisabled = {
      fontFamily: 'Arial', fontSize: '22px', color: '#888888',
      backgroundColor: '#333333', padding: { x: 28, y: 12 }
    };

    this.startBtn = this.add.text(0, 0, 'Start', btnStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.showStageSelect());

    const modsBtnStyle = {
      fontFamily: 'Arial', fontSize: '16px', color: '#cccccc',
      backgroundColor: '#2c2c2c', padding: { x: 18, y: 8 }
    };
    this.modsBtn = this.add.text(0, 0, 'Mods', modsBtnStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.showModsScreen());

    this.modsContainer = this.add.container(0, 0).setVisible(false);

    this.characterBtn = this.add.text(0, 0, 'Character', modsBtnStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.showCharacterScreen());

    this.characterContainer = this.add.container(0, 0).setVisible(false);
    this.characterHtmlInput = null;

    this.seeMobsBtn = this.add.text(0, 0, 'See Mobs', modsBtnStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.showMobsScreen());
    this.mobsContainer = this.add.container(0, 0).setVisible(false);

    this.newGameBtn = this.add.text(0, 0, 'New Game', btnStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.showNamePrompt())
      .setVisible(false);

    const canLoad = hasSave();
    this.loadGameBtn = this.add.text(0, 0, 'Load Game', canLoad ? btnStyle : btnStyleDisabled)
      .setOrigin(0.5)
      .setVisible(false);
    if (canLoad) {
      this.loadGameBtn.setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.showWorldList());
    }

    const joinBtnStyle = {
      fontFamily: 'Arial', fontSize: '16px', color: '#cccccc',
      backgroundColor: '#2c2c2c', padding: { x: 18, y: 8 }
    };
    this.joinGameBtn = this.add.text(0, 0, 'Join Multiplayer Game', joinBtnStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.showJoinPrompt())
      .setVisible(false);

    this.backBtn = this.add.text(0, 0, '< Back', {
      fontFamily: 'Arial', fontSize: '14px', color: '#aaaaaa', backgroundColor: '#242424', padding: { x: 10, y: 6 }
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.showStart())
      .setVisible(false);

    this.noSaveHint = this.add.text(0, 0, 'No saved worlds found', {
      fontFamily: 'Arial', fontSize: '12px', color: '#888888'
    }).setOrigin(0.5).setVisible(false);

    // World list UI (built lazily each time it's shown).
    this.worldListContainer = this.add.container(0, 0).setVisible(false);
    this.worldListBackBtn = this.add.text(0, 0, '< Back', {
      fontFamily: 'Arial', fontSize: '14px', color: '#aaaaaa', backgroundColor: '#242424', padding: { x: 10, y: 6 }
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.showStageSelect())
      .setVisible(false);

    this.htmlInput = null;

    this.positionLayout();
    this.scale.on('resize', () => this.positionLayout());

    this.events.on('shutdown', () => {
      this.destroyHtmlInput();
      this.destroyCharacterHtmlInput();
      this.destroyJoinHtmlInputs();
      this.stopPreviewWalkAnimation();
    });
  }

  positionLayout() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.title.setPosition(cx, cy - 200);
    this.startBtn.setPosition(cx, cy);
    this.modsBtn.setPosition(cx, cy + 56);
    this.characterBtn.setPosition(cx, cy + 96);
    this.seeMobsBtn.setPosition(cx, cy + 136);
    this.newGameBtn.setPosition(cx, cy - 60);
    this.loadGameBtn.setPosition(cx, cy);
    this.joinGameBtn.setPosition(cx, cy + 56);
    this.backBtn.setPosition(cx, cy + 130);
    this.noSaveHint.setPosition(cx, cy + 32);
    this.worldListBackBtn.setPosition(cx, cy + 220);

    if (this.htmlInput) {
      this.positionHtmlInput();
    }
    if (this.characterHtmlInput) {
      this.positionCharacterHtmlInput();
    }
    if (this.characterAgeHtmlInput) {
      this.positionCharacterAgeHtmlInput();
    }
    if (this.joinCodeInput) {
      this.positionJoinHtmlInputs();
    }
  }

  showStageSelect() {
    this.destroyHtmlInput();
    this.stage = 'select';
    this.startBtn.setVisible(false);
    this.modsBtn.setVisible(false);
    this.characterBtn.setVisible(false);
    this.seeMobsBtn.setVisible(false);
    this.newGameBtn.setVisible(true);
    this.loadGameBtn.setVisible(true);
    this.joinGameBtn.setVisible(true);
    this.backBtn.setVisible(true);
    this.noSaveHint.setVisible(!hasSave());
    this.worldListContainer.setVisible(false);
    this.worldListBackBtn.setVisible(false);
    this.modsContainer.setVisible(false);
    this.characterContainer.setVisible(false);
    this.mobsContainer.setVisible(false);
  }

  showStart() {
    this.destroyHtmlInput();
    this.destroyCharacterHtmlInput();
    this.stage = 'start';
    this.title.setVisible(true);
    this.startBtn.setVisible(true);
    this.modsBtn.setVisible(true);
    this.characterBtn.setVisible(true);
    this.seeMobsBtn.setVisible(true);
    this.newGameBtn.setVisible(false);
    this.loadGameBtn.setVisible(false);
    this.joinGameBtn.setVisible(false);
    this.backBtn.setVisible(false);
    this.noSaveHint.setVisible(false);
    this.worldListContainer.setVisible(false);
    this.worldListBackBtn.setVisible(false);
    this.modsContainer.setVisible(false);
    this.characterContainer.setVisible(false);
    this.mobsContainer.setVisible(false);
  }

  showModsScreen() {
    this.destroyHtmlInput();
    this.stage = 'mods';
    this.title.setVisible(false);
    this.startBtn.setVisible(false);
    this.modsBtn.setVisible(false);
    this.characterBtn.setVisible(false);
    this.seeMobsBtn.setVisible(false);
    this.characterContainer.setVisible(false);
    this.mobsContainer.setVisible(false);
    this.worldListContainer.setVisible(false);
    this.worldListBackBtn.setVisible(false);

    this.modsContainer.removeAll(true);
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;
    const rowHeight = 74;
    const startY = cy - (MODS.length * rowHeight) / 2 - 50;

    const heading = this.add.text(cx, startY - 40, 'Mods', {
      fontFamily: 'Arial', fontSize: '28px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.modRowButtons = {};
    const rowElements = [heading];

    MODS.forEach((mod, i) => {
      const rowY = startY + i * rowHeight;
      const installed = isModInstalled(mod.id);

      const rowBg = this.add.rectangle(cx, rowY, 460, 56, 0x2c2c2c, 1)
        .setStrokeStyle(1, 0x555555);
      const modName = this.add.text(cx - 220, rowY - 16, mod.name, {
        fontFamily: 'Arial', fontSize: '15px', color: '#ffffff', fontStyle: 'bold'
      });
      const modDesc = this.add.text(cx - 220, rowY + 4, mod.desc, {
        fontFamily: 'Arial', fontSize: '10px', color: '#999999', wordWrap: { width: 220 }
      });

      const downloadBtn = this.add.text(cx + 180, rowY, installed ? 'Installed' : 'Download', {
        fontFamily: 'Arial', fontSize: '13px', color: '#ffffff',
        backgroundColor: installed ? '#444444' : '#3a6b3a', padding: { x: 10, y: 6 }
      }).setOrigin(1, 0.5);

      const uninstallBtn = this.add.text(downloadBtn.x - downloadBtn.width - 8, rowY, 'Uninstall', {
        fontFamily: 'Arial', fontSize: '13px', color: '#ffffff',
        backgroundColor: installed ? '#6b3a3a' : '#333333', padding: { x: 10, y: 6 }
      }).setOrigin(1, 0.5);

      this.modRowButtons[mod.id] = { downloadBtn, uninstallBtn };
      this.refreshModRowInteractivity(mod.id);

      rowElements.push(rowBg, modName, modDesc, downloadBtn, uninstallBtn);
    });

    const message = this.add.text(cx, startY + MODS.length * rowHeight + 10,
      'Install a mod, then enable it when naming a new world.', {
        fontFamily: 'Arial', fontSize: '12px', color: '#888888', align: 'center'
      }).setOrigin(0.5);

    const backBtn = this.add.text(cx, startY + MODS.length * rowHeight + 50, '< Back', {
      fontFamily: 'Arial', fontSize: '14px', color: '#aaaaaa', backgroundColor: '#242424', padding: { x: 10, y: 6 }
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.showStart());

    rowElements.push(message, backBtn);
    this.modsContainer.add(rowElements);
    this.modsContainer.setVisible(true);
  }

  showMobsScreen() {
    this.destroyHtmlInput();
    this.destroyCharacterHtmlInput();
    this.stage = 'mobs';
    this.title.setVisible(false);
    this.startBtn.setVisible(false);
    this.modsBtn.setVisible(false);
    this.characterBtn.setVisible(false);
    this.seeMobsBtn.setVisible(false);
    this.modsContainer.setVisible(false);
    this.characterContainer.setVisible(false);
    this.worldListContainer.setVisible(false);
    this.worldListBackBtn.setVisible(false);

    this.generateMobPreviewTextures();
    this.mobsContainer.removeAll(true);
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;
    const heading = this.add.text(cx, cy - 245, 'Mobs', {
      fontFamily: 'Arial', fontSize: '30px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    const subtitle = this.add.text(cx, cy - 210, 'Creatures found in the world', {
      fontFamily: 'Arial', fontSize: '13px', color: '#aaaaaa'
    }).setOrigin(0.5);

    const mobs = [
      { key: 'mob-preview-melee', name: 'Skeleton', detail: 'Melee • 5 HP • 1 damage' },
      { key: 'mob-preview-archer', name: 'Skeleton Archer', detail: 'Ranged • 5 HP • 1 damage' },
      { key: 'mob-preview-knight', name: 'Skeleton Knight', detail: 'Armored • 10 HP • 2 damage' },
      { key: 'mob-preview-rider', name: 'Skeleton Horse Rider', detail: 'Very fast • 6 HP • 2 damage' }
    ];
    const elements = [heading, subtitle];
    mobs.forEach((mob, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = cx + (col === 0 ? -155 : 155);
      const y = cy - 95 + row * 165;
      const card = this.add.rectangle(x, y, 280, 142, 0x263426)
        .setStrokeStyle(2, 0x557755);
      const image = this.add.image(x, y - 18, mob.key).setScale(1.15);
      const name = this.add.text(x, y + 38, mob.name, {
        fontFamily: 'Arial', fontSize: '15px', color: '#ffffff', fontStyle: 'bold'
      }).setOrigin(0.5);
      const detail = this.add.text(x, y + 59, mob.detail, {
        fontFamily: 'Arial', fontSize: '11px', color: '#b5c9b5'
      }).setOrigin(0.5);
      elements.push(card, image, name, detail);
    });

    const back = this.add.text(cx, cy + 230, '< Back', {
      fontFamily: 'Arial', fontSize: '14px', color: '#aaaaaa',
      backgroundColor: '#242424', padding: { x: 12, y: 7 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.showStart());
    elements.push(back);
    this.mobsContainer.add(elements).setVisible(true);
  }

  generateMobPreviewTextures() {
    ['melee', 'archer', 'knight', 'rider'].forEach(type => {
      const key = `mob-preview-${type}`;
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      const bone = 0xe8e2cf;
      if (type === 'rider') {
        g.lineStyle(4, bone, 1);
        g.strokeEllipse(48, 48, 58, 22);
        g.lineBetween(26, 56, 21, 72); g.lineBetween(39, 57, 37, 73);
        g.lineBetween(57, 57, 60, 73); g.lineBetween(70, 54, 76, 70);
        g.lineBetween(73, 43, 84, 34);
        g.fillStyle(bone, 1); g.fillCircle(86, 31, 7);
        g.lineStyle(3, bone, 1); g.lineBetween(48, 37, 48, 18);
        g.fillStyle(bone, 1); g.fillCircle(48, 12, 7);
        g.lineStyle(2, 0x8b5a2b, 1); g.lineBetween(40, 25, 60, 38);
      } else {
        g.fillStyle(bone, 1); g.fillCircle(45, 16, 10);
        g.fillStyle(0x222222, 1); g.fillCircle(41, 14, 2); g.fillCircle(49, 14, 2);
        g.lineStyle(type === 'knight' ? 5 : 3, type === 'knight' ? 0x9298a3 : bone, 1);
        g.lineBetween(45, 26, 45, 55);
        g.lineBetween(45, 34, 28, 48); g.lineBetween(45, 34, 62, 48);
        g.lineBetween(45, 55, 34, 73); g.lineBetween(45, 55, 56, 73);
        if (type === 'archer') {
          g.lineStyle(3, 0x8b5a2b, 1); g.strokeCircle(65, 42, 16);
          g.lineStyle(1, 0xd8c6a0, 1); g.lineBetween(65, 26, 65, 58);
        } else if (type === 'knight') {
          g.fillStyle(0x6f7680, 1); g.fillRect(33, 5, 24, 10);
          g.fillStyle(0x77808d, 1); g.fillCircle(65, 45, 12);
        } else {
          g.lineStyle(3, 0xaaaaaa, 1); g.lineBetween(62, 47, 72, 22);
        }
      }
      g.generateTexture(key, 96, 80);
      g.destroy();
    });
  }

  refreshModRowInteractivity(modId) {
    const { downloadBtn, uninstallBtn } = this.modRowButtons[modId];
    const installed = isModInstalled(modId);

    downloadBtn.removeAllListeners();
    downloadBtn.disableInteractive();
    downloadBtn.setText(installed ? 'Installed' : 'Download');
    downloadBtn.setStyle({ backgroundColor: installed ? '#444444' : '#3a6b3a' });
    if (!installed) {
      downloadBtn.setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.downloadMod(modId));
    }

    uninstallBtn.removeAllListeners();
    uninstallBtn.disableInteractive();
    uninstallBtn.setStyle({ backgroundColor: installed ? '#6b3a3a' : '#333333' });
    if (installed) {
      uninstallBtn.setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.uninstallModClick(modId));
    }
  }

  downloadMod(modId) {
    const { downloadBtn } = this.modRowButtons[modId];
    downloadBtn.disableInteractive();
    downloadBtn.setText('Downloading...');
    downloadBtn.setStyle({ backgroundColor: '#555555' });

    this.time.delayedCall(900, () => {
      installMod(modId);
      this.refreshModRowInteractivity(modId);
    });
  }

  uninstallModClick(modId) {
    uninstallMod(modId);
    this.refreshModRowInteractivity(modId);
  }

  showNamePrompt() {
    this.stage = 'name';
    this.newGameBtn.setVisible(false);
    this.loadGameBtn.setVisible(false);
    this.joinGameBtn.setVisible(false);
    this.backBtn.setVisible(false);
    this.noSaveHint.setVisible(false);
    this.modsContainer.setVisible(false);
    this.characterContainer.setVisible(false);
    this.worldListContainer.setVisible(false);
    this.worldListBackBtn.setVisible(false);

    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.nameLabel = this.add.text(cx, cy - 40, 'Name your world', {
      fontFamily: 'Arial', fontSize: '18px', color: '#ffffff'
    }).setOrigin(0.5);

    this.createHtmlInput();

    // One checkbox per installed-or-not mod; enabling one here sets it for this world only.
    this.enabledMods = {};
    this.modCheckboxes = {};
    const modLabels = {
      [PEACEFUL_MOD_ID]: 'Peaceful Mode (no hostile enemies)',
      [CLONE_MOD_ID]: 'Clone Mod (spawn a following clone)',
      [GUN_MOD_ID]: 'Gun Mod (start with 3 guns)'
    };

    this.nameCheckboxContainer = this.add.container(0, 0);
    MODS.forEach((mod, i) => {
      const y = cy + 46 + i * 22;
      const modInstalled = isModInstalled(mod.id);
      this.enabledMods[mod.id] = false;
      const label = `☐ ${modLabels[mod.id]}${modInstalled ? '' : ' (download this mod first)'}`;

      const checkbox = this.add.text(cx - 90, y, label, {
        fontFamily: 'Arial', fontSize: '13px', color: modInstalled ? '#cccccc' : '#666666'
      }).setOrigin(0, 0.5);

      if (modInstalled) {
        checkbox.setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.toggleModEnabled(mod.id, modLabels[mod.id]));
      }

      this.modCheckboxes[mod.id] = checkbox;
      this.nameCheckboxContainer.add(checkbox);
    });

    const checkboxBlockHeight = MODS.length * 22;

    // Player mode toggle: Single Player and Multiplayer are mutually exclusive.
    this.playerMode = 'single';
    const modeOffStyle = { fontFamily: 'Arial', fontSize: '12px', color: '#aaaaaa', backgroundColor: '#242424', padding: { x: 10, y: 5 } };
    const modeOnStyle = { fontFamily: 'Arial', fontSize: '12px', color: '#ffffff', backgroundColor: '#3a6b3a', padding: { x: 10, y: 5 } };
    this.modeOffStyle = modeOffStyle;
    this.modeOnStyle = modeOnStyle;

    const modeY = cy + 46 + checkboxBlockHeight + 14;
    this.singlePlayerBtn = this.add.text(cx - 90, modeY, 'Single Player', modeOnStyle).setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.setPlayerMode('single'));
    this.multiplayerBtn = this.add.text(cx + 30, modeY, 'Multiplayer', modeOffStyle).setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.setPlayerMode('multi'));

    this.nameError = this.add.text(cx, modeY + 32, '', {
      fontFamily: 'Arial', fontSize: '12px', color: '#e08080'
    }).setOrigin(0.5);

    this.confirmBtn = this.add.text(cx, modeY + 66, 'Create World', {
      fontFamily: 'Arial', fontSize: '18px', color: '#ffffff', backgroundColor: '#3a6b3a', padding: { x: 20, y: 10 }
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.confirmCreateWorld());

    this.nameCancelBtn = this.add.text(cx, modeY + 116, '< Cancel', {
      fontFamily: 'Arial', fontSize: '14px', color: '#aaaaaa', backgroundColor: '#242424', padding: { x: 10, y: 6 }
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.cancelNamePrompt());
  }

  toggleModEnabled(modId, label) {
    this.enabledMods[modId] = !this.enabledMods[modId];
    this.modCheckboxes[modId].setText((this.enabledMods[modId] ? '☑' : '☐') + ` ${label}`);
  }

  setPlayerMode(mode) {
    this.playerMode = mode;
    this.singlePlayerBtn.setStyle(mode === 'single' ? this.modeOnStyle : this.modeOffStyle);
    this.multiplayerBtn.setStyle(mode === 'multi' ? this.modeOnStyle : this.modeOffStyle);
  }

  cancelNamePrompt() {
    this.destroyHtmlInput();
    this.nameLabel.destroy();
    this.nameCheckboxContainer.removeAll(true);
    this.nameCheckboxContainer.destroy();
    this.singlePlayerBtn.destroy();
    this.multiplayerBtn.destroy();
    this.nameError.destroy();
    this.confirmBtn.destroy();
    this.nameCancelBtn.destroy();
    this.showStageSelect();
  }

  createHtmlInput() {
    this.destroyHtmlInput();

    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 24;
    input.placeholder = 'My World';
    input.style.position = 'absolute';
    input.style.fontSize = '18px';
    input.style.padding = '8px 12px';
    input.style.width = '240px';
    input.style.textAlign = 'center';
    input.style.border = '1px solid #555';
    input.style.borderRadius = '4px';
    input.style.backgroundColor = '#242424';
    input.style.color = '#ffffff';
    input.style.outline = 'none';
    input.style.zIndex = '10';

    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') this.confirmCreateWorld();
    });

    document.body.appendChild(input);
    this.htmlInput = input;
    this.positionHtmlInput();
    input.focus();
  }

  positionHtmlInput() {
    if (!this.htmlInput) return;
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    const scaleX = rect.width / width;
    const scaleY = rect.height / height;

    this.htmlInput.style.left = `${rect.left + cx * scaleX - 120}px`;
    this.htmlInput.style.top = `${rect.top + cy * scaleY - 8}px`;
  }

  destroyHtmlInput() {
    if (this.htmlInput) {
      this.htmlInput.remove();
      this.htmlInput = null;
    }
  }

  confirmCreateWorld() {
    const name = (this.htmlInput ? this.htmlInput.value : '').trim();

    if (!name) {
      this.nameError.setText('Please enter a name');
      return;
    }
    if (worldNameTaken(name)) {
      this.nameError.setText('A world with that name already exists');
      return;
    }

    const isMultiplayer = this.playerMode === 'multi';
    const peaceful = !!this.enabledMods[PEACEFUL_MOD_ID];
    const cloneMod = !!this.enabledMods[CLONE_MOD_ID];
    const gunMod = !!this.enabledMods[GUN_MOD_ID];
    const id = createWorld(name, { peaceful, multiplayer: isMultiplayer, cloneMod, gunMod });
    this.destroyHtmlInput();

    const bootData = { mode: 'new', worldId: id, worldName: name, peaceful, multiplayer: isMultiplayer, cloneMod, gunMod };

    if (!isMultiplayer) {
      this.scene.start('BootScene', bootData);
      return;
    }

    this.hostMultiplayerWorld(bootData);
  }

  // Connects to the relay server as host (creating a new room), then starts
  // BootScene once the connection is confirmed. The room code is passed through
  // so BootScene can show it in the HUD for other players to join.
  hostMultiplayerWorld(bootData) {
    this.confirmBtn.disableInteractive();
    this.confirmBtn.setText('Connecting...');
    this.nameError.setText('');

    const character = loadCharacter();
    const net = new NetworkManager();

    net.on('waking-up', () => this.nameError.setText('Waking up server, this can take up to a minute...'));

    net.connect(undefined, character.name, '')
      .then(() => {
        this.scene.start('BootScene', { ...bootData, network: net, isHost: true, roomCode: net.roomCode });
      })
      .catch((err) => {
        this.confirmBtn.setInteractive({ useHandCursor: true });
        this.confirmBtn.setText('Create World');
        this.nameError.setText(err.message || 'Could not connect to multiplayer server');
      });
  }

  showJoinPrompt() {
    this.stage = 'join';
    this.newGameBtn.setVisible(false);
    this.loadGameBtn.setVisible(false);
    this.joinGameBtn.setVisible(false);
    this.backBtn.setVisible(false);
    this.noSaveHint.setVisible(false);
    this.modsContainer.setVisible(false);
    this.characterContainer.setVisible(false);
    this.worldListContainer.setVisible(false);
    this.worldListBackBtn.setVisible(false);

    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.joinLabel = this.add.text(cx, cy - 60, 'Join Multiplayer Game', {
      fontFamily: 'Arial', fontSize: '18px', color: '#ffffff'
    }).setOrigin(0.5);

    this.createJoinHtmlInputs();

    this.joinError = this.add.text(cx, cy + 78, '', {
      fontFamily: 'Arial', fontSize: '12px', color: '#e08080'
    }).setOrigin(0.5);

    this.joinConfirmBtn = this.add.text(cx, cy + 112, 'Join', {
      fontFamily: 'Arial', fontSize: '18px', color: '#ffffff', backgroundColor: '#3a6b3a', padding: { x: 20, y: 10 }
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.confirmJoinGame());

    this.joinCancelBtn = this.add.text(cx, cy + 162, '< Cancel', {
      fontFamily: 'Arial', fontSize: '14px', color: '#aaaaaa', backgroundColor: '#242424', padding: { x: 10, y: 6 }
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.cancelJoinPrompt());
  }

  createJoinHtmlInputs() {
    this.destroyJoinHtmlInputs();
    const character = loadCharacter();

    const codeInput = document.createElement('input');
    codeInput.type = 'text';
    codeInput.maxLength = 4;
    codeInput.placeholder = 'ROOM CODE';
    codeInput.style.position = 'absolute';
    codeInput.style.fontSize = '18px';
    codeInput.style.padding = '8px 12px';
    codeInput.style.width = '160px';
    codeInput.style.textAlign = 'center';
    codeInput.style.textTransform = 'uppercase';
    codeInput.style.letterSpacing = '4px';
    codeInput.style.border = '1px solid #555';
    codeInput.style.borderRadius = '4px';
    codeInput.style.backgroundColor = '#242424';
    codeInput.style.color = '#ffffff';
    codeInput.style.outline = 'none';
    codeInput.style.zIndex = '10';
    codeInput.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') this.confirmJoinGame();
    });
    document.body.appendChild(codeInput);
    this.joinCodeInput = codeInput;

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.maxLength = 20;
    nameInput.placeholder = 'Your name';
    nameInput.value = character.name || '';
    nameInput.style.position = 'absolute';
    nameInput.style.fontSize = '14px';
    nameInput.style.padding = '6px 10px';
    nameInput.style.width = '160px';
    nameInput.style.textAlign = 'center';
    nameInput.style.border = '1px solid #555';
    nameInput.style.borderRadius = '4px';
    nameInput.style.backgroundColor = '#242424';
    nameInput.style.color = '#ffffff';
    nameInput.style.outline = 'none';
    nameInput.style.zIndex = '10';
    nameInput.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') this.confirmJoinGame();
    });
    document.body.appendChild(nameInput);
    this.joinNameInput = nameInput;

    this.positionJoinHtmlInputs();
    codeInput.focus();
  }

  positionJoinHtmlInputs() {
    if (!this.joinCodeInput) return;
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    const scaleX = rect.width / width;
    const scaleY = rect.height / height;

    this.joinCodeInput.style.left = `${rect.left + (cx - 80) * scaleX}px`;
    this.joinCodeInput.style.top = `${rect.top + (cy - 30) * scaleY}px`;
    this.joinNameInput.style.left = `${rect.left + (cx - 80) * scaleX}px`;
    this.joinNameInput.style.top = `${rect.top + (cy + 14) * scaleY}px`;
  }

  destroyJoinHtmlInputs() {
    if (this.joinCodeInput) {
      this.joinCodeInput.remove();
      this.joinCodeInput = null;
    }
    if (this.joinNameInput) {
      this.joinNameInput.remove();
      this.joinNameInput = null;
    }
  }

  cancelJoinPrompt() {
    this.destroyJoinHtmlInputs();
    this.joinLabel.destroy();
    this.joinError.destroy();
    this.joinConfirmBtn.destroy();
    this.joinCancelBtn.destroy();
    this.showStageSelect();
  }

  confirmJoinGame() {
    const code = (this.joinCodeInput ? this.joinCodeInput.value : '').trim().toUpperCase();
    const name = (this.joinNameInput ? this.joinNameInput.value : '').trim() || 'Player';

    if (!code) {
      this.joinError.setText('Please enter a room code');
      return;
    }

    this.joinConfirmBtn.disableInteractive();
    this.joinConfirmBtn.setText('Connecting...');
    this.joinError.setText('');

    const net = new NetworkManager();
    net.on('waking-up', () => this.joinError.setText('Waking up server, this can take up to a minute...'));

    net.connect(undefined, name, code)
      .then(() => {
        this.destroyJoinHtmlInputs();
        this.scene.start('BootScene', {
          mode: 'join', network: net, isHost: false, roomCode: net.roomCode,
          peaceful: !!net.worldConfig?.peaceful
        });
      })
      .catch((err) => {
        this.joinConfirmBtn.setInteractive({ useHandCursor: true });
        this.joinConfirmBtn.setText('Join');
        this.joinError.setText(err.message || 'Could not join that room');
      });
  }

  showCharacterScreen() {
    this.destroyHtmlInput();
    this.stage = 'character';
    this.title.setVisible(false);
    this.startBtn.setVisible(false);
    this.modsBtn.setVisible(false);
    this.characterBtn.setVisible(false);
    this.seeMobsBtn.setVisible(false);
    this.modsContainer.setVisible(false);
    this.mobsContainer.setVisible(false);
    this.worldListContainer.setVisible(false);
    this.worldListBackBtn.setVisible(false);

    this.characterContainer.removeAll(true);
    this.character = loadCharacter();
    if (this.character.giant && this.character.dwarf) this.character.dwarf = false;
    this.generateCharacterPreviewTexture();

    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;
    const panelLeft = cx - 220;
    const panelRight = cx + 60;

    const heading = this.add.text(cx, cy - 230, 'Character', {
      fontFamily: 'Arial', fontSize: '28px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Live preview on the left side.
    this.previewSprite = this.add.image(panelLeft, cy - 40, 'character-preview').setScale(3);
    const previewLabel = this.add.text(panelLeft, cy + 40, '', {
      fontFamily: 'Arial', fontSize: '13px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.previewLabel = previewLabel;

    this.giantBtn = this.add.text(panelLeft, cy + 70, 'Giant: Off', {
      fontFamily: 'Arial', fontSize: '13px', color: '#aaaaaa',
      backgroundColor: '#242424', padding: { x: 12, y: 6 }
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.toggleCharacterGiant());

    this.dwarfBtn = this.add.text(panelLeft, cy + 105, 'Dwarf: Off', {
      fontFamily: 'Arial', fontSize: '13px', color: '#aaaaaa',
      backgroundColor: '#242424', padding: { x: 12, y: 6 }
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.toggleCharacterDwarf());

    // Name field.
    const nameLabel = this.add.text(panelRight, cy - 190, 'Name (0/20)', {
      fontFamily: 'Arial', fontSize: '13px', color: '#cccccc'
    }).setOrigin(0, 0.5);
    this.characterNameLabel = nameLabel;
    this.createCharacterHtmlInput();

    // Age field.
    const ageLabel = this.add.text(panelRight, cy - 138, 'Age (1-100)', {
      fontFamily: 'Arial', fontSize: '13px', color: '#cccccc'
    }).setOrigin(0, 0.5);
    this.createCharacterAgeHtmlInput();

    // Gender toggle.
    const genderLabel = this.add.text(panelRight, cy - 86, 'Gender', {
      fontFamily: 'Arial', fontSize: '13px', color: '#cccccc'
    }).setOrigin(0, 0.5);
    const genderOffStyle = { fontFamily: 'Arial', fontSize: '12px', color: '#aaaaaa', backgroundColor: '#242424', padding: { x: 10, y: 5 } };
    const genderOnStyle = { fontFamily: 'Arial', fontSize: '12px', color: '#ffffff', backgroundColor: '#3a6b3a', padding: { x: 10, y: 5 } };
    this.maleBtn = this.add.text(panelRight, cy - 66, 'Male', genderOffStyle).setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.setCharacterGender('male'));
    this.femaleBtn = this.add.text(panelRight + 55, cy - 66, 'Female', genderOffStyle).setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.setCharacterGender('female'));
    this.noGenderBtn = this.add.text(panelRight + 122, cy - 66, 'No Gender', genderOffStyle).setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.setCharacterGender('none'));
    this.genderOnStyle = genderOnStyle;
    this.genderOffStyle = genderOffStyle;

    // Hair style picker, with a tab per gender.
    const hairLabel = this.add.text(panelRight, cy - 28, 'Hair Style', {
      fontFamily: 'Arial', fontSize: '13px', color: '#cccccc'
    }).setOrigin(0, 0.5);

    this.hairTab = null;
    const tabOffStyle = { fontFamily: 'Arial', fontSize: '11px', color: '#888888', backgroundColor: '#1c1c1c', padding: { x: 9, y: 4 } };
    const tabOnStyle = { fontFamily: 'Arial', fontSize: '11px', color: '#ffffff', backgroundColor: '#3a3a6b', padding: { x: 9, y: 4 } };
    this.hairTabOnStyle = tabOnStyle;
    this.hairTabOffStyle = tabOffStyle;
    this.hairTabMaleBtn = this.add.text(panelRight, cy - 8, 'Male Styles ▸', tabOffStyle).setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.toggleHairTab('male'));
    this.hairTabFemaleBtn = this.add.text(panelRight + 90, cy - 8, 'Female Styles ▸', tabOffStyle).setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.toggleHairTab('female'));
    this.hatTabOpen = false;
    this.hatTabBtn = this.add.text(panelRight + 190, cy - 8, 'Hats ▸', tabOffStyle).setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.toggleHatTab());

    this.hairGridOrigin = { x: panelRight, y: cy + 14 };
    this.hairBtnStyleOn = { fontFamily: 'Arial', fontSize: '10px', color: '#ffffff', backgroundColor: '#3a6b3a', padding: { x: 6, y: 4 } };
    this.hairBtnStyleOff = { fontFamily: 'Arial', fontSize: '10px', color: '#aaaaaa', backgroundColor: '#242424', padding: { x: 6, y: 4 } };
    this.hairBtns = {};
    this.hairGridItems = [];
    this.rebuildHairGrid();
    this.hatBtns = {};
    this.hatGridItems = [];
    this.rebuildHatGrid();

    // Color swatches, with Skin Tone / Hair Color tabs that swap into this same slot when toggled.
    this.swatchSectionY = cy + 184;
    this.colorLabel = this.add.text(panelRight, this.swatchSectionY, 'Color', {
      fontFamily: 'Arial', fontSize: '13px', color: '#cccccc'
    }).setOrigin(0, 0.5);
    const swatchCols = 8;
    this.colorSwatches = CHARACTER_COLORS.map((color, i) => {
      const col = i % swatchCols;
      const row = Math.floor(i / swatchCols);
      const swatch = this.add.rectangle(panelRight + col * 26, this.swatchSectionY + 20 + row * 26, 20, 20, color, 1)
        .setOrigin(0, 0)
        .setStrokeStyle(1, 0x000000, 0.4)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.setCharacterColor(color));
      return { color, swatch };
    });

    // Skin tone and hair color tabs, positioned beside the Color label. Toggling one
    // hides the shirt Color swatches and shows that tab's swatches in the same slot.
    this.skinToneTabOpen = false;
    this.skinToneTabBtn = this.add.text(panelRight + 215, this.swatchSectionY, 'Skin Tone ▸', tabOffStyle).setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.toggleSkinToneTab());
    this.skinToneGridOrigin = { x: panelRight, y: this.swatchSectionY + 20 };
    this.skinToneSwatches = [];

    this.hairColorTabOpen = false;
    this.hairColorTabBtn = this.add.text(panelRight + 215, this.swatchSectionY + 26, 'Hair Color ▸', tabOffStyle).setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.toggleHairColorTab());
    this.hairColorGridOrigin = { x: panelRight, y: this.swatchSectionY + 20 };
    this.hairColorSwatches = [];

    const backBtn = this.add.text(cx - 40, cy + 234, '< Back', {
      fontFamily: 'Arial', fontSize: '14px', color: '#aaaaaa', backgroundColor: '#242424', padding: { x: 10, y: 6 }
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.saveAndExitCharacterScreen());
    this.characterBackBtn = backBtn;

    this.characterContainer.add([
      heading, this.previewSprite, previewLabel, this.giantBtn, this.dwarfBtn, nameLabel, ageLabel, genderLabel, this.maleBtn, this.femaleBtn, this.noGenderBtn,
      hairLabel, this.hairTabMaleBtn, this.hairTabFemaleBtn, this.hatTabBtn, this.colorLabel,
      ...this.colorSwatches.map(s => s.swatch),
      this.skinToneTabBtn, this.hairColorTabBtn,
      backBtn
    ]);
    this.characterContainer.setVisible(true);

    this.updateSwatchSectionVisibility();
    this.refreshCharacterUI();
    this.startPreviewWalkAnimation();
    this.repositionCharacterBottomUI();
  }

  toggleSkinToneTab() {
    this.skinToneTabOpen = !this.skinToneTabOpen;
    if (this.skinToneTabOpen) this.hairColorTabOpen = false;
    this.updateSwatchSectionVisibility();
    this.rebuildSkinToneGrid();
    this.rebuildHairColorGrid();
    this.refreshCharacterUI();
    this.repositionCharacterBottomUI();
  }

  toggleHairColorTab() {
    this.hairColorTabOpen = !this.hairColorTabOpen;
    if (this.hairColorTabOpen) this.skinToneTabOpen = false;
    this.updateSwatchSectionVisibility();
    this.rebuildSkinToneGrid();
    this.rebuildHairColorGrid();
    this.refreshCharacterUI();
    this.repositionCharacterBottomUI();
  }

  updateSwatchSectionVisibility() {
    const anyTabOpen = this.skinToneTabOpen || this.hairColorTabOpen;
    this.colorLabel.setVisible(!anyTabOpen);
    this.colorSwatches.forEach(s => s.swatch.setVisible(!anyTabOpen));
  }

  rebuildSkinToneGrid() {
    this.skinToneSwatches.forEach(s => s.swatch.destroy());
    this.skinToneSwatches = [];
    if (!this.skinToneTabOpen) return;

    const { x, y } = this.skinToneGridOrigin;
    this.skinToneSwatches = SKIN_TONES.map((color, i) => {
      const swatch = this.add.rectangle(x + i * 26, y, 20, 20, color, 1)
        .setOrigin(0, 0)
        .setStrokeStyle(1, 0x000000, 0.4)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.setCharacterSkinTone(color));
      return { color, swatch };
    });
    this.characterContainer.add(this.skinToneSwatches.map(s => s.swatch));
  }

  rebuildHairColorGrid() {
    this.hairColorSwatches.forEach(s => s.swatch.destroy());
    this.hairColorSwatches = [];
    if (!this.hairColorTabOpen) return;

    const { x, y } = this.hairColorGridOrigin;
    this.hairColorSwatches = HAIR_COLORS.map((color, i) => {
      const col = i % 8;
      const row = Math.floor(i / 8);
      const swatch = this.add.rectangle(x + col * 26, y + row * 26, 20, 20, color, 1)
        .setOrigin(0, 0)
        .setStrokeStyle(1, 0x000000, 0.4)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.setCharacterHairColor(color));
      return { color, swatch };
    });
    this.characterContainer.add(this.hairColorSwatches.map(s => s.swatch));
  }

  repositionCharacterBottomUI() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;
    const panelRight = cx + 60;

    // Tab buttons stay fixed beside the Color row; whichever tab is open swaps its
    // swatch grid into the same slot the shirt Color swatches normally occupy.
    this.skinToneTabBtn.setPosition(panelRight + 215, this.swatchSectionY);
    this.hairColorTabBtn.setPosition(panelRight + 215, this.swatchSectionY + 26);

    const y = this.swatchSectionY + 20;
    if (this.skinToneTabOpen) {
      this.skinToneGridOrigin = { x: panelRight, y };
      this.skinToneSwatches.forEach((s, i) => s.swatch.setPosition(panelRight + i * 26, y));
    } else if (this.hairColorTabOpen) {
      this.hairColorGridOrigin = { x: panelRight, y };
      this.hairColorSwatches.forEach((s, i) => {
        const col = i % 8;
        const row = Math.floor(i / 8);
        s.swatch.setPosition(panelRight + col * 26, y + row * 26);
      });
    }

    // Back button position is fixed regardless of which tab (if any) is open.
    this.characterBackBtn.setPosition(cx - 40, this.swatchSectionY + 50);
  }

  startPreviewWalkAnimation() {
    this.stopPreviewWalkAnimation();
    this.previewWalkToggle = false;
    this.previewWalkTimer = this.time.addEvent({
      delay: 220,
      loop: true,
      callback: () => {
        if (!this.previewSprite) return;
        this.previewWalkToggle = !this.previewWalkToggle;
        this.previewSprite.setTexture(this.previewWalkToggle ? 'character-preview-walk1' : 'character-preview-walk2');
      }
    });
  }

  stopPreviewWalkAnimation() {
    if (this.previewWalkTimer) {
      this.previewWalkTimer.remove();
      this.previewWalkTimer = null;
    }
  }

  toggleHairTab(tab) {
    this.hairTab = this.hairTab === tab ? null : tab;
    if (this.hairTab) this.hatTabOpen = false;
    this.rebuildHairGrid();
    this.rebuildHatGrid();
    this.refreshCharacterUI();
  }

  toggleHatTab() {
    this.hatTabOpen = !this.hatTabOpen;
    if (this.hatTabOpen) this.hairTab = null;
    this.rebuildHairGrid();
    this.rebuildHatGrid();
    this.refreshCharacterUI();
  }

  rebuildHairGrid() {
    this.hairGridItems.forEach(btn => btn.destroy());
    this.hairGridItems = [];
    this.hairBtns = {};

    if (!this.hairTab) return;

    const styles = this.hairTab === 'female' ? FEMALE_HAIR_STYLES : MALE_HAIR_STYLES;
    const { x, y } = this.hairGridOrigin;
    const cols = 3;
    const colWidth = 84;
    const rowHeight = 22;

    styles.forEach((h, i) => {
      const btn = this.add.text(x + (i % cols) * colWidth, y + Math.floor(i / cols) * rowHeight, h.label, this.hairBtnStyleOff)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.setCharacterHair(h.id));
      this.hairBtns[h.id] = btn;
      this.hairGridItems.push(btn);
    });

    this.characterContainer.add(this.hairGridItems);
  }

  rebuildHatGrid() {
    this.hatGridItems.forEach(btn => btn.destroy());
    this.hatGridItems = [];
    this.hatBtns = {};
    if (!this.hatTabOpen) return;

    const choices = [{ id: 'none', label: 'None' }, ...HAT_STYLES];
    const { x, y } = this.hairGridOrigin;
    const cols = 3;
    const colWidth = 84;
    const rowHeight = 22;
    choices.forEach((hat, i) => {
      const btn = this.add.text(x + (i % cols) * colWidth, y + Math.floor(i / cols) * rowHeight, hat.label, this.hairBtnStyleOff)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.setCharacterHat(hat.id));
      this.hatBtns[hat.id] = btn;
      this.hatGridItems.push(btn);
    });
    this.characterContainer.add(this.hatGridItems);
  }

  setCharacterGender(gender) {
    this.character.gender = gender;
    this.refreshCharacterUI();
  }

  setCharacterHair(hair) {
    this.character.hair = hair;
    this.refreshCharacterUI();
  }

  setCharacterHat(hat) {
    this.character.hat = hat;
    this.refreshCharacterUI();
  }

  setCharacterColor(color) {
    this.character.color = color;
    this.refreshCharacterUI();
  }

  setCharacterSkinTone(color) {
    this.character.skinTone = color;
    this.refreshCharacterUI();
  }

  setCharacterHairColor(color) {
    this.character.hairColor = color;
    this.refreshCharacterUI();
  }

  toggleCharacterGiant() {
    this.character.giant = !this.character.giant;
    if (this.character.giant) this.character.dwarf = false;
    this.refreshCharacterUI();
  }

  toggleCharacterDwarf() {
    this.character.dwarf = !this.character.dwarf;
    if (this.character.dwarf) this.character.giant = false;
    this.refreshCharacterUI();
  }

  refreshCharacterUI() {
    this.maleBtn.setStyle(this.character.gender === 'male' ? this.genderOnStyle : this.genderOffStyle);
    this.femaleBtn.setStyle(this.character.gender === 'female' ? this.genderOnStyle : this.genderOffStyle);
    this.noGenderBtn.setStyle(this.character.gender === 'none' ? this.genderOnStyle : this.genderOffStyle);

    this.hairTabMaleBtn.setStyle(this.hairTab === 'male' ? this.hairTabOnStyle : this.hairTabOffStyle);
    this.hairTabFemaleBtn.setStyle(this.hairTab === 'female' ? this.hairTabOnStyle : this.hairTabOffStyle);
    this.hatTabBtn.setStyle(this.hatTabOpen ? this.hairTabOnStyle : this.hairTabOffStyle);
    this.hatTabBtn.setText(this.hatTabOpen ? 'Hats ▾' : 'Hats ▸');

    this.skinToneTabBtn.setStyle(this.skinToneTabOpen ? this.hairTabOnStyle : this.hairTabOffStyle);
    this.skinToneTabBtn.setText(this.skinToneTabOpen ? 'Skin Tone ▾' : 'Skin Tone ▸');
    this.hairColorTabBtn.setStyle(this.hairColorTabOpen ? this.hairTabOnStyle : this.hairTabOffStyle);
    this.hairColorTabBtn.setText(this.hairColorTabOpen ? 'Hair Color ▾' : 'Hair Color ▸');

    Object.entries(this.hairBtns).forEach(([id, btn]) => {
      btn.setStyle(this.character.hair === id ? this.hairBtnStyleOn : this.hairBtnStyleOff);
    });
    Object.entries(this.hatBtns).forEach(([id, btn]) => {
      btn.setStyle(this.character.hat === id ? this.hairBtnStyleOn : this.hairBtnStyleOff);
    });

    this.colorSwatches.forEach(({ color, swatch }) => {
      swatch.setStrokeStyle(this.character.color === color ? 3 : 1, this.character.color === color ? 0xffe066 : 0x000000, this.character.color === color ? 1 : 0.4);
    });

    this.skinToneSwatches.forEach(({ color, swatch }) => {
      swatch.setStrokeStyle(this.character.skinTone === color ? 3 : 1, this.character.skinTone === color ? 0xffe066 : 0x000000, this.character.skinTone === color ? 1 : 0.4);
    });

    this.hairColorSwatches.forEach(({ color, swatch }) => {
      swatch.setStrokeStyle(this.character.hairColor === color ? 3 : 1, this.character.hairColor === color ? 0xffe066 : 0x000000, this.character.hairColor === color ? 1 : 0.4);
    });

    this.generateCharacterPreviewTexture();
    this.previewSprite.setTexture('character-preview');
    const normalPreviewScale = 3 * ageToScale(this.character.age);
    this.previewSprite.setScale(this.character.giant ? 7.5 : this.character.dwarf ? normalPreviewScale / 3 : normalPreviewScale);
    this.previewSprite.setPosition(this.previewSprite.x, this.scale.height / 2 - 40);
    this.previewLabel.setPosition(this.previewLabel.x, this.scale.height / 2 + (this.character.giant ? 120 : 40));
    this.giantBtn.setPosition(this.giantBtn.x, this.scale.height / 2 + (this.character.giant ? 155 : 70));
    this.giantBtn.setText(this.character.giant ? 'Giant: On' : 'Giant: Off');
    this.giantBtn.setStyle(this.character.giant ? this.genderOnStyle : this.genderOffStyle);
    this.dwarfBtn.setPosition(this.dwarfBtn.x, this.scale.height / 2 + (this.character.giant ? 190 : 105));
    this.dwarfBtn.setText(this.character.dwarf ? 'Dwarf: On' : 'Dwarf: Off');
    this.dwarfBtn.setStyle(this.character.dwarf ? this.genderOnStyle : this.genderOffStyle);

    const name = this.characterHtmlInput ? this.characterHtmlInput.value.trim() : this.character.name;
    this.previewLabel.setText(name || 'Player');
    if (this.characterNameLabel) {
      const length = this.characterHtmlInput ? this.characterHtmlInput.value.length : (this.character.name || '').length;
      this.characterNameLabel.setText(`Name (${Math.min(length, 20)}/20)`);
    }
  }

  generateCharacterPreviewTexture() {
    this.drawCharacterPreviewFrame('character-preview', 0);
    this.drawCharacterPreviewFrame('character-preview-walk1', -4);
    this.drawCharacterPreviewFrame('character-preview-walk2', 4);
  }

  drawCharacterPreviewFrame(key, legOffset) {
    if (this.textures.exists(key)) {
      this.textures.remove(key);
    }

    const size = 40;
    const g = this.add.graphics();
    const cx = size / 2;

    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, size - 4, size * 0.5, size * 0.16);

    // Legs, drawn under the torso so the hem/shirt overlaps the tops.
    // Each leg is a hinged quad: top stays fixed at the hip, bottom (foot) swings by
    // legOffset, so the leg pivots like a real stride instead of sliding as a rigid block.
    // Female legs are narrower and set closer together to fit the tapered hem.
    const hipY = size * 0.62;
    const footY = size - 2;
    const isFemale = this.character.gender === 'female';
    const legW = isFemale ? 4 : 5;
    const legInsetLeft = isFemale ? cx - 6 : cx - 7;
    const legInsetRight = cx + 2;
    const skinTone = this.character.skinTone || 0xe8b98a;
    g.fillStyle(skinTone, 1);
    [-1, 1].forEach(side => {
      const hipLeft = side < 0 ? legInsetLeft : legInsetRight;
      const footShift = side < 0 ? legOffset : -legOffset;
      g.beginPath();
      g.moveTo(hipLeft, hipY);
      g.lineTo(hipLeft + legW, hipY);
      g.lineTo(hipLeft + legW + footShift, footY);
      g.lineTo(hipLeft + footShift, footY);
      g.closePath();
      g.fillPath();
    });
    g.fillStyle(0x5a3a20, 1);
    g.fillRoundedRect(legInsetLeft + legOffset, size - 6, legW, 4, 1.5);
    g.fillRoundedRect(legInsetRight - legOffset, size - 6, legW, 4, 1.5);

    g.fillStyle(this.character.color, 1);
    if (this.character.gender === 'female') {
      const top = size * 0.42, bodyH = 16, shoulderW = 15, waistW = 11, hemW = 17;
      g.beginPath();
      g.moveTo(cx - shoulderW / 2, top);
      g.lineTo(cx + shoulderW / 2, top);
      g.lineTo(cx + waistW / 2, top + bodyH * 0.55);
      g.lineTo(cx + hemW / 2, top + bodyH);
      g.lineTo(cx - hemW / 2, top + bodyH);
      g.lineTo(cx - waistW / 2, top + bodyH * 0.55);
      g.closePath();
      g.fillPath();
    } else {
      g.fillRoundedRect(cx - 10, size * 0.42, 20, 16, 3);
    }

    g.fillStyle(skinTone, 1);
    g.fillCircle(cx, size * 0.36, 10);

    drawHairShape(g, this.character.hair, cx, size, this.character.hairColor);
    drawHatShape(g, this.character.hat, cx, size);

    g.fillStyle(0x2a2a2e, 1);
    g.fillCircle(cx - 3.5, size * 0.41, 1.6);
    g.fillCircle(cx + 3.5, size * 0.41, 1.6);

    g.generateTexture(key, size, size);
    g.destroy();
  }

  createCharacterHtmlInput() {
    this.destroyCharacterHtmlInput();

    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 20;
    input.placeholder = 'Player';
    input.value = (this.character.name || '').slice(0, 20);
    input.style.position = 'absolute';
    input.style.fontSize = '14px';
    input.style.padding = '5px 8px';
    input.style.width = '160px';
    input.style.border = '1px solid #555';
    input.style.borderRadius = '4px';
    input.style.backgroundColor = '#242424';
    input.style.color = '#ffffff';
    input.style.outline = 'none';
    input.style.zIndex = '10';

    input.addEventListener('keydown', (e) => e.stopPropagation());
    input.addEventListener('input', () => this.refreshCharacterUI());

    document.body.appendChild(input);
    this.characterHtmlInput = input;
    this.positionCharacterHtmlInput();
    input.focus();
  }

  positionCharacterHtmlInput() {
    if (!this.characterHtmlInput) return;
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;
    const panelRight = cx + 60;

    const scaleX = rect.width / width;
    const scaleY = rect.height / height;

    this.characterHtmlInput.style.left = `${rect.left + (panelRight - 10) * scaleX}px`;
    this.characterHtmlInput.style.top = `${rect.top + (cy - 190 + 14) * scaleY}px`;
  }

  destroyCharacterHtmlInput() {
    if (this.characterHtmlInput) {
      this.characterHtmlInput.remove();
      this.characterHtmlInput = null;
    }
    this.destroyCharacterAgeHtmlInput();
  }

  createCharacterAgeHtmlInput() {
    this.destroyCharacterAgeHtmlInput();

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.max = '100';
    input.placeholder = '25';
    input.value = this.character.age || 25;
    input.style.position = 'absolute';
    input.style.fontSize = '14px';
    input.style.padding = '5px 8px';
    input.style.width = '70px';
    input.style.border = '1px solid #555';
    input.style.borderRadius = '4px';
    input.style.backgroundColor = '#242424';
    input.style.color = '#ffffff';
    input.style.outline = 'none';
    input.style.zIndex = '10';

    input.addEventListener('keydown', (e) => e.stopPropagation());
    input.addEventListener('input', () => {
      const clamped = Phaser.Math.Clamp(parseInt(input.value, 10) || 1, 1, 100);
      this.character.age = clamped;
      this.refreshCharacterUI();
    });

    document.body.appendChild(input);
    this.characterAgeHtmlInput = input;
    this.positionCharacterAgeHtmlInput();
  }

  positionCharacterAgeHtmlInput() {
    if (!this.characterAgeHtmlInput) return;
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;
    const panelRight = cx + 60;

    const scaleX = rect.width / width;
    const scaleY = rect.height / height;

    this.characterAgeHtmlInput.style.left = `${rect.left + (panelRight - 10) * scaleX}px`;
    this.characterAgeHtmlInput.style.top = `${rect.top + (cy - 138 + 14) * scaleY}px`;
  }

  destroyCharacterAgeHtmlInput() {
    if (this.characterAgeHtmlInput) {
      this.characterAgeHtmlInput.remove();
      this.characterAgeHtmlInput = null;
    }
  }

  saveAndExitCharacterScreen() {
    if (this.characterHtmlInput) {
      this.character.name = this.characterHtmlInput.value.trim().slice(0, 20) || 'Player';
    }
    if (this.characterAgeHtmlInput) {
      this.character.age = Phaser.Math.Clamp(parseInt(this.characterAgeHtmlInput.value, 10) || 25, 1, 100);
    }
    saveCharacter(this.character);
    this.destroyCharacterHtmlInput();
    this.stopPreviewWalkAnimation();
    this.showStart();
  }

  showWorldList() {
    this.stage = 'worldList';
    this.startBtn.setVisible(false);
    this.newGameBtn.setVisible(false);
    this.loadGameBtn.setVisible(false);
    this.joinGameBtn.setVisible(false);
    this.backBtn.setVisible(false);
    this.noSaveHint.setVisible(false);
    this.worldListBackBtn.setVisible(true);

    this.renderWorldList();
    this.worldListContainer.setVisible(true);
  }

  renderWorldList() {
    this.worldListContainer.removeAll(true);

    const { width, height } = this.scale;
    const cx = width / 2;
    const startY = height / 2 - 150;
    const rowHeight = 50;
    const rowWidth = 420;

    const worlds = listWorlds();

    if (worlds.length === 0) {
      const empty = this.add.text(cx, startY + 20, 'No saved worlds', {
        fontFamily: 'Arial', fontSize: '14px', color: '#888888'
      }).setOrigin(0.5);
      this.worldListContainer.add(empty);
      return;
    }

    worlds.forEach((world, i) => {
      const y = startY + i * rowHeight;

      const rowBg = this.add.rectangle(cx, y, rowWidth, rowHeight - 8, 0x2c2c2c, 1)
        .setStrokeStyle(1, 0x555555);

      const date = new Date(world.updatedAt);
      const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const label = this.add.text(cx - rowWidth / 2 + 14, y - 14, world.name, {
        fontFamily: 'Arial', fontSize: '15px', color: '#ffffff', fontStyle: 'bold'
      });
      const subLabel = this.add.text(cx - rowWidth / 2 + 14, y + 4, `Last played: ${dateStr}`, {
        fontFamily: 'Arial', fontSize: '10px', color: '#999999'
      });

      const loadBtn = this.add.text(cx + rowWidth / 2 - 14, y - (rowHeight - 8) / 2 + 4, 'Load', {
        fontFamily: 'Arial', fontSize: '13px', color: '#ffffff', backgroundColor: '#3a6b3a', padding: { x: 10, y: 5 }
      }).setOrigin(1, 0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.scene.start('BootScene', { mode: 'load', worldId: world.id, worldName: world.name }));

      const deleteBtn = this.add.text(cx + rowWidth / 2 - 60, y - (rowHeight - 8) / 2 + 4, 'Delete', {
        fontFamily: 'Arial', fontSize: '13px', color: '#ffffff', backgroundColor: '#6b3a3a', padding: { x: 10, y: 5 }
      }).setOrigin(1, 0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          deleteWorld(world.id);
          this.renderWorldList();
        });

      this.worldListContainer.add([rowBg, label, subLabel, loadBtn, deleteBtn]);
    });
  }
}
