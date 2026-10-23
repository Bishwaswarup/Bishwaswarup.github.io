// The intro level, in world pixels. The world is 180 px tall; the ground top is
// at GROUND_Y and everything else is placed relative to it.
//
// Jump physics (engine.js): apex ~40 px, ~42 px of horizontal travel on a flat
// jump at full speed, ~70 px apex with the jet boots' second jump. Gaps are
// 24 px (lifts bridge the big pit) and steps are <= 32 px, so the level stays forgiving: it is a front
// door, not a challenge.

export const WORLD_H = 180;
export const GROUND_Y = 148;
export const LEVEL_END = 2800;

// Section starts, used for the HUD label.
export const SECTIONS = [
  { x: 0, name: 'Home base' },
  { x: 500, name: 'Launch yard' },
  { x: 1150, name: 'Service tunnel' },
  { x: 1810, name: 'Gantry lifts' },
  { x: 2460, name: 'Launch pad' },
];

// Ground segments [x0, x1]; the space between them is a pit.
export const GROUND = [
  [0, 264],
  [288, 768],
  [792, 1880],
  [2160, LEVEL_END],
];

// A tunnel through a hill: solid rock above `ceil`, rising to `top`.
export const TUNNEL = { x0: 1150, x1: 1800, ceil: 92, top: 24 };

// One-way girders [x, yTop, width]: jump up through them, land on top.
export const PLATFORMS = [
  [330, 120, 40],
  [400, 104, 40],
  [620, 100, 48],
  [880, 116, 48],
  [960, 96, 40],
  [2000, 56, 48], // bonus: jet boots only
  [2240, 116, 40],
  [2300, 96, 40],
  [2360, 76, 40],
];

// Moving lifts across the gantry pit. Position = base + amplitude * sin(2πt/period + phase).
export const MOVERS = [
  { x: 1924, y: 136, w: 36, ax: 34, ay: 0, period: 3.2, phase: 0 },
  { x: 1996, y: 122, w: 28, ax: 0, ay: 18, period: 2.8, phase: 1.2 },
  { x: 2072, y: 118, w: 36, ax: 35, ay: 0, period: 3.6, phase: 2.4 },
];

// Solid cargo crates [x, yTop, w, h].
export const CRATES = [
  [150, 132, 16, 16],
  [560, 132, 16, 16],
  [576, 116, 16, 32],
  [1040, 116, 32, 32],
  [1610, 132, 16, 16],
];

// Industrial pipes standing on the tunnel floor. `vent` pipes puff steam on a cycle.
export const PIPES = [
  { x: 1230, h: 16, vent: false, phase: 0 },
  { x: 1320, h: 24, vent: true, phase: 0 },
  { x: 1540, h: 20, vent: true, phase: 1.2 },
];

// Collectible stars, by centre.
export const STARS = [
  [158, 118], [276, 120], [350, 106], [420, 90],
  [700, 112], [716, 102], [732, 112], [748, 102], [780, 118],
  [904, 102], [980, 82], [1056, 100],
  [1237, 118], [1290, 124], [1360, 124], [1618, 116],
  [1940, 120], [2010, 100], [2090, 104],
  [2012, 42], [2024, 42], [2036, 42],
  [2260, 102], [2320, 82], [2380, 62],
];

// Patrolling drones: [xMin, xMax, yTop].
export const DRONES = [
  [420, 520, 136],
  [820, 950, 136],
  [1080, 1140, 136],
  [1390, 1500, 136],
  [2220, 2440, 136],
  [2420, 2560, 104],
];

// Power-up capsules.
export const POWERUPS = [
  { x: 644, y: 86, type: 'magnet' },
  { x: 1724, y: 134, type: 'jet' },
];

// Checkpoint beacons (respawn points after a fall).
export const BEACONS = [70, 520, 1164, 1830, 2180];

// Speech bubbles that fire when the astronaut first passes x.
export const TALK = [
  { x: 360, text: 'Drones! Stomp them from above.' },
  { x: 1150, text: 'Shortcut through the service tunnel.' },
  { x: 1860, text: 'Ride the lifts across.' },
  { x: 2540, text: 'Launch pad in sight!' },
];

// Launch site.
export const PAD_X0 = 2600;
export const PAD_X1 = 2720;
export const ROCKET_X = 2650; // left edge, 20 px wide
export const BOARD_X = 2615; // standing past this starts the boarding sequence
