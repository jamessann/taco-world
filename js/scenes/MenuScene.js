class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Sky gradient backdrop
    this.add.rectangle(W / 2, H / 2, W, H, 0x87CEEB);
    // Ground strip
    this.add.rectangle(W / 2, H - 30, W, 60, 0x4CAF50);
    // Sub-ground
    this.add.rectangle(W / 2, H - 4, W, 8, 0x388E3C);

    // Floating decorative tacos (just colored circles as stand-ins)
    this._addDeco(160, 200, 0xF4A460, 40);
    this._addDeco(864, 200, 0xFF69B4, 40);
    this._addDeco(512, 440, 0xFF6347, 55);

    // Game logo
    const logoShadow = this.add.text(W / 2 + 4, 104, 'TACO WORLD', {
      fontSize: '72px',
      fontFamily: 'Arial Black, Impact, Arial',
      fill: '#8B4513',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    const logo = this.add.text(W / 2, 100, 'TACO WORLD', {
      fontSize: '72px',
      fontFamily: 'Arial Black, Impact, Arial',
      fill: '#FFD700',
      stroke: '#FF6347',
      strokeThickness: 8
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(W / 2, 168, '🌮  The Ultimate Taco Fighting Experience  🌮', {
      fontSize: '20px',
      fontFamily: 'Arial',
      fill: '#2c3e50'
    }).setOrigin(0.5);

    // Controls legend
    const legend = [
      'Player 1 (Taco Boy)    A / D = Move   W = Jump   F = Light   G = Heavy   S = Block',
      'Player 2 (Taco Girl)   ← / → = Move   ↑ = Jump   K = Light   L = Heavy   ↓ = Block'
    ];
    legend.forEach((line, i) => {
      this.add.text(W / 2, 460 + i * 28, line, {
        fontSize: '14px',
        fontFamily: 'Arial',
        fill: '#1a1a2e',
        backgroundColor: '#ffffff88',
        padding: { x: 10, y: 4 }
      }).setOrigin(0.5);
    });

    this.add.text(W / 2, 410, 'Round 3 = Boss Fight vs Giant Taco!', {
      fontSize: '16px',
      fontFamily: 'Arial Black, Arial',
      fill: '#FF6347',
      stroke: '#ffffff',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Start button
    const btnBg = this.add.rectangle(W / 2, 280, 260, 64, 0xFF6347)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(4, 0xFFD700);

    const btnText = this.add.text(W / 2, 280, 'START GAME', {
      fontSize: '28px',
      fontFamily: 'Arial Black, Arial',
      fill: '#ffffff',
      stroke: '#8B0000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Button hover
    btnBg.on('pointerover',  () => { btnBg.setFillStyle(0xFF4500); btnText.setScale(1.05); });
    btnBg.on('pointerout',   () => { btnBg.setFillStyle(0xFF6347); btnText.setScale(1); });
    btnBg.on('pointerdown',  () => { this.scene.start('FightScene', { roundNumber: 1, p1Wins: 0, p2Wins: 0 }); });

    // Also start with SPACE or ENTER
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('FightScene', { roundNumber: 1, p1Wins: 0, p2Wins: 0 });
    });
    this.input.keyboard.once('keydown-ENTER', () => {
      this.scene.start('FightScene', { roundNumber: 1, p1Wins: 0, p2Wins: 0 });
    });

    // Pulse the button
    this.tweens.add({
      targets: [btnBg, btnText],
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Logo bounce
    this.tweens.add({
      targets: [logo, logoShadow],
      y: '-=12',
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  _addDeco(x, y, color, r) {
    const g = this.add.graphics();
    g.fillStyle(color, 0.35);
    g.fillCircle(x, y, r);
    g.fillStyle(color, 0.15);
    g.fillCircle(x, y, r + 12);
    this.tweens.add({
      targets: g,
      y: '-=18',
      duration: 1400 + Math.random() * 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
}
