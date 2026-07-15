export const mobsScreenMethods = {
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
  },

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
  },
};
