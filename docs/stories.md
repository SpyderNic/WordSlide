# Word Slide — Story Backlog (draft)

Draft list of stories for the first playable version. The designer hasn't approved the list or its order yet.
Each story gets an Example Mapping session before any implementation.

| # | Story | Status | Questions already known for its mapping session |
|---|---|---|---|
| 1 | **Level data and validator**: the format for a level (theme, rows, revealed letters, final word, solution arrangement), plus an automatic check that every level can be solved | [Approved](example-maps/story-01-level-data-and-validator.md) with its [scenarios](../features/story-01-level-validator.feature); not implemented | None |
| 2 | **Show a level**: theme, empty rows (D5 layout), revealed letters, letter pool (D3) | [Approved](example-maps/story-02-show-a-level.md) with its [scenarios](../features/story-02-show-a-level.feature); not implemented | None |
| 3 | **Place a letter** from the pool into a cell | [Approved](example-maps/story-03-place-a-letter.md) with its [scenarios](../features/story-03-place-a-letter.feature); not implemented | None |
| 17 | **Pool as a keyboard** (queued right after story 3): tap a word to select it, then tap a pool letter to move it to that word's first available cell. On a physical keyboard, pressing a key acts the same as tapping that pool letter, if the letter exists and has a tile left. Drag and drop stays | Not mapped | Is a row selected when a level opens? What happens when the selected row fills up? Can a locked row be selected? What does tapping a letter do with no row selected? How are accented letters typed? Does Backspace remove a letter? |
| 4 | **Return a single letter** to the pool | Not mapped | Does a placed letter released away from any cell go to the pool, or back to its cell? |
| 5 | **Recall All** | Not mapped | |
| 6 | **Check and lock a word**, with gentle feedback when it's wrong (D8, D9, D10) | Not mapped | What does "gentle feedback" look like, and do the letters stay in place afterwards? Visuals for "already found" and for hinted letters going back to the pool. |
| 7 | **Switch to phase two**: the ceremony (D6) | Not mapped | Every detail of the ceremony. The column's position is story 1's Q8. |
| 8 | **Slide a word horizontally** with snapping (D13) | Not mapped | |
| 9 | **Reorder rows** with the handle | Not mapped | |
| 10 | **Win check and celebration** (D4, D7) | Not mapped | What the win and the instant win look like. |
| 11 | **Unlock the next level and save progress**, including 1 point per level completed (D23) | Not mapped | |
| 12 | **First-level onboarding** (CrazyGames requires that the first minute makes it clear what to do) | Not mapped | |
| 13 | **Bonus words**: valid words the puzzle doesn't expect, found horizontally and vertically within the letter set and cell constraints | Not mapped | Needs a dictionary shipped with the game, which the game otherwise doesn't need. Which word list? What does the player get for one? How does it fit with "only intended answers lock" (D8)? |
| 14 | **Level generator**: an offline tool, not shipped with the game, that suggests answers and a final word from a theme's word list. Every suggestion goes through the validator and needs the designer's approval (D11) | Not mapped | |
| 15 | **Draft the first levels**: the levels for the first playable version | Not mapped | How many levels? Which themes? |
| 16 | **Visual style**: the game's real look, replacing the placeholder (D27) | Not mapped | |
| 18 | **Placeholder sounds** (D34), starting with placing a letter | Not mapped | Which actions get a sound? |

## Out of scope for the first playable version

From the design-context document; not to be built unless the designer asks:
hints, red herrings, power-ups, chapters and their content, daily challenges, async challenges/multiplayer, CrazyGames SDK integration.

There are no stars: they were replaced by 1 point per level completed (D23).
