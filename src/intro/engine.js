// A tiny side-scrolling platformer used as the site's intro.
// Pure logic + canvas drawing; the React wrapper (IntroGame.jsx) owns input,
// resizing and the HTML overlay (speech bubbles, comic sound words, HUD).
// Everything is drawn procedurally: no sprite sheets.
import {
  WORLD_H, GROUND_Y, LEVEL_END, GROUND, TUNNEL, PLATFORMS, MOVERS, CRATES, PIPES,
  STARS, DRONES, POWERUPS, BEACONS, TALK, PAD_X0, PAD_X1, ROCKET_X, BOARD_X, SECTIONS,
} from './level.js';

// --- feel ---------------------------------------------------------------------
// Heavier than v1: stronger gravity, a faster fall than rise, slow wind-up to
// full speed, skids when reversing, and a heavy landing costs you speed.
const GRAV_UP = 1500;
const GRAV_DOWN = 2150;
const GRAV_APEX = 950; // brief hang at the top while jump is held
const JUMP_V = 345; // ~40 px apex
const JUMP_CUT = 0.45; // releasing jump early cuts the rise
const DOUBLE_V = 300; // jet boots second jump
const HOVER_G = 520; // jet boots: holding jump while falling
const HOVER_FUEL = 0.7; // seconds of hover per air time
const RUN = 100;
const ACCEL = 470; // 0 -> full speed in ~0.2 s
const TURN = 1150; // reversing (skid)
const DECEL = 720;
const AIR_ACCEL = 300;
const AIR_DRAG = 140;
const MAX_FALL = 400;
const HEAVY_LAND = 330;
const COYOTE = 0.08;
const BUFFER = 0.1;
const PW = 10;
const PH = 15;
const MAGNET_T = 12;
const JET_T = 16;

const COL = {
  skyTop: '#02040a',
  skyBottom: '#0b1733',
  farHill: '#0b1630',
  nearHill: '#101f3d',
  ground: '#343c50',
  groundDark: '#262d3e',
  groundTop: '#8c96aa',
  rock: '#4a5368',
  hillRock: '#1f2638',
  hillRockHi: '#2c3549',
  tunnelWall: '#121827',
  tunnelPanel: '#182033',
  girder: '#2b3a55',
  girderEdge: '#5eead4',
  crate: '#5a3e1a',
  crateEdge: '#f5a623',
  pipe: '#4b5a74',
  pipeHi: '#7486a3',
  pipeDark: '#2c374b',
  star: '#ffd75e',
  starHi: '#fff6c9',
  suit: '#e9eef6',
  suitShade: '#aab4c5',
  visor: '#f5a623',
  visorHi: '#ffe2a8',
  pack: '#7d8aa3',
  outline: '#1d2433',
  boot: '#3a4256',
  cyan: '#5eead4',
  amber: '#f5a623',
  red: '#ff5c5c',
};

// --- helpers ------------------------------------------------------------------
const approach = (v, target, step) => (v < target ? Math.min(v + step, target) : Math.max(v - step, target));
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const PIPE_W = 14;
const SOLIDS = [
  ...GROUND.map(([x0, x1]) => ({ x: x0, y: GROUND_Y, w: x1 - x0, h: 400 })),
  ...CRATES.map(([x, y, w, h]) => ({ x, y, w, h })),
  ...PIPES.map((p) => ({ x: p.x, y: GROUND_Y - p.h, w: PIPE_W, h: p.h })),
  { x: TUNNEL.x0, y: -600, w: TUNNEL.x1 - TUNNEL.x0, h: 600 + TUNNEL.ceil }, // tunnel roof
];
const ONE_WAY = PLATFORMS.map(([x, y, w]) => ({ x, y, w, h: 6 }));

const STAR_WRAP_W = 640;
const STAR_WRAP_H = 420;
const SKY_STARS = [[0.04, 70, 0.45], [0.1, 45, 0.7], [0.22, 22, 1]].map(([f, n, b], i) => {
  const r = rng(11 + i * 97);
  return { f, b, pts: Array.from({ length: n }, () => [r() * STAR_WRAP_W, r() * STAR_WRAP_H, r() * 6.28]) };
});
const hill = (x, a, b, c) => Math.sin(x * a) * 9 + Math.sin(x * b + 1.7) * 6 + Math.sin(x * c + 4.1) * 3;

function moverPos(m, t) {
  const s = Math.sin((t / m.period) * Math.PI * 2 + m.phase);
  return { x: m.x + m.ax * s, y: m.y + m.ay * s };
}
const ventOn = (p, t) => p.vent && ((t + p.phase) % 2.4) < 0.8;

// --- state --------------------------------------------------------------------
export function createGame() {
  return {
    t: 0,
    phase: 'play', // play -> board -> count -> launch -> done
    phaseT: 0,
    p: {
      x: 44, y: GROUND_Y - PH, vx: 0, vy: 0, onGround: true, coyote: 0, buffer: 0, facing: 1,
      invuln: 0, anim: 0, hidden: false, sq: 0, sqv: 0, skid: false, dust: 0, jetReady: false,
      fuel: HOVER_FUEL, hovering: false, mover: -1, landLock: 0, idle: 0,
    },
    checkpoint: BEACONS[0],
    stars: STARS.map(([x, y]) => ({ x, y, got: false })),
    collected: 0,
    drones: DRONES.map(([x0, x1, y]) => ({ x: (x0 + x1) / 2, x0, x1, y, dir: -1, alive: true })),
    powerups: POWERUPS.map((u) => ({ ...u, got: false })),
    powers: { magnet: 0, jet: 0 },
    movers: MOVERS.map((m) => ({ ...moverPos(m, 0), px: 0, py: 0, w: m.w, def: m })),
    talkDone: TALK.map(() => false),
    bubble: null, // { text, t, dur, anchor }
    bubbleQueue: [
      { text: "Hi, I'm Bishwa!", dur: 2.4, delay: 0.5 },
      { text: 'Help me reach the launch pad.', dur: 2.6 },
    ],
    pops: [], // comic sound words { x, y, text, t, kind }
    particles: [],
    rocket: { y: 0, v: 0 },
    cam: { x: 0, y: 0 },
    camRender: { x: 0, y: 0 },
    shake: 0,
    moved: false,
    meteor: null,
    meteorT: 3,
    section: 0,
    steamWarned: false,
  };
}

export const PLAYER_SIZE = { w: PW, h: PH };
export const SECTION_NAMES = SECTIONS.map((s) => s.name);

function say(g, text, dur = 2.4, anchor = 'player') {
  g.bubbleQueue.push({ text, dur, anchor });
}
function pop(g, x, y, text, kind = 'sfx') {
  g.pops.push({ x, y, text, t: 0, kind });
  if (g.pops.length > 6) g.pops.shift();
}

