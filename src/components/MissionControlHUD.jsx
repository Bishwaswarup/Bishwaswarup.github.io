import { useEffect, useMemo, useState } from 'react';
import {
  X, Github, Star, Radio, ExternalLink, FileText, Archive, Code2, Mail, User,
  Pause, Play, Tag, Info, ChevronRight, Clock, GitBranch, Orbit, Rocket,
} from 'lucide-react';
import { bodies, profile, categories } from '../data/universe.js';
import { sim, periodOf } from '../lib/kepler.js';
import useGithubRepos from '../hooks/useGithubRepos.js';

const groupOf = (b) => {
  if (b.type === 'station') return 'Lab · station';
  if (b.type === 'comet') return 'Apps & tools · outer orbits';
  if (b.paper) return 'Papers · inner orbits';
  if (b.orbit.a < 28) return 'Research code · middle orbits';
  return 'Apps & tools · outer orbits';
};
const GROUPS = ['Lab · station', 'Papers · inner orbits', 'Research code · middle orbits', 'Apps & tools · outer orbits'];

const linkIcon = (kind) =>
  kind === 'paper' ? <FileText size={14} /> : kind === 'doi' ? <Archive size={14} /> : <Code2 size={14} />;

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function SimClockReadout() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT(sim.t), 250);
    return () => clearInterval(id);
  }, []);
  // 1 scene second = 1 "mission day" (purely cosmetic)
  return <b>T+{t.toFixed(0).padStart(4, '0')} d</b>;
}

function MoonDot({ weight, color }) {
  const s = 6 + weight * 4;
  return <span className="moon-dot" style={{ width: s, height: s, background: color, boxShadow: `0 0 ${s}px ${color}55` }} />;
}

