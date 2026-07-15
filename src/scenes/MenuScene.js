import Phaser from 'phaser';
import { hasSave } from '../SaveManager.js';
import { screensMethods } from './menu/screens.js';
import { modsScreenMethods } from './menu/modsScreen.js';
import { mobsScreenMethods } from './menu/mobsScreen.js';
import { worldCreateMethods } from './menu/worldCreate.js';
import { joinGameMethods } from './menu/joinGame.js';
import { characterMethods } from './menu/character.js';
import { worldListMethods } from './menu/worldList.js';

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
}

Object.assign(MenuScene.prototype,
  screensMethods,
  modsScreenMethods,
  mobsScreenMethods,
  worldCreateMethods,
  joinGameMethods,
  characterMethods,
  worldListMethods,
);
