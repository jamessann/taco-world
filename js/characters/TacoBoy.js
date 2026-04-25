// Config at top for easy tuning
const TACO_BOY_CONFIG = {
  name:           'Taco Boy',
  color:          0xF4A460,   // sandy brown fallback (shown if sprites not loaded)
  width:          80,         // physics body width
  height:         100,        // physics body height
  displayWidth:   145,        // sprite display size (square, matches image aspect ratio)
  displayHeight:  145,
  maxHp:          100,
  moveSpeed:      280,
  jumpSpeed:      600,
  knockbackSpeed: 320,
  lightDamage:    8,
  heavyDamage:    20,
  lightCooldown:  200,        // ms
  heavyCooldown:  800,        // ms

  // One texture key per state — loaded in BootScene, white-stripped automatically.
  // TODO: SPRITE SWAP — update keys here if filenames change
  textures: {
    IDLE:         'tb_idle',
    WALK:         'tb_walk',
    JUMP:         'tb_jump',
    ATTACK_LIGHT: 'tb_light_attack',
    ATTACK_HEAVY: 'tb_heavy_attack',
    BLOCK:        'tb_block',
    HIT:          'tb_hit',
    KO:           'tb_ko',
  },

  // Shown on the GameOver screen when Taco Boy wins
  victoryTextureKey: 'tb_victory',
};

// Player 1: A/D = move, W = jump, F = light, G = heavy, S = block
class TacoBoy extends Fighter {
  constructor(scene, x, y) {
    super(scene, x, y, TACO_BOY_CONFIG);
  }
}
