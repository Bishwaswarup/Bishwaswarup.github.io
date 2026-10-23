// The intro level, in world pixels. The world is 180 px tall; the ground top is
// at GROUND_Y and everything else is placed relative to it.
//
// Jump physics (see engine.js): apex ~55 px, ~75 px of horizontal travel on a
// flat jump at full speed. Gaps are 48-56 px and every step is <= 34 px, so the
// level is forgiving on purpose: it is a front door, not a challenge.

export const WORLD_H = 180;
export const GROUND_Y = 148;
export const LEVEL_END = 2560;

// Ground segments [x0, x1]; the space between them is a pit.
export const GROUND = [
  [0, 520],
  [568, 900],
  [948, 1300],
  [1348, 1700],
  [1756, LEVEL_END],
];

// One-way girders [x, yTop, width]: you can jump up through them and land on top.
export const PLATFORMS = [
  [150, 118, 40],
  [220, 96, 40],
  [640, 112, 48],
  [712, 88, 48],
  [784, 112, 40],
  [1180, 84, 56],
  [1450, 110, 40],
  [1530, 86, 40],
  [1610, 62, 40],
  [1900, 112, 48],
  [1980, 92, 48],
];

// Solid cargo crates [x, yTop, w, h].
export const CRATES = [
  [300, 132, 16, 16],
  [316, 116, 16, 32],
  [1040, 132, 16, 16],
  [1120, 116, 32, 32],
];

// Collectible stars, by centre.
export const STARS = [
  [170, 104], [240, 82], [324, 100], [544, 120],
  [736, 74], [860, 134], [924, 116], [1080, 120],
  [1208, 70], [1550, 72], [1630, 48], [1728, 112],
  [2004, 78], [2180, 96],
];

// Patrolling drones: [xMin, xMax, yTop].
export const DRONES = [
  [380, 500, 136],
  [620, 880, 136],
  [1170, 1290, 136],
  [1420, 1680, 136],
  [1850, 2050, 136],
  [2100, 2250, 108],
];

// Checkpoint beacons (respawn points after a fall).
export const BEACONS = [24, 600, 980, 1380, 1790];

// Launch site.
export const PAD_X0 = 2360;
export const PAD_X1 = 2470;
export const ROCKET_X = 2404; // left edge, 20 px wide
export const BOARD_X = 2372; // stepping past this starts the boarding sequence
