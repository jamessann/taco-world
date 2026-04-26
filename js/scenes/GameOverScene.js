class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.winnerName       = data.winnerName       || 'Player 1';
    this.winnerColor      = data.winnerColor      || 0xF4A460;
    this.p1Wins           = data.p1Wins           || 0;
    this.p2Wins           = data.p2Wins           || 0;
    this.victoryTextureKey = data.victoryTextureKey || null;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Music / SFX ──────────────────────────────────────────────────────────
    this.sound.stopAll();
    if (this.cache.audio.exists('sfx_crowd_cheer')) {
      this.sound.play('sfx_crowd_cheer', { volume: 0.65 });
    }

    // Stage background
    if (this.textures.exists('gameOverBg')) {
      this.add.image(W / 2, H / 2, 'gameOverBg').setDisplaySize(W, H);
    } else {
      this.add.rectangle(W / 2, H / 2, W, H, 0x0d0d1a); // fallback
    }

    // Spotlight ring under winner
    const spotlight = this.add.graphics();
    spotlight.fillStyle(this.winnerColor, 0.12);
    spotlight.fillEllipse(W / 2, H / 2 + 60, 320, 180);
    spotlight.fillStyle(this.winnerColor, 0.07);
    spotlight.fillEllipse(W / 2, H / 2 + 60, 500, 260);

    // ── Winner figure (sprite if available, coloured rect otherwise) ──────────
    const figureW = 180;
    const figureH = 180;
    const figureX = W / 2;
    const figureY = H / 2 + 20;

    const useSprite = this.victoryTextureKey && this.textures.exists(this.victoryTextureKey);

    let winnerFigure;
    if (useSprite) {
      winnerFigure = this.add.image(figureX, figureY, this.victoryTextureKey)
        .setDisplaySize(figureW, figureH)
        .setDepth(5);
    } else {
      winnerFigure = this.add.rectangle(figureX, figureY, figureW, figureH, this.winnerColor)
        .setDepth(5)
        .setStrokeStyle(4, 0xffffff);
      // Name label only on the placeholder rect
      this.add.text(figureX, figureY, this.winnerName.split(' ').join('\n'), {
        fontSize: '13px', fontFamily: 'Arial Black, Arial',
        fill: '#ffffff', stroke: '#000000', strokeThickness: 3,
        align: 'center'
      }).setOrigin(0.5).setDepth(6);
    }

    // Victory bounce animation
    this.tweens.add({
      targets: winnerFigure,
      y: figureY - 60,
      duration: 380,
      ease: 'Power2',
      yoyo: true,
      repeat: -1
    });

    // Shadow that squishes under the figure
    const shadow = this.add.ellipse(figureX, figureY + figureH / 2 + 8, 100, 20, 0x000000, 0.4)
      .setDepth(4);
    this.tweens.add({
      targets: shadow,
      scaleX: 0.5,
      alpha: 0.15,
      duration: 380,
      ease: 'Power2',
      yoyo: true,
      repeat: -1
    });

    // ── Title ────────────────────────────────────────────────────────────────
    const title = this.add.text(W / 2, 80, 'TACO WORLD', {
      fontSize: '42px', fontFamily: 'Arial Black, Arial',
      fill: '#FFD700', stroke: '#FF6347', strokeThickness: 7
    }).setOrigin(0.5).setDepth(10);

    // ── Winner announcement ───────────────────────────────────────────────────
    const banner = this.add.text(W / 2, 150, `${this.winnerName}`, {
      fontSize: '52px', fontFamily: 'Arial Black, Arial',
      fill: '#ffffff', stroke: '#000000', strokeThickness: 8
    }).setOrigin(0.5).setDepth(10).setScale(0.1);

    const wins = this.add.text(W / 2, 210, 'WINS!', {
      fontSize: '44px', fontFamily: 'Arial Black, Impact, Arial',
      fill: '#FFD700', stroke: '#8B0000', strokeThickness: 6
    }).setOrigin(0.5).setDepth(10).setScale(0.1);

    // Pop in
    this.tweens.add({ targets: banner, scaleX: 1, scaleY: 1, duration: 350, ease: 'Back.easeOut' });
    this.tweens.add({ targets: wins,   scaleX: 1, scaleY: 1, duration: 350, ease: 'Back.easeOut', delay: 200 });

    // Burst confetti from centre once the announcement lands
    this.time.delayedCall(420, () => this._burstConfetti(W / 2, H / 2 - 10));

    // Colour pulse on winner text
    this.tweens.addCounter({
      from: 0, to: 1, duration: 900, yoyo: true, repeat: -1,
      onUpdate: (tween) => {
        const t = tween.getValue();
        const r = Phaser.Math.Linear(255, (this.winnerColor >> 16) & 0xff, t);
        const g = Phaser.Math.Linear(255, (this.winnerColor >> 8)  & 0xff, t);
        const b = Phaser.Math.Linear(255,  this.winnerColor        & 0xff, t);
        banner.setFill(Phaser.Display.Color.RGBToString(~~r, ~~g, ~~b));
      }
    });

    // ── Score recap ──────────────────────────────────────────────────────────
    this.add.text(W / 2, H - 170, `Score  Taco Boy ${this.p1Wins} – ${this.p2Wins} Taco Girl / Boss`, {
      fontSize: '17px', fontFamily: 'Arial',
      fill: '#aaaaaa', stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(10);

    // ── Particle stars ───────────────────────────────────────────────────────
    this._spawnConfetti();

    // ── Play Again button ─────────────────────────────────────────────────────
    const btnBg = this.add.rectangle(W / 2, H - 90, 260, 60, 0xFF6347)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(4, 0xFFD700)
      .setDepth(10);

    const btnText = this.add.text(W / 2, H - 90, 'PLAY AGAIN', {
      fontSize: '26px', fontFamily: 'Arial Black, Arial',
      fill: '#ffffff', stroke: '#8B0000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(11);

    btnBg.on('pointerover',  () => { btnBg.setFillStyle(0xFF4500); btnText.setScale(1.06); });
    btnBg.on('pointerout',   () => { btnBg.setFillStyle(0xFF6347); btnText.setScale(1); });
    btnBg.on('pointerdown',  () => { this.scene.start('MenuScene'); });

    // Touch-only — no keyboard listeners

    this.tweens.add({
      targets: [btnBg, btnText],
      scaleX: 1.04, scaleY: 1.04,
      duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Press any key hint
    this.add.text(W / 2, H - 38, 'Tap PLAY AGAIN to continue', {
      fontSize: '13px', fontFamily: 'Arial',
      fill: '#777777'
    }).setOrigin(0.5).setDepth(10);

    // ── Sound toggle ─────────────────────────────────────────────────────────
    this._addSoundToggle();
  }

  _addSoundToggle() {
    if (window._tacoMuted === undefined) window._tacoMuted = false;
    this.sound.mute = window._tacoMuted;

    const x = this.scale.width  - 44;
    const y = this.scale.height - 26;

    const bg = this.add.rectangle(x, y, 76, 28, 0x000000, 0.65)
      .setStrokeStyle(1, 0x555555)
      .setDepth(200)
      .setInteractive({ useHandCursor: true });

    const lbl = this.add.text(x, y, window._tacoMuted ? '🔇 OFF' : '🔊 ON', {
      fontSize: '13px', fontFamily: 'Arial',
      fill: window._tacoMuted ? '#888888' : '#ffffff',
    }).setOrigin(0.5).setDepth(201);

    bg.on('pointerdown', () => {
      window._tacoMuted = !window._tacoMuted;
      this.sound.mute   = window._tacoMuted;
      lbl.setText(window._tacoMuted ? '🔇 OFF' : '🔊 ON');
      lbl.setFill(window._tacoMuted ? '#888888' : '#ffffff');
    });
    bg.on('pointerover', () => bg.setFillStyle(0x333333, 0.85));
    bg.on('pointerout',  () => bg.setFillStyle(0x000000, 0.65));
  }

  // Explosive burst of confetti radiating from (cx, cy) — one-shot, fades out
  _burstConfetti(cx, cy) {
    const colors = [0xFFD700, 0xFF6347, 0xFF69B4, 0xF4A460, 0x87CEEB, 0x2ecc71, 0xffffff];

    for (let i = 0; i < 55; i++) {
      const angle  = Phaser.Math.Between(0, 360);
      const speed  = Phaser.Math.Between(120, 420);
      const rad    = Phaser.Math.DegToRad(angle);
      const destX  = cx + Math.cos(rad) * speed;
      const destY  = cy + Math.sin(rad) * speed;
      const size   = Phaser.Math.Between(5, 14);
      const col    = Phaser.Utils.Array.GetRandom(colors);
      const dur    = Phaser.Math.Between(700, 1800);

      const rect = this.add.rectangle(cx, cy, size, Math.round(size * 0.55), col, 1)
        .setAngle(angle)
        .setDepth(35);

      this.tweens.add({
        targets:  rect,
        x:        destX,
        y:        destY + Phaser.Math.Between(40, 120), // arc downward under gravity feel
        angle:    angle + Phaser.Math.Between(-540, 540),
        alpha:    0,
        duration: dur,
        delay:    Phaser.Math.Between(0, 180),
        ease:     'Power2',
        onComplete: () => rect.destroy(),
      });
    }
  }

  _spawnConfetti() {
    const W = this.scale.width;
    const colors = [0xFFD700, 0xFF6347, 0xFF69B4, 0xF4A460, 0x87CEEB, 0x2ecc71, 0xffffff];

    for (let i = 0; i < 40; i++) {
      const x    = Phaser.Math.Between(0, W);
      const y    = Phaser.Math.Between(-50, -10);
      const size = Phaser.Math.Between(5, 13);
      const col  = Phaser.Utils.Array.GetRandom(colors);
      const rect = this.add.rectangle(x, y, size, size, col, 0.9)
        .setAngle(Phaser.Math.Between(0, 360))
        .setDepth(30);

      this.tweens.add({
        targets: rect,
        y: Phaser.Math.Between(600, 700),
        x: x + Phaser.Math.Between(-80, 80),
        angle: rect.angle + Phaser.Math.Between(-360, 360),
        alpha: 0,
        duration: Phaser.Math.Between(2000, 4500),
        delay: Phaser.Math.Between(0, 2000),
        ease: 'Linear',
        repeat: -1,
        onRepeat: (tween) => {
          tween.targets[0].setPosition(Phaser.Math.Between(0, W), Phaser.Math.Between(-50, -10));
          tween.targets[0].setAlpha(0.9);
        }
      });
    }
  }
}
