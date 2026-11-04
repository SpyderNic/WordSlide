# Word Slide — Build Plan

Approved by the designer on 2026-10-31. Each milestone ends with the designer playing it, and the next doesn't start until they say so.

| # | Milestone | Stories | Status |
|---|---|---|---|
| 1 | **Foundation**: project, tests, style file, save interface | None | Done |
| 2 | **Levels and screen** | 1, 2 | Done |
| 3 | **Phase one** | 3, 4, 5, 6, 17 | Done |
| 4 | **Phase two** | 7, 8, 9, 10 | Done |
| 5 | **The whole game**, including the tutorial (FTUE) | 11, 16, 12 | Built: waiting for the designer to play it |
| 6 | **Content**: generator and the 40 levels | 14, 15 | Built: waiting for the designer to play it |

## How we work

- One story at a time: build until its scenarios pass, then report what passed and anything that couldn't be tested.
- Scenarios that depend on a later story wait until that story is built, and the report says which.
- Anything unclear stops the work and goes to the designer as a question.
- Commit after each story, and push to `main`.
- Changes from playing a milestone go through the map and scenarios first, then the code.
- Milestones 2–5 use test levels made only of words already discussed, so the designer's playtest stays blind (D46).

## Where we are

Milestones 1 to 4 are done, and the designer has been told how to play milestone 4. The test audit below is done and reported in `docs/test-audit.md`. Milestone 5 has started, and story 11 is built. After playing it, the designer added split-word locking (D48, story 6 R16), which is built too, and so are story 16, the visual style, and story 12, the tutorial. Before playing, the designer moved reordering to its own tutorial, on the first level that needs it (story 21, built on 2026-11-03). In the prototype, that's level 2. **Next is the designer playing milestone 5.**

Milestone 6 is built (2026-11-03): the level generator (story 14) and the 40 levels (story 15), with a full-screen card naming each new theme. The levels are in `src/levels/levels.json`, drafted with `npm run levels:draft` from the word lists in `content/word-lists/`, which the designer doesn't see (D46). Reordering is first needed at level 21, and its tutorial always shows there (story 15, Q14). Handles appear once reordering is taught (D45, `src/game/reordering.ts`). **Next is the designer playing milestones 5 and 6.**

**From playing milestone 6 (2026-11-03):** the designer found level 2 really difficult and couldn't find its 5-letter words. On 2026-11-04, the designer chose to give each row its own pool (story 23, built on 2026-11-04), with a row locking all at once. The game before it is tagged `before-story-23` in git, and scenarios it made obsolete are in `archive/before-story-23/`. The designer will decide whether shuffling (story 22) is still needed after playing it. Story 24, the designer's changes after playing it, is built too. **Next is the designer playing stories 23 and 24.**

Mobile testing on a real device is parked until all milestones are done, at the designer's request.

## Test-first from now on

The designer requires BDD/TDD: for each scenario, write the test, see it fail, then write just enough code to pass. Milestones 1 to 4 weren't built this way: the code mostly came first, and the tests after. Some steps are also empty, or read a hard-coded value (the arrow count on Recall All, for example). The designer chose to audit the tests for stories 1 to 10 and 17 before going further.

## Done: audit the tests, before milestone 5

The designer asked for this on 2026-10-31. It finished on 2026-11-01, and the report is in `docs/test-audit.md`. Milestone 5 doesn't start until the designer says so.

1. Find every step that doesn't really check its scenario: empty steps, hard-coded values, and checks weaker than the wording. Make each one real, or report that it can't be tested automatically.
2. For each rule in stories 1 to 10 and 17, break the rule in the code on purpose, and confirm that a test fails. Then restore the code. A rule that can be broken with nothing failing has a missing or weak test, so write that test first.
3. Add a test for the false-flick fix in \`src/scenes/PhaseTwoView.ts\` (\`FLICK_MAX_PAUSE\`), which has none.
4. Treat any code that no scenario asks for as a finding, and report it to the designer. Don't change behaviour without asking.
5. Report what was found and fixed, by story, then wait for the designer to start milestone 5.