function burst(g, x, y, colors, n, speed = 90, life = 0.5, grav = 200) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.3 + Math.random() * 0.7);
    g.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life, color: colors[i % colors.length], size: 1, grav });
  }
}
function dust(g, x, y, dir, n = 1) {
  for (let i = 0; i < n; i++) {
    g.particles.push({
      x: x + (Math.random() - 0.5) * 4, y: y - 1, vx: -dir * (10 + Math.random() * 25), vy: -8 - Math.random() * 14,
      life: 0.35, max: 0.35, color: Math.random() < 0.5 ? '#8c96aa' : '#5d667a', size: 2, grav: 30, smoke: true,
    });
  }
}
function jetFlame(g, p) {
  const bx = p.facing > 0 ? p.x + 1 : p.x + PW - 1;
  g.particles.push({
    x: bx, y: p.y + PH - 2, vx: (Math.random() - 0.5) * 14, vy: 50 + Math.random() * 50,
    life: 0.22, max: 0.22, color: Math.random() < 0.5 ? COL.amber : '#fff3c4', size: 2, grav: 0,
  });
}

// --- update -------------------------------------------------------------------
export function update(g, input, dtRaw, view) {
  // rAF timestamps can precede the performance.now() taken at start: never step backwards.
  const dt = Math.max(0, Math.min(dtRaw, 1 / 30));
  g.t += dt;
  g.phaseT += dt;
  const p = g.p;

  // Lifts move first so the player can ride them this frame.
  for (const m of g.movers) {
    const pos = moverPos(m.def, g.t);
    m.px = m.x; m.py = m.y;
    m.x = pos.x; m.y = pos.y;
  }

  if (g.phase === 'play') stepPlayer(g, input, dt);
  else if (g.phase === 'board') {
    const door = ROCKET_X + 5;
    p.facing = 1;
    p.vx = approach(p.vx, RUN * 0.6, ACCEL * dt);
    if (!p.onGround) stepPlayer(g, { left: false, right: true, jumpHeld: false, jumpQueued: false }, dt);
    else p.x += p.vx * dt;
    p.anim += dt * Math.abs(p.vx) * 0.11;
    if (p.x >= door) {
      p.x = door;
      p.hidden = true;
      burst(g, ROCKET_X + 8, GROUND_Y - 10, [COL.cyan, '#ffffff'], 8, 40, 0.4, 0);
      setPhase(g, 'count');
      g.bubble = null;
      g.bubbleQueue = [{ text: 'See you in orbit!', dur: 2.3, anchor: 'rocket' }];
    }
  } else if (g.phase === 'count') {
    if (g.phaseT > 1.0 && Math.random() < 0.5) smoke(g, 0.6);
    if (g.phaseT >= 2.4) setPhase(g, 'launch');
  } else if (g.phase === 'launch') {
    const r = g.rocket;
    r.v -= (40 + 170 * g.phaseT) * dt;
    r.y += r.v * dt;
    g.shake = Math.max(0, 1.6 - g.phaseT) * 1.2;
    const by = GROUND_Y + r.y;
    for (let i = 0; i < 4; i++) {
      g.particles.push({
        x: ROCKET_X + 10 + (Math.random() - 0.5) * 6, y: by,
        vx: (Math.random() - 0.5) * 40, vy: 90 + Math.random() * 90,
        life: 0.35, max: 0.35, color: ['#fff3c4', COL.star, COL.amber, COL.red][i], size: 2, grav: 0, flame: true,
      });
    }
    if (g.phaseT < 1.8) smoke(g, 1);
    if (g.phaseT >= 2.8) setPhase(g, 'done');
  }

  // Squash-and-stretch spring (underdamped: a little wobble after landing).
  p.sqv += (-p.sq * 260 - p.sqv * 16) * dt;
  p.sq += p.sqv * dt;

  // Drones patrol; their eye tracks the astronaut.
  for (const d of g.drones) {
    if (!d.alive) continue;
    d.x += d.dir * 28 * dt;
    if (d.x < d.x0) { d.x = d.x0; d.dir = 1; }
    if (d.x > d.x1) { d.x = d.x1; d.dir = -1; }
  }

  // Steam from vent pipes.
  for (const v of PIPES) {
    if (ventOn(v, g.t) && Math.random() < 0.7) {
      g.particles.push({
        x: v.x + 4 + Math.random() * 6, y: GROUND_Y - v.h, vx: (Math.random() - 0.5) * 10, vy: -50 - Math.random() * 40,
        life: 0.55, max: 0.55, color: Math.random() < 0.5 ? '#c9d3e2' : '#8c96aa', size: 2, grav: 20, smoke: true,
      });
    }
  }

  // Power-up timers.
  g.powers.magnet = Math.max(0, g.powers.magnet - dt);
  g.powers.jet = Math.max(0, g.powers.jet - dt);

  // Particles.
  for (const q of g.particles) {
    q.life -= dt;
    q.vy += q.grav * dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    if (q.flame && q.y > GROUND_Y) {
      q.y = GROUND_Y;
      if (q.vy > 0) q.vx = (Math.random() < 0.5 ? -1 : 1) * (60 + q.vy * 0.6);
      q.vy = 0;
    }
  }
  g.particles = g.particles.filter((q) => q.life > 0);
  if (g.particles.length > 700) g.particles.splice(0, g.particles.length - 700);

  for (const q of g.pops) q.t += dt;
  g.pops = g.pops.filter((q) => q.t < 0.9);

  // Speech bubbles: one at a time, from a queue.
  if (g.bubble) {
    g.bubble.t += dt;
    if (g.bubble.t >= g.bubble.dur) g.bubble = null;
  } else if (g.bubbleQueue.length) {
    const next = g.bubbleQueue[0];
    if ((next.delay || 0) > 0) next.delay -= dt;
    else g.bubble = { anchor: 'player', ...g.bubbleQueue.shift(), t: 0 };
  }

  // Shooting stars every few seconds.
  g.meteorT -= dt;
  if (g.meteorT <= 0) {
    g.meteorT = 5 + Math.random() * 5;
    g.meteor = { x: Math.random() * view.w * 0.8 + view.w * 0.2, y: Math.random() * 40, life: 0.7 };
  }
  if (g.meteor) {
    g.meteor.life -= dt;
    g.meteor.x -= 220 * dt;
    g.meteor.y += 90 * dt;
    if (g.meteor.life <= 0) g.meteor = null;
  }

  let sec = 0;
  for (let i = 0; i < SECTIONS.length; i++) if (p.x >= SECTIONS[i].x) sec = i;
  g.section = sec;

  g.shake = Math.max(0, g.shake - dt * 4);
  updateCamera(g, view, dt);
}

function setPhase(g, phase) {
  g.phase = phase;
  g.phaseT = 0;
}

function smoke(g, k) {
  const x = ROCKET_X + 10 + (Math.random() - 0.5) * 30;
  g.particles.push({
    x, y: GROUND_Y - 2 + Math.min(0, g.rocket.y * 0.2),
    vx: (x - ROCKET_X - 10) * 2.2, vy: -10 - Math.random() * 20 * k,
    life: 1.4, max: 1.4, color: Math.random() < 0.5 ? '#8a93a6' : '#5d667a', size: 3, grav: -6, smoke: true,
  });
}

