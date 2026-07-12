import Phaser from 'phaser';
import { listWorlds, hasSave, createWorld, worldNameTaken, deleteWorld, isModInstalled, installMod, uninstallMod, loadCharacter, saveCharacter } from '../SaveManager.js';

const PEACEFUL_MOD_ID = 'peaceful-mode';
const CHARACTER_COLORS = [0x3f5fd6, 0xd63f3f, 0x3fd670, 0xd6b83f, 0x9a3fd6, 0x3fd6c9];
const HAIR_STYLES = [
  { id: 'short', label: 'Short' },
  { id: 'long', label: 'Long' },
  { id: 'ponytail', label: 'Ponytail' },
  { id: 'bald', label: 'Bald' }
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

    this.events.on('shutdown', () => this.destroyHtmlInput());
  }

  positionLayout() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.title.setPosition(cx, cy - 200);
    this.startBtn.setPosition(cx, cy);
    this.modsBtn.setPosition(cx, cy + 56);
    this.newGameBtn.setPosition(cx, cy - 30);
    this.loadGameBtn.setPosition(cx, cy + 35);
    this.backBtn.setPosition(cx, cy + 100);
    this.noSaveHint.setPosition(cx, cy + 68);
    this.worldListBackBtn.setPosition(cx, cy + 220);

    if (this.htmlInput) {
      this.positionHtmlInput();
    }
  }

  showStageSelect() {
    this.destroyHtmlInput();
    this.stage = 'select';
    this.startBtn.setVisible(false);
    this.modsBtn.setVisible(false);
    this.newGameBtn.setVisible(true);
    this.loadGameBtn.setVisible(true);
    this.backBtn.setVisible(true);
    this.noSaveHint.setVisible(!hasSave());
    this.worldListContainer.setVisible(false);
    this.worldListBackBtn.setVisible(false);
    this.modsContainer.setVisible(false);
  }

  showStart() {
    this.destroyHtmlInput();
    this.stage = 'start';
    this.startBtn.setVisible(true);
    this.modsBtn.setVisible(true);
    this.newGameBtn.setVisible(false);
    this.loadGameBtn.setVisible(false);
    this.backBtn.setVisible(false);
    this.noSaveHint.setVisible(false);
    this.worldListContainer.setVisible(false);
    this.worldListBackBtn.setVisible(false);
    this.modsContainer.setVisible(false);
  }

  showModsScreen() {
    this.destroyHtmlInput();
    this.stage = 'mods';
    this.startBtn.setVisible(false);
    this.modsBtn.setVisible(false);

    this.modsContainer.removeAll(true);
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    const heading = this.add.text(cx, cy - 100, 'Mods', {
      fontFamily: 'Arial', fontSize: '28px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    const rowBg = this.add.rectangle(cx, cy - 40, 400, 60, 0x2c2c2c, 1)
      .setStrokeStyle(1, 0x555555);
    const modName = this.add.text(cx - 180, cy - 54, 'Peaceful Mode', {
      fontFamily: 'Arial', fontSize: '15px', color: '#ffffff', fontStyle: 'bold'
    });
    const modDesc = this.add.text(cx - 180, cy - 34, 'No hostile enemies spawn in the world', {
      fontFamily: 'Arial', fontSize: '11px', color: '#999999'
    });

    const installed = isModInstalled(PEACEFUL_MOD_ID);

    this.modDownloadBtn = this.add.text(cx + 180, cy - 40, installed ? 'Installed' : 'Download', {
      fontFamily: 'Arial', fontSize: '13px', color: '#ffffff',
      backgroundColor: installed ? '#444444' : '#3a6b3a', padding: { x: 10, y: 6 }
    }).setOrigin(1, 0.5);
    if (!installed) {
      this.modDownloadBtn.setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.downloadMod());
    }

    this.modUninstallBtn = this.add.text(this.modDownloadBtn.x - this.modDownloadBtn.width - 8, cy - 40, 'Uninstall', {
      fontFamily: 'Arial', fontSize: '13px', color: '#ffffff',
      backgroundColor: installed ? '#6b3a3a' : '#333333', padding: { x: 10, y: 6 }
    }).setOrigin(1, 0.5);
    if (installed) {
      this.modUninstallBtn.setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.uninstallModClick());
    }

    const message = this.add.text(cx, cy + 10,
      'Install a mod, then enable it when naming a new world.', {
        fontFamily: 'Arial', fontSize: '12px', color: '#888888', align: 'center'
      }).setOrigin(0.5);

    const backBtn = this.add.text(cx, cy + 60, '< Back', {
      fontFamily: 'Arial', fontSize: '14px', color: '#aaaaaa', backgroundColor: '#242424', padding: { x: 10, y: 6 }
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.showStart());

    this.modsContainer.add([heading, rowBg, modName, modDesc, this.modUninstallBtn, this.modDownloadBtn, message, backBtn]);
    this.modsContainer.setVisible(true);
  }

  downloadMod() {
    this.modDownloadBtn.disableInteractive();
    this.modDownloadBtn.setText('Downloading...');
    this.modDownloadBtn.setStyle({ backgroundColor: '#555555' });

    this.time.delayedCall(900, () => {
      installMod(PEACEFUL_MOD_ID);
      this.modDownloadBtn.setText('Installed');
      this.modDownloadBtn.setStyle({ backgroundColor: '#444444' });
      this.modUninstallBtn.setStyle({ backgroundColor: '#6b3a3a' });
      this.modUninstallBtn.setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.uninstallModClick());
    });
  }

  uninstallModClick() {
    uninstallMod(PEACEFUL_MOD_ID);
    this.modUninstallBtn.disableInteractive();
    this.modUninstallBtn.setStyle({ backgroundColor: '#333333' });
    this.modDownloadBtn.setText('Download');
    this.modDownloadBtn.setStyle({ backgroundColor: '#3a6b3a' });
    this.modDownloadBtn.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.downloadMod());
  }

  showNamePrompt() {
    this.stage = 'name';
    this.newGameBtn.setVisible(false);
    this.loadGameBtn.setVisible(false);
    this.backBtn.setVisible(false);
    this.noSaveHint.setVisible(false);

    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.nameLabel = this.add.text(cx, cy - 40, 'Name your world', {
      fontFamily: 'Arial', fontSize: '18px', color: '#ffffff'
    }).setOrigin(0.5);

    this.createHtmlInput();

    this.peacefulMode = false;
    const modInstalled = isModInstalled(PEACEFUL_MOD_ID);
    const checkboxLabel = modInstalled
      ? '☐ Peaceful Mode (no hostile enemies)'
      : '☐ Peaceful Mode (download this mod first)';

    this.peacefulCheckbox = this.add.text(cx - 90, cy + 46, checkboxLabel, {
      fontFamily: 'Arial', fontSize: '13px', color: modInstalled ? '#cccccc' : '#666666'
    }).setOrigin(0, 0.5);

    if (modInstalled) {
      this.peacefulCheckbox.setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.togglePeacefulMode());
    }

    this.nameError = this.add.text(cx, cy + 78, '', {
      fontFamily: 'Arial', fontSize: '12px', color: '#e08080'
    }).setOrigin(0.5);

    this.confirmBtn = this.add.text(cx, cy + 112, 'Create World', {
      fontFamily: 'Arial', fontSize: '18px', color: '#ffffff', backgroundColor: '#3a6b3a', padding: { x: 20, y: 10 }
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.confirmCreateWorld());

    this.nameCancelBtn = this.add.text(cx, cy + 162, '< Cancel', {
      fontFamily: 'Arial', fontSize: '14px', color: '#aaaaaa', backgroundColor: '#242424', padding: { x: 10, y: 6 }
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.cancelNamePrompt());
  }

  togglePeacefulMode() {
    this.peacefulMode = !this.peacefulMode;
    this.peacefulCheckbox.setText(
      (this.peacefulMode ? '☑' : '☐') + ' Peaceful Mode (no hostile enemies)'
    );
  }

  cancelNamePrompt() {
    this.destroyHtmlInput();
    this.nameLabel.destroy();
    this.peacefulCheckbox.destroy();
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

    const id = createWorld(name, { peaceful: this.peacefulMode });
    this.destroyHtmlInput();
    this.scene.start('BootScene', { mode: 'new', worldId: id, worldName: name, peaceful: this.peacefulMode });
  }

  showWorldList() {
    this.stage = 'worldList';
    this.startBtn.setVisible(false);
    this.newGameBtn.setVisible(false);
    this.loadGameBtn.setVisible(false);
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
