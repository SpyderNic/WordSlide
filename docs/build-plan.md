# Word Slide — Build Plan

Approved by the designer on 2026-10-31. Each milestone ends with the designer playing it, and the next doesn't start until they say so.

| # | Milestone | Stories | Status |
|---|---|---|---|
| 1 | **Foundation**: project, tests, style file, save interface | None | In progress |
| 2 | **Levels and screen** | 1, 2 | Not started |
| 3 | **Phase one** | 3, 4, 5, 6, 17 | Not started |
| 4 | **Phase two** | 7, 8, 9, 10 | Not started |
| 5 | **The whole game**, including the tutorial (FTUE) | 11, 16, 12 | Not started |
| 6 | **Content**: generator and the 40 levels | 14, 15 | Not started |

## How we work

- One story at a time: build until its scenarios pass, then report what passed and anything that couldn't be tested.
- Scenarios that depend on a later story wait until that story is built, and the report says which.
- Anything unclear stops the work and goes to the designer as a question.
- Commit after each story, and push to `main`.
- Changes from playing a milestone go through the map and scenarios first, then the code.
- Milestones 2–5 use test levels made only of words already discussed, so the designer's playtest stays blind (D46).
