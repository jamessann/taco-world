class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Stage background image
    this.add.image(W / 2, H / 2, 'introBg').setDisplaySize(W, H).setDepth(0);

    // Floating decorative characters
    this._addDeco(160, 200, 0xF4A460, 40);
    this._addDeco(864, 200, 0xFF69B4, 40);
    this._addDeco(512, 440, 0xFF6347, 55);

    // ── Logo ────────────────────────────────────────────────────────────────
    const logoShadow = this.add.text(W / 2 + 4, 84, 'TACO WORLD', {
      fontSize: '72px', fontFamily: 'Arial Black, Impact, Arial',
      fill: '#8B4513', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    const logo = this.add.text(W / 2, 80, 'TACO WORLD', {
      fontSize: '72px', fontFamily: 'Arial Black, Impact, Arial',
      fill: '#FFD700', stroke: '#FF6347', strokeThickness: 8,
    }).setOrigin(0.5);

    this.add.text(W / 2, 152, '🌮  The Ultimate Taco Fighting Experience  🌮', {
      fontSize: '20px', fontFamily: 'Arial', fill: '#2c3e50',
    }).setOrigin(0.5);

    // Logo bounce
    this.tweens.add({
      targets: [logo, logoShadow],
      y: '-=12', duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // ── Mode buttons ────────────────────────────────────────────────────────
    this._makeBtn(W / 2 - 160, 268, '1 PLAYER',  0xFF6347, 0xFFD700, () => this._start('1P'));
    this._makeBtn(W / 2 + 160, 268, '2 PLAYERS', 0x2980b9, 0xFFD700, () => this._start('2P'));

    // ── Flow description ────────────────────────────────────────────────────
    const flowLines = [
      '1P — Beat Taco Girl to face the Giant Taco Boss!',
      '2P — Best of 2 rounds, winner fights the Giant Taco Boss!',
    ];
    flowLines.forEach((line, i) => {
      this.add.text(W / 2, 342 + i * 24, line, {
        fontSize: '14px', fontFamily: 'Arial',
        fill: '#1a1a2e', backgroundColor: '#ffffff88', padding: { x: 10, y: 3 },
      }).setOrigin(0.5);
    });

    // ── Controls legend ─────────────────────────────────────────────────────
    const legend = [
      'Player 1 (Taco Boy)    A / D = Move   W = Jump   F = Light   G = Heavy   S = Block',
      'Player 2 (Taco Girl)   ← / → = Move   ↑ = Jump   K = Light   L = Heavy   ↓ = Block',
    ];
    legend.forEach((line, i) => {
      this.add.text(W / 2, 432 + i * 26, line, {
        fontSize: '13px', fontFamily: 'Arial',
        fill: '#1a1a2e', backgroundColor: '#ffffff88', padding: { x: 10, y: 4 },
      }).setOrigin(0.5);
    });

    // Keyboard shortcut hints
    this.add.text(W / 2, 500, 'Press  1  for 1 Player  ·  Press  2  for 2 Players', {
      fontSize: '13px', fontFamily: 'Arial', fill: '#555555',
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown-ONE', () => this._start('1P'));
    this.input.keyboard.once('keydown-TWO', () => this._start('2P'));
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  _start(mode) {
    this.scene.start('FightScene', {
      mode, roundNumber: 1, p1Wins: 0, p2Wins: 0,
      isBossRound: false, isTiebreaker: false,
    });
  }

  _makeBtn(x, y, label, fillColor, strokeColor, onClick) {
    const bg = this.add.rectangle(x, y, 240, 64, fillColor)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(4, strokeColor);

    const txt = this.add.text(x, y, label, {
      fontSize: '26px', fontFamily: 'Arial Black, Arial',
      fill: '#ffffff', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    bg.on('pointerover',  () => { bg.setAlpha(0.85); txt.setScale(1.06); });
    bg.on('pointerout',   () => { bg.setAlpha(1);    txt.setScale(1);    });
    bg.on('pointerdown',  onClick);

    this.tweens.add({
      targets: [bg, txt],
      scaleX: 1.04, scaleY: 1.04,
      duration: 750, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  _addDeco(x, y, color, r) {
    const g = this.add.graphics();
    g.fillStyle(color, 0.35);
    g.fillCircle(x, y, r);
    g.fillStyle(color, 0.15);
    g.fillCircle(x, y, r + 12);
    this.tweens.add({
      targets: g, y: '-=18',
      duration: 1400 + Math.random() * 600,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }
}
