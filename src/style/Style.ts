/** Everything about how the game looks and how long things take (D27). */
export interface Style {
  name: string;
  font: string;
  colours: {
    background: number;
    tile: number;
    tileGrey: number;
    tilePlaced: number;
    tileRevealed: number;
    tileLocked: number;
    tileGold: number;
    text: number;
    highlight: number;
    column: number;
  };
  /** A tile's soft bevel (story 16, R8): the edges' thickness as a share of the tile, and how much lighter and darker they are, in percent. */
  bevel: { edge: number; light: number; dark: number };
  /** No text is smaller than this, in pixels (story 16, R4). */
  minText: number;
  /** How much bigger a pulsing tile gets: 1.15 is 15% (D37). */
  pulseScale: number;
  /** Milliseconds. */
  timings: {
    letterTravel: number;
    /** A locking tile grows, takes its new colour at its biggest, then shrinks back (D37). */
    lockPulseGrow: number;
    lockPulseShrink: number;
    wrongShake: number;
    alreadyFound: number;
    snap: number;
    rowMakeWay: number;
    ceremony: number;
    popupDelay: number;
    levelFade: number;
    interstitial: number;
  };
}
