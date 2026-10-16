import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { sim, registry, keplerPosition, orbitPath, planetRadius, moonRadius } from '../lib/kepler.js';
import { categories } from '../data/universe.js';

const DEG = Math.PI / 180;

function setCursor(on) {
  document.body.style.cursor = on ? 'pointer' : 'auto';
}

function Label({ children, y, dim, kind = '' }) {
  return (
    <Html position={[0, y, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
      <div className={`label-tag ${kind} ${dim ? 'dim' : ''}`}>{children}</div>
    </Html>
  );
}

// ---- Moon: a finding / method / feature. Size = importance weight ------------
function Moon({ moon, index, count, planetR, color, active, highlighted, onPick, showLabel }) {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);
  const r = moonRadius(planetR, moon.weight);

  // Each moon gets its own inclined circular orbit around the planet.
  const params = useMemo(() => {
    const dist = planetR * 1.9 + 0.32 + index * (0.26 + planetR * 0.18);
    const inc = (((index * 47) % 70) - 35) * DEG;
    const node = index * 67 * DEG;
    const speed = 2.4 / Math.pow(dist / planetR, 1.5);
    const phase = (index / Math.max(1, count)) * Math.PI * 2;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(inc, node, 0, 'YXZ'));
    return { dist, speed, phase, q };
  }, [index, count, planetR]);

  const ringPts = useMemo(() => {
    const pts = [];
    for (let k = 0; k <= 64; k++) {
      const a = (k / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * params.dist, 0, Math.sin(a) * params.dist).applyQuaternion(params.q));
    }
    return pts;
  }, [params]);

  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (!ref.current) return;
    const a = params.phase + sim.t * params.speed;
    tmp.set(Math.cos(a) * params.dist, 0, Math.sin(a) * params.dist).applyQuaternion(params.q);
    ref.current.position.copy(tmp);
  });

  const lit = hovered || highlighted;
  const moonColor = useMemo(() => new THREE.Color(color).lerp(new THREE.Color('#cbd5e1'), 0.55), [color]);

  return (
    <>
      {active && (
        <Line points={ringPts} color={color} transparent opacity={highlighted ? 0.55 : 0.16} lineWidth={highlighted ? 1.4 : 0.8} />
      )}
      <group ref={ref}>
        <mesh
          onClick={(e) => { e.stopPropagation(); onPick(index); }}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); setCursor(true); }}
          onPointerOut={() => { setHovered(false); setCursor(false); }}
        >
          <sphereGeometry args={[r, 20, 20]} />
          <meshStandardMaterial
            color={moonColor}
            emissive={color}
            emissiveIntensity={lit ? 0.75 : 0.12}
            roughness={0.85}
          />
        </mesh>
        {/* larger invisible hit target so small moons are clickable */}
        <mesh visible={false} onClick={(e) => { e.stopPropagation(); onPick(index); }}>
          <sphereGeometry args={[Math.max(r * 2.2, 0.22), 8, 8]} />
        </mesh>
        {(lit || (active && showLabel)) && <Label y={r} dim={!lit} kind="moon">{moon.name}</Label>}
      </group>
    </>
  );
}

