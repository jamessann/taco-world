class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this._difficulty = 'medium'; // default

    // ── Music ────────────────────────────────────────────────────────────────
    this.sound.stopAll();
    this.sound.play('music_menu', { loop: true, volume: 0.35 });

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

    // ── Falling confetti ─────────────────────────────────────────────────────
    this._startConfetti();

    // ── Sound toggle ─────────────────────────────────────────────────────────
    this._addSoundToggle();
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  _addSoundToggle() {
    // Sync Phaser mute with our persistent flag
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
    bg.on('pointerdown',  () => this._showPracticeEnemySelect());

    this.add.text(x, y + 24, 'Speed boost  •  Weak enemies  •  25 hits', {
      fontSize: '10px', fontFamily: 'Arial',
      fill: '#aaffaa', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(2);
  }

  _showPracticeEnemySelect() {
    const W = this.scale.width;
    const H = this.scale.height;
    const els = []; // collect all objects for cleanup

    const destroy = () => els.forEach(o => { if (o && o.destroy) o.destroy(); });

    // Dark backdrop (also acts as a click-outside cancel)
    const backdrop = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.78)
      .setDepth(30).setInteractive();
    els.push(backdrop);

    // Panel
    const panel = this.add.rectangle(W / 2, H / 2 + 10, 680, 300, 0x12122a)
      .setStrokeStyle(3, 0x27ae60).setDepth(31);
    els.push(panel);

    // Title
    els.push(this.add.text(W / 2, H / 2 - 120, 'PRACTICE — Choose Your Opponent', {
      fontSize: '22px', fontFamily: 'Arial Black, Arial',
      fill: '#27ae60', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(32));

    // Enemy cards
    const cards = [
      {
        label: 'TACO GIRL',
        sub:   'Classic sparring partner',
        color: 0xcc3399,
        x:     W / 2 - 215,
        data:  { isBossRound: false, isSuperBossRound: false },
      },
      {
        label: 'TACO BOSS',
        sub:   'Giant Taco, weak mode',
        color: 0xcc4400,
        x:     W / 2,
        data:  { isBossRound: true, bossChallenger: 'P1', isSuperBossRound: false },
      },
      {
        label: 'SUPER TACO BOSS',
        sub:   'Bigger  •  No enrage',
        color: 0x770000,
        x:     W / 2 + 215,
        data:  { isBossRound: true, bossChallenger: 'P1', isSuperBossRound: true },
      },
    ];

    cards.forEach(card => {
      const cardBg = this.add.rectangle(card.x, H / 2 + 20, 190, 130, card.color)
        .setStrokeStyle(3, 0xffffff)
        .setInteractive({ useHandCursor: true })
        .setDepth(32);

      const cardLbl = this.add.text(card.x, H / 2, card.label, {
        fontSize: '15px', fontFamily: 'Arial Black, Arial',
        fill: '#ffffff', stroke: '#000000', strokeThickness: 3,
        align: 'center', wordWrap: { width: 175 },
      }).setOrigin(0.5).setDepth(33);

      const cardSub = this.add.text(card.x, H / 2 + 44, card.sub, {
        fontSize: '11px', fontFamily: 'Arial',
        fill: '#ffddcc', stroke: '#000', strokeThickness: 2,
        align: 'center',
      }).setOrigin(0.5).setDepth(33);

      cardBg.on('pointerover', () => cardBg.setStrokeStyle(4, 0xFFD700));
      cardBg.on('pointerout',  () => cardBg.setStrokeStyle(3, 0xffffff));
      cardBg.on('pointerdown', () => {
        destroy();
        this.scene.start('FightScene', {
          mode: 'PRACTICE', difficulty: 'practice',
          roundNumber: 1, p1Wins: 0, p2Wins: 0,
          isTiebreaker: false,
          ...card.data,
        });
      });

      els.push(cardBg, cardLbl, cardSub);
    });

    // Back button
    const back = this.add.text(W / 2, H / 2 + 120, '← Back', {
      fontSize: '15px', fontFamily: 'Arial',
      fill: '#aaaaaa', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(32).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setFill('#ffffff'));
    back.on('pointerout',  () => back.setFill('#aaaaaa'));
    back.on('pointerdown', destroy);
    els.push(back);
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

  _startConfetti() {
    const W = this.scale.width;
    const H = this.scale.height;
    const colors = [0xFFD700, 0xFF6347, 0xFF69B4, 0xF4A460, 0x87CEEB, 0x2ecc71, 0xffffff];

    for (let i = 0; i < 45; i++) {
      const startX = Phaser.Math.Between(0, W);
      const size   = Phaser.Math.Between(5, 12);
      const col    = Phaser.Utils.Array.GetRandom(colors);
      const dur    = Phaser.Math.Between(2800, 5500);
      const drift  = Phaser.Math.Between(-90, 90);

      const rect = this.add.rectangle(startX, -size, size, Math.round(size * 0.55), col, 0.85)
        .setAngle(Phaser.Math.Between(0, 360))
        .setDepth(0.5);

      this.tweens.add({
        targets:  rect,
        y:        H + size,
        x:        startX + drift,
        angle:    rect.angle + Phaser.Math.Between(-400, 400),
        duration: dur,
        delay:    Phaser.Math.Between(0, dur),
        ease:     'Linear',
        repeat:   -1,
        onRepeat: (tween) => {
          const r = tween.targets[0];
          r.setPosition(Phaser.Math.Between(0, W), -size);
          r.setAlpha(0.85);
        },
      });
    }
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
