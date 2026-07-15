export const coinsMethods = {
  setupCoinCounter() {
    this.coins = 0;
    this.coinCounterText = this.add.text(0, 0, '●  Coins: 0', {
      fontFamily: 'Arial', fontSize: '16px', fontStyle: 'bold', color: '#ffd84a',
      backgroundColor: 'rgba(26,26,26,0.85)', padding: { x: 10, y: 6 }
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(2500000);
    this.positionCoinCounter();
    this.scale.on('resize', () => this.positionCoinCounter());
  },

  positionCoinCounter() {
    if (!this.coinCounterText) return;
    this.coinCounterText.setPosition(this.scale.width - 16, this.hpBarMargin + this.hpBarHeight + 10);
  },

  setCoins(amount) {
    this.coins = Math.max(0, Math.floor(Number(amount) || 0));
    if (this.coinCounterText) this.coinCounterText.setText(`●  Coins: ${this.coins}`);
    if (this.shopPanel?.visible) this.renderShopPage();
  },

  addCoins(amount) {
    this.setCoins(this.coins + amount);
  },
};
