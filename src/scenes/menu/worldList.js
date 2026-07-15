import { listWorlds, deleteWorld } from '../../SaveManager.js';

export const worldListMethods = {
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
  },

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
  },
};
