# Word Slide — Build Plan

Approved by the designer on 2026-10-31, and reorganised by milestone on 2026-11-06: M05-04, M06-03 and M06-04 joined the milestones they came from, M07-06 and M07-04 joined milestone 7, P-01 is parked, and milestone 8 outlines what release needs. Each milestone ends with the designer playing it, and the next doesn't start until they say so.

| # | Milestone | Stories | Status |
|---|---|---|---|
| 1 | [**Foundation**](milestones/1-foundation/README.md): The project, the tests, the style file and the save interface | None | Done |
| 2 | [**Levels and screen**](milestones/2-levels-and-screen/README.md): The level format and its validator, and a level shown on screen | M02-01, M02-02 | Done |
| 3 | [**Phase one**](milestones/3-phase-one/README.md): Building the words: placing and returning letters, Recall All, locking a word, and the pool as a keyboard | M03-01, M03-02, M03-03, M03-04, M03-05 | Done |
| 4 | [**Phase two**](milestones/4-phase-two/README.md): Finding the word: the ceremony, sliding words, reordering rows, and the win | M04-01, M04-02, M04-03, M04-04 | Done |
| 5 | [**The whole game**](milestones/5-the-whole-game/README.md): Levels one after another with saved progress, the visual style, and the tutorials (FTUE) | M05-01, M05-02, M05-03, M05-04 | Done: played and approved on 2026-11-06 |
| 6 | [**Content**](milestones/6-content/README.md): The level generator and the prototype's 40 levels, and the changes from playing them | M06-01, M06-02, M06-03, M06-04 | Done: played and approved on 2026-11-06 |
| 7 | [**Worth playing**](milestones/7-worth-playing/README.md): Reasons to keep playing: hints, coins and ads, buying hints, level series, bonus words, a gentle nudge, and sound | M07-01, M07-02, M07-03, M07-04, M07-05, M07-06, M07-07 | In progress: M07-01 to M07-03 built |
| 8 | [**Ready for CrazyGames**](milestones/8-ready-for-crazygames/README.md): What release needs, as an outline: no stories are written yet | None | Not started |
| | [**Parked**](milestones/parked/README.md) | P-01 | Set aside by the designer |

Each milestone has a folder in `docs/milestones/`, with its README and its stories' example maps, and a folder of the same name in `features/` for their scenarios.

## How we work

- One story at a time: build until its scenarios pass, then report what passed and anything that couldn't be tested.
- Scenarios that depend on a later story wait until that story is built, and the report says which.
- Anything unclear stops the work and goes to the designer as a question.
- Commit after each story, and push to `main`.
- Changes from playing a milestone go through the map and scenarios first, then the code.
- Milestones 2–5 use test levels made only of words already discussed, so the designer's playtest stays blind (D46).

## Where we are

Milestones 1 to 4 are done, and the designer has been told how to play milestone 4. The test audit below is done and reported in `docs/test-audit.md`. Milestone 5 has started, and M05-01 is built. After playing it, the designer added split-word locking (D48, M03-04 R16), which is built too, and so are M05-02, the visual style, and M05-03, the tutorial. Before playing, the designer moved reordering to its own tutorial, on the first level that needs it (M05-04, built on 2026-11-03). In the prototype, that's level 2. **Next is the designer playing milestone 5.**

Milestone 6 is built (2026-11-03): the level generator (M06-01) and the 40 levels (M06-02), with a full-screen card naming each new theme. The levels are in `src/levels/levels.json`, drafted with `npm run levels:draft` from the word lists in `content/word-lists/`, which the designer doesn't see (D46). Reordering is first needed at level 21, and its tutorial always shows there (M06-02, Q14). Handles appear once reordering is taught (D45, `src/game/reordering.ts`). **Next is the designer playing milestones 5 and 6.**

**From playing milestone 6 (2026-11-03):** the designer found level 2 really difficult and couldn't find its 5-letter words. On 2026-11-04, the designer chose to give each row its own pool (M06-03, built on 2026-11-04), with a row locking all at once. The game before it is tagged `before-story-23` in git, and scenarios it made obsolete are in `archive/before-story-23/`. The designer will decide whether shuffling (P-01) is still needed after playing it. M06-04, the designer's changes after playing it, is built too. **Next is the designer playing M06-03 and M06-04.**

**Milestone 7 (2026-11-05):** hints (M07-01) and coins and ads (M07-02) are built. Buying hints (M07-03) is built too (2026-11-06). Next is mapping M07-04, level series. Milestones 5 and 6 were played and approved on 2026-11-06. The designer can play M07-01 and M07-02 now.

Mobile testing on a real device waits for milestone 8, at the designer's request.

## Test-first from now on

The designer requires BDD/TDD: for each scenario, write the test, see it fail, then write just enough code to pass. Milestones 1 to 4 weren't built this way: the code mostly came first, and the tests after. Some steps are also empty, or read a hard-coded value (the arrow count on Recall All, for example). The designer chose to audit the tests for M02-01 to M04-04 and M03-05 before going further.

## Done: audit the tests, before milestone 5

The designer asked for this on 2026-10-31. It finished on 2026-11-01, and the report is in `docs/test-audit.md`. Milestone 5 doesn't start until the designer says so.

1. Find every step that doesn't really check its scenario: empty steps, hard-coded values, and checks weaker than the wording. Make each one real, or report that it can't be tested automatically.
2. For each rule in M02-01 to M04-04 and M03-05, break the rule in the code on purpose, and confirm that a test fails. Then restore the code. A rule that can be broken with nothing failing has a missing or weak test, so write that test first.
3. Add a test for the false-flick fix in \`src/scenes/PhaseTwoView.ts\` (\`FLICK_MAX_PAUSE\`), which has none.
4. Treat any code that no scenario asks for as a finding, and report it to the designer. Don't change behaviour without asking.
5. Report what was found and fixed, by story, then wait for the designer to start milestone 5.
