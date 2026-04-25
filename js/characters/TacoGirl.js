// Config at top for easy tuning
const TACO_GIRL_CONFIG = {
  name:           'Taco Girl',
  textureKey:     'tacoGirl',
  color:          0xFF69B4,  // hot pink
  width:          80,
  height:         100,
  maxHp:          100,
  moveSpeed:      300,       // slightly faster than Taco Boy
  jumpSpeed:      620,
  knockbackSpeed: 310,
  lightDamage:    8,
  heavyDamage:    20,
  lightCooldown:  200,
  heavyCooldown:  800,
};

// Player 2: Left/Right = move, Up = jump, K = light, L = heavy, Down = block
class TacoGirl extends Fighter {
  constructor(scene, x, y) {
    // TODO: SPRITE SWAP — load spritesheet 'tacoGirl' in BootScene, use frame 0 here
    super(scene, x, y, TACO_GIRL_CONFIG);
  }
}
