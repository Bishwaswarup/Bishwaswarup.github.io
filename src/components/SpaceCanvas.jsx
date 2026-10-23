import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import Planet from './Planet.jsx';
import { bodies, profile } from '../data/universe.js';
import { sim, registry, planetRadius } from '../lib/kepler.js';

const OVERVIEW = new THREE.Vector3(0, 33, 66);

function SimClock() {
  useFrame((_, dt) => {
    sim.t += Math.min(dt, 0.1) * sim.warp;
  });
  return null;
}

function CentralStar({ onSelect, active }) {
  const ref = useRef();
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.05; });
  return (
    <group
      onClick={(e) => { e.stopPropagation(); onSelect({ id: 'profile' }); }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    >
      <mesh ref={ref}>
        <sphereGeometry args={[2.1, 64, 64]} />
        <meshStandardMaterial color="#ffb347" emissive="#f5a623" emissiveIntensity={1.4} roughness={0.4} />
      </mesh>
      {[1.18, 1.42, 1.8].map((s, k) => (
        <mesh key={s} scale={s}>
          <sphereGeometry args={[2.1, 32, 32]} />
          <meshBasicMaterial
            color="#f5a623"
            transparent
            opacity={[0.16, 0.07, 0.03][k]}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
      <pointLight color="#ffd8a0" intensity={900} distance={0} decay={1.6} />
      <Html position={[0, 2.6, 0]} center zIndexRange={[10, 0]}>
        <div className={`label-tag star ${active ? 'on' : ''}`}>{profile.name}</div>
      </Html>
    </group>
  );
}

// Reference plane grid: the "ecliptic" that inclined orbits tilt out of.
function ReferencePlane() {
  const rings = useMemo(() => {
    const out = [];
    for (let r = 10; r <= 50; r += 10) {
      const pts = [];
      for (let k = 0; k <= 128; k++) {
        const a = (k / 128) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
      }
      out.push(pts);
    }
    return out;
  }, []);
  const spokes = useMemo(() => {
    const out = [];
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      out.push([new THREE.Vector3(Math.cos(a) * 4, 0, Math.sin(a) * 4), new THREE.Vector3(Math.cos(a) * 50, 0, Math.sin(a) * 50)]);
    }
    return out;
  }, []);
  return (
    <group>
      {rings.map((p, k) => (
        <Line key={k} points={p} color="#1c2940" transparent opacity={0.45} lineWidth={0.6} />
      ))}
      {spokes.map((p, k) => (
        <Line key={`s${k}`} points={p} color="#1c2940" transparent opacity={0.25} lineWidth={0.5} />
      ))}
    </group>
  );
}

// Asteroid belt between the research-code orbits and the app/tool orbits.
function AsteroidBelt({ inner = 27.2, outer = 28.6, count = 800 }) {
  const ref = useRef();
  const groupRef = useRef();
  useEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < count; k++) {
      const a = rnd() * Math.PI * 2;
      const r = inner + (outer - inner) * rnd();
      p.set(Math.cos(a) * r, (rnd() - 0.5) * 0.7, Math.sin(a) * r);
      q.setFromEuler(new THREE.Euler(rnd() * 3, rnd() * 3, rnd() * 3));
      const sc = 0.03 + rnd() * rnd() * 0.12;
      s.set(sc, sc * (0.6 + rnd() * 0.6), sc);
      m.compose(p, q, s);
      ref.current.setMatrixAt(k, m);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [inner, outer, count]);
  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y = -sim.t * 0.006;
  });
  return (
    <group ref={groupRef}>
      <instancedMesh ref={ref} args={[null, null, count]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#6b7a94" roughness={1} />
      </instancedMesh>
    </group>
  );
}

// Camera rig: smoothly re-targets the orbit controls on the selected body and
// follows it along its orbit, while leaving the user free to rotate and zoom.
function CameraRig({ selection }) {
  const controls = useThree((s) => s.controls);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const shift = useRef(0);
  const flight = useRef(0);
  const goal = useMemo(() => new THREE.Vector3(), []);
  const offset = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    flight.current = 1.8; // seconds of guided flight after each selection change
  }, [selection?.id]);

  useFrame((_, dt) => {
    if (!controls) return;
    const id = selection?.id;
    const body = bodies.find((b) => b.id === id);
    if (body && registry.has(id)) goal.copy(registry.get(id));
    else goal.set(0, 0, 0);

    offset.copy(camera.position).sub(controls.target);
    const k = 1 - Math.exp(-5 * dt);
    controls.target.lerp(goal, flight.current > 0 ? k : 1);

    if (flight.current > 0) {
      flight.current -= dt;
      let desired;
      if (body) {
        const R = body.type === 'station' ? 0.6 : planetRadius(body.importance);
        desired = 7 + R * 10;
      } else if (id === 'profile') desired = 34;
      else desired = OVERVIEW.length();
      const len = THREE.MathUtils.lerp(offset.length(), desired, 1 - Math.exp(-3 * dt));
      offset.setLength(len);
      if (!body && !id) offset.lerp(OVERVIEW.clone().setLength(len), 1 - Math.exp(-2 * dt));
    }
    camera.position.copy(controls.target).add(offset);
    controls.update();

    // Keep the focused body centred in the space left of the open drawer.
    const want = id && size.width > 720 ? Math.min(210, size.width * 0.15) : 0;
    shift.current += (want - shift.current) * (1 - Math.exp(-6 * dt));
    if (shift.current > 0.5) {
      const s = shift.current;
      const fw = size.width + 2 * s;
      const fh = (size.height * fw) / size.width; // keep pixels square
      camera.setViewOffset(fw, fh, 2 * s, (fh - size.height) / 2, size.width, size.height);
    } else if (camera.view) {
      camera.clearViewOffset();
    }
  });
  return null;
}

export default function SpaceCanvas({ selection, onSelect, showLabels, reducedMotion, paused = false }) {
  const focusMode = !!selection && selection.id !== 'profile';
  return (
    <Canvas
      camera={{ position: OVERVIEW.toArray(), fov: 50, near: 0.05, far: 2000 }}
      dpr={[1, 2]}
      frameloop={paused ? 'demand' : 'always'}
      onPointerMissed={() => onSelect(null)}
    >
      <color attach="background" args={['#04060b']} />
      <fog attach="fog" args={['#04060b', 90, 220]} />
      <ambientLight intensity={0.18} />
      <SimClock />
      <Suspense fallback={null}>
        <Stars radius={300} depth={80} count={6000} factor={4} saturation={0} fade speed={0.3} />
        <ReferencePlane />
        <AsteroidBelt />
        <CentralStar onSelect={onSelect} active={selection?.id === 'profile'} />
        {bodies.map((b) => (
          <Planet
            key={b.id}
            body={b}
            selection={selection}
            onSelect={onSelect}
            showLabels={showLabels}
            focusMode={focusMode}
          />
        ))}
      </Suspense>
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.5}
        maxDistance={140}
        autoRotate={!reducedMotion && !selection}
        autoRotateSpeed={0.18}
      />
      <CameraRig selection={selection} />
    </Canvas>
  );
}
