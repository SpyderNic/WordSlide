# Word Slide

A themed word puzzle, built with Phaser 3, Vite and TypeScript, aiming at CrazyGames first. The designer doesn't read code: they work from example maps and Gherkin scenarios.

## Read first

- `docs/build-plan.md`: milestones and where we are.
- `docs/decisions.md`: every decision. It overrides `docs/design-context.md`.
- `docs/stories.md`: the story backlog and its status.
- `docs/example-maps/`: one map per story. `features/`: the approved scenarios.
- `docs/later-ideas.md`: not planned, but the code shouldn't rule these out.

## How we work

- Build exactly what's agreed. Anything unclear stops the work and goes to the designer as a question, with a few options and a recommendation. Don't fill gaps with defaults.
- **Test first, always (BDD/TDD).** For each scenario, one at a time: write the test, run it and see it fail for the right reason, then write just enough code to make it pass. No production code without a failing test that asks for it. A test written after the code tends to check the implementation chosen, not the behaviour agreed.
- A step that doesn't really check its scenario isn't a test. Don't leave empty steps, or steps that read a value the code just hard-coded. If something can't be tested automatically, say so.
- One story at a time: when its scenarios pass, report what passed and what couldn't be tested. Be honest about scenarios that check less than they read.
- Each milestone ends with the designer playing it. Stop there, and don't start the next until they say so.
- A change that comes from playing goes through the map and scenarios first, then the code.
- When the designer says they've "answered" a map, empty questions take the recommendation and unticked rules are approved. Still raise new questions their answers create, and your own additions. Read the whole map before marking it approved.
- Commit after each story, and push to `main`. Only stage what belongs: `docs/.obsidian/` is the designer's and is ignored.

## Rules for the code

- **Blind levels (D46):** never show the designer the words in the prototype's levels or word lists, in chat, commits, test output or docs. Only the tutorial (FOX, OWL, OX) and row counts can be shared. They'll say when to lift this.
- **Platforms (D32):** game code never calls a platform SDK. Saving, ads and so on go through `src/platform/Platform.ts`.
- **Style (D27):** colours, fonts, sizes and timings live in `src/style`, and the game can hold several styles.
- **Layout (D28):** positions and sizes come from the screen size, in landscape and portrait.
- Game rules are plain TypeScript in `src/game`, with no Phaser. `src/scenes` draws them.

## Running and testing

Node is at `C:\Program Files\nodejs`. Add it to the PATH if a shell can't find it.

- `npm run dev` serves the game at http://localhost:5173. In development builds only, `?level=N` opens level N as a peek that saves nothing, and `?reset` clears saved progress.
- Browser tests give the game its levels through `window.wordSlideTestLevels` (see `useLevels` in `tests/browser/steps/story-02.steps.ts`), so they never depend on the prototype's levels.
- Browser tests play as if the reordering tutorial were already behind the player (`window.wordSlideReorderingTaught`, set in `tests/browser/steps/fixtures.ts`), so handles show in every test level. Stories 12 and 21 turn it off with `reorderingNotTaught`, so that story 21's rule decides.
- `npm run levels:generate -- --theme Animals --words <list> --rows 3 --lengths 3-5 --reordering needed` runs the level generator (story 14) and writes a review file to `content/reviews/`, which git ignores. Tick the boxes, then `npm run levels:approve -- <review file>` adds those levels to `src/levels/levels.json`. The generator lives in `tools/`, so the game never bundles it. Its output only prints counts (D46).
- The game's levels are `src/levels/levels.json`. `npm run levels:draft` redrafts the prototype's 40 levels (story 15) from `content/word-lists/`, with the generator and Claude's picks, and prints only numbers. Never print, quote or summarise those lists or levels (D46).
- `npm run build` type-checks and builds.
- `npm run test:logic` runs scenarios without a browser, using Cucumber. Steps are in `tests/logic/steps`.
- `npm run test:browser` runs scenarios tagged `@browser` in a real browser. Steps are in `tests/browser/steps`.
- `npm test` runs both. Reports go to `reports/`.
- `npm run test:other-style` runs every browser scenario again with a recoloured style, to show a style never changes the rules (story 16, R1). Development builds pick a style with `window.wordSlideStyle`.
- When a story is built, add it to the `built` list in `cucumber.mjs` and/or `playwright.config.ts`.
- Tag a scenario `@browser` if it needs the screen, and `@touch` if it needs fingers.
- In the browser tests, Given and Then share one step registry, so one step can't be defined twice for both uses.

## Things that have caught us out

- The app's browser pane pauses the game loop when it's in the background. For anything timed, use a Playwright script.
- Automated tests with pauses between keys hid a real bug. Press keys with no gaps when it matters, and play each milestone yourself.
- Key presses are read from `window`, not Phaser's keyboard queue, which mishandled keys landing in one frame.
- The Bash tool can strip backslashes from heredocs. Write edit scripts with the Write tool instead.
