# Word Slide

A themed word puzzle, built with Phaser 3, Vite and TypeScript, aiming at CrazyGames first. The designer doesn't read code: they work from example maps and Gherkin scenarios.

## Read first

- `docs/build-plan.md`: milestones and where we are.
- `docs/decisions.md`: every decision. It overrides `docs/design-context.md`.
- `docs/stories.md`: the story backlog and its status.
- `docs/milestones/<n>-<name>/`: one folder per milestone, with its README and one example map per story (`docs/milestones/parked/` for parked stories). `features/<n>-<name>/`: the approved scenarios, in the same milestone folders. A new story goes in the folder of the milestone it belongs to.
- Stories are named by milestone: M07-01 is milestone 7's first story, and parked stories are P-01, P-02… A new story takes the next ID in its milestone, and a parked story coming back takes its new milestone's next ID. Files are named the same way (`m07-01-hints.md`, `m07-01-hints.feature`, `m07-01.steps.ts`). Their old numbers are in `docs/stories.md`.
- `docs/later-ideas.md`: not planned, but the code shouldn't rule these out.

## How we work

- Build exactly what's agreed. Anything unclear stops the work and goes to the designer as a question, with a few options and a recommendation. Don't fill gaps with defaults.
- **Tuning values are named settings (D52).** In maps and scenarios, a value about the economy, balance or feel (amounts, prices, waits, starting levels, timings) is named, never written into a rule. Examples set the value they use in a Given, and tests inject it in development builds, so changing a shipped value never changes a rule or test.
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
- Browser tests give the game its levels through `window.wordSlideTestLevels` (see `useLevels` in `tests/browser/steps/m02-02.steps.ts`), so they never depend on the prototype's levels.
- Browser tests play as if the reordering tutorial were already behind the player (`window.wordSlideReorderingTaught`, set in `tests/browser/steps/fixtures.ts`), so handles show in every test level. M05-03 and M05-04 turn it off with `reorderingNotTaught`, so that M05-04's rule decides.
- Economy settings (D52) live in `src/game/economy.ts`. Development builds take overrides from `window.wordSlideEconomy`; the fixtures turn midgame ads off (`firstMidgameLevel` out of reach) so levels follow on, and M07-02's steps set the values each scenario names.
- Development builds play pretend ads (M07-02, R10): a page element `#pretend-ad` with Finish and Close buttons. `window.wordSlideAds` can make no ad available, the next fail, or midgame ads not play; `window.wordSlideAdLog` lists the ads asked for; `window.wordSlideTime` replaces the clock for the ad button's countdown; `window.wordSlideTestCoins` sets the balance when a test opens a level, and `wordSlide.setCoins` once it's open.
- `npm run levels:generate -- --theme Animals --words <list> --rows 3 --lengths 3-5 --reordering needed` runs the level generator (M06-01) and writes a review file to `content/reviews/`, which git ignores. Tick the boxes, then `npm run levels:approve -- <review file>` adds those levels to `src/levels/levels.json`. The generator lives in `tools/`, so the game never bundles it. Its output only prints counts (D46).
- The game's levels are `src/levels/levels.json`. `npm run levels:draft` redrafts the prototype's 40 levels (M06-02) from `content/word-lists/`, with the generator and Claude's picks, and prints only numbers. Never print, quote or summarise those lists or levels (D46).
- `npm run build` type-checks and builds.
- `npm run test:logic` runs scenarios without a browser, using Cucumber. Steps are in `tests/logic/steps`.
- `npm run test:browser` runs scenarios tagged `@browser` in a real browser. Steps are in `tests/browser/steps`.
- `npm test` runs both. Reports go to `reports/`.
- `npm run test:other-style` runs every browser scenario again with a recoloured style, to show a style never changes the rules (M05-02, R1). Development builds pick a style with `window.wordSlideStyle`.
- When a story is built, add it to the `built` list in `cucumber.mjs` and/or `playwright.config.ts`.
- Tag a scenario `@browser` if it needs the screen, and `@touch` if it needs fingers.
- In the browser tests, Given and Then share one step registry, so one step can't be defined twice for both uses.
- `archive/before-story-23/` holds scenarios that M06-03 (a pool for each row) made obsolete, with a copy of the test steps from then. They don't run. The game as it was is tagged `before-story-23`.
- `archive/before-story-20/` holds the scenarios M07-02 (coins and ads) made obsolete, and the game before it is tagged `before-story-20`. `archive/before-m07-03/` holds the scenarios M07-03 (buying hints) made obsolete, tagged `before-m07-03`. `tools/archive-scenarios.mjs` archives for any story.
- Each row has its own pool (M06-03): a test that takes a letter "from the pool" must have that letter's row selected. Browser steps use `layoutNow(page, scenario, letter)`, which taps the row first.

## Things that have caught us out

- The app's browser pane pauses the game loop when it's in the background. For anything timed, use a Playwright script.
- Automated tests with pauses between keys hid a real bug. Press keys with no gaps when it matters, and play each milestone yourself.
- Key presses are read from `window`, not Phaser's keyboard queue, which mishandled keys landing in one frame.
- The Bash tool can strip backslashes from heredocs. Write edit scripts with the Write tool instead.
