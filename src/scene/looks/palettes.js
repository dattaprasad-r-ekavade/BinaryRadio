/**
 * The two shop looks. These are the only visual styles: Cosy Day follows the
 * light theme, Neon Night follows the dark theme.
 */
export const LOOKS = {
  day: {
    id: 'day',
    name: 'Cosy Day',
    background: '#fbf1de',
    wall: '#f1dcb8',
    wallLower: '#e2c294',
    floor: '#a9784e',
    wood: '#a8703f',
    woodDark: '#734826',
    counter: '#7fa07a',
    sign: '#c8553d',
    signText: '#fff4dc',
    cardBg: '#fffaf0',
    cardText: '#2a1a10',
    accentA: '#c8553d',
    accentB: '#7fa07a',
    deckBody: '#d8d2c8',
    crtBody: '#e6dcc4',
    ink: '#2a1a10',
    night: false,
  },
  night: {
    id: 'night',
    name: 'Neon Night',
    background: '#05030b',
    wall: '#1a1030',
    wallLower: '#140c26',
    floor: '#0b0716',
    wood: '#24163c',
    woodDark: '#170e2a',
    counter: '#1d1233',
    sign: '#ff2fb4',
    signText: '#ffe3f6',
    cardBg: '#0d0718',
    cardText: '#ff8fe0',
    accentA: '#ff2fb4', // hot pink
    accentB: '#22e6ff', // cyan
    violet: '#8a5cff',
    amber: '#ffcf6b',
    deckBody: '#151022',
    crtBody: '#2a2440',
    ink: '#ffe3f6',
    night: true,
  },
}
