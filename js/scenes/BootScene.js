class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Stage background
    this.load.image('stageBg', 'assets/game-stage.png');

    // ── Taco Boy frames ──────────────────────────────────────────────────────
    this.load.image('tb_idle',          'assets/tb-01-taco-boy-idle-base.png');
    this.load.image('tb_walk',          'assets/tb-02-taco-boy-walk.png');
    this.load.image('tb_walk_alt',      'assets/tb-03-taco-boy-walk.png');    // alternate walk frame
    this.load.image('tb_jump',          'assets/tb-03-taco-boy-jump.png');
    this.load.image('tb_jump_land',     'assets/tb-04-taco-boy-jump-land.png');
    this.load.image('tb_light_wind',    'assets/tb-05-taco-boy-light-attack-winding.png');
    this.load.image('tb_light_attack',  'assets/tb-06-taco-boy-light-attack-hit-frame.png');
    this.load.image('tb_heavy_wind',    'assets/tb-07-taco-boy-heavy-attack-winding.png');
    this.load.image('tb_heavy_spin',    'assets/tb-08-taco-boy-heavy-attack-spin.png');
    this.load.image('tb_heavy_attack',  'assets/tb-09-taco-boy-heavy-attack-hitframe.png');
    this.load.image('tb_block',         'assets/tb-10-taco-boy-block.png');
    this.load.image('tb_hit',           'assets/tb-11-taco-boy-hit-reaction.png');
    this.load.image('tb_dizzy',         'assets/tb-12-taco-boy-dizzy.png');
    this.load.image('tb_ko',            'assets/tb-13-taco-boy-ko-falling.png');
    this.load.image('tb_ko_down',       'assets/tb-14-taco-boy-ko-down.png');
    this.load.image('tb_victory',       'assets/tb-15-taco-boy-victory.png');
    this.load.image('tb_crouch',        'assets/tb-16-taco-boy-crouch-idle-blink.png');

    // TODO: SPRITE SWAP — add Taco Girl and Giant Taco spritesheets here:
    // this.load.image('tg_idle', 'assets/tg-idle.png');
    // this.load.image('gt_idle', 'assets/gt-idle.png');
    // this.load.audio('bgMusic',   'assets/music.mp3');
    // this.load.audio('sfxHit',    'assets/hit.mp3');
    // this.load.audio('sfxKO',     'assets/ko.mp3');
  }

  create() {
    this.scene.start('MenuScene');
  }
}
