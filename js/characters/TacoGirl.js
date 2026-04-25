// Config at top for easy tuning
const TACO_GIRL_CONFIG = {
  name:           'Taco Girl',
  color:          0xFF69B4,  // hot pink fallback
  width:          80,
  height:         100,
  displayWidth:   145,
  displayHeight:  145,
  maxHp:          100,
  moveSpeed:      300,       // slightly faster than Taco Boy
  jumpSpeed:      620,
  knockbackSpeed: 310,
  lightDamage:    8,
  heavyDamage:    20,
  lightCooldown:  200,
  heavyCooldown:  800,

  // CPU tuning (used in 1P mode)
  cpuEngageDistance:    110,
  cpuAttackIntervalMin: 1100,
  cpuAttackIntervalMax: 2000,

  textures: {
    IDLE:         'tg_idle',
    WALK:         'tg_walk',
    JUMP:         'tg_jump',
    ATTACK_LIGHT: 'tg_light_attack',
    ATTACK_HEAVY: 'tg_heavy_attack',
    BLOCK:        'tg_block',
    HIT:          'tg_hit',
    KO:           'tg_ko',
  },

  victoryTextureKey: 'tg_victory',
};

// Player 2: Left/Right = move, Up = jump, K = light, L = heavy, Down = block
class TacoGirl extends Fighter {
  constructor(scene, x, y) {
    super(scene, x, y, TACO_GIRL_CONFIG);
  }
}
