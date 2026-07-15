import Phaser from 'phaser';
import { loadCharacter, saveCharacter } from '../../SaveManager.js';
import { MALE_HAIR_STYLES, FEMALE_HAIR_STYLES, drawHairShape, ageToScale, HAIR_COLORS, SKIN_TONES } from '../../HairStyles.js';
import { HAT_STYLES, drawHatShape } from '../../Hats.js';
import { CHARACTER_COLORS } from './constants.js';

export const characterMethods = {
  showCharacterScreen() {
    this.destroyHtmlInput();
    this.stage = 'character';
    this.title.setVisible(false);
    this.startBtn.setVisible(false);
    this.modsBtn.setVisible(false);
    this.characterBtn.setVisible(false);
    this.seeMobsBtn.setVisible(false);
    this.modsContainer.setVisible(false);
    this.mobsContainer.setVisible(false);
    this.worldListContainer.setVisible(false);
    this.worldListBackBtn.setVisible(false);

    this.characterContainer.removeAll(true);
    this.character = loadCharacter();
    if (this.character.giant && this.character.dwarf) this.character.dwarf = false;
    this.generateCharacterPreviewTexture();

    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;
    const panelLeft = cx - 220;
    const panelRight = cx + 60;

    const heading = this.add.text(cx, cy - 230, 'Character', {
      fontFamily: 'Arial', fontSize: '28px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Live preview on the left side.
    this.previewSprite = this.add.image(panelLeft, cy - 40, 'character-preview').setScale(3);
    const previewLabel = this.add.text(panelLeft, cy + 40, '', {
      fontFamily: 'Arial', fontSize: '13px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.previewLabel = previewLabel;

    this.giantBtn = this.add.text(panelLeft, cy + 70, 'Giant: Off', {
      fontFamily: 'Arial', fontSize: '13px', color: '#aaaaaa',
      backgroundColor: '#242424', padding: { x: 12, y: 6 }
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.toggleCharacterGiant());

    this.dwarfBtn = this.add.text(panelLeft, cy + 105, 'Dwarf: Off', {
      fontFamily: 'Arial', fontSize: '13px', color: '#aaaaaa',
      backgroundColor: '#242424', padding: { x: 12, y: 6 }
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.toggleCharacterDwarf());

    // Name field.
    const nameLabel = this.add.text(panelRight, cy - 190, 'Name (0/20)', {
      fontFamily: 'Arial', fontSize: '13px', color: '#cccccc'
    }).setOrigin(0, 0.5);
    this.characterNameLabel = nameLabel;
    this.createCharacterHtmlInput();

    // Age field.
    const ageLabel = this.add.text(panelRight, cy - 138, 'Age (1-100)', {
      fontFamily: 'Arial', fontSize: '13px', color: '#cccccc'
    }).setOrigin(0, 0.5);
    this.createCharacterAgeHtmlInput();

    // Gender toggle.
    const genderLabel = this.add.text(panelRight, cy - 86, 'Gender', {
      fontFamily: 'Arial', fontSize: '13px', color: '#cccccc'
    }).setOrigin(0, 0.5);
    const genderOffStyle = { fontFamily: 'Arial', fontSize: '12px', color: '#aaaaaa', backgroundColor: '#242424', padding: { x: 10, y: 5 } };
    const genderOnStyle = { fontFamily: 'Arial', fontSize: '12px', color: '#ffffff', backgroundColor: '#3a6b3a', padding: { x: 10, y: 5 } };
    this.maleBtn = this.add.text(panelRight, cy - 66, 'Male', genderOffStyle).setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.setCharacterGender('male'));
    this.femaleBtn = this.add.text(panelRight + 55, cy - 66, 'Female', genderOffStyle).setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.setCharacterGender('female'));
    this.noGenderBtn = this.add.text(panelRight + 122, cy - 66, 'No Gender', genderOffStyle).setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.setCharacterGender('none'));
    this.genderOnStyle = genderOnStyle;
    this.genderOffStyle = genderOffStyle;

    // Hair style picker, with a tab per gender.
    const hairLabel = this.add.text(panelRight, cy - 28, 'Hair Style', {
      fontFamily: 'Arial', fontSize: '13px', color: '#cccccc'
    }).setOrigin(0, 0.5);

    this.hairTab = null;
    const tabOffStyle = { fontFamily: 'Arial', fontSize: '11px', color: '#888888', backgroundColor: '#1c1c1c', padding: { x: 9, y: 4 } };
    const tabOnStyle = { fontFamily: 'Arial', fontSize: '11px', color: '#ffffff', backgroundColor: '#3a3a6b', padding: { x: 9, y: 4 } };
    this.hairTabOnStyle = tabOnStyle;
    this.hairTabOffStyle = tabOffStyle;
    this.hairTabMaleBtn = this.add.text(panelRight, cy - 8, 'Male Styles ▸', tabOffStyle).setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.toggleHairTab('male'));
    this.hairTabFemaleBtn = this.add.text(panelRight + 90, cy - 8, 'Female Styles ▸', tabOffStyle).setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.toggleHairTab('female'));
    this.hatTabOpen = false;
    this.hatTabBtn = this.add.text(panelRight + 190, cy - 8, 'Hats ▸', tabOffStyle).setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.toggleHatTab());

    this.hairGridOrigin = { x: panelRight, y: cy + 14 };
    this.hairBtnStyleOn = { fontFamily: 'Arial', fontSize: '10px', color: '#ffffff', backgroundColor: '#3a6b3a', padding: { x: 6, y: 4 } };
    this.hairBtnStyleOff = { fontFamily: 'Arial', fontSize: '10px', color: '#aaaaaa', backgroundColor: '#242424', padding: { x: 6, y: 4 } };
    this.hairBtns = {};
    this.hairGridItems = [];
    this.rebuildHairGrid();
    this.hatBtns = {};
    this.hatGridItems = [];
    this.rebuildHatGrid();

    // Color swatches, with Skin Tone / Hair Color tabs that swap into this same slot when toggled.
    this.swatchSectionY = cy + 184;
    this.colorLabel = this.add.text(panelRight, this.swatchSectionY, 'Color', {
      fontFamily: 'Arial', fontSize: '13px', color: '#cccccc'
    }).setOrigin(0, 0.5);
    const swatchCols = 8;
    this.colorSwatches = CHARACTER_COLORS.map((color, i) => {
      const col = i % swatchCols;
      const row = Math.floor(i / swatchCols);
      const swatch = this.add.rectangle(panelRight + col * 26, this.swatchSectionY + 20 + row * 26, 20, 20, color, 1)
        .setOrigin(0, 0)
        .setStrokeStyle(1, 0x000000, 0.4)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.setCharacterColor(color));
      return { color, swatch };
    });

    // Skin tone and hair color tabs, positioned beside the Color label. Toggling one
    // hides the shirt Color swatches and shows that tab's swatches in the same slot.
    this.skinToneTabOpen = false;
    this.skinToneTabBtn = this.add.text(panelRight + 215, this.swatchSectionY, 'Skin Tone ▸', tabOffStyle).setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.toggleSkinToneTab());
    this.skinToneGridOrigin = { x: panelRight, y: this.swatchSectionY + 20 };
    this.skinToneSwatches = [];

    this.hairColorTabOpen = false;
    this.hairColorTabBtn = this.add.text(panelRight + 215, this.swatchSectionY + 26, 'Hair Color ▸', tabOffStyle).setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.toggleHairColorTab());
    this.hairColorGridOrigin = { x: panelRight, y: this.swatchSectionY + 20 };
    this.hairColorSwatches = [];

    const backBtn = this.add.text(cx - 40, cy + 234, '< Back', {
      fontFamily: 'Arial', fontSize: '14px', color: '#aaaaaa', backgroundColor: '#242424', padding: { x: 10, y: 6 }
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.saveAndExitCharacterScreen());
    this.characterBackBtn = backBtn;

    this.characterContainer.add([
      heading, this.previewSprite, previewLabel, this.giantBtn, this.dwarfBtn, nameLabel, ageLabel, genderLabel, this.maleBtn, this.femaleBtn, this.noGenderBtn,
      hairLabel, this.hairTabMaleBtn, this.hairTabFemaleBtn, this.hatTabBtn, this.colorLabel,
      ...this.colorSwatches.map(s => s.swatch),
      this.skinToneTabBtn, this.hairColorTabBtn,
      backBtn
    ]);
    this.characterContainer.setVisible(true);

    this.updateSwatchSectionVisibility();
    this.refreshCharacterUI();
    this.startPreviewWalkAnimation();
    this.repositionCharacterBottomUI();
  },

  toggleSkinToneTab() {
    this.skinToneTabOpen = !this.skinToneTabOpen;
    if (this.skinToneTabOpen) this.hairColorTabOpen = false;
    this.updateSwatchSectionVisibility();
    this.rebuildSkinToneGrid();
    this.rebuildHairColorGrid();
    this.refreshCharacterUI();
    this.repositionCharacterBottomUI();
  },

  toggleHairColorTab() {
    this.hairColorTabOpen = !this.hairColorTabOpen;
    if (this.hairColorTabOpen) this.skinToneTabOpen = false;
    this.updateSwatchSectionVisibility();
    this.rebuildSkinToneGrid();
    this.rebuildHairColorGrid();
    this.refreshCharacterUI();
    this.repositionCharacterBottomUI();
  },

  updateSwatchSectionVisibility() {
    const anyTabOpen = this.skinToneTabOpen || this.hairColorTabOpen;
    this.colorLabel.setVisible(!anyTabOpen);
    this.colorSwatches.forEach(s => s.swatch.setVisible(!anyTabOpen));
  },

  rebuildSkinToneGrid() {
    this.skinToneSwatches.forEach(s => s.swatch.destroy());
    this.skinToneSwatches = [];
    if (!this.skinToneTabOpen) return;

    const { x, y } = this.skinToneGridOrigin;
    this.skinToneSwatches = SKIN_TONES.map((color, i) => {
      const swatch = this.add.rectangle(x + i * 26, y, 20, 20, color, 1)
        .setOrigin(0, 0)
        .setStrokeStyle(1, 0x000000, 0.4)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.setCharacterSkinTone(color));
      return { color, swatch };
    });
    this.characterContainer.add(this.skinToneSwatches.map(s => s.swatch));
  },

  rebuildHairColorGrid() {
    this.hairColorSwatches.forEach(s => s.swatch.destroy());
    this.hairColorSwatches = [];
    if (!this.hairColorTabOpen) return;

    const { x, y } = this.hairColorGridOrigin;
    this.hairColorSwatches = HAIR_COLORS.map((color, i) => {
      const col = i % 8;
      const row = Math.floor(i / 8);
      const swatch = this.add.rectangle(x + col * 26, y + row * 26, 20, 20, color, 1)
        .setOrigin(0, 0)
        .setStrokeStyle(1, 0x000000, 0.4)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.setCharacterHairColor(color));
      return { color, swatch };
    });
    this.characterContainer.add(this.hairColorSwatches.map(s => s.swatch));
  },

  repositionCharacterBottomUI() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;
    const panelRight = cx + 60;

    // Tab buttons stay fixed beside the Color row; whichever tab is open swaps its
    // swatch grid into the same slot the shirt Color swatches normally occupy.
    this.skinToneTabBtn.setPosition(panelRight + 215, this.swatchSectionY);
    this.hairColorTabBtn.setPosition(panelRight + 215, this.swatchSectionY + 26);

    const y = this.swatchSectionY + 20;
    if (this.skinToneTabOpen) {
      this.skinToneGridOrigin = { x: panelRight, y };
      this.skinToneSwatches.forEach((s, i) => s.swatch.setPosition(panelRight + i * 26, y));
    } else if (this.hairColorTabOpen) {
      this.hairColorGridOrigin = { x: panelRight, y };
      this.hairColorSwatches.forEach((s, i) => {
        const col = i % 8;
        const row = Math.floor(i / 8);
        s.swatch.setPosition(panelRight + col * 26, y + row * 26);
      });
    }

    // Back button position is fixed regardless of which tab (if any) is open.
    this.characterBackBtn.setPosition(cx - 40, this.swatchSectionY + 50);
  },

  startPreviewWalkAnimation() {
    this.stopPreviewWalkAnimation();
    this.previewWalkToggle = false;
    this.previewWalkTimer = this.time.addEvent({
      delay: 220,
      loop: true,
      callback: () => {
        if (!this.previewSprite) return;
        this.previewWalkToggle = !this.previewWalkToggle;
        this.previewSprite.setTexture(this.previewWalkToggle ? 'character-preview-walk1' : 'character-preview-walk2');
      }
    });
  },

  stopPreviewWalkAnimation() {
    if (this.previewWalkTimer) {
      this.previewWalkTimer.remove();
      this.previewWalkTimer = null;
    }
  },

  toggleHairTab(tab) {
    this.hairTab = this.hairTab === tab ? null : tab;
    if (this.hairTab) this.hatTabOpen = false;
    this.rebuildHairGrid();
    this.rebuildHatGrid();
    this.refreshCharacterUI();
  },

  toggleHatTab() {
    this.hatTabOpen = !this.hatTabOpen;
    if (this.hatTabOpen) this.hairTab = null;
    this.rebuildHairGrid();
    this.rebuildHatGrid();
    this.refreshCharacterUI();
  },

  rebuildHairGrid() {
    this.hairGridItems.forEach(btn => btn.destroy());
    this.hairGridItems = [];
    this.hairBtns = {};

    if (!this.hairTab) return;

    const styles = this.hairTab === 'female' ? FEMALE_HAIR_STYLES : MALE_HAIR_STYLES;
    const { x, y } = this.hairGridOrigin;
    const cols = 3;
    const colWidth = 84;
    const rowHeight = 22;

    styles.forEach((h, i) => {
      const btn = this.add.text(x + (i % cols) * colWidth, y + Math.floor(i / cols) * rowHeight, h.label, this.hairBtnStyleOff)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.setCharacterHair(h.id));
      this.hairBtns[h.id] = btn;
      this.hairGridItems.push(btn);
    });

    this.characterContainer.add(this.hairGridItems);
  },

  rebuildHatGrid() {
    this.hatGridItems.forEach(btn => btn.destroy());
    this.hatGridItems = [];
    this.hatBtns = {};
    if (!this.hatTabOpen) return;

    const choices = [{ id: 'none', label: 'None' }, ...HAT_STYLES];
    const { x, y } = this.hairGridOrigin;
    const cols = 3;
    const colWidth = 84;
    const rowHeight = 22;
    choices.forEach((hat, i) => {
      const btn = this.add.text(x + (i % cols) * colWidth, y + Math.floor(i / cols) * rowHeight, hat.label, this.hairBtnStyleOff)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.setCharacterHat(hat.id));
      this.hatBtns[hat.id] = btn;
      this.hatGridItems.push(btn);
    });
    this.characterContainer.add(this.hatGridItems);
  },

  setCharacterGender(gender) {
    this.character.gender = gender;
    this.refreshCharacterUI();
  },

  setCharacterHair(hair) {
    this.character.hair = hair;
    this.refreshCharacterUI();
  },

  setCharacterHat(hat) {
    this.character.hat = hat;
    this.refreshCharacterUI();
  },

  setCharacterColor(color) {
    this.character.color = color;
    this.refreshCharacterUI();
  },

  setCharacterSkinTone(color) {
    this.character.skinTone = color;
    this.refreshCharacterUI();
  },

  setCharacterHairColor(color) {
    this.character.hairColor = color;
    this.refreshCharacterUI();
  },

  toggleCharacterGiant() {
    this.character.giant = !this.character.giant;
    if (this.character.giant) this.character.dwarf = false;
    this.refreshCharacterUI();
  },

  toggleCharacterDwarf() {
    this.character.dwarf = !this.character.dwarf;
    if (this.character.dwarf) this.character.giant = false;
    this.refreshCharacterUI();
  },

  refreshCharacterUI() {
    this.maleBtn.setStyle(this.character.gender === 'male' ? this.genderOnStyle : this.genderOffStyle);
    this.femaleBtn.setStyle(this.character.gender === 'female' ? this.genderOnStyle : this.genderOffStyle);
    this.noGenderBtn.setStyle(this.character.gender === 'none' ? this.genderOnStyle : this.genderOffStyle);

    this.hairTabMaleBtn.setStyle(this.hairTab === 'male' ? this.hairTabOnStyle : this.hairTabOffStyle);
    this.hairTabFemaleBtn.setStyle(this.hairTab === 'female' ? this.hairTabOnStyle : this.hairTabOffStyle);
    this.hatTabBtn.setStyle(this.hatTabOpen ? this.hairTabOnStyle : this.hairTabOffStyle);
    this.hatTabBtn.setText(this.hatTabOpen ? 'Hats ▾' : 'Hats ▸');

    this.skinToneTabBtn.setStyle(this.skinToneTabOpen ? this.hairTabOnStyle : this.hairTabOffStyle);
    this.skinToneTabBtn.setText(this.skinToneTabOpen ? 'Skin Tone ▾' : 'Skin Tone ▸');
    this.hairColorTabBtn.setStyle(this.hairColorTabOpen ? this.hairTabOnStyle : this.hairTabOffStyle);
    this.hairColorTabBtn.setText(this.hairColorTabOpen ? 'Hair Color ▾' : 'Hair Color ▸');

    Object.entries(this.hairBtns).forEach(([id, btn]) => {
      btn.setStyle(this.character.hair === id ? this.hairBtnStyleOn : this.hairBtnStyleOff);
    });
    Object.entries(this.hatBtns).forEach(([id, btn]) => {
      btn.setStyle(this.character.hat === id ? this.hairBtnStyleOn : this.hairBtnStyleOff);
    });

    this.colorSwatches.forEach(({ color, swatch }) => {
      swatch.setStrokeStyle(this.character.color === color ? 3 : 1, this.character.color === color ? 0xffe066 : 0x000000, this.character.color === color ? 1 : 0.4);
    });

    this.skinToneSwatches.forEach(({ color, swatch }) => {
      swatch.setStrokeStyle(this.character.skinTone === color ? 3 : 1, this.character.skinTone === color ? 0xffe066 : 0x000000, this.character.skinTone === color ? 1 : 0.4);
    });

    this.hairColorSwatches.forEach(({ color, swatch }) => {
      swatch.setStrokeStyle(this.character.hairColor === color ? 3 : 1, this.character.hairColor === color ? 0xffe066 : 0x000000, this.character.hairColor === color ? 1 : 0.4);
    });

    this.generateCharacterPreviewTexture();
    this.previewSprite.setTexture('character-preview');
    const normalPreviewScale = 3 * ageToScale(this.character.age);
    this.previewSprite.setScale(this.character.giant ? 7.5 : this.character.dwarf ? normalPreviewScale / 3 : normalPreviewScale);
    this.previewSprite.setPosition(this.previewSprite.x, this.scale.height / 2 - 40);
    this.previewLabel.setPosition(this.previewLabel.x, this.scale.height / 2 + (this.character.giant ? 120 : 40));
    this.giantBtn.setPosition(this.giantBtn.x, this.scale.height / 2 + (this.character.giant ? 155 : 70));
    this.giantBtn.setText(this.character.giant ? 'Giant: On' : 'Giant: Off');
    this.giantBtn.setStyle(this.character.giant ? this.genderOnStyle : this.genderOffStyle);
    this.dwarfBtn.setPosition(this.dwarfBtn.x, this.scale.height / 2 + (this.character.giant ? 190 : 105));
    this.dwarfBtn.setText(this.character.dwarf ? 'Dwarf: On' : 'Dwarf: Off');
    this.dwarfBtn.setStyle(this.character.dwarf ? this.genderOnStyle : this.genderOffStyle);

    const name = this.characterHtmlInput ? this.characterHtmlInput.value.trim() : this.character.name;
    this.previewLabel.setText(name || 'Player');
    if (this.characterNameLabel) {
      const length = this.characterHtmlInput ? this.characterHtmlInput.value.length : (this.character.name || '').length;
      this.characterNameLabel.setText(`Name (${Math.min(length, 20)}/20)`);
    }
  },

  generateCharacterPreviewTexture() {
    this.drawCharacterPreviewFrame('character-preview', 0);
    this.drawCharacterPreviewFrame('character-preview-walk1', -4);
    this.drawCharacterPreviewFrame('character-preview-walk2', 4);
  },

  drawCharacterPreviewFrame(key, legOffset) {
    if (this.textures.exists(key)) {
      this.textures.remove(key);
    }

    const size = 40;
    const g = this.add.graphics();
    const cx = size / 2;

    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, size - 4, size * 0.5, size * 0.16);

    // Legs, drawn under the torso so the hem/shirt overlaps the tops.
    // Each leg is a hinged quad: top stays fixed at the hip, bottom (foot) swings by
    // legOffset, so the leg pivots like a real stride instead of sliding as a rigid block.
    // Female legs are narrower and set closer together to fit the tapered hem.
    const hipY = size * 0.62;
    const footY = size - 2;
    const isFemale = this.character.gender === 'female';
    const legW = isFemale ? 4 : 5;
    const legInsetLeft = isFemale ? cx - 6 : cx - 7;
    const legInsetRight = cx + 2;
    const skinTone = this.character.skinTone || 0xe8b98a;
    g.fillStyle(skinTone, 1);
    [-1, 1].forEach(side => {
      const hipLeft = side < 0 ? legInsetLeft : legInsetRight;
      const footShift = side < 0 ? legOffset : -legOffset;
      g.beginPath();
      g.moveTo(hipLeft, hipY);
      g.lineTo(hipLeft + legW, hipY);
      g.lineTo(hipLeft + legW + footShift, footY);
      g.lineTo(hipLeft + footShift, footY);
      g.closePath();
      g.fillPath();
    });
    g.fillStyle(0x5a3a20, 1);
    g.fillRoundedRect(legInsetLeft + legOffset, size - 6, legW, 4, 1.5);
    g.fillRoundedRect(legInsetRight - legOffset, size - 6, legW, 4, 1.5);

    g.fillStyle(this.character.color, 1);
    if (this.character.gender === 'female') {
      const top = size * 0.42, bodyH = 16, shoulderW = 15, waistW = 11, hemW = 17;
      g.beginPath();
      g.moveTo(cx - shoulderW / 2, top);
      g.lineTo(cx + shoulderW / 2, top);
      g.lineTo(cx + waistW / 2, top + bodyH * 0.55);
      g.lineTo(cx + hemW / 2, top + bodyH);
      g.lineTo(cx - hemW / 2, top + bodyH);
      g.lineTo(cx - waistW / 2, top + bodyH * 0.55);
      g.closePath();
      g.fillPath();
    } else {
      g.fillRoundedRect(cx - 10, size * 0.42, 20, 16, 3);
    }

    g.fillStyle(skinTone, 1);
    g.fillCircle(cx, size * 0.36, 10);

    drawHairShape(g, this.character.hair, cx, size, this.character.hairColor);
    drawHatShape(g, this.character.hat, cx, size);

    g.fillStyle(0x2a2a2e, 1);
    g.fillCircle(cx - 3.5, size * 0.41, 1.6);
    g.fillCircle(cx + 3.5, size * 0.41, 1.6);

    g.generateTexture(key, size, size);
    g.destroy();
  },

  createCharacterHtmlInput() {
    this.destroyCharacterHtmlInput();

    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 20;
    input.placeholder = 'Player';
    input.value = (this.character.name || '').slice(0, 20);
    input.style.position = 'absolute';
    input.style.fontSize = '14px';
    input.style.padding = '5px 8px';
    input.style.width = '160px';
    input.style.border = '1px solid #555';
    input.style.borderRadius = '4px';
    input.style.backgroundColor = '#242424';
    input.style.color = '#ffffff';
    input.style.outline = 'none';
    input.style.zIndex = '10';

    input.addEventListener('keydown', (e) => e.stopPropagation());
    input.addEventListener('input', () => this.refreshCharacterUI());

    document.body.appendChild(input);
    this.characterHtmlInput = input;
    this.positionCharacterHtmlInput();
    input.focus();
  },

  positionCharacterHtmlInput() {
    if (!this.characterHtmlInput) return;
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;
    const panelRight = cx + 60;

    const scaleX = rect.width / width;
    const scaleY = rect.height / height;

    this.characterHtmlInput.style.left = `${rect.left + (panelRight - 10) * scaleX}px`;
    this.characterHtmlInput.style.top = `${rect.top + (cy - 190 + 14) * scaleY}px`;
  },

  destroyCharacterHtmlInput() {
    if (this.characterHtmlInput) {
      this.characterHtmlInput.remove();
      this.characterHtmlInput = null;
    }
    this.destroyCharacterAgeHtmlInput();
  },

  createCharacterAgeHtmlInput() {
    this.destroyCharacterAgeHtmlInput();

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.max = '100';
    input.placeholder = '25';
    input.value = this.character.age || 25;
    input.style.position = 'absolute';
    input.style.fontSize = '14px';
    input.style.padding = '5px 8px';
    input.style.width = '70px';
    input.style.border = '1px solid #555';
    input.style.borderRadius = '4px';
    input.style.backgroundColor = '#242424';
    input.style.color = '#ffffff';
    input.style.outline = 'none';
    input.style.zIndex = '10';

    input.addEventListener('keydown', (e) => e.stopPropagation());
    input.addEventListener('input', () => {
      const clamped = Phaser.Math.Clamp(parseInt(input.value, 10) || 1, 1, 100);
      this.character.age = clamped;
      this.refreshCharacterUI();
    });

    document.body.appendChild(input);
    this.characterAgeHtmlInput = input;
    this.positionCharacterAgeHtmlInput();
  },

  positionCharacterAgeHtmlInput() {
    if (!this.characterAgeHtmlInput) return;
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;
    const panelRight = cx + 60;

    const scaleX = rect.width / width;
    const scaleY = rect.height / height;

    this.characterAgeHtmlInput.style.left = `${rect.left + (panelRight - 10) * scaleX}px`;
    this.characterAgeHtmlInput.style.top = `${rect.top + (cy - 138 + 14) * scaleY}px`;
  },

  destroyCharacterAgeHtmlInput() {
    if (this.characterAgeHtmlInput) {
      this.characterAgeHtmlInput.remove();
      this.characterAgeHtmlInput = null;
    }
  },

  saveAndExitCharacterScreen() {
    if (this.characterHtmlInput) {
      this.character.name = this.characterHtmlInput.value.trim().slice(0, 20) || 'Player';
    }
    if (this.characterAgeHtmlInput) {
      this.character.age = Phaser.Math.Clamp(parseInt(this.characterAgeHtmlInput.value, 10) || 25, 1, 100);
    }
    saveCharacter(this.character);
    this.destroyCharacterHtmlInput();
    this.stopPreviewWalkAnimation();
    this.showStart();
  },
};
