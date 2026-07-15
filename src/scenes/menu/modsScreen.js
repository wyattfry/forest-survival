import { isModInstalled, installMod, uninstallMod } from '../../SaveManager.js';
import { MODS } from './constants.js';

export const modsScreenMethods = {
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
  },

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
  },

  downloadMod(modId) {
    const { downloadBtn } = this.modRowButtons[modId];
    downloadBtn.disableInteractive();
    downloadBtn.setText('Downloading...');
    downloadBtn.setStyle({ backgroundColor: '#555555' });

    this.time.delayedCall(900, () => {
      installMod(modId);
      this.refreshModRowInteractivity(modId);
    });
  },

  uninstallModClick(modId) {
    uninstallMod(modId);
    this.refreshModRowInteractivity(modId);
  },

  toggleModEnabled(modId, label) {
    this.enabledMods[modId] = !this.enabledMods[modId];
    this.modCheckboxes[modId].setText((this.enabledMods[modId] ? '☑' : '☐') + ` ${label}`);
  },

  setPlayerMode(mode) {
    this.playerMode = mode;
    this.singlePlayerBtn.setStyle(mode === 'single' ? this.modeOnStyle : this.modeOffStyle);
    this.multiplayerBtn.setStyle(mode === 'multi' ? this.modeOnStyle : this.modeOffStyle);
  },
};
