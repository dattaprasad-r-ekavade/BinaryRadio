/**
 * Shared layout for the 3D cassette shop. Units are metres; +y is up, the
 * back wall is at -z and the camera starts on the +z (open) side.
 * Every scene component places itself from these constants so parts built
 * separately line up.
 */
export const ROOM = { minX: -4, maxX: 4, minZ: -3, maxZ: 3, height: 3.4 }

export const SHELF = {
  x0: -3.7, // left end of the shelf unit
  x1: 0.7, // right end
  z: -2.78, // front-to-back centre of the uprights
  depth: 0.34,
  boardYs: [0.55, 1.05, 1.55, 2.05], // shelf boards (bottom to top)
  tapeRows: [0.57, 1.07, 1.57], // y the cassettes stand on
  uprightXs: [-3.7, -2.2, -0.75, 0.7],
  sectionCardY: 2.32,
}

/** Cassette case shown face-out (stylised, about 2x real size so labels read). */
export const CASSETTE = { w: 0.22, h: 0.14, d: 0.03, spacing: 0.27, tilt: -0.18 }

export const SIGN = { x: -1.5, y: 2.82, z: -2.96, w: 3.0, h: 0.6 }

export const BIN = { x: -2.0, z: -1.2, w: 1.1, h: 0.7, d: 0.7 }

export const COUNTER = { x: 1.1, z: 0.4, w: 2.4, h: 1.0, d: 0.75, topY: 1.05 }

/** Items standing on the counter top (y is the item's centre). */
export const DECK = { x: 1.35, y: 1.2, z: 0.35, w: 0.95, h: 0.3, d: 0.45 }
export const CRT = { x: 0.3, y: 1.28, z: 0.3, w: 0.5, h: 0.45, d: 0.48 }
export const RADIO = { x: 2.25, y: 1.16, z: 0.15, w: 0.45, h: 0.22, d: 0.16 }
export const HEADPHONES = { x: 2.05, y: 1.2, z: 0.5 }

export const KEYBOARD = { x: -2.55, z: 1.0, rotY: 0.5, topY: 0.97, w: 1.3, d: 0.38 }

export const WINDOW = { x: -3.98, y: 1.7, z: 0.2, w: 2.2, h: 1.6 }

/** Camera viewpoints: position and look-at target. */
export const VIEWPOINTS = {
  overview: { label: 'Overview', position: [2.0, 1.8, 4.3], target: [-1.1, 1.0, -1.4] },
  shelves: { label: 'Shelves', position: [-1.5, 1.6, 0.6], target: [-1.5, 1.3, -2.8] },
  counter: { label: 'Counter', position: [1.3, 1.75, 1.95], target: [1.2, 1.15, 0.3] },
  keyboard: { label: 'Keyboard', position: [-1.75, 1.8, 2.25], target: [-2.55, 0.95, 1.0] },
}
