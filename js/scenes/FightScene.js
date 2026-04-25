// ─── Layout constants ────────────────────────────────────────────────────────
const FLOOR_Y      = 498;
const BAR_W        = 300;
const BAR_H        = 24;
const P1_BAR_X     = 14;          // left edge of P1 bar
const P2_BAR_RX    = 1010;        // right edge of P2 bar
const BAR_Y        = 20;
const HUD_NAME_Y   = 50;
const HUD_PIP_Y    = 66;
const ROUND_TIME   = 99;          // seconds

class FightScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FightScene' });
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  init(data) {
    this.mode           = data.mode           || '1P';
    this.roundNumber    = data.roundNumber    || 1;
    this.p1Wins         = data.p1Wins         || 0;
    this.p2Wins         = data.p2Wins         || 0;
    this.isBossRound    = data.isBossRound    || false;
    this.isTiebreaker   = data.isTiebreaker   || false;
    this.bossChallenger = data.bossChallenger || 'P1'; // 'P1' or 'P2'
    // P2 is CPU when it's the boss round (Giant Taco) OR 1P mode (Taco Girl as CPU)
    this.isP2CPU        = this.isBossRound || this.mode === '1P';
    this.difficulty     = data.difficulty  || 'medium';
    this.gameState      = 'COUNTDOWN';
    this.roundTimeLeft  = ROUND_TIME;
    this._timerAccum    = 0;
    this._roundEndFired = false;
    this._p1Smooth      = { hp: 100 };
    this._p2Smooth      = { hp: 100 };
  }

  create() {
    this._setupStage();
    this._setupFighters();
    this._setupHUD();
    this._setupTouchControls();
    this._setupPowerUps();
    if (this.isBossRound) this._setupBossProjectiles();
    this._startRoundCountdown();
  }

  // ─── Stage ───────────────────────────────────────────────────────────────────

  _setupStage() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Background image — scaled to fill the canvas, depth 0 (behind everything)
    this.add.image(W / 2, H / 2, 'stageBg')
      .setDisplaySize(W, H)
      .setDepth(0);

    // Invisible physics ground — visual floor comes from the background image
    this._groundObj = this.add.rectangle(W / 2, FLOOR_Y + 16, W, 32, 0x000000, 0);
    this.physics.add.existing(this._groundObj, true);
  }

  // ─── Fighters ────────────────────────────────────────────────────────────────

  _setupFighters() {
    const W      = this.scale.width;
    const spawnY = FLOOR_Y - 50;

    if (this.isBossRound) {
      // The round winner becomes fighter1 (left, P1 controls).
      // If P2 won the series they still use P1-side controls in the boss fight.
      this.fighter1 = this.bossChallenger === 'P2'
        ? new TacoGirl(this, 200, spawnY)
        : new TacoBoy(this, 200, spawnY);
      this.fighter2 = new GiantTaco(this, W - 220, FLOOR_Y - 80);
    } else {
      // Normal round: TacoBoy left, TacoGirl right
      this.fighter1 = new TacoBoy(this, 200, spawnY);
      this.fighter2 = new TacoGirl(this, W - 200, spawnY);
    }

    this.physics.add.collider(this.fighter1.rect, this._groundObj);
    this.physics.add.collider(this.fighter2.rect, this._groundObj);

    // Apply difficulty scaling to CPU fighter's stats
    if (this.isP2CPU) {
      const d = this._cpuDifficultyConfig();
      const c = this.fighter2.config;
      c.lightDamage          = Math.round(c.lightDamage  * d.damageMult);
      c.heavyDamage          = Math.round(c.heavyDamage  * d.damageMult);
      c.cpuAttackIntervalMin = d.intervalMin;
      c.cpuAttackIntervalMax = d.intervalMax;
      c.cpuEngageDistance    = d.engageDist;
    }

    this._p1Smooth.hp = this.fighter1.hp;
    this._p2Smooth.hp = this.fighter2.hp;
  }

  // Returns CPU difficulty overrides based on this.difficulty
  _cpuDifficultyConfig() {
    const presets = {
      easy:   { damageMult: 0.65, intervalMin: 2400, intervalMax: 4000, engageDist: 160 },
      medium: { damageMult: 1.0,  intervalMin: 1200, intervalMax: 2200, engageDist: 120 },
      hard:   { damageMult: 1.4,  intervalMin: 380,  intervalMax: 850,  engageDist: 90  },
    };
    return presets[this.difficulty] || presets.medium;
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────────

  _setupHUD() {
    const W = this.scale.width;
    const DEPTH = 20;

    // Semi-transparent HUD backing strip
    this.add.rectangle(W / 2, 44, W, 88, 0x000000, 0.45).setDepth(DEPTH - 1);

    // ── P1 health bar ──
    this.add.rectangle(P1_BAR_X + BAR_W / 2, BAR_Y, BAR_W + 4, BAR_H + 4, 0x333333).setDepth(DEPTH);
    this._p1BarBg   = this.add.rectangle(P1_BAR_X + BAR_W / 2, BAR_Y, BAR_W, BAR_H, 0x555555).setDepth(DEPTH + 1);
    // Fill — origin left-centre so scaleX shrinks from right
    this._p1BarFill = this.add.rectangle(P1_BAR_X, BAR_Y, BAR_W, BAR_H, 0x2ecc71).setOrigin(0, 0.5).setDepth(DEPTH + 2);

    this.add.text(P1_BAR_X, HUD_NAME_Y, this.fighter1.config.name, {
      fontSize: '13px', fontFamily: 'Arial Black, Arial',
      fill: '#F4A460', stroke: '#000', strokeThickness: 3
    }).setDepth(DEPTH + 3);

    // ── P2 health bar ──
    this.add.rectangle(P2_BAR_RX - BAR_W / 2, BAR_Y, BAR_W + 4, BAR_H + 4, 0x333333).setDepth(DEPTH);
    this._p2BarBg   = this.add.rectangle(P2_BAR_RX - BAR_W / 2, BAR_Y, BAR_W, BAR_H, 0x555555).setDepth(DEPTH + 1);
    // Fill — origin right-centre so scaleX shrinks from left
    this._p2BarFill = this.add.rectangle(P2_BAR_RX, BAR_Y, BAR_W, BAR_H,
      this.isBossRound ? 0xe74c3c : 0xe91e8c).setOrigin(1, 0.5).setDepth(DEPTH + 2);

    const p2Name = this.fighter2.config.name;
    this.add.text(P2_BAR_RX, HUD_NAME_Y, p2Name, {
      fontSize: '13px', fontFamily: 'Arial Black, Arial',
      fill: this.isBossRound ? '#FF6347' : '#FF69B4',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(1, 0).setDepth(DEPTH + 3);

    // ── Round timer ──
    this._timerText = this.add.text(W / 2, 8, String(ROUND_TIME), {
      fontSize: '38px', fontFamily: 'Arial Black, Arial',
      fill: '#ffffff', stroke: '#000000', strokeThickness: 5
    }).setOrigin(0.5, 0).setDepth(DEPTH + 3);

    // ── Round pips ──
    this._pipGraphics = this.add.graphics().setDepth(DEPTH + 3);
    this._drawPips();
  }

  _drawPips() {
    const g = this._pipGraphics;
    g.clear();
    const r = 7;
    const gap = 18;

    for (let i = 0; i < 2; i++) {
      const filled = i < this.p1Wins;
      g.lineStyle(2, 0xffffff, 1);
      g.fillStyle(filled ? 0xFFD700 : 0x333333, 1);
      g.fillCircle(P1_BAR_X + r + i * gap, HUD_PIP_Y, r);
      g.strokeCircle(P1_BAR_X + r + i * gap, HUD_PIP_Y, r);
    }
    for (let i = 0; i < 2; i++) {
      const filled = i < this.p2Wins;
      g.lineStyle(2, 0xffffff, 1);
      g.fillStyle(filled ? 0xFFD700 : 0x333333, 1);
      g.fillCircle(P2_BAR_RX - r - i * gap, HUD_PIP_Y, r);
      g.strokeCircle(P2_BAR_RX - r - i * gap, HUD_PIP_Y, r);
    }
  }

  // Keyboard input removed — game is touch-only (iPad).

  // ─── Touch controls ───────────────────────────────────────────────────────────

  _setupTouchControls() {
    // Pass null as fighter2 when P2 is CPU so their touch pad is hidden
    const f2 = this.isP2CPU ? null : this.fighter2;
    this._touchControls = new TouchControls(this, this.fighter1, f2);
  }

  // ─── Round countdown ─────────────────────────────────────────────────────────

  _startRoundCountdown() {
    const W = this.scale.width;
    const H = this.scale.height;
    let roundLabel, subLabel;
    if (this.isBossRound) {
      roundLabel = 'BOSS ROUND!';
      subLabel   = 'Survive the Giant Taco!';
    } else if (this.isTiebreaker) {
      roundLabel = 'TIEBREAKER!';
      subLabel   = '🌮  Winner fights the Giant Taco Boss!  🌮';
    } else if (this.mode === '1P') {
      roundLabel = 'Round 1';
      subLabel   = '🌮  Beat Taco Girl to face the Giant Taco Boss!  🌮';
    } else {
      roundLabel = `Round ${this.roundNumber}`;
      subLabel   = this.roundNumber >= 2 ? '🌮  Win to fight the Giant Taco Boss!  🌮' : '';
    }

    const roundText = this.add.text(W / 2, H / 2 - 20, roundLabel, {
      fontSize: '56px', fontFamily: 'Arial Black, Arial',
      fill: '#FFD700', stroke: '#000000', strokeThickness: 8
    }).setOrigin(0.5).setDepth(50).setScale(0.1);

    let subText = null;
    if (subLabel) {
      subText = this.add.text(W / 2, H / 2 + 46, subLabel, {
        fontSize: '24px', fontFamily: 'Arial',
        fill: '#FF6347', stroke: '#000', strokeThickness: 4
      }).setOrigin(0.5).setDepth(50).setAlpha(0);
    }

    // Pop in
    this.tweens.add({
      targets: roundText,
      scaleX: 1, scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
    if (subText) {
      this.tweens.add({ targets: subText, alpha: 1, duration: 300, delay: 200 });
    }

    // Hold then fade, then show FIGHT!
    this.time.delayedCall(1400, () => {
      this.tweens.add({
        targets: [roundText, subText].filter(Boolean),
        alpha: 0, duration: 200,
        onComplete: () => {
          roundText.destroy();
          if (subText) subText.destroy();
          this._showFightBang();
        }
      });
    });
  }

  _showFightBang() {
    const W = this.scale.width;
    const H = this.scale.height;

    const txt = this.add.text(W / 2, H / 2, 'FIGHT!', {
      fontSize: '80px', fontFamily: 'Arial Black, Arial',
      fill: '#ffffff', stroke: '#FF6347', strokeThickness: 12
    }).setOrigin(0.5).setDepth(50).setScale(0.2);

    this.tweens.add({
      targets: txt,
      scaleX: 1.1, scaleY: 1.1,
      duration: 250, ease: 'Back.easeOut'
    });

    this.time.delayedCall(700, () => {
      this.tweens.add({
        targets: txt, alpha: 0, scaleX: 1.4, scaleY: 1.4,
        duration: 300,
        onComplete: () => { txt.destroy(); }
      });
      this.gameState = 'FIGHTING';
    });
  }

  // ─── Main loop ───────────────────────────────────────────────────────────────

  update(time, delta) {
    if (this.gameState !== 'FIGHTING') return;

    this.fighter1.update(delta);
    this.fighter2.update(delta);

    // Human fighter 2 faces opponent while idle/walking (in 2P mode)
    if (!this.isP2CPU &&
        (this.fighter2.state === STATES.IDLE || this.fighter2.state === STATES.WALK)) {
      this.fighter2.faceOpponent(this.fighter1);
    }
    // Fighter 1 always faces opponent while idle/walking
    if (this.fighter1.state === STATES.IDLE || this.fighter1.state === STATES.WALK) {
      this.fighter1.faceOpponent(this.fighter2);
    }

    // CPU AI (Taco Girl in 1P mode, Giant Taco in boss round)
    if (this.isP2CPU) {
      this.fighter2.updateCPU(delta, this.fighter1);
    }

    // Bidirectional hit detection
    this._checkHit(this.fighter1, this.fighter2);
    this._checkHit(this.fighter2, this.fighter1);

    // Power-ups
    this._updatePowerUps(delta);

    // Boss projectiles (boss round only)
    if (this.isBossRound) this._updateBossProjectiles(delta);

    // Round timer
    this._timerAccum += delta;
    if (this._timerAccum >= 1000) {
      this._timerAccum -= 1000;
      this.roundTimeLeft = Math.max(0, this.roundTimeLeft - 1);
      this._timerText.setText(String(this.roundTimeLeft));
      if (this.roundTimeLeft <= 10) this._timerText.setFill('#FF4500');
      if (this.roundTimeLeft <= 0) this._triggerTimeout();
    }

    this._updateHealthBars();
    this._checkRoundEnd();
  }

  // ─── Hit detection ───────────────────────────────────────────────────────────

  _checkHit(attacker, defender) {
    if (!attacker.hitboxActive || attacker.attackHitLanded) return;
    if (!defender.isAlive) return;

    const hb = attacker.getHitboxBounds();
    if (!hb) return;

    const db = defender.getBodyBounds();
    if (!Phaser.Geom.Rectangle.Overlaps(hb, db)) return;

    // Landed!
    attacker.attackHitLanded = true;

    const isHeavy  = attacker.state === STATES.ATTACK_HEAVY;
    const baseDmg  = isHeavy ? attacker.config.heavyDamage : attacker.config.lightDamage;
    const kbDir    = attacker.facingRight ? 1 : -1;
    const finalDmg = Math.ceil(baseDmg * (attacker._damageMult || 1));
    const dmg      = defender.takeDamage(finalDmg, kbDir);

    // Tween the plain HP POJO — kill any in-flight tween first so they don't fight each other
    if (defender === this.fighter1) {
      this.tweens.killTweensOf(this._p1Smooth);
      this.tweens.add({ targets: this._p1Smooth, hp: this.fighter1.hp, duration: 280, ease: 'Power2' });
    } else {
      this.tweens.killTweensOf(this._p2Smooth);
      this.tweens.add({ targets: this._p2Smooth, hp: this.fighter2.hp, duration: 280, ease: 'Power2' });
    }

    // Screen shake on heavy
    if (isHeavy && !defender.isBlocking) {
      this.cameras.main.shake(220, 0.012);
    }

    // Hit spark text
    this._spawnHitText(defender.x, defender.y - defender.config.height / 2, dmg, isHeavy);
  }

  _spawnHitText(x, y, dmg, isHeavy) {
    const style = isHeavy
      ? { fontSize: '28px', fill: '#FFD700', stroke: '#8B0000', strokeThickness: 5 }
      : { fontSize: '18px', fill: '#ffffff', stroke: '#333333', strokeThickness: 3 };

    const txt = this.add.text(x, y, `-${dmg}`, { ...style, fontFamily: 'Arial Black, Arial' })
      .setOrigin(0.5, 1).setDepth(60);

    this.tweens.add({
      targets: txt,
      y: y - 55,
      alpha: 0,
      duration: isHeavy ? 900 : 600,
      ease: 'Power2',
      onComplete: () => txt.destroy()
    });
  }

  // ─── Health bar rendering ─────────────────────────────────────────────────────

  _updateHealthBars() {
    const p1Pct = Math.max(0, this._p1Smooth.hp / this.fighter1.maxHp);
    const p2Pct = Math.max(0, this._p2Smooth.hp / this.fighter2.maxHp);

    this._p1BarFill.scaleX = p1Pct;
    this._p2BarFill.scaleX = p2Pct;

    // Colour shift green → yellow → red
    this._p1BarFill.fillColor = this._hpColor(p1Pct);
    this._p2BarFill.fillColor = this._hpColor(p2Pct);
  }

  _hpColor(pct) {
    if (pct > 0.55) return 0x2ecc71;  // green
    if (pct > 0.25) return 0xf39c12;  // yellow-orange
    return 0xe74c3c;                   // red
  }

  // ─── Round end logic ─────────────────────────────────────────────────────────

  _checkRoundEnd() {
    if (this._roundEndFired) return;
    if (!this.fighter1.isAlive || !this.fighter2.isAlive) {
      this._roundEndFired = true;
      this.gameState = 'ROUND_OVER';
      const winnerId = !this.fighter1.isAlive ? 2 : 1;
      this._endRound(winnerId, 'KO');
    }
  }

  _triggerTimeout() {
    if (this._roundEndFired) return;
    this._roundEndFired = true;
    this.gameState = 'ROUND_OVER';
    const winnerId = this.fighter1.hp >= this.fighter2.hp ? 1 : 2;
    this._endRound(winnerId, 'TIME');
  }

  _endRound(winnerId, reason) {
    this.fighter1.physBody.setVelocityX(0);
    this.fighter2.physBody.setVelocityX(0);

    if (winnerId === 1) this.p1Wins++;
    else                this.p2Wins++;
    this._drawPips();

    // Fade in the round-win stage behind the fighters
    if (this.textures.exists('roundWinBg')) {
      const W = this.scale.width;
      const H = this.scale.height;
      const rwBg = this.add.image(W / 2, H / 2, 'roundWinBg')
        .setDisplaySize(W, H)
        .setDepth(1)   // behind fighters (depth 5) but above fight arena (depth 0)
        .setAlpha(0);
      this.tweens.add({ targets: rwBg, alpha: 1, duration: 500, ease: 'Power2' });
    }

    this._showRoundEndBanner(reason, winnerId);
    this._bounceWinner(winnerId === 1 ? this.fighter1 : this.fighter2);

    this.time.delayedCall(2800, () => {
      const _goGameOver = (fighterId) => {
        const f   = fighterId === 1 ? this.fighter1 : this.fighter2;
        this.scene.start('GameOverScene', {
          winnerName:        f.config.name,
          winnerColor:       f.config.color,
          p1Wins:            this.p1Wins,
          p2Wins:            this.p2Wins,
          victoryTextureKey: f.config.victoryTextureKey || null,
        });
      };

      // ── Boss round — always the final fight ──────────────────────────────
      if (this.isBossRound) {
        _goGameOver(winnerId);
        return;
      }

      // ── 1 Player mode ────────────────────────────────────────────────────
      if (this.mode === '1P') {
        if (winnerId === 1) {
          // Human wins → face the boss
          this.scene.start('FightScene', {
            mode: '1P', roundNumber: 2, difficulty: this.difficulty,
            p1Wins: this.p1Wins, p2Wins: this.p2Wins,
            isBossRound: true, bossChallenger: 'P1',
          });
        } else {
          // CPU Taco Girl wins — game over
          _goGameOver(2);
        }
        return;
      }

      // ── 2 Player mode ────────────────────────────────────────────────────
      // Always play at least 2 rounds before the boss
      if (this.roundNumber < 2 && !this.isTiebreaker) {
        this.scene.start('FightScene', {
          mode: '2P', roundNumber: 2, difficulty: this.difficulty,
          p1Wins: this.p1Wins, p2Wins: this.p2Wins,
          isBossRound: false, isTiebreaker: false,
        });
        return;
      }

      // After round 2 (or a tiebreaker), determine the boss challenger
      if (this.p1Wins === this.p2Wins) {
        // Exactly tied — sudden-death tiebreaker
        this.scene.start('FightScene', {
          mode: '2P', roundNumber: this.roundNumber + 1, difficulty: this.difficulty,
          p1Wins: this.p1Wins, p2Wins: this.p2Wins,
          isBossRound: false, isTiebreaker: true,
        });
      } else {
        const bossChallenger = this.p1Wins > this.p2Wins ? 'P1' : 'P2';
        this.scene.start('FightScene', {
          mode: '2P', roundNumber: this.roundNumber + 1, difficulty: this.difficulty,
          p1Wins: this.p1Wins, p2Wins: this.p2Wins,
          isBossRound: true, bossChallenger,
        });
      }
    });
  }

  _showRoundEndBanner(reason, winnerId) {
    const W = this.scale.width;
    const H = this.scale.height;

    // KO! / TIME! splash
    const label = reason === 'KO' ? 'K.O.!' : 'TIME!';
    const txt = this.add.text(W / 2, H / 2 - 30, label, {
      fontSize: '96px', fontFamily: 'Arial Black, Impact, Arial',
      fill: reason === 'KO' ? '#FFD700' : '#FF6347',
      stroke: '#000000', strokeThickness: 12
    }).setOrigin(0.5).setDepth(55).setScale(0.1);

    this.tweens.add({
      targets: txt, scaleX: 1, scaleY: 1,
      duration: 300, ease: 'Back.easeOut'
    });

    // Sub-text: winner name
    const winnerName = winnerId === 1 ? this.fighter1.config.name : this.fighter2.config.name;
    const sub = this.add.text(W / 2, H / 2 + 52, `${winnerName} wins!`, {
      fontSize: '32px', fontFamily: 'Arial Black, Arial',
      fill: '#ffffff', stroke: '#000000', strokeThickness: 5
    }).setOrigin(0.5).setDepth(55).setAlpha(0);

    this.tweens.add({ targets: sub, alpha: 1, duration: 300, delay: 400 });
  }

  _bounceWinner(fighter) {
    // Small celebration bounces
    this.tweens.add({
      targets: fighter.rect,
      y: fighter.rect.y - 40,
      duration: 220,
      ease: 'Power2',
      yoyo: true,
      repeat: 3
    });
  }

  // ─── Power-ups ───────────────────────────────────────────────────────────────

  _setupPowerUps() {
    this._powerUps     = [];
    this._puTimer      = 0;
    this._puInterval   = Phaser.Math.Between(7000, 11000); // ms until first spawn
  }

  _updatePowerUps(delta) {
    this._puTimer += delta;
    if (this._puTimer >= this._puInterval && this._powerUps.length < 3) {
      this._puTimer    = 0;
      this._puInterval = Phaser.Math.Between(8000, 13000);
      this._spawnPowerUp();
    }
    this._checkPowerUpCollisions();
  }

  _spawnPowerUp() {
    const W = this.scale.width;
    const types = [
      { type: 'heal',   icon: '+HP',  color: 0xff2255, rimColor: 0xff88bb, label: '+25 HP!'    },
      { type: 'damage', icon: 'POW',  color: 0xff6600, rimColor: 0xffaa44, label: 'POWER UP!'  },
      { type: 'speed',  icon: 'SPD',  color: 0xccaa00, rimColor: 0xffee44, label: 'SPEED UP!'  },
    ];
    const t = Phaser.Utils.Array.GetRandom(types);
    const x = Phaser.Math.Between(180, W - 180);
    const y = FLOOR_Y - 32;

    // Outer pulse ring
    const rim = this.add.circle(x, y, 30, t.rimColor, 0.35).setDepth(8);
    // Main glowing circle
    const gfx = this.add.circle(x, y, 24, t.color, 1).setDepth(9);
    // Text label — short caps, always renders on Safari canvas
    const lbl = this.add.text(x, y, t.icon, {
      fontSize: '13px', fontFamily: 'Arial Black, Arial',
      fill: '#ffffff', stroke: '#000000', strokeThickness: 3,
      align: 'center',
    }).setOrigin(0.5).setDepth(10);

    // Bob up/down
    this.tweens.add({
      targets: [rim, gfx, lbl], y: y - 12,
      duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    // Pulse glow on rim
    this.tweens.add({
      targets: rim, alpha: 0.05, scaleX: 1.35, scaleY: 1.35,
      duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    this._powerUps.push({ type: t.type, label: t.label, x, y, gfx, rim, lbl, active: true });
  }

  _checkPowerUpCollisions() {
    for (const pu of this._powerUps) {
      if (!pu.active) continue;
      for (const fighter of [this.fighter1, this.fighter2]) {
        if (!fighter.isAlive) continue;
        const dx = Math.abs(fighter.x - pu.x);
        const dy = Math.abs(fighter.y - pu.y);
        if (dx < 65 && dy < 70) {
          this._collectPowerUp(fighter, pu);
          break;
        }
      }
    }
    this._powerUps = this._powerUps.filter(p => p.active);
  }

  _collectPowerUp(fighter, pu) {
    pu.active = false;
    pu.gfx.destroy();
    pu.rim.destroy();
    pu.lbl.destroy();

    // Flash collect text
    const txt = this.add.text(fighter.x, fighter.y - 70, pu.label, {
      fontSize: '22px', fontFamily: 'Arial Black, Arial',
      fill: '#FFD700', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(65);
    this.tweens.add({
      targets: txt, y: txt.y - 45, alpha: 0,
      duration: 900, ease: 'Power2',
      onComplete: () => txt.destroy(),
    });

    switch (pu.type) {
      case 'heal': {
        fighter.hp = Math.min(fighter.maxHp, fighter.hp + 25);
        const smooth = fighter === this.fighter1 ? this._p1Smooth : this._p2Smooth;
        this.tweens.killTweensOf(smooth);
        this.tweens.add({ targets: smooth, hp: fighter.hp, duration: 280 });
        break;
      }
      case 'damage': {
        fighter._damageMult = 2.0;
        fighter._visual.setTint(0xff8800);
        this.time.delayedCall(6000, () => {
          fighter._damageMult = 1;
          if (fighter._visual) fighter._visual.clearTint();
        });
        break;
      }
      case 'speed': {
        const orig = fighter.config.moveSpeed;
        fighter.config.moveSpeed = Math.round(orig * 1.6);
        fighter._visual.setTint(0xffee44);
        this.time.delayedCall(6000, () => {
          fighter.config.moveSpeed = orig;
          if (fighter._visual) fighter._visual.clearTint();
        });
        break;
      }
    }
  }

  // ─── Boss Projectiles ─────────────────────────────────────────────────────────

  _setupBossProjectiles() {
    this._bossProjectiles = [];
    this._bossShootTimer  = 0;

    // First shot is a little later so player has time to settle
    const intervals = {
      easy:   { min: 5500, max: 8000, first: 7000 },
      medium: { min: 3500, max: 5500, first: 5000 },
      hard:   { min: 2000, max: 3500, first: 3500 },
    };
    const iv = intervals[this.difficulty] || intervals.medium;
    this._bossShootMin      = iv.min;
    this._bossShootMax      = iv.max;
    this._bossShootInterval = iv.first;   // first interval is always a bit longer
  }

  _updateBossProjectiles(delta) {
    // ── Firing timer ──────────────────────────────────────────────────────────
    if (this.fighter2 && this.fighter2.isAlive &&
        this.fighter2.state !== STATES.KO &&
        this.fighter2.state !== STATES.HIT) {
      this._bossShootTimer += delta;
      if (this._bossShootTimer >= this._bossShootInterval) {
        this._bossShootTimer  = 0;
        this._bossShootInterval = Phaser.Math.Between(this._bossShootMin, this._bossShootMax);
        this._fireBossProjectile();
      }
    }

    // ── Move + collide ────────────────────────────────────────────────────────
    const W = this.scale.width;
    for (let i = this._bossProjectiles.length - 1; i >= 0; i--) {
      const p = this._bossProjectiles[i];

      // Advance position
      p.x     += p.vx * (delta / 1000);
      p.angle += 360  * (delta / 1000);    // full spin per second
      p.gfx.setPosition(p.x, p.y);
      p.gfx.setAngle(p.angle);
      p.lbl.setPosition(p.x, p.y);

      // Off-screen → remove
      if (p.x < -60 || p.x > W + 60) {
        p.gfx.destroy();
        p.lbl.destroy();
        this._bossProjectiles.splice(i, 1);
        continue;
      }

      // Collision with human fighter (fighter1)
      const f = this.fighter1;
      if (!f || !f.isAlive) continue;

      const dx = Math.abs(f.x - p.x);
      const dy = Math.abs(f.y - p.y);

      // Dodged if jumping or blocking/ducking
      const isJumping = !f.isOnGround();
      const isDucking = f.state === STATES.BLOCK;
      if (isJumping || isDucking) continue;

      if (dx < 55 && dy < 65) {
        // Hit!
        p.gfx.destroy();
        p.lbl.destroy();
        this._bossProjectiles.splice(i, 1);

        const kbDir = p.vx > 0 ? 1 : -1;
        const dmg = f.takeDamage(p.damage, kbDir);
        this.tweens.killTweensOf(this._p1Smooth);
        this.tweens.add({ targets: this._p1Smooth, hp: f.hp, duration: 280, ease: 'Power2' });
        this._spawnHitText(f.x, f.y - f.config.height / 2, dmg, false);
        this.cameras.main.shake(100, 0.006);

        // Mini "TACO HIT" label
        const hitLbl = this.add.text(f.x, f.y - 90, 'TACO HIT!', {
          fontSize: '16px', fontFamily: 'Arial Black, Arial',
          fill: '#FF6347', stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(65);
        this.tweens.add({
          targets: hitLbl, y: hitLbl.y - 30, alpha: 0,
          duration: 700, ease: 'Power2', onComplete: () => hitLbl.destroy(),
        });
      }
    }
  }

  _fireBossProjectile() {
    const boss = this.fighter2;
    if (!boss || !boss.isAlive) return;

    const f    = this.fighter1;
    const dirX = (f && f.x < boss.x) ? -1 : 1;   // fire toward the human
    const speed  = 400;
    const projY  = FLOOR_Y - 75;                  // mid-body of a standing fighter
    const startX = boss.x + dirX * (boss.config.width / 2 + 15);

    // Spinning taco shell (circle + label)
    const gfx = this.add.circle(startX, projY, 20, 0xFF6347, 1)
      .setStrokeStyle(3, 0xFFD700)
      .setDepth(14);
    // "🌮" text — rendered on top of the circle as a fallback label
    const lbl = this.add.text(startX, projY, '🌮', {
      fontSize: '18px',
    }).setOrigin(0.5).setDepth(15);

    // Warning banner: flashes above the arena
    const W    = this.scale.width;
    const side = dirX < 0 ? '← MINI TACO!' : 'MINI TACO! →';
    const warn = this.add.text(W / 2, 108, side, {
      fontSize: '20px', fontFamily: 'Arial Black, Arial',
      fill: '#FF6347', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(50).setAlpha(0);
    this.tweens.add({
      targets: warn, alpha: 1, duration: 110,
      yoyo: true, repeat: 2,
      onComplete: () => warn.destroy(),
    });

    // Instruction tip (only show the first 3 times)
    this._tacoHintCount = (this._tacoHintCount || 0) + 1;
    if (this._tacoHintCount <= 3) {
      const tip = this.add.text(W / 2, 130, 'Jump or Block to dodge!', {
        fontSize: '13px', fontFamily: 'Arial',
        fill: '#ffffff', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(50).setAlpha(0);
      this.tweens.add({
        targets: tip, alpha: 1, duration: 200, delay: 150,
        hold: 1200, yoyo: true,
        onComplete: () => tip.destroy(),
      });
    }

    this._bossProjectiles.push({
      x: startX, y: projY,
      vx: dirX * speed,
      angle: 0,
      damage: 12,   // less than the boss's direct light hit (lightDamage=12 at base; this ignores difficulty scaling intentionally)
      gfx, lbl,
    });
  }
}
