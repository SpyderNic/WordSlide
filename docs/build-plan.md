# Word Slide — Build Plan

Approved by the designer on 2026-10-31. Each milestone ends with the designer playing it, and the next doesn't start until they say so.

| # | Milestone | Stories | Status |
|---|---|---|---|
| 1 | **Foundation**: project, tests, style file, save interface | None | Done |
| 2 | **Levels and screen** | 1, 2 | Done |
| 3 | **Phase one** | 3, 4, 5, 6, 17 | Done |
| 4 | **Phase two** | 7, 8, 9, 10 | Done |
| 5 | **The whole game**, including the tutorial (FTUE) | 11, 16, 12 | Not started |
| 6 | **Content**: generator and the 40 levels | 14, 15 | Not started |

## How we work

- One story at a time: build until its scenarios pass, then report what passed and anything that couldn't be tested.
- Scenarios that depend on a later story wait until that story is built, and the report says which.
- Anything unclear stops the work and goes to the designer as a question.
- Commit after each story, and push to `main`.
- Changes from playing a milestone go through the map and scenarios first, then the code.
- Milestones 2–5 use test levels made only of words already discussed, so the designer's playtest stays blind (D46).

## Where we are

Milestones 1 to 4 are done, and the designer has been told how to play milestone 4. **Next is milestone 5: stories 11, 16 and 12, in that order.** Wait for the designer to say so before starting it.

Known placeholders for milestone 5: points stay at 0, progress isn't saved, and after the last test level "Play Level N" loops back to the first level's content (`nextLevel` in `src/scenes/GameScene.ts`). Story 11's last-level popup replaces that. The handles' link to the tutorial (D45) is only a `canReorder` setting in `src/game/phaseTwo.ts` for now.

Mobile testing on a real device is parked until all milestones are done, at the designer's request.

## Test-first from now on

The designer requires BDD/TDD: for each scenario, write the test, see it fail, then write just enough code to pass. Milestones 1 to 4 weren't built this way: the code mostly came first, and the tests after. Some steps are also empty, or read a hard-coded value (the arrow count on Recall All, for example). The tests for stories 1 to 10 and 17 are therefore weaker evidence than their pass counts suggest. The designer decides whether to audit them.
