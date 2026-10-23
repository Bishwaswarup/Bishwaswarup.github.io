import { useCallback, useEffect, useRef, useState } from 'react';
import { createGame, update, render, anchors, SECTION_NAMES } from './engine.js';
import { WORLD_H, STARS } from './level.js';

const JUMP_KEYS = new Set([' ', 'Spacebar', 'ArrowUp', 'w', 'W', 'z', 'Z', 'k', 'K']);
const LEFT_KEYS = new Set(['ArrowLeft', 'a', 'A']);
const RIGHT_KEYS = new Set(['ArrowRight', 'd', 'D']);
const ADVANCE_KEYS = new Set([' ', 'Enter', 'ArrowRight', 'd', 'D']);
const TOUCH_LIFT = 46; // logical px the world is raised on touch screens, to clear the buttons
const POP_POOL = 6;

// Optional comic opener. Drop images at public/intro/comic-1.webp (or .png) ... comic-3;
// if all three load, they play as a short strip before the level. Otherwise the level starts at once.
const BASE = import.meta.env.BASE_URL || '/';
const PANELS = [
  { file: 'comic-1', caption: 'IISc, 3:07 a.m. The last simulation finally converges.' },
  { file: 'comic-2', caption: 'PING! The launch window opens in two minutes.' },
  { file: 'comic-3', caption: 'Only one way to the pad. Run, Bishwa!' },
];

function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
async function probePanels() {
  const urls = await Promise.all(
    PANELS.map(async (p) => (await loadImage(`${BASE}intro/${p.file}.webp`)) || loadImage(`${BASE}intro/${p.file}.png`)),
  );
  return urls.every(Boolean) ? urls : null;
}

const isCoarse = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

/**
 * Side-scrolling intro: walk the astronaut to the launch pad, the rocket lifts
 * off, and the 3D site underneath is revealed. `onDone` fires once the fade-out
 * has finished (after liftoff or Skip).
 */
