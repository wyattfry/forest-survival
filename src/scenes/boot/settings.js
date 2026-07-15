export const settingsMethods = {
  setupSettingsMenu() {
    this.gameMode = 'survival';
    this.settingsButtonSize = 34;

    this.settingsBtn = this.add.text(0, 0, '⚙', {
      fontFamily: 'Arial', fontSize: '20px', color: '#ffffff', backgroundColor: 'rgba(26,26,26,0.85)',
      padding: { x: 7, y: 4 }
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(2500000)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.toggleSettingsPanel());

    const panelWidth = 220;
    const panelHeight = 190;
    this.settingsPanel = this.add.container(0, 0)
      .setScrollFactor(0)
      .setDepth(2500001)
      .setVisible(false);
    this.settingsPanelSize = { width: panelWidth, height: panelHeight };

    const bg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x1a1a1a, 0.94)
      .setOrigin(0, 0).setStrokeStyle(2, 0xffffff, 0.6).setScrollFactor(0);
    const title = this.add.text(panelWidth / 2, 12, 'Settings', {
      fontFamily: 'Arial', fontSize: '15px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0);

    const closeBtn = this.add.text(panelWidth - 12, 10, 'X', {
      fontFamily: 'Arial', fontSize: '12px', color: '#ffffff', backgroundColor: '#3a3a3a', padding: { x: 5, y: 2 }
    }).setOrigin(1, 0).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.settingsPanel.setVisible(false));

    const modeLabel = this.add.text(14, 46, 'Game Mode', {
      fontFamily: 'Arial', fontSize: '11px', color: '#cccccc'
    }).setScrollFactor(0);

    const btnStyleOff = { fontFamily: 'Arial', fontSize: '13px', color: '#aaaaaa', backgroundColor: '#242424', padding: { x: 12, y: 6 } };
    const btnStyleOn = { fontFamily: 'Arial', fontSize: '13px', color: '#ffffff', backgroundColor: '#3a6b3a', padding: { x: 12, y: 6 } };

    this.survivalModeBtn = this.add.text(14, 68, 'Survival', btnStyleOn).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.setGameMode('survival'));
    this.creativeModeBtn = this.add.text(110, 68, 'Creative', btnStyleOff).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.setGameMode('creative'));
    this.settingsBtnStyleOn = btnStyleOn;
    this.settingsBtnStyleOff = btnStyleOff;

    const hint = this.add.text(panelWidth / 2, 104, 'Creative: unlimited materials', {
      fontFamily: 'Arial', fontSize: '9px', color: '#888888'
    }).setOrigin(0.5, 0).setScrollFactor(0);

    const exitBtn = this.add.text(panelWidth / 2, 128, 'Exit World', {
      fontFamily: 'Arial', fontSize: '13px', color: '#ffffff', backgroundColor: '#6b3a3a', padding: { x: 14, y: 7 }
    }).setOrigin(0.5, 0).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.exitToMenu());

    const exitHint = this.add.text(panelWidth / 2, 164, 'Saves before returning to the menu', {
      fontFamily: 'Arial', fontSize: '9px', color: '#888888'
    }).setOrigin(0.5, 0).setScrollFactor(0);

    this.settingsPanel.add([bg, title, closeBtn, modeLabel, this.survivalModeBtn, this.creativeModeBtn, hint, exitBtn, exitHint]);

    this.positionSettingsMenu();
    this.scale.on('resize', () => this.positionSettingsMenu());
  },

  positionSettingsMenu() {
    const { width } = this.scale;
    const btnX = width - this.hpBarMargin - this.hpBarWidth - this.settingsButtonSize - 10;
    const btnY = this.hpBarMargin;
    this.settingsBtn.setPosition(btnX, btnY);

    const { width: pw } = this.settingsPanelSize;
    this.settingsPanel.setPosition(btnX + this.settingsButtonSize - pw, btnY + this.settingsButtonSize + 6);
  },

  toggleSettingsPanel() {
    this.settingsPanel.setVisible(!this.settingsPanel.visible);
  },
};
