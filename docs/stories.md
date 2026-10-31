# Word Slide — Story Backlog (draft)

Draft list of stories for the first playable version. The designer hasn't approved the list or its order yet.
Each story gets an Example Mapping session before any implementation.

| # | Story | Status | Questions already known for its mapping session |
|---|---|---|---|
| 1 | **Level data and validator**: the format for a level (theme, rows, revealed letters, final word, solution arrangement), plus an automatic check that every level can be solved | [Approved](example-maps/story-01-level-data-and-validator.md) with its [scenarios](../features/story-01-level-validator.feature); not implemented | None |
| 2 | **Show a level**: theme, empty rows (D5 layout), revealed letters, letter pool (D3) | [Approved](example-maps/story-02-show-a-level.md) with its [scenarios](../features/story-02-show-a-level.feature); not implemented | None |
| 3 | **Place a letter** from the pool into a cell | [Approved](example-maps/story-03-place-a-letter.md) with its [scenarios](../features/story-03-place-a-letter.feature); not implemented | None |
| 17 | **Pool as a keyboard** (queued right after story 3): tap a word to select it, then tap a pool letter to move it to that word's first available cell. On a physical keyboard, pressing a key acts the same as tapping that pool letter, if the letter exists and has a tile left. Drag and drop stays | [Approved](example-maps/story-17-pool-as-a-keyboard.md) with its [scenarios](../features/story-17-pool-as-a-keyboard.feature); not implemented. Build after story 6 | None |
| 4 | **Return a single letter** to the pool | [Approved](example-maps/story-04-return-a-letter.md) with its [scenarios](../features/story-04-return-a-letter.feature); not implemented | None |
| 5 | **Recall All** | [Approved](example-maps/story-05-recall-all.md) with its [scenarios](../features/story-05-recall-all.feature); not implemented | None |
| 6 | **Check and lock a word**, with gentle feedback when it's wrong (D8, D9, D10) | [Approved](example-maps/story-06-check-and-lock-a-word.md) with its [scenarios](../features/story-06-check-and-lock-a-word.feature); not implemented | None |
| 7 | **Switch to phase two**: the ceremony (D6) | [Approved](example-maps/story-07-switch-to-phase-two.md) with its [scenarios](../features/story-07-switch-to-phase-two.feature); not implemented | None |
| 8 | **Slide a word horizontally** with snapping (D13) | [Approved](example-maps/story-08-slide-a-word.md) with its [scenarios](../features/story-08-slide-a-word.feature); not implemented | None |
| 9 | **Reorder rows** with the handle | [Approved](example-maps/story-09-reorder-rows.md) with its [scenarios](../features/story-09-reorder-rows.feature); not implemented | None |
| 10 | **Win check and celebration** (D4, D7) | [Approved](example-maps/story-10-win-check-and-celebration.md) with its [scenarios](../features/story-10-win-check-and-celebration.feature); not implemented | None |
| 11 | **Unlock the next level and save progress**, including 1 point per level completed (D23) | [Approved](example-maps/story-11-next-level-and-progress.md) with its [scenarios](../features/story-11-next-level-and-progress.feature); not implemented | None |
| 12 | **First-level tutorial**: a strict walkthrough of level 1 (CrazyGames requires that the first minute makes it clear what to do) | [Approved](example-maps/story-12-first-level-onboarding.md) with its [scenarios](../features/story-12-first-level-tutorial.feature); not implemented | None |
| 14 | **Level generator**: an offline tool, not shipped with the game, that suggests answers and a final word from a theme's word list. Every suggestion goes through the validator and needs the designer's approval (D11) | Not mapped | |
| 15 | **Draft the first levels**: the levels for the first playable version | Not mapped | How many levels? Which themes? Level 1 is the tutorial level (story 12, R11). |
| 16 | **Visual style**: the game's real look, replacing the placeholder (D27) | Not mapped | How does a tapped letter travel from the pool to its cell (story 17, R10)? How do letters travel back to the pool, for Recall All and hinted letters (story 6, R10)? |
| 18 | **Placeholder sounds** (D34), starting with placing a letter | Not mapped | Which actions get a sound? A word locking needs one (story 6, R14), and so does winning (story 10, R13). |

## Out of scope for the first playable version

From the design-context document; not to be built unless the designer asks:
hints, red herrings, power-ups, chapters and their content, daily challenges, async challenges/multiplayer, CrazyGames SDK integration, bonus words (story 13, moved out on 2026-10-31; see [later ideas](later-ideas.md)).

There are no stars: they were replaced by 1 point per level completed (D23).
