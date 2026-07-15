import { loadCharacter } from '../../SaveManager.js';
import NetworkManager from '../../net/NetworkManager.js';

export const joinGameMethods = {
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
  },

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
  },

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
  },

  destroyJoinHtmlInputs() {
    if (this.joinCodeInput) {
      this.joinCodeInput.remove();
      this.joinCodeInput = null;
    }
    if (this.joinNameInput) {
      this.joinNameInput.remove();
      this.joinNameInput = null;
    }
  },

  cancelJoinPrompt() {
    this.destroyJoinHtmlInputs();
    this.joinLabel.destroy();
    this.joinError.destroy();
    this.joinConfirmBtn.destroy();
    this.joinCancelBtn.destroy();
    this.showStageSelect();
  },

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
  },
};
