import { useCallback, useEffect, useRef, useState } from 'react';
import { createGame, update, render } from './engine.js';
import { WORLD_H, STARS } from './level.js';

const JUMP_KEYS = new Set([' ', 'Spacebar', 'ArrowUp', 'w', 'W', 'z', 'Z', 'k', 'K']);
const LEFT_KEYS = new Set(['ArrowLeft', 'a', 'A']);
const RIGHT_KEYS = new Set(['ArrowRight', 'd', 'D']);
const TOUCH_LIFT = 46; // logical px the world is raised on touch screens, to clear the buttons

const isCoarse = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

/**
 * Side-scrolling intro: walk the astronaut to the launch pad, the rocket lifts
 * off, and the 3D site underneath is revealed. `onDone` fires once the fade-out
 * has finished (after liftoff or Skip).
 */
export default function IntroGame({ onDone, reducedMotion = false }) {
  const canvasRef = useRef(null);
  const input = useRef({ left: false, right: false, jumpHeld: false, jumpQueued: false });
  const game = useRef(null);
  const view = useRef({ w: 320, h: 180, offY: 0 });
  const [touch] = useState(isCoarse);
  const [hud, setHud] = useState({ stars: 0, phase: 'play', count: 3, hint: true });
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);

  const finish = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    setTimeout(onDone, reducedMotion ? 150 : 700);
  }, [onDone, reducedMotion]);

  // Resize: pick a logical resolution about 180 px tall (wider screens see more level).
  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current;
      if (!c) return;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const scale = Math.max(1, Math.min(H / WORLD_H, W / 240));
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
  }, [finish]);

  // Game loop.
  useEffect(() => {
    game.current = createGame();
    const ctx = canvasRef.current.getContext('2d');
    let raf = 0;
    let last = performance.now();
    let shown = { stars: -1, phase: '', count: -1, hint: true };

    const frame = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      const g = game.current;
      update(g, input.current, dt, view.current);
      ctx.imageSmoothingEnabled = false;
      render(ctx, g, view.current, reducedMotion);

      const count = g.phase === 'count' ? 3 - Math.floor(g.phaseT / 0.8) : 0;
      const hint = !g.moved;
      if (g.collected !== shown.stars || g.phase !== shown.phase || count !== shown.count || hint !== shown.hint) {
        shown = { stars: g.collected, phase: g.phase, count, hint };
        setHud(shown);
      }
      if (g.phase === 'done') { finish(); return; }
      raf = requestAnimationFrame(frame);
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

      <div className="intro-stars" aria-live="polite">★ {String(hud.stars).padStart(2, '0')}/{total}</div>
      <button className="intro-skip" onClick={finish}>Skip ▸▸</button>

      <div className={`intro-title ${hud.hint && hud.phase === 'play' ? '' : 'faded'}`}>
        <div className="intro-name">Bishwaswarup Nayak</div>
        <div className="intro-mission">Mission 00 · reach the launch pad</div>
        <div className="intro-keys">
          {touch ? 'Use the buttons to move and jump' : '← → move · Space jump · Esc skip'}
        </div>
      </div>

      {hud.phase === 'count' && hud.count > 0 && <div className="intro-count" key={hud.count}>{hud.count}</div>}
      {(hud.phase === 'launch' || hud.phase === 'done') && (
        <div className="intro-liftoff">
          Liftoff
          <small>★ {hud.stars}/{total} collected</small>
        </div>
      )}

      {touch && hud.phase === 'play' && (
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