function stepPlayer(g, input, dt) {
  const p = g.p;
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (dir) { p.facing = dir; g.moved = true; }

  // Ride a lift: carry the astronaut by the lift's motion since last frame.
  if (p.mover >= 0 && p.onGround) {
    const m = g.movers[p.mover];
    p.x += m.x - m.px;
    p.y += m.y - m.py;
  }

  // Horizontal: slow wind-up, skid on reversal, low air control.
  p.landLock = Math.max(0, p.landLock - dt);
  const max = RUN * (p.landLock > 0 ? 0.55 : 1);
  p.skid = false;
  if (p.onGround) {
    if (dir && Math.sign(p.vx) === -dir && Math.abs(p.vx) > 45) {
      p.vx = approach(p.vx, dir * max, TURN * dt);
      p.skid = true;
    } else if (dir) p.vx = approach(p.vx, dir * max, ACCEL * dt);
    else p.vx = approach(p.vx, 0, DECEL * dt);
  } else if (dir) p.vx = approach(p.vx, dir * RUN, AIR_ACCEL * dt);
  else p.vx = approach(p.vx, 0, AIR_DRAG * dt);

  // Jump: buffer + coyote time; jet boots add a second jump and a hover.
  if (input.jumpQueued) { p.buffer = BUFFER; input.jumpQueued = false; g.moved = true; }
  else p.buffer -= dt;
  p.coyote = p.onGround ? COYOTE : p.coyote - dt;

  const jet = g.powers.jet > 0;
  if (p.buffer > 0 && p.coyote > 0) {
    p.vy = -JUMP_V;
    p.buffer = 0;
    p.coyote = 0;
    p.onGround = false;
    p.mover = -1;
    p.cut = false;
    p.sq = 0.24; p.sqv = 0;
    dust(g, p.x + PW / 2, p.y + PH, p.facing, 3);
  } else if (p.buffer > 0 && !p.onGround && jet && p.jetReady) {
    p.vy = -DOUBLE_V;
    p.buffer = 0;
    p.jetReady = false;
    p.cut = false;
    p.sq = 0.2; p.sqv = 0;
    for (let i = 0; i < 8; i++) jetFlame(g, p);
    pop(g, p.x + PW / 2, p.y + PH + 4, 'WHOOSH');
  }
  if (!input.jumpHeld && p.vy < 0 && !p.cut) { p.vy *= JUMP_CUT; p.cut = true; }

  // Gravity: heavier on the way down, a short hang at the apex.
  let grav = p.vy < 0 ? GRAV_UP : GRAV_DOWN;
  if (input.jumpHeld && Math.abs(p.vy) < 45) grav = GRAV_APEX;
  p.hovering = false;
  if (jet && input.jumpHeld && p.vy > 0 && !p.onGround && !p.jetReady && p.fuel > 0) {
    grav = HOVER_G;
    p.vy = Math.min(p.vy, 90);
    p.fuel -= dt;
    p.hovering = true;
    if (Math.random() < 0.8) jetFlame(g, p);
  }
  p.vy = Math.min(p.vy + grav * dt, MAX_FALL);

  // Horizontal move, then resolve against solids.
  p.x += p.vx * dt;
  p.x = Math.max(0, Math.min(p.x, LEVEL_END - PW));
  let box = { x: p.x, y: p.y, w: PW, h: PH };
  for (const s of SOLIDS) {
    if (!overlap(box, s)) continue;
    p.x = p.vx > 0 ? s.x - PW : s.x + s.w;
    p.vx = 0;
    box.x = p.x;
  }

  // Vertical move.
  const wasGround = p.onGround;
  const impact = p.vy;
  const prevBottom = p.y + PH;
  p.y += p.vy * dt;
  p.onGround = false;
  p.mover = -1;
  box = { x: p.x, y: p.y, w: PW, h: PH };
  for (const s of SOLIDS) {
    if (!overlap(box, s)) continue;
    if (p.vy > 0) { p.y = s.y - PH; p.onGround = true; } else {
      p.y = s.y + s.h;
      if (p.vy < -60) { p.sq = -0.15; burst(g, p.x + PW / 2, p.y, ['#8c96aa'], 3, 30, 0.25, 80); }
    }
    p.vy = 0;
    box.y = p.y;
  }
  if (p.vy >= 0) {
    for (const s of ONE_WAY) {
      if (prevBottom <= s.y + 0.5 && p.y + PH >= s.y && p.x + PW > s.x && p.x < s.x + s.w) {
        p.y = s.y - PH; p.vy = 0; p.onGround = true;
      }
    }
    g.movers.forEach((m, i) => {
      if (prevBottom <= m.py + 1.5 && p.y + PH >= m.y && p.x + PW > m.x && p.x < m.x + m.w) {
        p.y = m.y - PH; p.vy = 0; p.onGround = true; p.mover = i;
      }
    });
  }

  if (p.onGround) {
    p.jetReady = true;
    p.fuel = HOVER_FUEL;
    if (!wasGround) {
      p.sq = -Math.min(0.38, 0.08 + impact / 1100);
      p.sqv = 0;
      dust(g, p.x + PW / 2, p.y + PH, 1, 2);
      dust(g, p.x + PW / 2, p.y + PH, -1, 2);
      if (impact > HEAVY_LAND) {
        p.landLock = 0.12;
        p.vx *= 0.5;
        g.shake = Math.max(g.shake, 1);
      }
    }
    if (Math.abs(p.vx) > 60 || p.skid) {
      p.dust -= dt;
      if (p.dust <= 0) { dust(g, p.x + PW / 2, p.y + PH, Math.sign(p.vx) || 1, p.skid ? 2 : 1); p.dust = p.skid ? 0.04 : 0.14; }
    }
  }

  p.anim += dt * (p.onGround ? Math.abs(p.vx) * 0.11 : 0);
  p.idle = p.onGround && Math.abs(p.vx) < 5 ? p.idle + dt : 0;
  p.invuln = Math.max(0, p.invuln - dt);

  // Fell into a pit: back to the last beacon.
  if (p.y > WORLD_H + 70) {
    p.x = g.checkpoint;
    p.y = GROUND_Y - PH - 20;
    p.vx = p.vy = 0;
    p.invuln = 1;
    pop(g, p.x + PW / 2, GROUND_Y - 30, 'OOPS!');
  }

  for (const b of BEACONS) if (p.x >= b && b > g.checkpoint) g.checkpoint = b;
  TALK.forEach((tk, i) => {
    if (!g.talkDone[i] && p.x >= tk.x) { g.talkDone[i] = true; say(g, tk.text); }
  });

  const cx = p.x + PW / 2;
  const cy = p.y + PH / 2;

  // Stars (the magnet pulls nearby ones in).
  for (const s of g.stars) {
    if (s.got) continue;
    if (g.powers.magnet > 0) {
      const dx = cx - s.x;
      const dy = cy - s.y;
      const d = Math.hypot(dx, dy);
      if (d < 70 && d > 0.1) {
        const k = Math.min(1, (190 * dt) / d);
        s.x += dx * k;
        s.y += dy * k;
      }
    }
    if (Math.abs(s.x - cx) > 9 || Math.abs(s.y - cy) > 11) continue;
    s.got = true;
    g.collected++;
    burst(g, s.x, s.y, [COL.star, COL.starHi, COL.amber], 10, 70, 0.45, 80);
    pop(g, s.x, s.y - 6, '+1', 'plus');
  }

  // Power-ups.
  for (const u of g.powerups) {
    if (u.got || Math.abs(u.x - cx) > 10 || Math.abs(u.y + Math.sin(g.t * 3) * 2 - cy) > 12) continue;
    u.got = true;
    burst(g, u.x, u.y, [COL.cyan, '#ffffff', COL.amber], 18, 100, 0.6, 0);
    if (u.type === 'magnet') { g.powers.magnet = MAGNET_T; say(g, 'Star magnet! Stars come to me.'); }
    else { g.powers.jet = JET_T; p.jetReady = true; say(g, 'Jet boots! Jump again in mid-air.', 2.8); }
    pop(g, u.x, u.y - 10, 'POWER UP!');
  }

  // Drones: stomp from above, otherwise get knocked back.
  for (const d of g.drones) {
    if (!d.alive) continue;
    const dy = d.y + Math.sin(g.t * 4 + d.x0) * 2;
    const db = { x: d.x - 6, y: dy, w: 12, h: 9 };
    if (!overlap({ x: p.x, y: p.y, w: PW, h: PH }, db)) continue;
    if (p.vy > 0 && p.y + PH - dy < 8) {
      d.alive = false;
      p.vy = input.jumpHeld ? -JUMP_V : -240;
      p.cut = !input.jumpHeld;
      p.sq = -0.2;
      p.jetReady = true;
      g.shake = Math.max(g.shake, 0.8);
      burst(g, d.x, dy + 4, ['#56637d', COL.cyan, COL.red], 16, 100, 0.55, 140);
      pop(g, d.x, dy - 4, Math.random() < 0.5 ? 'BONK!' : 'KLANG!');
    } else if (p.invuln <= 0) hurt(g, cx < d.x ? -1 : 1, 'OOF!');
  }

  // Steam vents knock you back.
  for (const v of PIPES) {
    if (!ventOn(v, g.t) || p.invuln > 0) continue;
    const steam = { x: v.x + 3, y: GROUND_Y - v.h - 30, w: PIPE_W - 6, h: 30 };
    if (overlap({ x: p.x, y: p.y, w: PW, h: PH }, steam)) {
      hurt(g, cx < v.x + PIPE_W / 2 ? -1 : 1, 'HISS!');
      if (!g.steamWarned) { g.steamWarned = true; say(g, 'Hot! Time the steam.'); }
    }
  }

  if (p.onGround && p.x >= BOARD_X) {
    setPhase(g, 'board');
    say(g, "Let's fly!", 1.4);
  }
}

