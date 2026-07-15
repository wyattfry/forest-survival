import { hasSave } from '../../SaveManager.js';

export const screensMethods = {
  positionLayout() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.title.setPosition(cx, cy - 200);
    this.startBtn.setPosition(cx, cy);
    this.modsBtn.setPosition(cx, cy + 56);
    this.characterBtn.setPosition(cx, cy + 96);
    this.seeMobsBtn.setPosition(cx, cy + 136);
    this.newGameBtn.setPosition(cx, cy - 60);
    this.loadGameBtn.setPosition(cx, cy);
    this.joinGameBtn.setPosition(cx, cy + 56);
    this.backBtn.setPosition(cx, cy + 130);
    this.noSaveHint.setPosition(cx, cy + 32);
    this.worldListBackBtn.setPosition(cx, cy + 220);

    if (this.htmlInput) {
      this.positionHtmlInput();
    }
    if (this.characterHtmlInput) {
      this.positionCharacterHtmlInput();
    }
    if (this.characterAgeHtmlInput) {
      this.positionCharacterAgeHtmlInput();
    }
    if (this.joinCodeInput) {
      this.positionJoinHtmlInputs();
    }
  },

  showStageSelect() {
    this.destroyHtmlInput();
    this.stage = 'select';
    this.startBtn.setVisible(false);
    this.modsBtn.setVisible(false);
    this.characterBtn.setVisible(false);
    this.seeMobsBtn.setVisible(false);
    this.newGameBtn.setVisible(true);
    this.loadGameBtn.setVisible(true);
    this.joinGameBtn.setVisible(true);
    this.backBtn.setVisible(true);
    this.noSaveHint.setVisible(!hasSave());
    this.worldListContainer.setVisible(false);
    this.worldListBackBtn.setVisible(false);
    this.modsContainer.setVisible(false);
    this.characterContainer.setVisible(false);
    this.mobsContainer.setVisible(false);
  },

  showStart() {
    this.destroyHtmlInput();
    this.destroyCharacterHtmlInput();
    this.stage = 'start';
    this.title.setVisible(true);
    this.startBtn.setVisible(true);
    this.modsBtn.setVisible(true);
    this.characterBtn.setVisible(true);
    this.seeMobsBtn.setVisible(true);
    this.newGameBtn.setVisible(false);
    this.loadGameBtn.setVisible(false);
    this.joinGameBtn.setVisible(false);
    this.backBtn.setVisible(false);
    this.noSaveHint.setVisible(false);
    this.worldListContainer.setVisible(false);
    this.worldListBackBtn.setVisible(false);
    this.modsContainer.setVisible(false);
    this.characterContainer.setVisible(false);
    this.mobsContainer.setVisible(false);
  },
};