function ProjectPanel({ body, selection, onSelect, repos }) {
  const cat = categories[body.category];
  const live = body.repoName ? repos[body.repoName] : null;
  const paper = body.paper ? profile.papers.find((p) => p.id === body.paper) : null;
  const moons = useMemo(
    () => body.moons.map((m, k) => ({ ...m, k })).sort((a, b) => b.weight - a.weight),
    [body]
  );
  const o = body.orbit;

  return (
    <>
      <div className="eyebrow" style={{ color: cat.color }}>{cat.label}</div>
      <h2>{body.name}</h2>
      <div className="status-badge" style={{ borderColor: cat.color, color: cat.color }}>{body.status}</div>
      <p className="tagline">{body.tagline}</p>
      <p className="desc">{body.description}</p>

      {paper && (
        <div className="paper-card">
          <div className="label"><FileText size={11} /> PAPER</div>
          <div className="paper-title">{paper.title}</div>
          <div className="paper-venue">{paper.venue}</div>
          {paper.doi && (
            <a className="doi" href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer">
              <span>DOI</span> {paper.doi} <ExternalLink size={10} />
              {paper.doiLabel && <em>{paper.doiLabel}</em>}
            </a>
          )}
        </div>
      )}

      {moons.length > 0 && (
        <section>
          <h3><Orbit size={12} /> {body.type === 'comet' ? 'Features' : 'Moons · findings by importance'}</h3>
          <ul className="moon-list">
            {moons.map((m) => {
              const on = selection?.moon === m.k;
              return (
                <li key={m.k} className={on ? 'on' : ''}>
                  <button onClick={() => onSelect({ id: body.id, moon: on ? undefined : m.k })}>
                    <MoonDot weight={m.weight} color={cat.color} />
                    <span className="moon-name">{m.name}</span>
                    <ChevronRight size={12} className="chev" />
                  </button>
                  {on && <p>{m.detail}</p>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {body.satellites.length > 0 && (
        <section>
          <h3><Radio size={12} /> Satellites · links</h3>
          <div className="link-row">
            {body.satellites.map((s, k) => (
              <a
                key={s.url}
                className={`repo-link ${s.kind} ${selection?.link === k ? 'on' : ''}`}
                href={s.url}
                target="_blank"
                rel="noreferrer"
              >
                {linkIcon(s.kind)} {s.label} <ExternalLink size={12} />
              </a>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3><Info size={12} /> Telemetry</h3>
        <div className="stat-grid">
          {body.repoName && (
            <>
              <div className="stat-box"><div className="label"><Star size={10} /> STARS</div><div className="value">{live ? live.stars : '—'}</div></div>
              <div className="stat-box"><div className="label"><Clock size={10} /> LAST PUSH</div><div className="value sm">{live ? fmtDate(live.pushed) : '—'}</div></div>
            </>
          )}
          <div className="stat-box"><div className="label">a · e</div><div className="value sm">{o.a.toFixed(1)} · {(o.e || 0).toFixed(2)}</div></div>
          <div className="stat-box"><div className="label">INCLINATION</div><div className="value sm">{(o.i || 0).toFixed(1)}°</div></div>
          <div className="stat-box"><div className="label">PERIOD</div><div className="value sm">{periodOf(o.a).toFixed(0)} d</div></div>
          <div className="stat-box"><div className="label">{body.type === 'comet' ? 'FEATURES · SATS' : 'MOONS · SATS'}</div><div className="value sm">{body.moons.length} · {body.satellites.length}</div></div>
        </div>
      </section>

      <div className="tag-row">
        {body.stack.map((s) => <span key={s} className="tag">{s}</span>)}
      </div>
    </>
  );
}

function ProfilePanel({ onSelect }) {
  return (
    <>
      <div className="eyebrow">Pilot dossier</div>
      <h2>{profile.name}</h2>
      <p className="tagline">{profile.role}</p>
      <p className="desc">{profile.tagline}</p>
      <div className="link-row">
        <a className="repo-link" href={`mailto:${profile.email}`}><Mail size={14} /> Email</a>
        <a className="repo-link code" href={profile.github} target="_blank" rel="noreferrer"><Github size={14} /> GitHub</a>
      </div>

      <section>
        <h3>Research interests</h3>
        <ul className="plain">{profile.interests.map((x) => <li key={x}>{x}</li>)}</ul>
      </section>

      <section>
        <h3>Papers & preprints</h3>
        <ol className="papers">
          {profile.papers.map((p) => (
            <li key={p.id}>
              <button className="paper-jump" onClick={() => onSelect({ id: p.planet })} title="Fly to project">
                {p.title}
              </button>
              <div className="paper-venue">{p.venue}</div>
              {p.doi && <div className="paper-venue">doi:{p.doi}</div>}
              <div className="mini-links">
                {p.links.map((l) => (
                  <a key={l.url} href={l.url} target="_blank" rel="noreferrer">{l.label} <ExternalLink size={10} /></a>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h3>Test scores</h3>
        {profile.tests.map((t) => (
          <div className="test-card" key={t.name}>
            <div className="entry-head"><b>{t.name}</b><span>{t.when || ''}</span></div>
            <div className="test-grid">
              <div className="stat-box total"><div className="label">TOTAL</div><div className="value sm">{t.total}</div></div>
              {t.parts.map((x) => (
                <div className="stat-box" key={x.label}><div className="label">{x.label.toUpperCase()}</div><div className="value sm">{x.value}</div></div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section>
        <h3>Education</h3>
        {profile.education.map((e) => (
          <div className="entry" key={e.where}>
            <div className="entry-head"><b>{e.where}</b><span>{e.when}</span></div>
            <div className="entry-sub">{e.what}</div>
            <ul className="plain">{e.notes.map((n) => <li key={n}>{n}</li>)}</ul>
          </div>
        ))}
      </section>

      <section>
        <h3>Experience</h3>
        {profile.experience.map((e) => (
          <div className="entry" key={e.where}>
            <div className="entry-head"><b>{e.where}</b><span>{e.when}</span></div>
            <div className="entry-sub">{e.what}</div>
            <ul className="plain">{e.notes.map((n) => <li key={n}>{n}</li>)}</ul>
          </div>
        ))}
      </section>

      <section>
        <h3>Skills</h3>
        {profile.skills.map((s) => (
          <div className="skill" key={s.group}><b>{s.group}</b><p>{s.items}</p></div>
        ))}
      </section>

      <section>
        <h3>Coursework</h3>
        <div className="tag-row">{profile.coursework.map((c) => <span className="tag" key={c}>{c}</span>)}</div>
      </section>

      <section>
        <h3>Honours</h3>
        <ul className="plain">{profile.honours.map((h) => <li key={h}>{h}</li>)}</ul>
      </section>
    </>
  );
}

function Legend({ open, setOpen }) {
  return (
    <div className={`legend ${open ? 'open' : ''}`}>
      <button className="legend-toggle" onClick={() => setOpen(!open)}>
        <Info size={12} /> {open ? 'Hide legend' : 'How to read this system'}
      </button>
      {open && (
        <div className="legend-body">
          <div><span className="lg-star" /> Star: me. Click for the CV dossier.</div>
          <div><span className="lg-planet" /> Planet: a project. Size = scope.</div>
          <div><span className="lg-ring" /> Ring: the project has a paper or preprint.</div>
          <div><span className="lg-moon" /> Moons: findings and features. Bigger moon = more important result.</div>
          <div><span className="lg-sat" /> Satellites: links (amber = paper/DOI, blue = code).</div>
          <div><span className="lg-comet" /> Comet: a side project on an eccentric orbit, without moons.</div>
          <div><span className="lg-inc" /> Inclination: how far a project sits from astrodynamics &amp; GNC (the reference plane).</div>
          <div><span className="lg-orb" /> Orbit radius: inner = papers, middle = research code, belt, outer = apps.</div>
          <div className="lg-cats">
            {Object.entries(categories).map(([k, c]) => (
              <span key={k}><i style={{ background: c.color }} />{c.label}</span>
            ))}
          </div>
          <div className="lg-keys">← → cycle bodies · P dossier · Space pause · Esc overview</div>
        </div>
      )}
    </div>
  );
}

export default function MissionControlHUD({ selection, onSelect, onClose, showLabels, setShowLabels, warp, setWarp, onReplayIntro }) {
  const repos = useGithubRepos();
  const [legendOpen, setLegendOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const active = selection && selection.id !== 'profile' ? bodies.find((b) => b.id === selection.id) : null;
  const drawerOpen = !!active || selection?.id === 'profile';
  const moonCount = bodies.reduce((n, b) => n + b.moons.length, 0);
  const totalStars = Object.values(repos).reduce((n, r) => n + (r.stars || 0), 0);

  const pick = (s) => { onSelect(s); setNavOpen(false); };

  return (
    <div className="hud-layer">
      <div className="scan-corner tl" />
      <div className="scan-corner tr" />
      <div className="scan-corner bl" />
      <div className="scan-corner br" />

      <header className="hud-header">
        <div className="call-sign">{profile.callSign} · IISc Bengaluru</div>
        <h1>{profile.title}</h1>
        <div className="subtitle">{profile.tagline}</div>
        <button className={`dossier-btn ${selection?.id === 'profile' ? 'active' : ''}`} onClick={() => onSelect({ id: 'profile' })}>
          <User size={13} /> Pilot dossier · CV
        </button>
      </header>

      <button className="nav-toggle" onClick={() => setNavOpen(!navOpen)}>
        <GitBranch size={14} /> {navOpen ? 'Close' : 'Bodies'}
      </button>
      <nav className={`nav-rail ${navOpen ? 'open' : ''}`}>
        {GROUPS.map((g) => (
          <div key={g} className="nav-group">
            <div className="nav-group-label">{g}</div>
            {bodies.filter((b) => groupOf(b) === g).map((b) => (
              <button
                key={b.id}
                className={`nav-btn ${selection?.id === b.id ? 'active' : ''}`}
                style={{ '--c': categories[b.category].color }}
                onClick={() => pick({ id: b.id })}
              >
                <span className="nav-dot" />
                <span className="nav-text">
                  {b.name}
                  <small>{b.status}</small>
                </span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <Legend open={legendOpen} setOpen={setLegendOpen} />

      <div className="telemetry-strip">
        <span><Radio size={11} /> LINK <b>NOMINAL</b></span>
        <span>BODIES <b>{bodies.length}</b></span>
        <span>MOONS <b>{moonCount}</b></span>
        {totalStars > 0 && <span>★ <b>{totalStars}</b></span>}
        <span className="hide-sm">CLOCK <SimClockReadout /></span>
        <span className="warp">
          <button onClick={() => setWarp(warp === 0 ? 1 : 0)} aria-label={warp === 0 ? 'Play' : 'Pause'}>
            {warp === 0 ? <Play size={11} /> : <Pause size={11} />}
          </button>
          {[1, 4, 16].map((w) => (
            <button key={w} className={warp === w ? 'on' : ''} onClick={() => setWarp(w)}>{w}×</button>
          ))}
        </span>
        <span>
          <button className={`toggle ${showLabels ? 'on' : ''}`} onClick={() => setShowLabels(!showLabels)}>
            <Tag size={11} /> LABELS
          </button>
        </span>
        {onReplayIntro && (
          <span className="hide-sm">
            <button className="toggle" onClick={onReplayIntro} title="Play the intro again">
              <Rocket size={11} /> INTRO
            </button>
          </span>
        )}
        <span className="hide-sm">TARGET <b>{active ? active.name.toUpperCase() : selection?.id === 'profile' ? 'DOSSIER' : 'FREE CAM'}</b></span>
      </div>

      <aside className={`drawer ${drawerOpen ? 'open' : ''}`} aria-hidden={!drawerOpen}>
        {drawerOpen && (
          <>
            <button className="drawer-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
            {active ? (
              <ProjectPanel body={active} selection={selection} onSelect={onSelect} repos={repos} />
            ) : (
              <ProfilePanel onSelect={onSelect} />
            )}
          </>
        )}
      </aside>
    </div>
  );
}
