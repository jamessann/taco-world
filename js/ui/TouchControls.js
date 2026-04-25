// ─── TouchControls ────────────────────────────────────────────────────────────
// On-screen joystick + two attack buttons for each player.
// Works alongside the existing keyboard controls — both can be used at once.
//
// Layout (1024 × 600 canvas):
//   P1  joystick left side,  buttons to its right
//   P2  joystick right side, buttons to its left

class TouchControls {
  constructor(scene, fighter1, fighter2) {
    this.scene    = scene;
    this.fighters = [fighter1, fighter2];

    // Allow up to 8 simultaneous touch points (2 joysticks + 4 buttons + spare)
    scene.input.addPointer(7);

    // ── Layout ──────────────────────────────────────────────────────────────
    this._JR = 48;   // joystick ring radius
    this._TR = 22;   // thumb knob radius
    this._BR = 30;   // button radius

    // Fixed joystick base centres
    this._joyBase = [
      { cx: 95,  cy: 548 },   // P1 — bottom-left
      { cx: 929, cy: 548 },   // P2 — bottom-right
    ];

    // Per-player buttons  [label, fill colour, fighter method to call]
    this._btnDefs = [
      [
        { cx: 213, cy: 566, label: 'A', color: 0x2299ff, action: 'light' },
        { cx: 268, cy: 534, label: 'B', color: 0xff5533, action: 'heavy' },
      ],
      [
        { cx: 811, cy: 566, label: 'A', color: 0x2299ff, action: 'light' },
        { cx: 756, cy: 534, label: 'B', color: 0xff5533, action: 'heavy' },
      ],
    ];

    // ── Runtime joystick state (one entry per player) ────────────────────────
    // pid   — pointer id currently owning this joystick (null = untouched)
    // ox/oy — world coords where the touch started
    // dx/dy — current offset from origin (clamped visually; raw for logic)
    this._joy = [
      { pid: null, ox: 0, oy: 0, dx: 0, dy: 0 },
      { pid: null, ox: 0, oy: 0, dx: 0, dy: 0 },
    ];

    this._buildUI();
    this._bindInput();

    // Hook into the scene update loop
    scene.events.on('update', this._tick, this);
    scene.events.once('shutdown', this._teardown, this);
  }

  // ── Public ──────────────────────────────────────────────────────────────────

  /** True while a finger is on player p's joystick (0 = P1, 1 = P2). */
  joystickActive(p) {
    return this._joy[p].pid !== null;
  }

  // ── UI construction ──────────────────────────────────────────────────────────

  _buildUI() {
    const scene = this.scene;

    // Static rings + buttons — drawn once
    const g = scene.add.graphics().setDepth(100).setScrollFactor(0);
    this._staticGfx = g;

    // Thumb knobs — redrawn each frame
    this._thumbGfx = [
      scene.add.graphics().setDepth(101).setScrollFactor(0),
      scene.add.graphics().setDepth(101).setScrollFactor(0),
    ];

    for (let p = 0; p < 2; p++) {
      if (!this.fighters[p]) continue;  // no human fighter → skip controls

      const jb = this._joyBase[p];

      // Joystick outer ring
      g.fillStyle(0x000000, 0.28);
      g.fillCircle(jb.cx, jb.cy, this._JR);
      g.lineStyle(2, 0xffffff, 0.35);
      g.strokeCircle(jb.cx, jb.cy, this._JR);

      // Attack buttons
      for (const btn of this._btnDefs[p]) {
        g.fillStyle(btn.color, 0.78);
        g.fillCircle(btn.cx, btn.cy, this._BR);
        g.lineStyle(2, 0xffffff, 0.55);
        g.strokeCircle(btn.cx, btn.cy, this._BR);

        scene.add.text(btn.cx, btn.cy, btn.label, {
          fontSize: '17px',
          fontFamily: 'Arial Black, Arial',
          fill: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3,
        }).setOrigin(0.5).setDepth(102).setScrollFactor(0);
      }
    }

    this._redrawThumbs();
  }

