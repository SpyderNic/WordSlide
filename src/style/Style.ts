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
  /** Milliseconds. */
  timings: {
    letterTravel: number;
    lockPulse: number;
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
