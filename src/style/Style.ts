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
  /** How strongly rows that aren't selected and aren't finished show (story 23, R3). */
  fadedRow: number;
  /** How many coins fly to the counter when coins are earned (story 20, R15). */
  coinFlights: number;
  timings: {
    letterTravel: number;
    /** A locking tile grows, takes its new colour at its biggest, then shrinks back (D37). */
    lockPulseGrow: number;
    /** The tutorial's hand glides for handMove, then pauses for handPause, and repeats (story 12, R9). */
    handMove: number;
    handPause: number;
    /** One brightening and dimming of level 2's outline around the theme (story 12, R12). */
    themeGlow: number;
    lockPulseShrink: number;
    wrongShake: number;
    alreadyFound: number;
    snap: number;
    rowMakeWay: number;
    ceremony: number;
    popupDelay: number;
    levelFade: number;
    interstitial: number;
    /** A row fading or coming forward as the selection moves (story 23, Q8). */
    rowFade: number;
    /** The pool changing to another row's letters (story 23, Q3). */
    poolChange: number;
    /** Earned coins flying to the counter (story 20, R15): how long each flies, and the gap between one setting off and the next. */
    coinFlight: number;
    coinFlightGap: number;
    /** The points on the Level complete popup counting up (story 20, R11). */
    pointsCount: number;
  };
}
