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
  /** A tile's soft bevel (M05-02, R8): the edges' thickness as a share of the tile, and how much lighter and darker they are, in percent. */
  bevel: { edge: number; light: number; dark: number };
  /** No text is smaller than this, in pixels (M05-02, R4). */
  minText: number;
  /** How much bigger a pulsing tile gets: 1.15 is 15% (D37). */
  pulseScale: number;
  /** Milliseconds. */
  /** How strongly rows that aren't selected and aren't finished show (M06-03, R3). */
  fadedRow: number;
  /** How many coins fly to the counter when coins are earned (M07-02, R15). */
  coinFlights: number;
  timings: {
    letterTravel: number;
    /** A locking tile grows, takes its new colour at its biggest, then shrinks back (D37). */
    lockPulseGrow: number;
    /** The tutorial's hand glides for handMove, then pauses for handPause, and repeats (M05-03, R9). */
    handMove: number;
    handPause: number;
    /** One brightening and dimming of level 2's outline around the theme (M05-03, R12). */
    themeGlow: number;
    lockPulseShrink: number;
    wrongShake: number;
    alreadyFound: number;
    /** "Bonus word!" rising and fading above the rows (M07-05, R4). */
    bonusWord: number;
    snap: number;
    rowMakeWay: number;
    ceremony: number;
    popupDelay: number;
    levelFade: number;
    interstitial: number;
    /** A row fading or coming forward as the selection moves (M06-03, Q8). */
    rowFade: number;
    /** The pool changing to another row's letters (M06-03, Q3). */
    poolChange: number;
    /** Earned coins flying to the counter (M07-02, R15): how long each flies, and the gap between one setting off and the next. */
    coinFlight: number;
    coinFlightGap: number;
    /** How long the Level complete popup shows the old points before the new ones pulse in (M07-02, R11). */
    pointsPause: number;
    /** The coin counter counting down when coins are spent (M07-03, R10). */
    coinCount: number;
    /** The Level complete screen fading in over the level (M07-04, Q15). */
    completeFade: number;
    /** After the points change, how long before the series bar starts filling, and how long it takes (M07-04, R4). */
    seriesBarPause: number;
    seriesBarFill: number;
    /** A finished series' bar lighting up and going back, once (M07-04, R5). It flashes twice. */
    seriesFlash: number;
  };
}
