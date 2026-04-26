class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this._difficulty = 'medium'; // default

    // Background
    this.add.image(W / 2, H / 2, 'introBg').setDisplaySize(W, H).setDepth(0);

    // ── Logo ────────────────────────────────────────────────────────────────
    const logoShadow = this.add.text(W / 2 + 4, 74, 'TACO WORLD', {
      fontSize: '68px', fontFamily: 'Arial Black, Impact, Arial',
      fill: '#8B4513', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(1);

    const logo = this.add.text(W / 2, 70, 'TACO WORLD', {
      fontSize: '68px', fontFamily: 'Arial Black, Impact, Arial',
      fill: '#FFD700', stroke: '#FF6347', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(1);

    this.add.text(W / 2, 142, '🌮  The Ultimate Taco Fighting Experience  🌮', {
      fontSize: '18px', fontFamily: 'Arial', fill: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1);

    this.tweens.add({
      targets: [logo, logoShadow],
      y: '-=10', duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // ── Mode buttons ────────────────────────────────────────────────────────
    this._makeBtn(W / 2 - 155, 228, '1 PLAYER',  0xFF6347, 0xFFD700, () => this._start('1P'));
    this._makeBtn(W / 2 + 155, 228, '2 PLAYERS', 0x2980b9, 0xFFD700, () => this._start('2P'));
    this._makePracticeBtn(W / 2, 272);

    // ── Flow description ────────────────────────────────────────────────────
    const flowLines = [
      '1P — Beat Taco Girl to face the Giant Taco Boss!',
      '2P — Best of 2 rounds, winner fights the Boss!',
    ];
    flowLines.forEach((line, i) => {
      this.add.text(W / 2, 305 + i * 24, line, {
        fontSize: '14px', fontFamily: 'Arial Black, Arial',
        fill: '#ffffff', stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(1);
    });

    // ── Difficulty selector ─────────────────────────────────────────────────
    this.add.text(W / 2, 367, 'DIFFICULTY', {
      fontSize: '16px', fontFamily: 'Arial Black, Arial',
      fill: '#FFD700', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1);

    const diffLevels = [
      { key: 'easy',   label: 'EASY',   x: W / 2 - 160, color: 0x27ae60, glow: 0x2ecc71 },
      { key: 'medium', label: 'MEDIUM', x: W / 2,       color: 0xe67e22, glow: 0xf39c12 },
      { key: 'hard',   label: 'HARD',   x: W / 2 + 160, color: 0xc0392b, glow: 0xe74c3c },
    ];

    this._diffBtns = [];
    diffLevels.forEach(d => {
      const bg = this.add.rectangle(d.x, 405, 140, 46, d.color)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(3, 0xffffff)
        .setDepth(1);

      const txt = this.add.text(d.x, 405, d.label, {
        fontSize: '18px', fontFamily: 'Arial Black, Arial',
        fill: '#ffffff', stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(2);

      bg.on('pointerdown', () => this._selectDifficulty(d.key));
      bg.on('pointerover',  () => bg.setStrokeStyle(3, d.glow));
      bg.on('pointerout',   () => this._refreshDiffVisuals());

      this._diffBtns.push({ key: d.key, bg, txt, glow: d.glow });
    });

    this._refreshDiffVisuals();

    // ── Tip ─────────────────────────────────────────────────────────────────
    this.add.text(W / 2, H - 55, 'Collect power-ups during battle for bonus damage & speed!', {
      fontSize: '13px', fontFamily: 'Arial',
      fill: '#ffffff', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(1);

    // ── Floating deco ────────────────────────────────────────────────────────
    this._addDeco(80,  200, 0xF4A460, 30);
    this._addDeco(944, 200, 0xFF69B4, 30);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  _selectDifficulty(key) {
    this._difficulty = key;
    this._refreshDiffVisuals();
  }

  _refreshDiffVisuals() {
    if (!this._diffBtns) return;
    this._diffBtns.forEach(d => {
      const selected = d.key === this._difficulty;
      d.bg.setStrokeStyle(selected ? 5 : 2, selected ? 0xFFD700 : 0xffffff);
      d.bg.setAlpha(selected ? 1 : 0.65);
      d.txt.setScale(selected ? 1.1 : 1);
    });
  }

  _start(mode) {
    this.scene.start('FightScene', {
      mode,
      difficulty:   this._difficulty,
      roundNumber:  1,
      p1Wins:       0,
      p2Wins:       0,
      isBossRound:  false,
      isTiebreaker: false,
    });
  }

  _makePracticeBtn(x, y) {
    const bg = this.add.rectangle(x, y, 200, 40, 0x27ae60)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(3, 0xFFD700)
      .setDepth(1);

    const txt = this.add.text(x, y, 'PRACTICE', {
      fontSize: '17px', fontFamily: 'Arial Black, Arial',
      fill: '#ffffff', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(2);

    bg.on('pointerover',  () => { bg.setAlpha(0.85); txt.setScale(1.05); });
    bg.on('pointerout',   () => { bg.setAlpha(1);    txt.setScale(1);    });
    bg.on('pointerdown',  () => {
      this.scene.start('FightScene', {
        mode: 'PRACTICE', difficulty: 'practice',
        roundNumber: 1, p1Wins: 0, p2Wins: 0,
        isBossRound: false, isTiebreaker: false,
      });
    });

    // Small label underneath
    this.add.text(x, y + 24, 'Speed boost  •  Weak enemies  •  25 hits', {
      fontSize: '10px', fontFamily: 'Arial',
      fill: '#aaffaa', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(2);
  }

  _makeBtn(x, y, label, fillColor, strokeColor, onClick) {
    const bg = this.add.rectangle(x, y, 230, 62, fillColor)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(4, strokeColor)
      .setDepth(1);

    const txt = this.add.text(x, y, label, {
      fontSize: '24px', fontFamily: 'Arial Black, Arial',
      fill: '#ffffff', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(2);

    bg.on('pointerover',  () => { bg.setAlpha(0.85); txt.setScale(1.06); });
    bg.on('pointerout',   () => { bg.setAlpha(1);    txt.setScale(1);    });
    bg.on('pointerdown',  onClick);

    this.tweens.add({
      targets: [bg, txt],
      scaleX: 1.03, scaleY: 1.03,
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  _addDeco(x, y, color, r) {
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(color, 0.3);
    g.fillCircle(x, y, r);
    this.tweens.add({
      targets: g, y: '-=14',
      duration: 1400 + Math.random() * 600,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }
}
