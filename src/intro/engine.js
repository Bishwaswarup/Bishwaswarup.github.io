// A tiny side-scrolling platformer used as the site's intro.
// Pure logic + canvas drawing; the React wrapper (IntroGame.jsx) owns input,
// resizing and the HTML overlay. Everything is drawn procedurally: no sprites.
import {
  WORLD_H, GROUND_Y, LEVEL_END, GROUND, PLATFORMS, CRATES, STARS, DRONES,
  BEACONS, PAD_X0, PAD_X1, ROCKET_X, BOARD_X,
} from './level.js';

// --- tuning -----------------------------------------------------------------
const G = 980;
const JUMP_V = 330;
const RUN = 112;
const ACCEL = 900;
const AIR_ACCEL = 620;
const FRICTION = 1300;
const COYOTE = 0.09;
const BUFFER = 0.12;
const MAX_FALL = 520;
const PW = 10;
const PH = 15;

const COL = {
  skyTop: '#02040a',
  skyBottom: '#0b1733',
  farHill: '#0b1630',
  nearHill: '#101f3d',
  ground: '#343c50',
  groundDark: '#262d3e',
  groundTop: '#8c96aa',
  rock: '#4a5368',
  girder: '#2b3a55',
  girderEdge: '#5eead4',
  crate: '#5a3e1a',
  crateEdge: '#f5a623',
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

// --- helpers ----------------------------------------------------------------
const approach = (v, target, step) => (v < target ? Math.min(v + step, target) : Math.max(v - step, target));
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const SOLIDS = [
  ...GROUND.map(([x0, x1]) => ({ x: x0, y: GROUND_Y, w: x1 - x0, h: 400 })),
  ...CRATES.map(([x, y, w, h]) => ({ x, y, w, h })),
];
const ONE_WAY = PLATFORMS.map(([x, y, w]) => ({ x, y, w, h: 6 }));

// Background star layers: [parallax factor, count, brightness].
const STAR_WRAP_W = 640;
const STAR_WRAP_H = 420;
const SKY_STARS = [[0.04, 70, 0.45], [0.1, 45, 0.7], [0.22, 22, 1]].map(([f, n, b], i) => {
  const r = rng(11 + i * 97);
  return { f, b, pts: Array.from({ length: n }, () => [r() * STAR_WRAP_W, r() * STAR_WRAP_H, r() * 6.28]) };
});

const hill = (x, a, b, c) => Math.sin(x * a) * 9 + Math.sin(x * b + 1.7) * 6 + Math.sin(x * c + 4.1) * 3;

// --- state --------------------------------------------------------------------
export function createGame() {
  return {
    t: 0,
    phase: 'play', // play -> board -> count -> launch -> done
    phaseT: 0,
    p: { x: 40, y: GROUND_Y - PH, vx: 0, vy: 0, onGround: true, coyote: 0, buffer: 0, facing: 1, invuln: 0, anim: 0, hidden: false },
    checkpoint: BEACONS[0],
    stars: STARS.map(([x, y]) => ({ x, y, got: false })),
    collected: 0,
    drones: DRONES.map(([x0, x1, y]) => ({ x: (x0 + x1) / 2, x0, x1, y, dir: -1, alive: true })),
    particles: [],
    rocket: { y: 0, v: 0 },
    cam: { x: 0, y: 0 },
    shake: 0,
    moved: false,
  };
}

function burst(g, x, y, colors, n, speed = 90, life = 0.5, grav = 200) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.3 + Math.random() * 0.7);
    g.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life, color: colors[i % colors.length], size: 1, grav });
  }
}