// ---- Satellite: a link (paper, code, archive). Small spacecraft model -------
function Satellite({ sat, index, planetR, color, highlighted, onPick }) {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);
  const dist = planetR * 1.45 + 0.15;
  const q = useMemo(
    () => new THREE.Quaternion().setFromEuler(new THREE.Euler((80 - index * 25) * DEG, index * 90 * DEG, 0, 'YXZ')),
    [index]
  );
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const a = index * Math.PI + sim.t * 1.6;
    tmp.set(Math.cos(a) * dist, 0, Math.sin(a) * dist).applyQuaternion(q);
    ref.current.position.copy(tmp);
    ref.current.rotation.y += dt * 0.8;
  });
  const lit = hovered || highlighted;
  const panel = sat.kind === 'paper' || sat.kind === 'doi' ? '#f5a623' : '#60a5fa';
  return (
    <group
      ref={ref}
      scale={Math.max(0.6, planetR)}
      onClick={(e) => { e.stopPropagation(); onPick(index); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); setCursor(true); }}
      onPointerOut={() => { setHovered(false); setCursor(false); }}
    >
      <mesh>
        <boxGeometry args={[0.09, 0.09, 0.13]} />
        <meshStandardMaterial color="#d6dde8" metalness={0.8} roughness={0.3} emissive="#ffffff" emissiveIntensity={lit ? 0.5 : 0.05} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.16, 0, 0]}>
          <boxGeometry args={[0.2, 0.006, 0.09]} />
          <meshStandardMaterial color={panel} emissive={panel} emissiveIntensity={lit ? 0.9 : 0.3} metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
      <mesh visible={false}>
        <sphereGeometry args={[0.28, 8, 8]} />
      </mesh>
      {lit && <Label y={0.1} kind="moon">{`↗ ${sat.label}`}</Label>}
    </group>
  );
}

