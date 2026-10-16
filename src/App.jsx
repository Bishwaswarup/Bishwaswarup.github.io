import { useCallback, useEffect, useState } from 'react';
import SpaceCanvas from './components/SpaceCanvas.jsx';
import MissionControlHUD from './components/MissionControlHUD.jsx';
import { bodies } from './data/universe.js';
import { sim } from './lib/kepler.js';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function App() {
  // selection: null | { id: 'profile' } | { id, moon?, link? }
  const [selection, setSelection] = useState(null);
  const [showLabels, setShowLabels] = useState(true);
  const [reducedMotion] = useState(prefersReducedMotion);
  const [warp, setWarpState] = useState(() => (prefersReducedMotion() ? 0 : 1));

  const setWarp = useCallback((w) => {
    sim.warp = w;
    setWarpState(w);
  }, []);
  useEffect(() => { sim.warp = warp; }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const select = useCallback((s) => setSelection(s), []);

  // Keyboard: ← / → cycle bodies, P opens the dossier, Esc returns to overview.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea')) return;
      if (e.key === 'Escape') setSelection(null);
      else if (e.key === 'p' || e.key === 'P') setSelection({ id: 'profile' });
      else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        setSelection((cur) => {
          const idx = bodies.findIndex((b) => b.id === cur?.id);
          const step = e.key === 'ArrowRight' ? 1 : -1;
          const next = idx < 0 ? (step > 0 ? 0 : bodies.length - 1) : (idx + step + bodies.length) % bodies.length;
          return { id: bodies[next].id };
        });
      } else if (e.key === ' ') {
        e.preventDefault();
        setWarp(sim.warp === 0 ? 1 : 0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setWarp]);

  return (
    <div className="app-root">
      <div className="canvas-layer">
        <SpaceCanvas
          selection={selection}
          onSelect={select}
          showLabels={showLabels}
          reducedMotion={reducedMotion}
        />
      </div>
      <MissionControlHUD
        selection={selection}
        onSelect={select}
        onClose={() => setSelection(null)}
        showLabels={showLabels}
        setShowLabels={setShowLabels}
        warp={warp}
        setWarp={setWarp}
      />
    </div>
  );
}
