# Word Slide — Story Backlog (draft)

Draft list of stories for the first playable version. The designer hasn't approved the list or its order yet.
Each story gets an Example Mapping session before any implementation.

| # | Story | Status | Questions already known for its mapping session |
|---|---|---|---|
| 1 | **Level data and validator**: the format for a level (theme, rows, revealed letters, final word, solution arrangement), plus an automatic check that every level can be solved | [Approved](example-maps/story-01-level-data-and-validator.md) with its [scenarios](../features/story-01-level-validator.feature); not implemented | None |
| 2 | **Show a level**: theme, empty rows (D5 layout), revealed letters, letter pool (D3 layouts) | Not mapped | The designer's note: "only use letters (accented or not) when a level uses them". To clarify: does this apply to accented letters and digits in the all-letters layout, or does it retire that layout altogether (changing D3)? |
| 3 | **Place a letter** from the pool into a cell | Not mapped | Where does a letter go when dropped on a filled cell (D14)? Can a letter be dragged directly from one cell to another? Can revealed cells be changed? |
| 4 | **Return a single letter** to the pool | Not mapped | |
| 5 | **Recall All** | Not mapped | |
| 6 | **Check and lock a word**, with gentle feedback when it's wrong (D8, D9, D10) | Not mapped | What does "gentle feedback" look like, and do the letters stay in place afterwards? Visuals for "already found" and for hinted letters going back to the pool. |
| 7 | **Switch to phase two**: the ceremony (D6) | Not mapped | Every detail of the ceremony. The column's position is story 1's Q8. |
| 8 | **Slide a word horizontally** with snapping (D13) | Not mapped | |
| 9 | **Reorder rows** with the handle | Not mapped | |
| 10 | **Win check and celebration** (D4, D7) | Not mapped | What the win and the instant win look like. |
| 11 | **Unlock the next level and save progress** | Not mapped | |
| 12 | **First-level onboarding** (CrazyGames requires that the first minute makes it clear what to do) | Not mapped | |

## Out of scope for the first playable version

From the design-context document; not to be built unless the designer asks:
hints, red herrings, power-ups, points, stars, chapters and their content, daily challenges, async challenges/multiplayer, CrazyGames SDK integration.
