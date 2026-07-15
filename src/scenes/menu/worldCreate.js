import { createWorld, worldNameTaken, isModInstalled, loadCharacter } from '../../SaveManager.js';
import NetworkManager from '../../net/NetworkManager.js';
import { PEACEFUL_MOD_ID, CLONE_MOD_ID, GUN_MOD_ID, MODS } from './constants.js';

export const worldCreateMethods = {
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
  },

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
  },

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
  },

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
  },

  destroyHtmlInput() {
    if (this.htmlInput) {
      this.htmlInput.remove();
      this.htmlInput = null;
    }
  },

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
  },

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
  },
};