function hurt(g, dir, word) {
  const p = g.p;
  p.invuln = 1.1;
  p.vx = dir * 160;
  p.vy = -200;
  p.cut = true;
  p.onGround = false;
  p.mover = -1;
  p.sq = 0.2;
  g.shake = Math.max(g.shake, 1);
  burst(g, p.x + PW / 2, p.y + PH / 2, [COL.red, '#ffffff'], 8, 70, 0.3, 0);
  pop(g, p.x + PW / 2, p.y - 6, word);
}

function updateCamera(g, view, dt) {
  const p = g.p;
  // Look ahead in the facing direction, so you see where you're running.
  const look = g.phase === 'play' ? p.facing * 26 : 0;
  const target = Math.max(0, Math.min(p.x + PW / 2 + look - view.w * 0.42, LEVEL_END - view.w));
  g.cam.x += (target - g.cam.x) * Math.min(1, dt * 3.5);
  if (g.phase === 'launch') {
    const rocketMid = GROUND_Y - 30 + g.rocket.y;
    g.cam.y = Math.min(0, rocketMid + view.offY - view.h * 0.5);
  } else {
    // Rise with the astronaut on high girders; never drop below the ground line.
    const screenY = p.y + view.offY;
    const ty = Math.min(0, screenY - view.h * 0.3);
    const want = screenY < view.h * 0.22 ? ty : 0;
    g.cam.y += (want - g.cam.y) * Math.min(1, dt * 3);
  }
}

// --- render -------------------------------------------------------------------
export function render(ctx, g, view, reducedMotion) {
  const { w, h, offY } = view;
  const shake = reducedMotion ? 0 : g.shake;
  const sx = shake ? Math.round((Math.random() - 0.5) * 2 * shake) : 0;
  const sy = shake ? Math.round((Math.random() - 0.5) * 2 * shake) : 0;
  const camX = Math.round(g.cam.x) - sx;
  const camY = Math.round(g.cam.y) - sy;
  g.camRender = { x: camX, y: camY };
  const oy = offY - camY; // world -> screen: (x - camX, y + oy)

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, COL.skyTop);
  grad.addColorStop(1, COL.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (const layer of SKY_STARS) {
    for (const [x, y, ph] of layer.pts) {
      const px = ((x - camX * layer.f) % STAR_WRAP_W + STAR_WRAP_W) % STAR_WRAP_W;
      const py = ((y - camY * layer.f * 2) % STAR_WRAP_H + STAR_WRAP_H) % STAR_WRAP_H;
      if (px >= w || py >= h) continue;
      const tw = reducedMotion ? 1 : 0.6 + 0.4 * Math.sin(g.t * 2 + ph);
      ctx.globalAlpha = layer.b * tw;
      ctx.fillStyle = '#dbe4f0';
      ctx.fillRect(px | 0, py | 0, 1, 1);
    }
  }
  ctx.globalAlpha = 1;

  // Shooting star and a slow satellite.
  if (g.meteor && !reducedMotion) {
    const m = g.meteor;
    for (let i = 0; i < 10; i++) {
      ctx.globalAlpha = (1 - i / 10) * Math.min(1, m.life * 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(m.x + i * 2.4), Math.round(m.y - i), 1, 1);
    }
    ctx.globalAlpha = 1;
  }
  const satX = ((g.t * 7) % (w + 40)) - 20;
  ctx.fillStyle = Math.floor(g.t * 2) % 2 ? '#dbe4f0' : '#6b7a94';
  ctx.fillRect(Math.round(satX), Math.round(18 + oy * 0.3), 1, 1);

  drawMoon(ctx, Math.round(w * 0.72 - camX * 0.03), Math.round(oy * 0.6 + 38), 20);
  drawHills(ctx, w, h, camX, oy, 0.25, GROUND_Y - 30, COL.farHill, [0.011, 0.023, 0.051]);
  drawHills(ctx, w, h, camX, oy, 0.5, GROUND_Y - 14, COL.nearHill, [0.017, 0.031, 0.067]);

  ctx.save();
  ctx.translate(-camX, oy);
  const viewL = camX - 40;
  const viewR = camX + w + 40;
  const vis = (x0, x1) => x1 > viewL && x0 < viewR;

  if (vis(0, 60)) drawHab(ctx, g.t);
  if (vis(TUNNEL.x0 - 20, TUNNEL.x1 + 20)) drawTunnelBack(ctx, g.t);
  if (vis(ROCKET_X, ROCKET_X + 60)) drawTower(ctx, g);
  for (const b of BEACONS) if (vis(b - 10, b + 10)) drawBeacon(ctx, b, g.checkpoint >= b, g.t);
  for (const s of ONE_WAY) if (vis(s.x, s.x + s.w)) drawGirder(ctx, s);
  g.movers.forEach((m) => { if (vis(m.x, m.x + m.w)) drawMover(ctx, m, g.t); });
  for (const [x, y, cw, ch] of CRATES) if (vis(x, x + cw)) drawCrate(ctx, x, y, cw, ch);
  const depth = Math.max(60, h - oy - GROUND_Y + 4);
  for (const [x0, x1] of GROUND) if (vis(x0, x1)) drawGround(ctx, x0, x1, depth);
  for (const v of PIPES) if (vis(v.x, v.x + PIPE_W)) drawPipe(ctx, v, g.t);
  if (vis(PAD_X0, PAD_X1)) drawPad(ctx, g.t);
  if (vis(TUNNEL.x0 - 20, TUNNEL.x1 + 20)) drawTunnelFront(ctx, g.t, -oy);

  for (const s of g.stars) if (!s.got && vis(s.x, s.x)) drawStar(ctx, s.x, s.y + Math.sin(g.t * 3 + s.x) * 1.5, g.t);
  for (const u of g.powerups) if (!u.got && vis(u.x, u.x)) drawPowerup(ctx, u, g.t);
  for (const d of g.drones) if (d.alive && vis(d.x - 8, d.x + 8)) drawDrone(ctx, d, g.t, g.p);

  for (const q of g.particles) if (q.smoke) drawParticle(ctx, q);
  if (vis(ROCKET_X - 10, ROCKET_X + 30) || g.phase === 'launch') drawRocket(ctx, g);
  if (!g.p.hidden && !(g.p.invuln > 0 && Math.floor(g.t * 12) % 2)) drawAstronaut(ctx, g);
  for (const q of g.particles) if (!q.smoke) drawParticle(ctx, q);

  ctx.restore();
}

