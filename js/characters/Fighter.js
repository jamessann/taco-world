// Animation state constants
const STATES = {
  IDLE:         'IDLE',
  WALK:         'WALK',
  JUMP:         'JUMP',
  ATTACK_LIGHT: 'ATTACK_LIGHT',
  ATTACK_HEAVY: 'ATTACK_HEAVY',
  HIT:          'HIT',
  BLOCK:        'BLOCK',
  KO:           'KO'
};

class Fighter {
  constructor(scene, x, y, config) {
    this.scene       = scene;
    this.config      = config;
    this.hp          = config.maxHp;
    this.maxHp       = config.maxHp;
    this.state       = STATES.IDLE;
    this.facingRight = (x < scene.scale.width / 2);
    this.isBlocking  = false;
    this.hitboxActive    = false;
    this.attackHitLanded = false;
    this.isAlive     = true;
    this.cooldowns   = { light: 0, heavy: 0, hit: 0 };

    // ── Stamina (anti-mash) ───────────────────────────────────────────────────
    this.stamina        = 100;
    this.maxStamina     = 100;
    this._exhausted     = false;   // true while stamina penalty is active
    this._exhaustedTimer = 0;      // ms remaining

    // ── Counter window ────────────────────────────────────────────────────────
    this._counterBoost = 1;        // damage multiplier for next attack
    this._counterTimer = 0;        // ms until counter boost expires

    // ── Hit-streak (for CPU retreat) ──────────────────────────────────────────
    this._hitStreak      = 0;
    this._hitStreakTimer = 0;

    // ── Physics rectangle ────────────────────────────────────────────────────
    // Always present — drives all physics. Hidden when a sprite overlay is used.
    this.rect = scene.add.rectangle(x, y, config.width, config.height, config.color);
    scene.physics.add.existing(this.rect);
    this.physBody = this.rect.body;
    this.physBody.setCollideWorldBounds(true);
    this.physBody.setMaxVelocityX(config.moveSpeed * 1.5);
    this.physBody.setDragX(1800);

    // ── Sprite overlay ───────────────────────────────────────────────────────
    // If config.textures is provided, render a real image instead of the rect.
    // TODO: SPRITE SWAP — populate config.textures in each character subclass
    this.sprite = null;
    this._lastSpriteKey = null;

    const dW = config.displayWidth  || config.width;
    const dH = config.displayHeight || config.height;

    // When the sprite is taller than the physics body, shift the sprite UP so
    // both share the same floor-line (bottom edges aligned).
    // e.g. phys height=100, sprite height=140 → offset = (100-140)/2 = -20
    this._spriteYOffset = (config.height - dH) / 2;

    // Base scale factors — stored so _syncSprite can multiply squish on top of them.
    // setDisplaySize() can't be used because _syncSprite overwrites scale every frame.
    this._spriteBaseScaleX = 1;
    this._spriteBaseScaleY = 1;

    if (config.textures) {
      const firstKey = config.textures[STATES.IDLE] || Object.values(config.textures)[0];
      this.rect.setAlpha(0);           // physics rect invisible; drives physics only
      this.sprite = scene.add.image(x, y + this._spriteYOffset, firstKey).setDepth(5);
      this._lastSpriteKey = firstKey;
      // Calculate base scale from actual texture dimensions so the sprite
      // renders at displayWidth × displayHeight regardless of source image size.
      this._recalcBaseScale(firstKey);
      this.sprite.setScale(this._spriteBaseScaleX, this._spriteBaseScaleY);
    } else {
      this._spriteYOffset = 0;
      this.rect.setDepth(5);           // rect is the visual
    }

    // Unified reference — use this for visual-only effects
    this._visual = this.sprite || this.rect;

    // ── Name label ───────────────────────────────────────────────────────────
    const labelY = y + this._spriteYOffset - dH / 2 - 6;
    this.nameLabel = scene.add.text(x, labelY, config.name, {
      fontSize: '13px',
      fontFamily: 'Arial Black, Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5, 1).setDepth(10);

    // ── White hit-flash overlay ───────────────────────────────────────────────
    this.flashRect = scene.add.rectangle(x, y + this._spriteYOffset, dW, dH, 0xffffff, 0).setDepth(6);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  get x() { return this.rect.x; }
  get y() { return this.rect.y; }

  get _dW() { return this.config.displayWidth  || this.config.width;  }
  get _dH() { return this.config.displayHeight || this.config.height; }

  // Recalculates _spriteBaseScaleX/Y so the sprite renders at _dW × _dH pixels,
  // regardless of the source texture's native dimensions.
  _recalcBaseScale(key) {
    if (!this.sprite) return;
    const src = this.scene.textures.get(key)?.getSourceImage();
    const srcW = (src?.width  || src?.naturalWidth)  || this._dW;
    const srcH = (src?.height || src?.naturalHeight) || this._dH;
    this._spriteBaseScaleX = this._dW / srcW;
    this._spriteBaseScaleY = this._dH / srcH;
  }

  isOnGround() {
    return this.physBody && this.physBody.blocked.down;
  }

  // ─── Sprite sync (called every frame) ────────────────────────────────────────

  _syncSprite() {
    if (!this.sprite) return;

    // Position follows physics rect, shifted so bottom edges share the same floor-line
    this.sprite.setPosition(this.rect.x, this.rect.y + this._spriteYOffset);
    this.sprite.setAngle(this.rect.angle);

    // Flip to face correct direction
    this.sprite.setFlipX(!this.facingRight);

    // Swap texture when state changes
    const textures = this.config.textures;
    const wantKey  = (textures[this.state] && this.scene.textures.exists(textures[this.state]))
      ? textures[this.state]
      : (textures[STATES.IDLE] && this.scene.textures.exists(textures[STATES.IDLE]))
        ? textures[STATES.IDLE]
        : null;

    if (wantKey && wantKey !== this._lastSpriteKey) {
      this.sprite.setTexture(wantKey);
      this._recalcBaseScale(wantKey);  // texture may have different native dimensions
      this._lastSpriteKey = wantKey;
    }

    // Apply base display scale multiplied by any squish the rect is undergoing.
    // This keeps the sprite at displayWidth×displayHeight at rest, and inherits
    // attack squish / KO animation from the physics rect's scale.
    this.sprite.setScale(
      this._spriteBaseScaleX * this.rect.scaleX,
      this._spriteBaseScaleY * this.rect.scaleY
    );
  }

  // ─── Movement ────────────────────────────────────────────────────────────────

  moveLeft() {
    if (!this.canMove()) return;
    this.physBody.setVelocityX(-this.config.moveSpeed);
    this.facingRight = false;
    if (this.isOnGround()) this.state = STATES.WALK;
  }

  moveRight() {
    if (!this.canMove()) return;
    this.physBody.setVelocityX(this.config.moveSpeed);
    this.facingRight = true;
    if (this.isOnGround()) this.state = STATES.WALK;
  }

  stopMoving() {
    if (!this.isAlive || this.state === STATES.KO) return;
    if (this.isOnGround() && this.state === STATES.WALK) this.state = STATES.IDLE;
  }

  jump() {
    if (!this.canMove()) return;
    if (this.isOnGround()) {
      this.physBody.setVelocityY(-this.config.jumpSpeed);
      this.state = STATES.JUMP;
      this.isBlocking = false;
    }
  }

  // ─── Combat ──────────────────────────────────────────────────────────────────

  lightAttack() {
    if (!this.canAttack() || this.cooldowns.light > 0) return;
    // Stamina cost — exhaustion if empty
    const lightCost = 15;
    if (this.stamina < lightCost) { this._triggerExhaustion(); return; }
    this.stamina -= lightCost;
    this.state = STATES.ATTACK_LIGHT;
    this.hitboxActive    = true;
    this.attackHitLanded = false;
    this.cooldowns.light = this.config.lightCooldown;

    this.scene.tweens.add({
      targets: this.rect,     // rect drives scale; sprite mirrors it via _syncSprite
      scaleX: 1.25, duration: 80, yoyo: true,
      onComplete: () => this.rect.setScale(1, 1)
    });
    this.scene.time.delayedCall(this.config.lightCooldown, () => {
      this.hitboxActive = false;
      if (this.state === STATES.ATTACK_LIGHT) this.state = STATES.IDLE;
    });
  }

  heavyAttack() {
    if (!this.canAttack() || this.cooldowns.heavy > 0) return;
    // Stamina cost
    const heavyCost = 28;
    if (this.stamina < heavyCost) { this._triggerExhaustion(); return; }
    this.stamina -= heavyCost;
    this.state = STATES.ATTACK_HEAVY;
    this.hitboxActive    = true;
    this.attackHitLanded = false;
    this.cooldowns.heavy = this.config.heavyCooldown;

    this.scene.tweens.add({
      targets: this.rect,
      scaleX: 0.7, scaleY: 1.3, duration: 200, yoyo: true,
      onComplete: () => this.rect.setScale(1, 1)
    });
    this.scene.time.delayedCall(this.config.heavyCooldown, () => {
      this.hitboxActive = false;
      if (this.state === STATES.ATTACK_HEAVY) this.state = STATES.IDLE;
    });
  }

  startBlock() {
    if (!this.isAlive || this.state === STATES.KO) return;
    if (this.state === STATES.ATTACK_LIGHT || this.state === STATES.ATTACK_HEAVY) return;
    this.isBlocking = true;
    this.state = STATES.BLOCK;
    this._visual.setAlpha(0.65);
  }

  stopBlock() {
    if (!this.isBlocking) return;
    this.isBlocking = false;
    this._visual.setAlpha(1);
    if (this.state === STATES.BLOCK) this.state = STATES.IDLE;
  }

  // Returns actual damage dealt
  takeDamage(amount, knockbackDir) {
    if (!this.isAlive || this.state === STATES.KO) return 0;

    const dmg = this.isBlocking ? Math.ceil(amount * 0.25) : amount;
    this.hp   = Math.max(0, this.hp - dmg);

    // Hit flash
    this.flashRect.setAlpha(0.8);
    this.scene.tweens.add({ targets: this.flashRect, alpha: 0, duration: 150 });

    // Knockback
    const kbMult = this.isBlocking ? 0.4 : 1;
    this.physBody.setVelocityX(knockbackDir * this.config.knockbackSpeed * kbMult);

    if (this.hp <= 0) {
      this._triggerKO();
    } else if (!this.isBlocking) {
      this.state = STATES.HIT;
      this.cooldowns.hit = 350;
      this.scene.time.delayedCall(350, () => {
        if (this.state === STATES.HIT) this.state = STATES.IDLE;
      });
    }

    return dmg;
  }

  _triggerExhaustion() {
    if (this._exhausted) return;
    this._exhausted      = true;
    this._exhaustedTimer = 1500;
    this.stamina         = 0;

    // Visual pop-up
    const tx = this.scene.add.text(this.x, this.y - this._dH / 2 - 10, 'EXHAUSTED!', {
      fontSize: '18px', fontFamily: 'Arial Black, Arial',
      fill: '#ff8800', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(70);
    this.scene.tweens.add({
      targets: tx, y: tx.y - 50, alpha: 0,
      duration: 1300, ease: 'Power2',
      onComplete: () => tx.destroy(),
    });
  }

  _triggerKO() {
    this.isAlive      = false;
    this.isBlocking   = false;
    this.state        = STATES.KO;
    this.hitboxActive = false;
    this.physBody.setVelocityX(0);
    this._visual.setAlpha(1);

    // Tip over
    this.scene.tweens.add({
      targets: [this.rect, this._visual].filter((v, i, a) => a.indexOf(v) === i),
      angle:   this.facingRight ? -85 : 85,
      y:       this._visual.y + this._dH * 0.15,
      duration: 350, ease: 'Power2'
    });
    // Dim
    this.scene.tweens.add({
      targets: [this._visual, this.nameLabel],
      alpha: 0.4, duration: 400
    });
  }

  // ─── Hitbox ───────────────────────────────────────────────────────────────────

  getHitboxBounds() {
    if (!this.hitboxActive) return null;
    const dir = this.facingRight ? 1 : -1;
    const hbX = this.rect.x + dir * (this.config.width / 2 + 30);
    const hbW = 60;
    const hbH = this.config.height * 0.75;
    return new Phaser.Geom.Rectangle(hbX - hbW / 2, this.rect.y - hbH / 2, hbW, hbH);
  }

  getBodyBounds() {
    return this.rect.getBounds();
  }

  // ─── Guards ───────────────────────────────────────────────────────────────────

  canMove() {
    return this.isAlive &&
      this.state !== STATES.HIT &&
      this.state !== STATES.KO &&
      this.state !== STATES.ATTACK_LIGHT &&
      this.state !== STATES.ATTACK_HEAVY;
  }

  canAttack() {
    return this.isAlive &&
      !this._exhausted &&
      this.state !== STATES.KO &&
      this.state !== STATES.HIT &&
      this.state !== STATES.BLOCK;
  }

  // ─── CPU AI (base — can be overridden per character) ─────────────────────────

  updateCPU(delta, target) {
    if (!this.isAlive || !target || !target.isAlive) return;
    if (this.state === STATES.HIT || this.state === STATES.KO) return;

    // Lazily initialise the CPU attack timer
    if (this._cpuTimer === undefined) {
      const min = this.config.cpuAttackIntervalMin || 1200;
      const max = this.config.cpuAttackIntervalMax || 2200;
      this._cpuTimer = min + Math.random() * (max - min);
    }

    const engageDist = this.config.cpuEngageDistance || 120;
    const dist = Math.abs(this.x - target.x);

    // Retreat if player is spam-attacking (hit-streak protection)
    if (this._hitStreak >= 3 && dist < engageDist + 40) {
      this._hitStreak = 0;
      const retreatDir = this.x > target.x ? 1 : -1;
      this.physBody.setVelocityX(retreatDir * this.config.moveSpeed * 1.6);
      if (this.isOnGround() && Math.random() < 0.65) this.jump();
      return;
    }

    // Move toward target until within engage range
    if (dist > engageDist) {
      if (target.x < this.x) this.moveLeft();
      else                    this.moveRight();
    } else {
      this.stopMoving();
    }

    // Attack countdown
    this._cpuTimer -= delta;
    if (this._cpuTimer <= 0 && dist <= engageDist + 50) {
      const roll = Math.random();
      if      (roll < 0.40) this.lightAttack();
      else if (roll < 0.75) this.heavyAttack();
      const min = this.config.cpuAttackIntervalMin || 1200;
      const max = this.config.cpuAttackIntervalMax || 2200;
      this._cpuTimer = min + Math.random() * (max - min);
    }

    this.faceOpponent(target);
  }

  // ─── Per-frame update ─────────────────────────────────────────────────────────

  update(delta) {
    this.cooldowns.light = Math.max(0, this.cooldowns.light - delta);
    this.cooldowns.heavy = Math.max(0, this.cooldowns.heavy - delta);
    this.cooldowns.hit   = Math.max(0, this.cooldowns.hit   - delta);

    // ── Stamina regen (only while not actively swinging) ──────────────────────
    if (this.state !== STATES.ATTACK_LIGHT && this.state !== STATES.ATTACK_HEAVY) {
      this.stamina = Math.min(this.maxStamina, this.stamina + 30 * (delta / 1000));
    }

    // ── Exhaustion countdown ──────────────────────────────────────────────────
    if (this._exhausted) {
      this._exhaustedTimer -= delta;
      if (this._exhaustedTimer <= 0) {
        this._exhausted      = false;
        this._exhaustedTimer = 0;
        this.stamina         = 25; // enough for a couple of attacks after recovery
      }
    }

    // ── Counter boost expiry ──────────────────────────────────────────────────
    if (this._counterTimer > 0) {
      this._counterTimer -= delta;
      if (this._counterTimer <= 0) { this._counterBoost = 1; this._counterTimer = 0; }
    }

    // ── Hit streak decay (resets if not hit again within 2.5 s) ──────────────
    if (this._hitStreakTimer > 0) {
      this._hitStreakTimer -= delta;
      if (this._hitStreakTimer <= 0) { this._hitStreak = 0; this._hitStreakTimer = 0; }
    }

    if (this.isOnGround() && this.state === STATES.JUMP) this.state = STATES.IDLE;

    // Sync sprite texture / position / flip
    this._syncSprite();

    // Sync name label and flash overlay (both follow the sprite, not the raw physics rect)
    const cx      = this.rect.x;
    const visualY = this.rect.y + this._spriteYOffset;
    this.nameLabel.setPosition(cx, visualY - this._dH / 2 - 6);
    this.flashRect.setPosition(cx, visualY);
    this.flashRect.setAngle(this.rect.angle);
    this.flashRect.setScale(this.rect.scaleX, this.rect.scaleY);
  }

  faceOpponent(opponent) {
    this.facingRight = opponent.x > this.x;
  }

  // ─── Round reset ──────────────────────────────────────────────────────────────

  resetForRound(x, y) {
    this.hp          = this.maxHp;
    this.isAlive     = true;
    this.isBlocking  = false;
    this.state       = STATES.IDLE;
    this.hitboxActive    = false;
    this.attackHitLanded = false;
    this.cooldowns       = { light: 0, heavy: 0, hit: 0 };
    this.stamina         = this.maxStamina;
    this._exhausted      = false;
    this._exhaustedTimer = 0;
    this._counterBoost   = 1;
    this._counterTimer   = 0;
    this._hitStreak      = 0;
    this._hitStreakTimer = 0;

    this.rect.setPosition(x, y);
    this.rect.setAngle(0);
    this.rect.setScale(1, 1);

    if (this.sprite) {
      this.sprite.setPosition(x, y + this._spriteYOffset);
      this.sprite.setAngle(0);
      this.sprite.setAlpha(1);
      const idleKey = this.config.textures[STATES.IDLE];
      if (idleKey && this.scene.textures.exists(idleKey)) {
        this.sprite.setTexture(idleKey);
        this._recalcBaseScale(idleKey);
        this._lastSpriteKey = idleKey;
      }
      this.sprite.setScale(this._spriteBaseScaleX, this._spriteBaseScaleY);
    } else {
      this.rect.setAlpha(1);
    }

    this.flashRect.setPosition(x, y).setAlpha(0).setAngle(0);
    this.nameLabel.setAlpha(1);
    this.physBody.setVelocity(0, 0);
    this.facingRight = (x < this.scene.scale.width / 2);
  }

  destroy() {
    if (this.sprite)    this.sprite.destroy();
    this.nameLabel.destroy();
    this.flashRect.destroy();
    this.rect.destroy();
  }
}
