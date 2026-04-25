// Config at top for easy tuning
const GIANT_TACO_CONFIG = {
  name:           'Giant Taco',
  textureKey:     'giantTaco',
  color:          0xFF6347,  // tomato red
  width:          160,
  height:         160,
  maxHp:          150,       // tankier boss
  moveSpeed:      180,       // slow but hits hard
  jumpSpeed:      500,
  knockbackSpeed: 200,       // hard to push around
  lightDamage:    12,        // even lights sting
  heavyDamage:    30,
  lightCooldown:  350,
  heavyCooldown:  1000,
};

// AI timing constants
const CPU_ATTACK_INTERVAL_MIN = 2000;  // ms
const CPU_ATTACK_INTERVAL_MAX = 3000;
const CPU_ENGAGE_DISTANCE     = 130;   // px — how close before stopping

class GiantTaco extends Fighter {
  constructor(scene, x, y) {
    // TODO: SPRITE SWAP — load spritesheet 'giantTaco' in BootScene, use frame 0 here
    super(scene, x, y, GIANT_TACO_CONFIG);
    this._cpuTimer = this._nextAttackDelay();
    this._cpuMoving = false;
  }

  _nextAttackDelay() {
    return CPU_ATTACK_INTERVAL_MIN +
      Math.random() * (CPU_ATTACK_INTERVAL_MAX - CPU_ATTACK_INTERVAL_MIN);
  }

  // Called each frame by FightScene when isCPURound === true
  updateCPU(delta, target) {
    if (!this.isAlive || !target || !target.isAlive) return;
    if (this.state === STATES.HIT || this.state === STATES.KO) return;

    const dist = Math.abs(this.x - target.x);

    // Move toward target until in range
    if (dist > CPU_ENGAGE_DISTANCE) {
      if (target.x < this.x) this.moveLeft();
      else                    this.moveRight();
    } else {
      this.stopMoving();
    }

    // Countdown to next attack
    this._cpuTimer -= delta;
    if (this._cpuTimer <= 0 && dist <= CPU_ENGAGE_DISTANCE + 40) {
      // 40% light, 35% heavy, 25% do nothing this cycle (feint)
      const roll = Math.random();
      if      (roll < 0.40) this.lightAttack();
      else if (roll < 0.75) this.heavyAttack();
      this._cpuTimer = this._nextAttackDelay();
    }

    // Face the target every frame
    this.faceOpponent(target);
  }
}