function drawParticle(ctx, q) {
  ctx.globalAlpha = Math.max(0, q.life / q.max) * (q.smoke ? 0.5 : 1);
  ctx.fillStyle = q.color;
  const s = q.smoke ? q.size + (1 - q.life / q.max) * 5 : q.size;
  ctx.fillRect(Math.round(q.x - s / 2), Math.round(q.y - s / 2), Math.ceil(s), Math.ceil(s));
  ctx.globalAlpha = 1;
}

function disc(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.floor(Math.sqrt(r * r - dy * dy));
    ctx.fillRect(cx - half, cy + dy, half * 2 + 1, 1);
  }
}

function drawMoon(ctx, cx, cy, r) {
  ctx.globalAlpha = 0.12;
  disc(ctx, cx, cy, r + 4, '#cfd8e6');
  ctx.globalAlpha = 1;
  disc(ctx, cx, cy, r, '#c9cfda');
  disc(ctx, cx - 6, cy - 5, 5, '#aab2c1');
  disc(ctx, cx + 7, cy + 4, 4, '#aab2c1');
  disc(ctx, cx - 2, cy + 9, 3, '#b3bbc9');
  disc(ctx, cx + 9, cy - 8, 2, '#b3bbc9');
  ctx.globalAlpha = 0.35;
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.floor(Math.sqrt(r * r - dy * dy));
    const cut = Math.floor(half * 0.35);
    ctx.fillStyle = '#0b1733';
    ctx.fillRect(cx + half - cut, cy + dy, cut + 1, 1);
  }
  ctx.globalAlpha = 1;
}

function drawHills(ctx, w, h, camX, oy, f, base, color, k) {
  ctx.fillStyle = color;
  const shift = camX * f;
  for (let x = 0; x < w; x += 2) {
    const top = Math.round(base + hill(x + shift, k[0], k[1], k[2]) + oy);
    ctx.fillRect(x, top, 2, h - top);
  }
}

function hash(n) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

function drawGround(ctx, x0, x1, depth) {
  const y = GROUND_Y;
  ctx.fillStyle = COL.ground;
  ctx.fillRect(x0, y, x1 - x0, depth);
  ctx.fillStyle = COL.groundTop;
  ctx.fillRect(x0, y, x1 - x0, 2);
  ctx.fillStyle = '#5d667a';
  ctx.fillRect(x0, y + 2, x1 - x0, 1);
  for (let x = x0; x < x1; x += 6) {
    const r = hash(x);
    ctx.fillStyle = r < 0.5 ? COL.groundDark : COL.rock;
    ctx.fillRect(x + Math.floor(r * 4), y + 6 + Math.floor(hash(x + 3) * 20), 2 + Math.floor(r * 2), 1 + Math.floor(hash(x + 7) * 2));
    if (r > 0.82) {
      ctx.fillStyle = COL.groundDark;
      ctx.fillRect(x, y + 3, 5, 1);
    }
  }
  ctx.fillStyle = COL.groundDark;
  ctx.fillRect(x0, y, 1, depth);
  ctx.fillRect(x1 - 1, y, 1, depth);
}

function drawGirder(ctx, s) {
  ctx.fillStyle = COL.girder;
  ctx.fillRect(s.x, s.y, s.w, s.h);
  ctx.fillStyle = '#1a2438';
  for (let x = s.x + 2; x < s.x + s.w - 2; x += 6) {
    for (let i = 0; i < 4; i++) ctx.fillRect(x + i, s.y + 1 + i, 1, 1);
  }
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = COL.girderEdge;
  ctx.fillRect(s.x, s.y, s.w, 1);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#16203a';
  ctx.fillRect(s.x, s.y + s.h - 1, s.w, 1);
}

function drawMover(ctx, m, t) {
  const x = Math.round(m.x);
  const y = Math.round(m.y);
  // piston / cable hinting at how it moves
  ctx.fillStyle = '#3b465c';
  if (m.def.ay) ctx.fillRect(x + m.w / 2 - 1, y + 6, 2, GROUND_Y + 30 - y);
  else ctx.fillRect(x + m.w / 2, y - 60, 1, 60);
  drawGirder(ctx, { x, y, w: m.w, h: 6 });
  const on = Math.floor(t * 4) % 2 === 0;
  ctx.fillStyle = on ? COL.amber : '#6b4a1e';
  ctx.fillRect(x + 1, y + 2, 2, 2);
  ctx.fillRect(x + m.w - 3, y + 2, 2, 2);
}

function drawCrate(ctx, x, y, w, h) {
  for (let cy = y; cy < y + h; cy += 16) {
    for (let cx = x; cx < x + w; cx += 16) {
      ctx.fillStyle = COL.crate;
      ctx.fillRect(cx, cy, 16, 16);
      ctx.fillStyle = '#7a5523';
      for (let i = 2; i < 14; i++) {
        ctx.fillRect(cx + i, cy + i, 1, 1);
        ctx.fillRect(cx + 15 - i, cy + i, 1, 1);
      }
      ctx.fillStyle = COL.crateEdge;
      ctx.fillRect(cx, cy, 16, 1);
      ctx.fillRect(cx, cy + 15, 16, 1);
      ctx.fillRect(cx, cy, 1, 16);
      ctx.fillRect(cx + 15, cy, 1, 16);
    }
  }
}

