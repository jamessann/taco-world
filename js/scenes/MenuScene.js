class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this._difficulty = 'medium';

    // ── Music ─────────────────────────────────────────────────────────────────
    this.sound.stopAll();
    if (this.cache.audio.exists('music_menu')) {
      this.sound.play('music_menu', { loop: true, volume: 0.35 });
    }

    // ── Background ────────────────────────────────────────────────────────────
    this.add.image(W / 2, H / 2, 'introBg').setDisplaySize(W, H).setDepth(0);

    // ── Falling confetti (behind all UI) ──────────────────────────────────────
    this._startConfetti();

    // ── Neon sign backlight glow ──────────────────────────────────────────────
    // Simulates the sign illuminating the space around it
    const glowG = this.add.graphics().setDepth(1);
    glowG.fillStyle(0xFF69B4, 0.11);
    glowG.fillEllipse(W / 2 - 20, 138, 500, 190);
    glowG.fillStyle(0x22CCFF, 0.09);
    glowG.fillEllipse(W / 2 + 15, 155, 480, 170);

    // Subtle warm floor glow at the very bottom
    glowG.fillStyle(0xFF8822, 0.06);
    glowG.fillEllipse(W / 2, H, 920, 220);

    // ── Neon sign images ──────────────────────────────────────────────────────
    this._neonState1 = this.add.image(W / 2, 145, 'neonTitle1')
      .setDisplaySize(500, 215)
      .setDepth(2);

    this._neonState2 = this.add.image(W / 2, 145, 'neonTitle2')
      .setDisplaySize(500, 215)
      .setDepth(2)
      .setVisible(false);

    // Gentle float — both images move together so flicker looks seamless
    this.tweens.add({
      targets: [this._neonState1, this._neonState2],
      y: 137,
      duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Start the neon flicker loop
    this._startNeonFlicker();

    // ── Tagline ───────────────────────────────────────────────────────────────
    this.add.text(W / 2, 272, '🌮  The Ultimate Taco Fighting Experience  🌮', {
      fontSize: '16px', fontFamily: 'Arial',
      fill: '#FFB8D8', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(2);

    // ── Dark UI panel (frosted glass behind all buttons) ──────────────────────
    this.add.rectangle(W / 2, 437, 950, 284, 0x04040f, 0.62)
      .setStrokeStyle(1, 0x2a1040, 1)
      .setDepth(1.8);

    // ── Mode buttons ──────────────────────────────────────────────────────────
    this._makeBtn(W / 2 - 178, 320, '1 PLAYER',  0xaa1844, 0xFF69B4, () => this._start('1P'));
    this._makeBtn(W / 2 + 178, 320, '2 PLAYERS', 0x124b88, 0x22CCFF, () => this._start('2P'));
    this._makePracticeBtn(W / 2, 366);

    // ── Flow description ──────────────────────────────────────────────────────
    const flowLines = [
      '1P — Beat Taco Girl to face the Giant Taco Boss!',
      '2P — Best of 2 rounds, winner fights the Boss!',
    ];
    flowLines.forEach((line, i) => {
      this.add.text(W / 2, 407 + i * 20, line, {
        fontSize: '13px', fontFamily: 'Arial',
        fill: '#999999', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(3);
    });

    // ── Separator ─────────────────────────────────────────────────────────────
    const sep = this.add.graphics().setDepth(2.5);
    sep.lineStyle(1, 0x331155, 1);
    sep.lineBetween(80, 453, W - 80, 453);

    // ── Difficulty selector ───────────────────────────────────────────────────
    this.add.text(W / 2, 465, 'DIFFICULTY', {
      fontSize: '13px', fontFamily: 'Arial Black, Arial',
      fill: '#CC88FF', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);

    const diffLevels = [
      { key: 'easy',   label: 'EASY',   x: W / 2 - 160, color: 0x153a22, glow: 0x2ecc71 },
      { key: 'medium', label: 'MEDIUM', x: W / 2,       color: 0x3d2008, glow: 0xf39c12 },
      { key: 'hard',   label: 'HARD',   x: W / 2 + 160, color: 0x3d0808, glow: 0xe74c3c },
    ];

    this._diffBtns = [];
    diffLevels.forEach(d => {
      const bg = this.add.rectangle(d.x, 503, 138, 40, d.color)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, 0x555555)
        .setDepth(3);

      const txt = this.add.text(d.x, 503, d.label, {
        fontSize: '15px', fontFamily: 'Arial Black, Arial',
        fill: '#ffffff', stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(4);

      bg.on('pointerdown', () => this._selectDifficulty(d.key));
      bg.on('pointerover',  () => bg.setStrokeStyle(3, d.glow));
      bg.on('pointerout',   () => this._refreshDiffVisuals());

      this._diffBtns.push({ key: d.key, bg, txt, glow: d.glow });
    });

    this._refreshDiffVisuals();

    // ── Tip ───────────────────────────────────────────────────────────────────
    this.add.text(W / 2, 551, 'Collect power-ups during battle for bonus damage & speed!', {
      fontSize: '12px', fontFamily: 'Arial',
      fill: '#555555', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(3);

    // ── Ambient side orbs ─────────────────────────────────────────────────────
    this._addDeco(52,  215, 0xFF69B4, 20);
    this._addDeco(972, 215, 0x22CCFF, 20);

    // ── Sound toggle ──────────────────────────────────────────────────────────
    this._addSoundToggle();
  }

  // ── Neon flicker ─────────────────────────────────────────────────────────────

  _startNeonFlicker() {
    const flicker = () => {
      // Randomly flicker 1–4 times per burst
      const count = Phaser.Math.Between(1, 4);
      let t = 0;

      for (let i = 0; i < count; i++) {
        // Dim (state 2)
        this.time.delayedCall(t, () => {
          this._neonState1?.setVisible(false);
          this._neonState2?.setVisible(true);
        });
        t += Phaser.Math.Between(30, 110);

        // Bright (state 1)
        this.time.delayedCall(t, () => {
          this._neonState1?.setVisible(true);
          this._neonState2?.setVisible(false);
        });
        t += Phaser.Math.Between(50, 200);
      }

      // Ensure we always end on the bright state
      this.time.delayedCall(t, () => {
        this._neonState1?.setVisible(true);
        this._neonState2?.setVisible(false);
      });

      // Schedule next burst: 2.5–9 seconds from now
      this.time.delayedCall(t + Phaser.Math.Between(2500, 9000), flicker);
    };

    // First flicker after 1.5–4 seconds so it feels natural on scene entry
    this.time.delayedCall(Phaser.Math.Between(1500, 4000), flicker);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

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

  _selectDifficulty(key) {
    this._difficulty = key;
    this._refreshDiffVisuals();
  }

  _refreshDiffVisuals() {
    if (!this._diffBtns) return;
    this._diffBtns.forEach(d => {
      const selected = d.key === this._difficulty;
      d.bg.setStrokeStyle(selected ? 3 : 2, selected ? 0xFFD700 : 0x555555);
      d.bg.setAlpha(selected ? 1 : 0.60);
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
    // Glow halo
    this.add.rectangle(x, y, 204, 44, 0x2ecc71, 0.14).setDepth(2);

    const bg = this.add.rectangle(x, y, 194, 38, 0x0e3320)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x2ecc71)
      .setDepth(2.5);

    const txt = this.add.text(x, y - 2, 'PRACTICE', {
      fontSize: '15px', fontFamily: 'Arial Black, Arial',
      fill: '#aaffaa', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);

    bg.on('pointerover',  () => { bg.setAlpha(0.85); txt.setScale(1.05); });
    bg.on('pointerout',   () => { bg.setAlpha(1);    txt.setScale(1);    });
    bg.on('pointerdown',  () => this._showPracticeEnemySelect());

    this.add.text(x, y + 14, 'Speed boost  •  Weak enemies  •  25 hits', {
      fontSize: '10px', fontFamily: 'Arial',
      fill: '#55aa77', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(3);
  }

  _showPracticeEnemySelect() {
    const W = this.scale.width;
    const H = this.scale.height;
    const els = [];

    const destroy = () => els.forEach(o => { if (o && o.destroy) o.destroy(); });

    const backdrop = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.78)
      .setDepth(30).setInteractive();
    els.push(backdrop);

    const panel = this.add.rectangle(W / 2, H / 2 + 10, 680, 300, 0x12122a)
      .setStrokeStyle(3, 0x27ae60).setDepth(31);
    els.push(panel);

    els.push(this.add.text(W / 2, H / 2 - 120, 'PRACTICE — Choose Your Opponent', {
      fontSize: '22px', fontFamily: 'Arial Black, Arial',
      fill: '#27ae60', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(32));

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
    // Soft neon glow halo behind button
    this.add.rectangle(x, y, 236, 66, strokeColor, 0.14).setDepth(2);

    const bg = this.add.rectangle(x, y, 224, 58, fillColor)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, strokeColor)
      .setDepth(2.5);

    const txt = this.add.text(x, y, label, {
      fontSize: '22px', fontFamily: 'Arial Black, Arial',
      fill: '#ffffff', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(3);

    bg.on('pointerover',  () => { bg.setAlpha(0.85); txt.setScale(1.06); });
    bg.on('pointerout',   () => { bg.setAlpha(1);    txt.setScale(1);    });
    bg.on('pointerdown',  onClick);

    this.tweens.add({
      targets: [bg, txt],
      scaleX: 1.03, scaleY: 1.03,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
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