export default function IntroGame({ onDone, onReveal, reducedMotion = false }) {
  const canvasRef = useRef(null);
  const bubbleRef = useRef(null);
  const bubbleTextRef = useRef(null);
  const popRefs = useRef([]);
  const magnetBarRef = useRef(null);
  const jetBarRef = useRef(null);
  const input = useRef({ left: false, right: false, jumpHeld: false, jumpQueued: false });
  const game = useRef(null);
  const view = useRef({ w: 320, h: 180, offY: 0 });
  const [touch] = useState(isCoarse);
  const [hud, setHud] = useState({ stars: 0, phase: 'play', count: 3, hint: true, section: 0, magnet: false, jet: false });
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const [comic, setComic] = useState(null); // { urls, i } while the opener plays
  const comicRef = useRef(null);
  comicRef.current = comic;

  // Callbacks live in refs so a parent re-render never restarts the game loop.
  const cb = useRef({ onDone, onReveal });
  cb.current = { onDone, onReveal };
  const finish = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    cb.current.onReveal?.();
    setTimeout(() => cb.current.onDone?.(), reducedMotion ? 150 : 700);
  }, [reducedMotion]);

  const advanceComic = useCallback(() => {
    setComic((c) => (!c ? c : c.i + 1 >= c.urls.length ? null : { ...c, i: c.i + 1 }));
  }, []);

  useEffect(() => {
    let alive = true;
    probePanels().then((urls) => { if (alive && urls) setComic({ urls, i: 0 }); });
    return () => { alive = false; };
  }, []);

  // Auto-advance the comic.
  useEffect(() => {
    if (!comic) return undefined;
    const id = setTimeout(advanceComic, 3200);
    return () => clearTimeout(id);
  }, [comic, advanceComic]);

  // Resize: pick a logical resolution about 180 px tall (wider screens see more level).
  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current;
      if (!c) return;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const scale = Math.max(1, Math.min(H / WORLD_H, W / 200));
      const w = Math.ceil(W / scale);
      const h = Math.ceil(H / scale);
      c.width = w;
      c.height = h;
      view.current = { w, h, offY: h - WORLD_H - (touch ? TOUCH_LIFT : 0) };
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [touch]);

  // Keyboard.
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'Escape') { finish(); return; }
      if (comicRef.current) {
        if (ADVANCE_KEYS.has(e.key)) { e.preventDefault(); if (!e.repeat) advanceComic(); }
        return;
      }
      if (LEFT_KEYS.has(e.key)) input.current.left = true;
      else if (RIGHT_KEYS.has(e.key)) input.current.right = true;
      else if (JUMP_KEYS.has(e.key)) {
        if (!e.repeat) input.current.jumpQueued = true;
        input.current.jumpHeld = true;
      } else return;
      e.preventDefault();
    };
    const up = (e) => {
      if (LEFT_KEYS.has(e.key)) input.current.left = false;
      else if (RIGHT_KEYS.has(e.key)) input.current.right = false;
      else if (JUMP_KEYS.has(e.key)) input.current.jumpHeld = false;
    };
    const blur = () => Object.assign(input.current, { left: false, right: false, jumpHeld: false });
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [finish, advanceComic]);

  // Game loop.
  useEffect(() => {
    game.current = createGame();
    const ctx = canvasRef.current.getContext('2d');
    let raf = 0;
    let last = performance.now();
    let shown = {};

    const frame = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      const g = game.current;
      const v = view.current;
      if (!comicRef.current) update(g, input.current, dt, v);
      ctx.imageSmoothingEnabled = false;
      render(ctx, g, v, reducedMotion);
      placeOverlay(g, v);

      const count = g.phase === 'count' ? 3 - Math.floor(g.phaseT / 0.8) : 0;
      const next = {
        stars: g.collected, phase: g.phase, count, hint: !g.moved, section: g.section,
        magnet: g.powers.magnet > 0, jet: g.powers.jet > 0,
      };
      if (Object.keys(next).some((k) => next[k] !== shown[k])) {
        shown = next;
        setHud(next);
      }
      if (magnetBarRef.current) magnetBarRef.current.style.transform = `scaleX(${g.powers.magnet / 12})`;
      if (jetBarRef.current) jetBarRef.current.style.transform = `scaleX(${g.powers.jet / 16})`;
      if (g.phase === 'done') { finish(); return; }
      raf = requestAnimationFrame(frame);
    };

    // Speech bubble and comic sound words are HTML, positioned every frame.
    const placeOverlay = (g, v) => {
      const kx = window.innerWidth / v.w;
      const ky = window.innerHeight / v.h;
      const { bubble, pops } = anchors(g, v);
      const b = bubbleRef.current;
      if (b) {
        if (bubble) {
          if (bubbleTextRef.current.textContent !== bubble.text) bubbleTextRef.current.textContent = bubble.text;
          const x = Math.max(90, Math.min(window.innerWidth - 90, bubble.x * kx));
          const tail = bubble.x * kx - x; // keep the tail pointing at the head when the bubble is clamped
          b.style.transform = `translate(${x}px, ${bubble.y * ky}px) translate(-50%, -100%)`;
          b.style.setProperty('--tail', `${tail}px`);
          const fade = Math.min(1, bubble.t * 6, (bubble.dur - bubble.t) * 4);
          b.style.opacity = String(Math.max(0, fade));
        } else b.style.opacity = '0';
      }
      for (let i = 0; i < POP_POOL; i++) {
        const el = popRefs.current[i];
        if (!el) continue;
        const q = pops[i];
        if (!q) { el.style.opacity = '0'; continue; }
        if (el.textContent !== q.text) el.textContent = q.text;
        el.dataset.kind = q.kind;
        const s = q.kind === 'plus' ? 1 : 1 + Math.max(0, 0.25 - q.t) * 2.4;
        el.style.transform = `translate(${q.x * kx}px, ${q.y * ky}px) translate(-50%, -50%) scale(${s}) rotate(${q.kind === 'plus' ? 0 : -6}deg)`;
        el.style.opacity = String(Math.min(1, (0.9 - q.t) * 3));
      }
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [finish, reducedMotion]);

  // Touch buttons: each tracks its own pointer so left+jump can be held together.
  const hold = (key) => ({
    onPointerDown: (e) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      if (key === 'jump') { input.current.jumpQueued = true; input.current.jumpHeld = true; } else input.current[key] = true;
    },
    onPointerUp: () => { if (key === 'jump') input.current.jumpHeld = false; else input.current[key] = false; },
    onPointerCancel: () => { if (key === 'jump') input.current.jumpHeld = false; else input.current[key] = false; },
    onContextMenu: (e) => e.preventDefault(),
  });

  const total = STARS.length;
  return (
    <div className={`intro ${closing ? 'closing' : ''}`} role="dialog" aria-label="Intro game: reach the launch pad">
      <canvas ref={canvasRef} className="intro-canvas" aria-hidden="true" />

      <div ref={bubbleRef} className="intro-bubble" style={{ opacity: 0 }} aria-live="polite">
        <span ref={bubbleTextRef} />
      </div>
      {Array.from({ length: POP_POOL }, (_, i) => (
        <div key={i} ref={(el) => { popRefs.current[i] = el; }} className="intro-pop" style={{ opacity: 0 }} aria-hidden="true" />
      ))}

      <div className="intro-hud">
        <div className="intro-stars">★ {String(hud.stars).padStart(2, '0')}/{total}</div>
        <div className="intro-section">{SECTION_NAMES[hud.section]}</div>
        {hud.magnet && (
          <div className="intro-power magnet"><span>Magnet</span><i><b ref={magnetBarRef} /></i></div>
        )}
        {hud.jet && (
          <div className="intro-power jet"><span>Jet boots</span><i><b ref={jetBarRef} /></i></div>
        )}
      </div>
      <button className="intro-skip" onClick={finish}>Skip ▸▸</button>

      <div className={`intro-title ${hud.hint && hud.phase === 'play' && !comic ? '' : 'faded'}`}>
        <div className="intro-name">Bishwaswarup Nayak</div>
        <div className="intro-mission">Mission 00 · reach the launch pad</div>
        <div className="intro-keys">
          {touch ? 'Use the buttons to move and jump' : '← → move · Space jump (hold = higher) · Esc skip'}
        </div>
      </div>

      {hud.phase === 'count' && hud.count > 0 && <div className="intro-count" key={hud.count}>{hud.count}</div>}
      {(hud.phase === 'launch' || hud.phase === 'done') && (
        <div className="intro-liftoff">
          <span className="intro-burst">Liftoff!</span>
          <small>★ {hud.stars}/{total} collected</small>
        </div>
      )}

      {comic && (
        <div className="intro-comic" onClick={advanceComic} role="button" tabIndex={0} aria-label="Next panel">
          <figure key={comic.i} className="intro-panel">
            <img src={comic.urls[comic.i]} alt="" />
            <figcaption>{PANELS[comic.i].caption}</figcaption>
          </figure>
          <div className="intro-comic-hint">{touch ? 'Tap' : 'Space'} to continue · {comic.i + 1}/{comic.urls.length}</div>
        </div>
      )}

      {touch && hud.phase === 'play' && !comic && (
        <div className="intro-pad">
          <div className="intro-dpad">
            <button aria-label="Left" {...hold('left')}>◀</button>
            <button aria-label="Right" {...hold('right')}>▶</button>
          </div>
          <button className="intro-jump" aria-label="Jump" {...hold('jump')}>▲</button>
        </div>
      )}
    </div>
  );
}