function drawPipe(ctx, v, t) {
  const x = v.x;
  const top = GROUND_Y - v.h;
  ctx.fillStyle = COL.pipe;
  ctx.fillRect(x + 1, top + 3, PIPE_W - 2, v.h - 3);
  ctx.fillStyle = COL.pipeHi;
  ctx.fillRect(x + 3, top + 3, 2, v.h - 3);
  ctx.fillStyle = COL.pipeDark;
  ctx.fillRect(x + PIPE_W - 3, top + 3, 2, v.h - 3);
  // flange
  ctx.fillStyle = '#5d6c88';
  ctx.fillRect(x, top, PIPE_W, 3);
  ctx.fillStyle = COL.pipeDark;
  ctx.fillRect(x, top + 2, PIPE_W, 1);
  // hazard band + bolts
  ctx.fillStyle = COL.amber;
  for (let i = 0; i < PIPE_W - 2; i += 4) ctx.fillRect(x + 1 + i, top + 6, 2, 2);
  ctx.fillStyle = '#9aa6bd';
  ctx.fillRect(x + 1, top + 1, 1, 1);
  ctx.fillRect(x + PIPE_W - 2, top + 1, 1, 1);
  if (v.vent) {
    // valve wheel on the side + warning light
    const on = ventOn(v, t);
    const soon = !on && ((t + v.phase) % 2.4) > 1.9;
    ctx.fillStyle = on ? COL.red : soon ? COL.amber : '#3b2a2a';
    ctx.fillRect(x + 5, top + 10, 4, 2);
  }
}

function drawHab(ctx, t) {
  // the little home module the astronaut starts in front of
  const x = 0;
  const y = GROUND_Y;
  ctx.fillStyle = '#1d2638';
  for (let dy = 0; dy < 22; dy++) {
    const half = Math.floor(Math.sqrt(22 * 22 - (22 - dy) * (22 - dy)));
    ctx.fillRect(x + 26 - half, y - 22 + dy, half * 2, 1);
  }
  ctx.fillStyle = '#2b3650';
  ctx.fillRect(x + 4, y - 8, 44, 8);
  ctx.fillStyle = Math.sin(t * 1.5) > 0 ? COL.cyan : '#2f7f75';
  ctx.fillRect(x + 12, y - 15, 4, 3);
  ctx.fillRect(x + 20, y - 15, 4, 3);
  ctx.fillStyle = '#f5a623';
  ctx.fillRect(x + 32, y - 14, 6, 14); // door glow
  ctx.fillStyle = '#ffd59a';
  ctx.fillRect(x + 33, y - 13, 4, 12);
  ctx.fillStyle = '#56637d';
  ctx.fillRect(x + 25, y - 30, 1, 8);
  ctx.fillRect(x + 22, y - 31, 7, 1);
}

function drawTunnelBack(ctx, t) {
  const { x0, x1, ceil } = TUNNEL;
  ctx.fillStyle = COL.tunnelWall;
  ctx.fillRect(x0, ceil, x1 - x0, GROUND_Y - ceil);
  ctx.fillStyle = COL.tunnelPanel;
  for (let x = x0 + 4; x < x1 - 8; x += 24) {
    ctx.fillRect(x, ceil + 10, 20, GROUND_Y - ceil - 18);
  }
  // background pipework
  ctx.fillStyle = '#1f2a40';
  ctx.fillRect(x0, ceil + 6, x1 - x0, 2);
  ctx.fillRect(x0, ceil + 12, x1 - x0, 1);
  ctx.fillStyle = '#263248';
  for (let x = x0 + 30; x < x1; x += 90) ctx.fillRect(x, ceil + 5, 3, 9);
  // painted section number
  ctx.fillStyle = '#2a3550';
  ctx.fillRect(x0 + 40, ceil + 22, 10, 14);
  ctx.fillRect(x0 + 54, ceil + 22, 3, 14);
  // flickering lamps with light cones
  for (let x = x0 + 60; x < x1 - 20; x += 110) {
    const flick = Math.sin(t * 13 + x) > 0.97 ? 0.35 : 1;
    ctx.globalAlpha = 0.09 * flick;
    ctx.fillStyle = '#ffe2a8';
    for (let r = 0; r < GROUND_Y - ceil - 6; r += 2) {
      const half = 3 + Math.floor(r * 0.45);
      ctx.fillRect(x - half, ceil + 6 + r, half * 2 + 2, 2);
    }
    ctx.globalAlpha = 1;
  }
}

function drawTunnelFront(ctx, t, screenTopWorldY) {
  const { x0, x1, ceil, top } = TUNNEL;
  // rock mass of the hill, with a bumpy crest
  for (let x = x0; x < x1; x += 2) {
    const edge = Math.min(Math.abs(x - x0), Math.abs(x1 - x)); // round the shoulders
    const crest = top + Math.max(0, 26 - edge * 0.5) + Math.round(hill(x, 0.05, 0.11, 0.23) * 0.5);
    ctx.fillStyle = COL.hillRock;
    ctx.fillRect(x, crest, 2, ceil - crest);
    ctx.fillStyle = COL.hillRockHi;
    ctx.fillRect(x, crest, 2, 2);
    if (hash(x) > 0.86) {
      ctx.fillStyle = '#283148';
      ctx.fillRect(x, crest + 8 + Math.floor(hash(x + 1) * (ceil - crest - 14)), 3, 2);
    }
  }
  void screenTopWorldY;
  // ceiling edge with hazard stripes
  ctx.fillStyle = '#2b3446';
  ctx.fillRect(x0, ceil - 3, x1 - x0, 3);
  for (let x = x0; x < x1; x += 8) {
    ctx.fillStyle = COL.amber;
    ctx.fillRect(x, ceil - 3, 4, 3);
  }
  // portal frames at both ends
  for (const px of [x0 - 4, x1 - 2]) {
    ctx.fillStyle = '#3b465c';
    ctx.fillRect(px, ceil - 8, 6, GROUND_Y - ceil + 8);
    ctx.fillStyle = '#56637d';
    ctx.fillRect(px, ceil - 8, 6, 2);
  }
  // sign over the entrance
  ctx.fillStyle = '#0b1220';
  ctx.fillRect(x0 + 6, ceil - 18, 46, 11);
  ctx.fillStyle = COL.cyan;
  ctx.fillRect(x0 + 6, ceil - 18, 46, 1);
  ctx.fillStyle = Math.floor(t * 2) % 2 ? COL.cyan : '#2f7f75';
  // "B-7" in blocky pixels, readable at any size
  const glyph = (gx, rows) => rows.forEach((row, ry) => [...row].forEach((c, rx) => { if (c === '#') ctx.fillRect(gx + rx, ceil - 15 + ry, 1, 1); }));
  glyph(x0 + 20, ['##.', '#.#', '##.', '#.#', '##.']);
  glyph(x0 + 25, ['...', '...', '###', '...', '...']);
  glyph(x0 + 30, ['###', '..#', '.#.', '.#.', '.#.']);
  // hanging lamps
  for (let x = x0 + 60; x < x1 - 20; x += 110) {
    ctx.fillStyle = '#56637d';
    ctx.fillRect(x, ceil, 1, 4);
    ctx.fillStyle = Math.sin(t * 13 + x) > 0.97 ? '#8a6a3a' : '#ffe2a8';
    ctx.fillRect(x - 2, ceil + 4, 5, 2);
  }
}

function drawBeacon(ctx, x, lit, t) {
  ctx.fillStyle = '#56637d';
  ctx.fillRect(x, GROUND_Y - 18, 1, 18);
  ctx.fillRect(x - 2, GROUND_Y - 1, 5, 1);
  const on = lit ? true : Math.floor(t * 2) % 2 === 0;
  ctx.fillStyle = lit ? COL.cyan : COL.amber;
  ctx.globalAlpha = on ? 1 : 0.35;
  ctx.fillRect(x - 1, GROUND_Y - 21, 3, 3);
  if (on && lit) {
    const pulse = 0.15 + 0.15 * Math.sin(t * 4);
    ctx.globalAlpha = pulse;
    ctx.fillRect(x - 3, GROUND_Y - 23, 7, 7);
  }
  ctx.globalAlpha = 1;
}

