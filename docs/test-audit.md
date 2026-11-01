# Test audit report

Requested by the designer on 2026-10-31, finished on 2026-11-01. The audit itself changed no game behaviour: only tests, plus some test-only bookkeeping removed from the game code. The designer's answers below then made two changes to the game, both listed there.

## Result

- 419 tests pass: 191 logic and 228 browser.
- Each rule in stories 1 to 10 and 17 was broken on purpose, 245 breaks in all.
- 222 were caught straight away.
- 15 of the other 23 are now caught, after stronger tests or a corrected break.
- 8 remain uncaught, and no player could notice any of them.
- The agreed changes below were broken on purpose as well, and all 5 breaks were caught.

## Questions for the designer

Answered on 2026-11-01:

1. **Tap or drag: keep it.** A press stays a tap until it moves 15% of a tile. This is now in story 17, tested just under and just over the limit.
2. **The snap after a flick: keep the ease.** D39 and story 8 now say a flick eases to a stop over 0.25 seconds, with no bounce.
3. **`?level=N`: development builds only.** Changed in the game. The released build no longer contains the code that reads it.
4. **Ctrl and Alt with a letter: leave it as it is.** Ignoring either would risk accented letters, because many keyboards type é with Alt or AltGr. A browser shortcut such as Ctrl+C can still place a letter, and the designer accepts that.
5. **Handles after rotating: a real bug, now fixed.** After a rotation, a handle kept its old size, 46 instead of 83 in the test.

## Wording to tighten

These need the designer's approval, so they're unchanged:

- Story 8 says most of the long word runs off the left. On a 450-wide screen, it's 3 of its 8 cells.
- Story 6 has no "doesn't fit" example for D8's fourth row, though fixed cells imply it.
- Story 6 says "no confirmation". That's only shown by one press being enough.

## Findings by story

**Story 1.** Centring was checked against a formula in the test, not the game's own layout. The pool counts were compared with themselves. Both fixed.

**Story 2.** The Recall All arrow count was hard-coded. It's now read from what's drawn.

**Story 3.** A broken count sent a test into an endless loop, where it should simply have failed. Fixed. "Can be dragged" now really picks up the letter. New checks: a tile turns grey as soon as its last copy is picked up, and a dragged tile shows its letter under the pointer.

**Story 4.** New check: a letter taken from the pool doesn't highlight a tile. New check: a tile is grey exactly while it has no copies left.

**Story 5.** The button's grey state was never checked as drawn. New checks: it's grey with nothing to recall, grey when only locked words remain, and Recall All does nothing while a letter is held.

**Story 6.** Locked, revealed and grey colours were never read from the screen. Fixed. The "Already found" check passed even when the message didn't rise or fade, because it counted a message that had gone as having moved. Fixed.

**Story 7.** "About 1 second" measured nothing, and the ceremony was always skipped in tests. It now really plays and is timed frame by frame. The "drag during the ceremony" test was pressing where nothing could be picked up. Fixed. Notches and handle grips are now read from what's drawn. "Nothing is picked up" was checked after the release, and now it's checked while holding.

**Story 8.** The flick end check could never fail. Fixed. The range rule only tested where a word snaps, not where it stretches. Fixed. Stretching was only tested at one end, and by too small a drag. Fixed. The flick test now needs the glide to reach the end. The false-flick fix has its test, and that test fails when the fix is removed.

**Story 9.** A rotation's "drag cancelled" read phase-one state. Fixed. The row stretch had no real limit check. Fixed. Reordering before the tutorial (D45) is checked on the rules only, because nothing can turn handles off on screen until story 12.

**Story 10.** Winning with Shift+arrow had no test. Fixed. Gold, fade, popup and snap read values the game kept for the tests, and now read the real objects. Rotating during the celebration only checked that a popup appeared, which happens anyway after 1.5 seconds. It now has to jump there.

**Story 17.** "Row is selected" now uses a real click. The arrow selection is checked per arrow. A press now has a tested 15% allowance before it becomes a drag.

## Breaks that nothing catches, and why

| Break | Why nothing fails |
| --- | --- |
| Second touch pointer removed | That line lets the game track a second finger, and the rule is to ignore it. The line is unnecessary |
| First typed letter's row | A later line moves on from a full row, with the same result |
| Accented key check | Redundant: the next line already rejects that case |
| Selection cleared at the last lock | Another line clears it too |
| Phase-one keys in phase two | Keys reach the old board, but nothing shows and no letters remain |
| "A key needs a tile" | My break was badly made. The real rule is caught by the grey-tile break |
| Two "no input after a win" guards, one at a time | Each covers for the other. Removing both is caught |

## Code no scenario asks for

- `FLICK_*`, `STRETCH_*`, `GOLD_STAGGER`, `WIN_FADE`, `PULSE_SCALE`, `RAISED_SCALE`, `SHAKE_DISTANCE` and many size ratios are in `src/scenes`, though D27 puts timings and sizes in `src/style`.
- `letterTravel`, `levelFade` and `interstitial` in `src/style` aren't used yet. A foundation test reads `letterTravel` as a hard-coded value.
- `baseOf` in `src/game/board.ts` duplicates `baseLetter` in `src/game/characters.ts`.

## What can't be tested automatically

How it feels on a real device, real touch hardware (parked until the milestones are done), and how the colours look.

## New test files

- `tests/browser/screen-audit.feature` and `tests/logic/audit.feature` hold what the audit added. They aren't designed stories.
- `tests/browser/steps/probe.ts` lets browser tests read what the game really draws.
- The development-only browser hook now exposes the scene, for those tests.
