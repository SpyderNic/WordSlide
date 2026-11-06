import type { Style } from './Style';
import { woodAndBrass } from './woodAndBrass';

/** Only the colours differ: every scenario runs again with it, to show a style never changes the rules (M05-02, R1). */
export const recoloured: Style = {
  ...woodAndBrass,
  name: 'Recoloured (tests only)',
  colours: {
    background: 0x1e2a3b,
    tile: 0x62a0c9,
    tileGrey: 0x686f7a,
    tilePlaced: 0x85c0e0,
    tileRevealed: 0x43709c,
    tileLocked: 0x5b9a8a,
    tileGold: 0xf28a30,
    text: 0x121c2a,
    highlight: 0xc8e6f5,
    column: 0x3c8db0,
  },
};

/** A second style that changes a colour, the font and a timing, to show each change applies everywhere (M05-02, R2). */
export const test: Style = {
  ...recoloured,
  name: 'Test (tests only)',
  font: 'Courier New',
  timings: { ...woodAndBrass.timings, letterTravel: 400 },
};