const STAR_SHAPE = ['...#...', '...#...', '#######', '.#####.', '..###..', '.##.##.', '##...##'];

function drawStar(ctx, x, y, t) {
  // fake spin: squeeze the width with a cosine
  const k = Math.abs(Math.cos(t * 2.2 + x * 0.05));
  const x0 = Math.round(x) - 3;
  const y0 = Math.round(y) - 3;
  ctx.fillStyle = k < 0.35 ? '#e0b43c' : COL.star;
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      if (STAR_SHAPE[r][c] !== '#') continue;
      const cx = Math.round(3 + (c - 3) * Math.max(0.2, k));
      ctx.fillRect(x0 + cx, y0 + r, 1, 1);
    }
  }
  ctx.fillStyle = COL.starHi;
  ctx.fillRect(x0 + 3, y0 + 2, 1, 2);
  if (Math.sin(t * 5 + x) > 0.85) {
    ctx.fillRect(x0 + 6, y0 - 1, 1, 1);
    ctx.fillRect(x0 - 1, y0 + 6, 1, 1);
  }
}

function drawPowerup(ctx, u, t) {
  const x = Math.round(u.x) - 6;
  const y = Math.round(u.y + Math.sin(t * 3) * 2) - 6;
  ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 6);
  ctx.fillStyle = u.type === 'magnet' ? COL.red : COL.cyan;
  ctx.fillRect(x - 2, y - 2, 16, 16);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#0b1220';
  ctx.fillRect(x, y, 12, 12);
  ctx.fillStyle = u.type === 'magnet' ? COL.red : COL.cyan;
  ctx.fillRect(x, y, 12, 1);
  ctx.fillRect(x, y + 11, 12, 1);
  ctx.fillRect(x, y, 1, 12);
  ctx.fillRect(x + 11, y, 1, 12);
  if (u.type === 'magnet') {
    // horseshoe magnet
    ctx.fillStyle = COL.red;
    ctx.fillRect(x + 3, y + 3, 2, 6);
    ctx.fillRect(x + 7, y + 3, 2, 6);
    ctx.fillRect(x + 3, y + 8, 6, 2);
    ctx.fillStyle = '#e9eef6';
    ctx.fillRect(x + 3, y + 3, 2, 2);
    ctx.fillRect(x + 7, y + 3, 2, 2);
  } else {
    // boot with a flame
    ctx.fillStyle = '#e9eef6';
    ctx.fillRect(x + 4, y + 2, 3, 5);
    ctx.fillRect(x + 4, y + 6, 5, 2);
    ctx.fillStyle = Math.floor(t * 12) % 2 ? COL.amber : '#fff3c4';
    ctx.fillRect(x + 4, y + 8, 2, 2 + (Math.floor(t * 12) % 2));
    ctx.fillRect(x + 7, y + 8, 2, 2);
  }
}

function drawDrone(ctx, d, t, p) {
  const x = Math.round(d.x - 6);
  const y = Math.round(d.y + Math.sin(t * 4 + d.x0) * 2);
  ctx.fillStyle = '#8c96aa';
  const blade = Math.floor(t * 20) % 2 ? 12 : 6;
  ctx.fillRect(x + 6 - blade / 2, y, blade, 1);
  ctx.fillRect(x + 5, y + 1, 2, 1);
  ctx.fillStyle = '#3b465c';
  ctx.fillRect(x, y + 2, 12, 5);
  ctx.fillStyle = '#56637d';
  ctx.fillRect(x, y + 2, 12, 1);
  // the eye looks at the astronaut
  const look = Math.max(-3, Math.min(3, Math.round((p.x - d.x) / 20)));
  ctx.fillStyle = '#1a1f2b';
  ctx.fillRect(x + 3, y + 3, 6, 3);
  ctx.fillStyle = COL.red;
  ctx.fillRect(x + 5 + Math.sign(look) * Math.min(2, Math.abs(look)), y + 3, 2, 2);
  ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 30);
  ctx.fillStyle = COL.cyan;
  ctx.fillRect(x + 4, y + 7, 4, 1);
  ctx.globalAlpha = 1;
}

// The astronaut is drawn into a small offscreen canvas, then blitted with
// squash-and-stretch about the feet.
let sprite = null;
function spriteCtx() {
  if (!sprite) {
    const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(16, 20) : document.createElement('canvas');
    c.width = 16;
    c.height = 20;
    sprite = { c, ctx: c.getContext('2d') };
  }
  return sprite;
}

function drawAstronaut(ctx, g) {
  const p = g.p;
  const { c, ctx: s } = spriteCtx();
  s.clearRect(0, 0, 16, 20);
  const f = p.facing;
  const OX = 3;
  const OY = 4; // sprite drawn at (3,4) inside the 16x20 buffer
  const px = (lx, ly, w, h, col) => {
    s.fillStyle = col;
    s.fillRect(OX + (f > 0 ? lx : PW - lx - w), OY + ly, w, h);
  };

  const air = !p.onGround;
  const running = Math.abs(p.vx) > 10 && !air;
  const frame = Math.floor(p.anim) % 4;
  const bob = running ? (frame % 2 ? -1 : 0) : (p.idle > 0 && Math.floor(g.t * 1.6) % 2 ? 1 : 0);
  const lean = p.skid ? -1 : 0;
  const talking = !!g.bubble && g.bubble.anchor === 'player' && p.idle > 0.2;

  // jetpack flames under the backpack
  if (p.hovering || (g.powers.jet > 0 && air && p.vy < -150)) {
    px(0, 11 + bob, 2, 2 + (Math.floor(g.t * 20) % 2), COL.amber);
    px(0, 11 + bob, 1, 1, '#fff3c4');
  }
  // backpack (gets a cyan stripe while jet boots are active)
  px(0 + lean, 5 + bob, 2, 6, COL.pack);
  px(0 + lean, 5 + bob, 2, 1, g.powers.jet > 0 ? COL.cyan : '#9aa6bd');
  // helmet
  px(1 + lean, 0 + bob, 8, 7, COL.outline);
  px(2 + lean, 1 + bob, 6, 5, COL.suit);
  px(2 + lean, 1 + bob, 1, 5, COL.suitShade);
  px(5 + lean, 2 + bob, 3, 3, COL.visor);
  // visor glint sweeps across every few seconds
  const glint = Math.floor((g.t % 3.2) * 10);
  px(5 + lean + Math.min(2, glint), 2 + bob, 1, 1, glint < 3 ? '#ffffff' : COL.visorHi);
  // torso
  px(2 + lean, 7 + bob, 6, 5, COL.suit);
  px(2 + lean, 7 + bob, 1, 5, COL.suitShade);
  px(4 + lean, 8 + bob, 2, 1, g.powers.magnet > 0 && Math.floor(g.t * 6) % 2 ? COL.red : COL.cyan);
  // arm
  if (talking) {
    const wave = Math.floor(g.t * 6) % 2;
    px(7, 3 + wave, 2, 4, '#cfd6e2');
  } else if (air) px(6, 5 + bob, 2, 3, '#cfd6e2');
  else if (running) px(frame < 2 ? 6 : 5, 8 + bob + (frame === 1 || frame === 3 ? 1 : 0), 2, 3, '#cfd6e2');
  else px(6 + lean, 8 + bob, 2, 3, '#cfd6e2');
  // legs: near leg in suit white, far leg shaded, so the run cycle reads
  if (air) {
    px(2, 12, 2, 2, COL.suitShade);
    px(5, 11, 2, 3, COL.suit);
    px(2, 14, 2, 1, COL.boot);
    px(5, 14, 3, 1, COL.boot);
  } else if (running) {
    const legs = [[6, 2], [5, 3], [2, 6], [3, 5]][frame]; // [near x, far x]
    const lift = frame === 1 || frame === 3;
    px(legs[1], lift ? 11 : 12, 2, lift ? 2 : 2, COL.suitShade);
    px(legs[1], lift ? 13 : 14, 2, 1, COL.boot);
    px(legs[0], 12, 2, 2, COL.suit);
    px(legs[0], 14, 3, 1, COL.boot);
  } else if (p.skid) {
    px(5, 12, 2, 2, COL.suit);
    px(6, 14, 3, 1, COL.boot);
    px(2, 12, 2, 2, COL.suitShade);
    px(1, 14, 3, 1, COL.boot);
  } else {
    px(3, 12, 2, 2, COL.suit);
    px(5, 12, 2, 2, COL.suitShade);
    px(3, 14, 2, 1, COL.boot);
    px(5, 14, 3, 1, COL.boot);
  }

  // squash/stretch about the feet
  const sq = Math.max(-0.4, Math.min(0.35, p.sq));
  const sy = 1 + sq;
  const sx = 1 - sq * 0.7;
  const dw = 16 * sx;
  const dh = 20 * sy;
  const feetX = p.x + PW / 2;
  const feetY = p.y + PH;
  ctx.drawImage(c, Math.round(feetX - dw / 2), Math.round(feetY - (OY + PH) * sy), Math.round(dw), Math.round(dh));
}

