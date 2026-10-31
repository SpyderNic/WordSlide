import type { Style } from './Style';

export const woodAndBrass: Style = {
  name: 'Wood and brass',
  font: 'sans-serif',
  colours: {
    background: 0x3b2a1e,
    tile: 0xc99a62,
    tileGrey: 0x7a7168,
    tilePlaced: 0xe0bb85,
    tileRevealed: 0x9c7043,
    tileLocked: 0x8a9a5b,
    tileGold: 0xf2c230,
    text: 0x2a1c12,
    highlight: 0xf5e6c8,
    column: 0xb08d3c,
  },
  timings: {
    letterTravel: 150,
    lockPulse: 300,
    wrongShake: 300,
    alreadyFound: 1400,
    snap: 100,
    rowMakeWay: 100,
    ceremony: 1000,
    popupDelay: 1500,
    levelFade: 300,
    interstitial: 2000,
  },
};
