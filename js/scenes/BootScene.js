class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Stage backgrounds
    this.load.image('stageBg',      'assets/game-stage.png');
    this.load.image('introBg',      'assets/intro-stage.png');
    this.load.image('roundWinBg',   'assets/round-win-stage.png');
    this.load.image('gameOverBg',   'assets/game-over-stage.png');

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

    // ── Taco Girl frames ─────────────────────────────────────────────────────
    this.load.image('tg_idle',         'assets/tb-01-taco-girl-idle-base.png');
    this.load.image('tg_walk',         'assets/tb-02-taco-girl-walk.png');
    this.load.image('tg_walk_alt',     'assets/tb-03-taco-girl-walk.png');
    this.load.image('tg_jump',         'assets/tb-03-taco-girl-jump.png');
    this.load.image('tg_jump_land',    'assets/tb-04-taco-girl-jump-land.png');
    this.load.image('tg_light_wind',   'assets/tb-05-taco-girl-light-attack-winding.png');
    this.load.image('tg_light_attack', 'assets/tb-06-taco-girl-light-attack-hit-frame.png');
    this.load.image('tg_heavy_wind',   'assets/tb-07-taco-girl-heavy-attack-winding.png');
    this.load.image('tg_heavy_spin',   'assets/tb-08-taco-girl-heavy-attack-spin.png');
    this.load.image('tg_heavy_attack', 'assets/tb-09-taco-girl-heavy-attack-hitframe.png');
    this.load.image('tg_block',        'assets/tb-10-taco-girl-block.png');
    this.load.image('tg_hit',          'assets/tb-11-taco-girl-hit-reaction.png');
    this.load.image('tg_dizzy',        'assets/tb-12-taco-girl-dizzy.png');
    this.load.image('tg_ko',           'assets/tb-13-taco-girl-ko-falling.png');
    this.load.image('tg_ko_down',      'assets/tb-14-taco-girl-ko-down.png');
    this.load.image('tg_victory',      'assets/tb-15-taco-girl-victory.png');

    // ── Giant Taco Boss frames ────────────────────────────────────────────────
    this.load.image('gt_idle',         'assets/tb-01-taco-boss-idle-base.png');
    this.load.image('gt_idle_blink',   'assets/tb-02-taco-boss-idle-blink.png');
    this.load.image('gt_walk',         'assets/tb-03-taco-boss-walk.png');
    this.load.image('gt_walk_alt',     'assets/tb-04-taco-boss-walk-2.png');
    this.load.image('gt_light_wind',   'assets/tb-05-taco-boss-chomp-attack-open.png');
    this.load.image('gt_light_attack', 'assets/tb-06-taco-boss-chomp-attack-closed.png');
    this.load.image('gt_heavy_wind',   'assets/tb-07-taco-boss-charge-slam-windup.png');
    this.load.image('gt_heavy_attack', 'assets/tb-08-taco-boss-charge-slam-hit-frame.png');
    this.load.image('gt_heavy_recover','assets/tb-09-taco-boss-charge-slam-recovery.png');
    this.load.image('gt_block',        'assets/tb-10-taco-boss-charge-block.png');
    this.load.image('gt_hit',          'assets/tb-11-taco-boss-hit-reaction.png');
    this.load.image('gt_ko',           'assets/tb-12-taco-boss-ko-falling.png');
    this.load.image('gt_ko_down',      'assets/tb-13-taco-boss-ko-down.png');

    // this.load.audio('bgMusic',   'assets/music.mp3');
    // this.load.audio('sfxHit',    'assets/hit.mp3');
    // this.load.audio('sfxKO',     'assets/ko.mp3');
  }

  create() {
    this.scene.start('MenuScene');
  }
}