// --- update -------------------------------------------------------------------
export function update(g, input, dtRaw, view) {
  const dt = Math.min(dtRaw, 1 / 30);
  g.t += dt;
  g.phaseT += dt;
  const p = g.p;

  if (g.phase === 'play') stepPlayer(g, input, dt);
  else if (g.phase === 'board') {
    // Walk to the hatch, then climb in.
    const door = ROCKET_X + 5;
    p.facing = 1;
    p.vx = approach(p.vx, RUN * 0.6, ACCEL * dt);
    if (!p.onGround) stepPlayer(g, { left: false, right: true, jumpHeld: false, jumpQueued: false }, dt);
    else p.x += p.vx * dt;
    p.anim += dt * Math.abs(p.vx) * 0.12;
    if (p.x >= door) {
      p.x = door;
      p.hidden = true;
      setPhase(g, 'count');
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

  // Drones patrol and bob.
  for (const d of g.drones) {
    if (!d.alive) continue;
    d.x += d.dir * 28 * dt;
    if (d.x < d.x0) { d.x = d.x0; d.dir = 1; }
    if (d.x > d.x1) { d.x = d.x1; d.dir = -1; }
  }

  // Particles.
  for (const q of g.particles) {
    q.life -= dt;
    q.vy += q.grav * dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    if (q.flame && q.y > GROUND_Y) {
      // exhaust hits the pad and spreads sideways
      q.y = GROUND_Y;
      if (q.vy > 0) q.vx = (Math.random() < 0.5 ? -1 : 1) * (60 + q.vy * 0.6);
      q.vy = 0;
    }
  }
  g.particles = g.particles.filter((q) => q.life > 0);
  if (g.particles.length > 600) g.particles.splice(0, g.particles.length - 600);

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

  if (dir) p.vx = approach(p.vx, dir * RUN, (p.onGround ? ACCEL : AIR_ACCEL) * dt);
  else p.vx = approach(p.vx, 0, (p.onGround ? FRICTION : 260) * dt);

  if (input.jumpQueued) { p.buffer = BUFFER; input.jumpQueued = false; g.moved = true; }
  else p.buffer -= dt;
  p.coyote = p.onGround ? COYOTE : p.coyote - dt;

  if (p.buffer > 0 && p.coyote > 0) {
    p.vy = -JUMP_V;
    p.buffer = 0;
    p.coyote = 0;
    p.onGround = false;
    burst(g, p.x + PW / 2, p.y + PH, ['#8c96aa', '#5d667a'], 4, 30, 0.3, 60);
  }
  if (!input.jumpHeld && p.vy < -130) p.vy = -130; // short hop on early release
  p.vy = Math.min(p.vy + G * dt, MAX_FALL);

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
  const prevBottom = p.y + PH;
  p.y += p.vy * dt;
  p.onGround = false;
  box = { x: p.x, y: p.y, w: PW, h: PH };
  for (const s of SOLIDS) {
    if (!overlap(box, s)) continue;
    if (p.vy > 0) { p.y = s.y - PH; p.onGround = true; } else p.y = s.y + s.h;
    p.vy = 0;
    box.y = p.y;
  }
  if (p.vy >= 0) {
    for (const s of ONE_WAY) {
      if (prevBottom <= s.y + 0.5 && p.y + PH >= s.y && p.x + PW > s.x && p.x < s.x + s.w) {
        p.y = s.y - PH;
        p.vy = 0;
        p.onGround = true;
      }
    }
  }
  if (p.onGround && !wasGround) burst(g, p.x + PW / 2, p.y + PH, ['#8c96aa'], 3, 25, 0.25, 40);

  p.anim += dt * (p.onGround ? Math.abs(p.vx) * 0.12 : 0);
  p.invuln = Math.max(0, p.invuln - dt);

  // Fell into a pit: back to the last beacon.
  if (p.y > WORLD_H + 70) {
    p.x = g.checkpoint;
    p.y = GROUND_Y - PH - 20;
    p.vx = p.vy = 0;
    p.invuln = 1;
  }

  for (const b of BEACONS) if (p.x >= b && b > g.checkpoint) g.checkpoint = b;

  // Stars.
  const cx = p.x + PW / 2;
  const cy = p.y + PH / 2;
  for (const s of g.stars) {
    if (s.got || Math.abs(s.x - cx) > 9 || Math.abs(s.y - cy) > 11) continue;
    s.got = true;
    g.collected++;
    burst(g, s.x, s.y, [COL.star, COL.starHi, COL.amber], 10, 70, 0.45, 80);
  }

  // Drones: stomp from above, otherwise get knocked back.
  for (const d of g.drones) {
    if (!d.alive) continue;
    const dy = d.y + Math.sin(g.t * 4 + d.x0) * 2;
    const db = { x: d.x - 6, y: dy, w: 12, h: 9 };
    if (!overlap({ x: p.x, y: p.y, w: PW, h: PH }, db)) continue;
    if (p.vy > 0 && p.y + PH - dy < 8) {
      d.alive = false;
      p.vy = input.jumpHeld ? -JUMP_V * 0.95 : -230;
      burst(g, d.x, dy + 4, ['#56637d', COL.cyan, COL.red], 14, 90, 0.5, 120);
    } else if (p.invuln <= 0) {
      p.invuln = 1.2;
      p.vx = (cx < d.x ? -1 : 1) * 170;
      p.vy = -170;
      p.onGround = false;
      burst(g, cx, cy, [COL.red, '#ffffff'], 6, 60, 0.3, 0);
    }
  }

  if (p.onGround && p.x >= BOARD_X) setPhase(g, 'board');
}

function updateCamera(g, view, dt) {
  const p = g.p;
  const target = Math.max(0, Math.min(p.x + PW / 2 - view.w * 0.4, LEVEL_END - view.w));
  g.cam.x += (target - g.cam.x) * Math.min(1, dt * 6);
  if (g.phase === 'launch') {
    const rocketMid = GROUND_Y - 30 + g.rocket.y;
    g.cam.y = Math.min(0, rocketMid + view.offY - view.h * 0.5);
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
  // world -> screen: (x - camX, y + offY - camY)
  const oy = offY - camY;

  // Sky.
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

  // Moon.
  drawMoon(ctx, Math.round(w * 0.72 - camX * 0.03), Math.round(oy * 0.6 + 38), 20);

  // Hills (parallax silhouettes).
  drawHills(ctx, w, h, camX, oy, 0.25, GROUND_Y - 30, COL.farHill, [0.011, 0.023, 0.051]);
  drawHills(ctx, w, h, camX, oy, 0.5, GROUND_Y - 14, COL.nearHill, [0.017, 0.031, 0.067]);

  ctx.save();
  ctx.translate(-camX, oy);

  drawTower(ctx, g);
  for (const b of BEACONS) drawBeacon(ctx, b, g.checkpoint >= b, g.t);
  for (const s of ONE_WAY) drawGirder(ctx, s);
  for (const [x, y, cw, ch] of CRATES) drawCrate(ctx, x, y, cw, ch);
  for (const [x0, x1] of GROUND) drawGround(ctx, x0, x1, Math.max(60, h - offY + camY - GROUND_Y + 4));
  drawPad(ctx);
  for (const s of g.stars) if (!s.got) drawStar(ctx, s.x, s.y + Math.sin(g.t * 3 + s.x) * 1.5, g.t);
  for (const d of g.drones) if (d.alive) drawDrone(ctx, d, g.t);

  // Smoke behind the rocket, flame and sparks in front.
  for (const q of g.particles) if (q.smoke) drawParticle(ctx, q);
  drawRocket(ctx, g);
  if (!g.p.hidden && !(g.p.invuln > 0 && Math.floor(g.t * 12) % 2)) drawAstronaut(ctx, g.p);
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
  // terminator shading
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
    const wx = x + shift;
    const top = Math.round(base + hill(wx, k[0], k[1], k[2]) + oy);
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
      // small crater
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

function drawBeacon(ctx, x, lit, t) {
  ctx.fillStyle = '#56637d';
  ctx.fillRect(x, GROUND_Y - 18, 1, 18);
  ctx.fillRect(x - 2, GROUND_Y - 1, 5, 1);
  const on = lit ? true : Math.floor(t * 2) % 2 === 0;
  ctx.fillStyle = lit ? COL.cyan : COL.amber;
  ctx.globalAlpha = on ? 1 : 0.35;
  ctx.fillRect(x - 1, GROUND_Y - 21, 3, 3);
  if (on && lit) {
    ctx.globalAlpha = 0.25;
    ctx.fillRect(x - 3, GROUND_Y - 23, 7, 7);
  }
  ctx.globalAlpha = 1;
}

const STAR_SHAPE = [
  '...#...',
  '...#...',
  '#######',
  '.#####.',
  '..###..',
  '.##.##.',
  '##...##',
];

function drawStar(ctx, x, y, t) {
  const x0 = Math.round(x) - 3;
  const y0 = Math.round(y) - 3;
  ctx.fillStyle = COL.star;
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) if (STAR_SHAPE[r][c] === '#') ctx.fillRect(x0 + c, y0 + r, 1, 1);
  }
  ctx.fillStyle = COL.starHi;
  ctx.fillRect(x0 + 3, y0 + 2, 1, 2);
  if (Math.sin(t * 5 + x) > 0.85) {
    ctx.fillRect(x0 + 6, y0 - 1, 1, 1);
    ctx.fillRect(x0 - 1, y0 + 6, 1, 1);
  }
}

function drawDrone(ctx, d, t) {
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
  ctx.fillStyle = COL.red;
  ctx.fillRect(d.dir > 0 ? x + 8 : x + 1, y + 3, 3, 2);
  ctx.fillStyle = '#ffd0d0';
  ctx.fillRect(d.dir > 0 ? x + 10 : x + 1, y + 3, 1, 1);
  ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 30);
  ctx.fillStyle = COL.cyan;
  ctx.fillRect(x + 4, y + 7, 4, 1);
  ctx.globalAlpha = 1;
}

function drawAstronaut(ctx, p) {
  const X = Math.round(p.x);
  const Y = Math.round(p.y);
  const f = p.facing;
  const px = (lx, ly, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(X + (f > 0 ? lx : PW - lx - w), Y + ly, w, h);
  };
  const air = !p.onGround;
  const step = Math.floor(p.anim) % 2;
  const running = Math.abs(p.vx) > 10 && !air;
  const bob = running && step ? 1 : 0;

  // backpack
  px(0, 5 + bob, 2, 6, COL.pack);
  px(0, 5 + bob, 2, 1, '#9aa6bd');
  // helmet
  px(1, 0 + bob, 8, 7, COL.outline);
  px(2, 1 + bob, 6, 5, COL.suit);
  px(2, 1 + bob, 1, 5, COL.suitShade);
  px(5, 2 + bob, 3, 3, COL.visor);
  px(6, 2 + bob, 1, 1, COL.visorHi);
  // torso
  px(2, 7 + bob, 6, 5, COL.suit);
  px(2, 7 + bob, 1, 5, COL.suitShade);
  px(4, 8 + bob, 2, 1, COL.cyan);
  // arm
  const armY = air ? 6 : running ? (step ? 9 : 8) : 8;
  px(6, armY + bob, 2, 3, '#cfd6e2');
  // legs
  if (air) {
    px(2, 12, 2, 2, COL.suit);
    px(5, 11, 2, 3, COL.suit);
    px(2, 14, 2, 1, COL.boot);
    px(5, 14, 3, 1, COL.boot);
  } else if (running) {
    const a = step ? 1 : 3;
    const b = step ? 6 : 4;
    px(a, 12, 2, 2, COL.suit);
    px(b, 12, 2, 2, COL.suit);
    px(a, 14, 2, 1, COL.boot);
    px(b, 14, 3, 1, COL.boot);
  } else {
    px(3, 12, 2, 2, COL.suit);
    px(5, 12, 2, 2, COL.suitShade);
    px(3, 14, 2, 1, COL.boot);
    px(5, 14, 3, 1, COL.boot);
  }
}

function drawPad(ctx) {
  const y = GROUND_Y;
  ctx.fillStyle = '#2b3446';
  ctx.fillRect(PAD_X0, y, PAD_X1 - PAD_X0, 4);
  ctx.fillStyle = '#4b5873';
  ctx.fillRect(PAD_X0, y, PAD_X1 - PAD_X0, 1);
  ctx.fillStyle = COL.amber;
  for (let x = PAD_X0 + 2; x < PAD_X1 - 4; x += 8) ctx.fillRect(x, y + 2, 4, 1);
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
  // service arm, retracts at launch
  if (g.phase !== 'launch' && g.phase !== 'done') {
    ctx.fillRect(ROCKET_X + 20, GROUND_Y - 50, 10, 2);
  }
  ctx.fillStyle = Math.floor(g.t * 2) % 2 ? COL.red : '#5a1f24';
  ctx.fillRect(x + 3, top - 2, 2, 2);
}

function drawRocket(ctx, g) {
  const x = ROCKET_X;
  const base = GROUND_Y + Math.round(g.rocket.y);
  const bodyTop = base - 46;
  // nose cone
  for (let r = 0; r < 14; r++) {
    const half = Math.max(1, Math.round((r + 1) * 8 / 14));
    ctx.fillStyle = r < 4 ? COL.red : '#e9eef6';
    ctx.fillRect(x + 10 - half, bodyTop - 14 + r, half * 2, 1);
  }
  // body
  ctx.fillStyle = '#e9eef6';
  ctx.fillRect(x + 2, bodyTop, 16, 42);
  ctx.fillStyle = '#b9c3d3';
  ctx.fillRect(x + 2, bodyTop, 3, 42);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 13, bodyTop, 1, 42);
  ctx.fillStyle = COL.amber;
  ctx.fillRect(x + 2, bodyTop + 22, 16, 2);
  // window
  ctx.fillStyle = COL.outline;
  ctx.fillRect(x + 7, bodyTop + 8, 6, 6);
  ctx.fillStyle = COL.cyan;
  ctx.fillRect(x + 8, bodyTop + 9, 4, 4);
  ctx.fillStyle = '#c9fff5';
  ctx.fillRect(x + 8, bodyTop + 9, 1, 1);
  // hatch
  ctx.fillStyle = '#8c96aa';
  ctx.fillRect(x + 4, bodyTop + 28, 1, 12);
  ctx.fillRect(x + 4, bodyTop + 28, 7, 1);
  ctx.fillRect(x + 10, bodyTop + 28, 1, 12);
  // fins
  ctx.fillStyle = COL.amber;
  for (let r = 0; r < 12; r++) {
    const wd = Math.round(r / 3) + 1;
    ctx.fillRect(x + 2 - wd, bodyTop + 30 + r, wd, 1);
    ctx.fillRect(x + 18, bodyTop + 30 + r, wd, 1);
  }
  // engine bell
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