  // Redraws both thumb knobs at their current positions (called every frame)
  _redrawThumbs() {
    for (let p = 0; p < 2; p++) {
      if (!this.fighters[p]) continue;

      const g  = this._thumbGfx[p];
      const jb = this._joyBase[p];
      const j  = this._joy[p];

      // Clamp thumb position inside the ring
      const maxR = this._JR - this._TR;
      let tx = jb.cx + j.dx;
      let ty = jb.cy + j.dy;
      const dist = Math.sqrt(j.dx * j.dx + j.dy * j.dy);
      if (dist > maxR) {
        tx = jb.cx + (j.dx / dist) * maxR;
        ty = jb.cy + (j.dy / dist) * maxR;
      }

      g.clear();
      g.fillStyle(0xffffff, 0.62);
      g.fillCircle(tx, ty, this._TR);
      g.lineStyle(2, 0x000000, 0.28);
      g.strokeCircle(tx, ty, this._TR);
    }
  }

  // ── Pointer event binding ─────────────────────────────────────────────────────

  _bindInput() {
    const s = this.scene;
    s.input.on('pointerdown', this._onDown, this);
    s.input.on('pointermove', this._onMove, this);
    s.input.on('pointerup',   this._onUp,   this);
  }

  _onDown(ptr) {
    const px = ptr.x;
    const py = ptr.y;

    for (let p = 0; p < 2; p++) {
      // ── Joystick zone? ──
      const jb  = this._joyBase[p];
      const jdx = px - jb.cx;
      const jdy = py - jb.cy;
      const jd  = Math.sqrt(jdx * jdx + jdy * jdy);

      if (jd <= this._JR + 18 && this._joy[p].pid === null) {
        const j  = this._joy[p];
        j.pid = ptr.id;
        j.ox  = px;
        j.oy  = py;
        j.dx  = 0;
        j.dy  = 0;
        return;   // one action per pointer tap
      }

      // ── Button zone? ──
      for (const btn of this._btnDefs[p]) {
        const bdx = px - btn.cx;
        const bdy = py - btn.cy;
        if (Math.sqrt(bdx * bdx + bdy * bdy) <= this._BR + 10) {
          this._fire(p, btn.action);
          return;
        }
      }
    }
  }

  _onMove(ptr) {
    for (let p = 0; p < 2; p++) {
      const j = this._joy[p];
      if (j.pid === ptr.id) {
        j.dx = ptr.x - j.ox;
        j.dy = ptr.y - j.oy;
      }
    }
  }

  _onUp(ptr) {
    for (let p = 0; p < 2; p++) {
      const j = this._joy[p];
      if (j.pid === ptr.id) {
        j.pid = null;
        j.dx  = 0;
        j.dy  = 0;
      }
    }
  }

  _fire(p, action) {
    const f = this.fighters[p];
    if (!f) return;
    if (action === 'light') f.lightAttack();
    if (action === 'heavy') f.heavyAttack();
  }

  // ── Per-frame update ──────────────────────────────────────────────────────────

  _tick() {
    // Only drive fighters while the round is active
    if (this.scene.gameState === 'FIGHTING') {
      for (let p = 0; p < 2; p++) {
        const j = this._joy[p];
        const f = this.fighters[p];
        if (!f) continue;

        if (j.pid !== null) {
          const { dx, dy } = j;

          // Up flick → jump (only triggers from ground)
          if (dy < -22 && f.isOnGround()) {
            f.jump();
          }

          // Horizontal (also works in the air for air-steering)
          if (dx < -14) {
            f.moveLeft();
          } else if (dx > 14) {
            f.moveRight();
          } else {
            // Stick centred — stop horizontal movement
            f.stopMoving();
          }
        }
        // Note: when pid === null the keyboard handler's stopMoving() takes over,
        // so we don't double-call it here.
      }
    }

    this._redrawThumbs();
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────────

  _teardown() {
    const s = this.scene;
    s.events.off('update',      this._tick,    this);
    s.input.off('pointerdown',  this._onDown,  this);
    s.input.off('pointermove',  this._onMove,  this);
    s.input.off('pointerup',    this._onUp,    this);
  }
}
