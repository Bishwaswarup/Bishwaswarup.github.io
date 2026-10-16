import * as THREE from 'three';

const DEG = Math.PI / 180;

// Shared simulation state (mutable, read inside useFrame; no React re-renders).
export const sim = { t: 0, warp: 1 };
export const registry = new Map(); // body id -> THREE.Vector3 (world position)

// Kepler's third law in scene units: innermost paper planet (a = 7.5) ~ 60 s.
const K = 60 / Math.pow(7.5, 1.5);
export const periodOf = (a) => K * Math.pow(a, 1.5);

function solveKepler(M, e) {
  let E = e < 0.8 ? M : Math.PI;
  for (let k = 0; k < 8; k++) {
    E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  }
  return E;
}

// Perifocal -> inertial (Rz(Ω) Rx(i) Rz(ω)), then inertial (X, Y, Z) -> three.js (X, Z, -Y)
// so the reference plane is the scene's horizontal xz plane and +Z (orbit normal) is up.
function rotate(orbit, xp, yp, out) {
  const O = (orbit.node || 0) * DEG;
  const i = (orbit.i || 0) * DEG;
  const w = (orbit.argp || 0) * DEG;
  const cO = Math.cos(O), sO = Math.sin(O);
  const ci = Math.cos(i), si = Math.sin(i);
  const cw = Math.cos(w), sw = Math.sin(w);
  const X = (cO * cw - sO * sw * ci) * xp + (-cO * sw - sO * cw * ci) * yp;
  const Y = (sO * cw + cO * sw * ci) * xp + (-sO * sw + cO * cw * ci) * yp;
  const Z = sw * si * xp + cw * si * yp;
  return out.set(X, Z, -Y);
}

function perifocal(a, e, E) {
  return [a * (Math.cos(E) - e), a * Math.sqrt(1 - e * e) * Math.sin(E)];
}

export function keplerPosition(orbit, t, out = new THREE.Vector3()) {
  const { a, e = 0, M0 = 0 } = orbit;
  const n = (2 * Math.PI) / periodOf(a);
  const M = M0 * DEG + n * t;
  const E = solveKepler(((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), e);
  const [xp, yp] = perifocal(a, e, E);
  return rotate(orbit, xp, yp, out);
}

export function orbitPath(orbit, segments = 256) {
  const pts = [];
  for (let k = 0; k <= segments; k++) {
    const E = (k / segments) * Math.PI * 2;
    const [xp, yp] = perifocal(orbit.a, orbit.e || 0, E);
    pts.push(rotate(orbit, xp, yp, new THREE.Vector3()));
  }
  return pts;
}

// Ascending node direction (where the orbit crosses the reference plane going up).
export function nodeMarker(orbit) {
  const pts = [];
  const { a, e = 0 } = orbit;
  // true anomaly at ascending node: ν = −ω
  const nu = -(orbit.argp || 0) * DEG;
  const r = (a * (1 - e * e)) / (1 + e * Math.cos(nu));
  pts.push(rotate(orbit, r * Math.cos(nu), r * Math.sin(nu), new THREE.Vector3()));
  return pts[0];
}

export const planetRadius = (importance) => 0.32 + 0.14 * importance;
export const moonRadius = (planetR, weight) => Math.max(0.07, planetR * (0.1 + 0.075 * weight));
