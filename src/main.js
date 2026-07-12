import Phaser from 'phaser';
import MenuScene from './scenes/MenuScene.js';
import BootScene from './scenes/BootScene.js';

const config = {
  type: Phaser.AUTO,
  parent: document.body,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: [MenuScene, BootScene]
};

new Phaser.Game(config);