// ---- Space station (lab) model ---------------------------------------------
function StationModel({ color, lit }) {
  const ref = useRef();
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.5; });
  return (
    <group ref={ref} rotation={[0.3, 0, 0.2]}>
      <mesh>
        <cylinderGeometry args={[0.12, 0.12, 0.7, 12]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.3} emissive={color} emissiveIntensity={lit ? 0.6 : 0.1} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.04, 8, 32]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.25} emissive={color} emissiveIntensity={lit ? 0.5 : 0.08} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.75, 0, 0]}>
          <boxGeometry args={[0.6, 0.01, 0.26]} />
          <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={lit ? 0.8 : 0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ---- Comet: nucleus, coma and a tail that always points away from the star ----
const UP = new THREE.Vector3(0, 1, 0);

function CometModel({ color, lit, tailRef }) {
  return (
    <group>
      <mesh>
        <icosahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color="#cbd5e1" emissive={color} emissiveIntensity={lit ? 0.8 : 0.35} roughness={0.9} flatShading />
      </mesh>
      <mesh scale={2.2}>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshBasicMaterial color={color} transparent opacity={lit ? 0.22 : 0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <group ref={tailRef}>
        {/* dust tail: wide, soft */}
        <mesh position={[0, 2.5, 0]}>
          <cylinderGeometry args={[0.9, 0.18, 5, 24, 1, true]} />
          <meshBasicMaterial color={color} transparent opacity={lit ? 0.2 : 0.11} side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        {/* ion tail: narrow, bright */}
        <mesh position={[0, 3.5, 0]}>
          <cylinderGeometry args={[0.18, 0.06, 7, 12, 1, true]} />
          <meshBasicMaterial color="#e0f2fe" transparent opacity={lit ? 0.35 : 0.2} side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

// ---- Planet ---------------------------------------------------------------
export default function Planet({ body, selection, onSelect, showLabels, focusMode }) {
  const groupRef = useRef();
  const spinRef = useRef();
  const tailRef = useRef();
  const [hovered, setHovered] = useState(false);
  const color = categories[body.category].color;
  const isStation = body.type === 'station';
  const isComet = body.type === 'comet';
  const R = isStation ? 0.45 : isComet ? 0.3 : planetRadius(body.importance);
  const active = selection?.id === body.id;
  const dimmed = focusMode && !active;

  const path = useMemo(() => orbitPath(body.orbit), [body.orbit]);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const tmpDir = useMemo(() => new THREE.Vector3(), []);
  const tilt = useMemo(() => [((body.orbit.i || 0) * 0.6 + 12) * DEG, 0, (body.orbit.node % 30) * DEG], [body]);

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    keplerPosition(body.orbit, sim.t, pos);
    groupRef.current.position.copy(pos);
    if (!registry.has(body.id)) registry.set(body.id, new THREE.Vector3());
    registry.get(body.id).copy(pos);
    if (spinRef.current) spinRef.current.rotation.y += dt * 0.35;
    if (tailRef.current) {
      // anti-sunward, longer near perihelion (tail length ~ 1/r)
      const r = pos.length();
      tailRef.current.quaternion.setFromUnitVectors(UP, tmpDir.copy(pos).normalize());
      const L = THREE.MathUtils.clamp(14 / r, 0.35, 2.2);
      tailRef.current.scale.set(0.6 + 0.4 * L, L, 0.6 + 0.4 * L);
    }
  });

  const pick = (e) => {
    e.stopPropagation();
    onSelect({ id: body.id });
  };
  const lit = hovered || active;

  return (
    <group>
      {/* Orbit path: inclined Keplerian ellipse */}
      <Line
        points={path}
        color={color}
        transparent
        opacity={active ? 0.65 : dimmed ? 0.06 : hovered ? 0.45 : 0.2}
        lineWidth={active ? 1.6 : 1}
        dashed={body.type === 'dwarf' || isComet}
        dashSize={0.6}
        gapSize={0.4}
      />

      <group ref={groupRef}>
        {isComet ? (
          <group
            onClick={pick}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true); setCursor(true); }}
            onPointerOut={() => { setHovered(false); setCursor(false); }}
          >
            <CometModel color={color} lit={lit} tailRef={tailRef} />
            <mesh visible={false}>
              <sphereGeometry args={[0.8, 8, 8]} />
            </mesh>
          </group>
        ) : isStation ? (
          <group
            onClick={pick}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true); setCursor(true); }}
            onPointerOut={() => { setHovered(false); setCursor(false); }}
          >
            <StationModel color={color} lit={lit} />
            <mesh visible={false}>
              <sphereGeometry args={[0.9, 8, 8]} />
            </mesh>
          </group>
        ) : (
          <group rotation={tilt}>
            <mesh
              ref={spinRef}
              onClick={pick}
              onPointerOver={(e) => { e.stopPropagation(); setHovered(true); setCursor(true); }}
              onPointerOut={() => { setHovered(false); setCursor(false); }}
            >
              <sphereGeometry args={[R, 48, 48]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={lit ? 0.55 : 0.18}
                roughness={0.55}
                metalness={0.15}
              />
            </mesh>
            {/* atmosphere */}
            <mesh scale={1.18}>
              <sphereGeometry args={[R, 32, 32]} />
              <meshBasicMaterial color={color} transparent opacity={lit ? 0.16 : 0.07} side={THREE.BackSide} depthWrite={false} />
            </mesh>
            {/* ring = this project has a paper / preprint */}
            {body.paper && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[R * 1.38, R * 1.85, 96]} />
                <meshBasicMaterial color={color} transparent opacity={lit ? 0.42 : 0.24} side={THREE.DoubleSide} depthWrite={false} />
              </mesh>
            )}
          </group>
        )}

        {/* Moons (findings) and satellites (links); a comet carries no moons */}
        {!isComet && body.moons.map((m, k) => (
          <Moon
            key={m.name}
            moon={m}
            index={k}
            count={body.moons.length}
            planetR={R}
            color={color}
            active={active}
            highlighted={active && selection?.moon === k}
            showLabel={showLabels}
            onPick={(idx) => onSelect({ id: body.id, moon: idx })}
          />
        ))}
        {body.satellites.map((s, k) => (
          <Satellite
            key={s.url}
            sat={s}
            index={k}
            planetR={R}
            color={color}
            highlighted={active && selection?.link === k}
            onPick={(idx) => onSelect({ id: body.id, link: idx })}
          />
        ))}

        {(lit || (showLabels && !dimmed && !isStation)) && (
          <Label y={R * 1.2} dim={!lit}>{body.name}</Label>
        )}
      </group>
    </group>
  );
}