function drawPad(ctx, t) {
  const y = GROUND_Y;
  ctx.fillStyle = '#2b3446';
  ctx.fillRect(PAD_X0, y, PAD_X1 - PAD_X0, 4);
  ctx.fillStyle = '#4b5873';
  ctx.fillRect(PAD_X0, y, PAD_X1 - PAD_X0, 1);
  ctx.fillStyle = COL.amber;
  for (let x = PAD_X0 + 2; x < PAD_X1 - 4; x += 8) ctx.fillRect(x, y + 2, 4, 1);
  // runway arrows pointing at the rocket
  ctx.fillStyle = Math.floor(t * 3) % 2 ? COL.cyan : '#2f7f75';
  for (let x = PAD_X0 - 50; x < PAD_X0 - 4; x += 14) {
    ctx.fillRect(x, y - 1, 3, 1);
    ctx.fillRect(x + 1, y - 2, 2, 1);
  }
}

function drawTower(ctx, g) {
  const x = ROCKET_X + 30;
  const top = GROUND_Y - 82;
  ctx.fillStyle = '#3b465c';
  ctx.fillRect(x, top, 1, 82);
  ctx.fillRect(x + 7, top, 1, 82);
  for (let y = top; y < GROUND_Y; y += 8) {
    ctx.fillRect(x, y, 8, 1);
    for (let i = 0; i < 8; i++) ctx.fillRect(x + i, y + i, 1, 1);
  }
  if (g.phase !== 'launch' && g.phase !== 'done') ctx.fillRect(ROCKET_X + 20, GROUND_Y - 50, 10, 2);
  ctx.fillStyle = Math.floor(g.t * 2) % 2 ? COL.red : '#5a1f24';
  ctx.fillRect(x + 3, top - 2, 2, 2);
}

function drawRocket(ctx, g) {
  const x = ROCKET_X;
  const base = GROUND_Y + Math.round(g.rocket.y);
  const bodyTop = base - 46;
  for (let r = 0; r < 14; r++) {
    const half = Math.max(1, Math.round(((r + 1) * 8) / 14));
    ctx.fillStyle = r < 4 ? COL.red : '#e9eef6';
    ctx.fillRect(x + 10 - half, bodyTop - 14 + r, half * 2, 1);
  }
  ctx.fillStyle = '#e9eef6';
  ctx.fillRect(x + 2, bodyTop, 16, 42);
  ctx.fillStyle = '#b9c3d3';
  ctx.fillRect(x + 2, bodyTop, 3, 42);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 13, bodyTop, 1, 42);
  ctx.fillStyle = COL.amber;
  ctx.fillRect(x + 2, bodyTop + 22, 16, 2);
  ctx.fillStyle = COL.outline;
  ctx.fillRect(x + 7, bodyTop + 8, 6, 6);
  ctx.fillStyle = COL.cyan;
  ctx.fillRect(x + 8, bodyTop + 9, 4, 4);
  ctx.fillStyle = '#c9fff5';
  ctx.fillRect(x + 8, bodyTop + 9, 1, 1);
  if (g.p.hidden) {
    // the astronaut's visor in the window
    ctx.fillStyle = COL.visor;
    ctx.fillRect(x + 9, bodyTop + 10, 2, 2);
  }
  ctx.fillStyle = '#8c96aa';
  ctx.fillRect(x + 4, bodyTop + 28, 1, 12);
  ctx.fillRect(x + 4, bodyTop + 28, 7, 1);
  ctx.fillRect(x + 10, bodyTop + 28, 1, 12);
  ctx.fillStyle = COL.amber;
  for (let r = 0; r < 12; r++) {
    const wd = Math.round(r / 3) + 1;
    ctx.fillRect(x + 2 - wd, bodyTop + 30 + r, wd, 1);
    ctx.fillRect(x + 18, bodyTop + 30 + r, wd, 1);
  }
  ctx.fillStyle = '#3b465c';
  ctx.fillRect(x + 6, base - 4, 8, 2);
  ctx.fillRect(x + 5, base - 2, 10, 2);
  if (g.phase === 'launch') {
    const fl = 6 + Math.floor(Math.random() * 6);
    ctx.fillStyle = COL.amber;
    ctx.fillRect(x + 6, base, 8, fl);
    ctx.fillStyle = '#fff3c4';
    ctx.fillRect(x + 8, base, 4, Math.round(fl * 0.6));
  }
}

// Screen-space anchors for the HTML overlay (speech bubble, sound words).
export function anchors(g, view) {
  const { x: camX, y: camY } = g.camRender;
  const toScreen = (wx, wy) => ({ x: wx - camX, y: wy + view.offY - camY });
  let bubble = null;
  if (g.bubble) {
    const b = g.bubble;
    const at = b.anchor === 'rocket'
      ? toScreen(ROCKET_X + 10, GROUND_Y - 64 + g.rocket.y)
      : toScreen(g.p.x + PW / 2, g.p.y - 3);
    bubble = { ...at, text: b.text, t: b.t, dur: b.dur };
  }
  const pops = g.pops.map((q) => ({ ...toScreen(q.x, q.y - q.t * 22), text: q.text, t: q.t, kind: q.kind }));
  return { bubble, pops };
}
