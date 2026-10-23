import { useCallback, useEffect, useRef, useState } from 'react';
import portrait from './bishwa-portrait.png';

// Opening radio call, drawn as a pixel console with a flashing ALERT banner.
// The game is frozen behind the console's window while this plays.
export const TRANSMISSION = [
  { who: 'Mission Control', text: 'Bishwa! The launch window opens in two minutes. Your rocket is fuelled on Pad 1.' },
  { who: 'Mission Control', text: 'Fastest route: across the yard, through Service Tunnel B-7, then over the gantry lifts.' },
  { who: 'Bishwa', text: 'Copy that, Mission Control. On my way!' },
];

const CPS = 42; // typewriter speed, characters per second

export default function Transmission({ onDone, reducedMotion = false, touch = false }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(reducedMotion ? Infinity : 0);
  const line = TRANSMISSION[i];
  const full = shown >= line.text.length;
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  // Typewriter.
  useEffect(() => {
    if (reducedMotion) return undefined;
    setShown(0);
    const t0 = performance.now();
    let raf = 0;
    const tick = (now) => {
      const n = Math.floor(((now - t0) / 1000) * CPS);
      setShown(n);
      if (n < TRANSMISSION[i].text.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [i, reducedMotion]);

  // First press finishes the line, the next one moves on.
  const advance = useCallback(() => {
    if (shown < TRANSMISSION[i].text.length) { setShown(Infinity); return; }
    if (i + 1 < TRANSMISSION.length) setI(i + 1);
    else doneRef.current?.();
  }, [i, shown]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!e.repeat) advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance]);

  const isBishwa = line.who === 'Bishwa';
  return (
    <div className={`tx ${reducedMotion ? 'still' : ''}`} onClick={advance} role="dialog" aria-label="Incoming transmission">
      <div className="tx-frame">
        <div className="tx-bolts" aria-hidden="true"><i /><i /><i /><i /></div>
        <aside className="tx-side left" aria-hidden="true">
          <span className="led" /><span className="led amber" /><span className="led" />
          <div className="tx-gauge"><b /></div>
          <div className="tx-grille" />
        </aside>
        <aside className="tx-side right" aria-hidden="true">
          <div className="tx-signal">
            <small>Incoming · Pad 1</small>
            <div className="tx-wave">{Array.from({ length: 9 }, (_, k) => <i key={k} style={{ animationDelay: `${k * 0.09}s` }} />)}</div>
            <small>{isBishwa ? 'Reply' : 'Voice only'}</small>
          </div>
          <span className="led amber" /><span className="led" />
          <div className="tx-knob" />
        </aside>

        <div className="tx-window">
          <div className="tx-alert"><span>Alert</span></div>
          <div className="tx-sub">Launch window T−02:00</div>
        </div>

        <div className="tx-dialog" aria-live="polite">
          <div className={`tx-portrait ${isBishwa ? '' : 'mc'}`}>
            {isBishwa ? (
              <img src={portrait} alt="Bishwa" />
            ) : (
              <div className="tx-mc" aria-label="Mission Control">
                {Array.from({ length: 7 }, (_, k) => <i key={k} style={{ animationDelay: `${k * 0.11}s` }} />)}
              </div>
            )}
          </div>
          <div className="tx-text">
            <div className="tx-who">{line.who}</div>
            <p>{line.text.slice(0, shown)}<span className="tx-ghost">{line.text.slice(shown)}</span></p>
            <div className={`tx-next ${full ? 'on' : ''}`}>
              {full ? (i + 1 < TRANSMISSION.length ? '▼' : touch ? 'Tap to start' : 'Space to start') : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
