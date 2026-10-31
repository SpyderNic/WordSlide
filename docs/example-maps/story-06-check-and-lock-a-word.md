# Story 6: Check and lock a word

**Status:** 🟢 Approved by the designer on 2026-10-31, along with its scenarios in [story-06-check-and-lock-a-word.feature](../../features/story-06-check-and-lock-a-word.feature). Not implemented yet. The typing and selection scenarios need story 17.

*As a player, I want the game to check each word I complete, so that correct words lock in and wrong ones can be fixed without penalty.*

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

All examples use the answers ZEBRA, LEMUR and KANGAROO, with nothing revealed, unless they say otherwise. The rows are LEMUR, ZEBRA, KANGAROO (D5).

**Terms:** a *full* row has no empty cell. A row's *hints* are its revealed letters, not counting special characters. A *fixed cell* holds a revealed letter, a special character or a locked word's letter.

This story brings together D8, D9, D10 and D18. The switch to phase two is story 7.

---

## Rules and examples

### 🟦 R1. A row is checked as soon as it's full, with no button to press

It doesn't matter how the last letter arrived: dragging, swapping, tapping or typing.

- 🟩 Placing the R of LEMUR in the last empty cell checks the row at once
- 🟩 A swap that fills a row checks it too

**Confirmed:** ☑

### 🟦 R2. A full row locks if its word is an unlocked answer and fits the row (D8)

"Fits" means it matches the row's cell count, its revealed letters and its special characters.

- 🟩 LEMUR in the top row locks
- 🟩 ZEBRA in the top row locks, because both words have 5 cells
- 🟩 With T revealed first in a row, and the answers TREE and TART, either word locks there
- 🟩 With T revealed first in a row, and the answers TREE and PALM, PALM can't lock there

**Confirmed:** ☑

### 🟦 R3. Only the level's answers lock

Bonus words aren't in the prototype, so a real word that isn't an answer counts as wrong. Forgiving accent mix-ups is a [later idea](../later-ideas.md), not part of the prototype.

- 🟩 ZEBRA, LEMUR and KANGAROO lock, but LEMON in the top row doesn't
- 🟩 With the answer CAFÉ, CAFE doesn't lock, because É and E are different letters (D21)

**Confirmed:** ☑

### 🟦 R4. A locked word's cells become fixed

Its letters can't be dragged, Recall All leaves them, and the row can't be selected.

- 🟩 With LEMUR locked, trying to drag its M does nothing

**Confirmed:** ☑

### 🟦 R5. Locking doesn't change the pool

The letters already left the pool when they were placed.

- 🟩 The pool shows the same counts before and after LEMUR locks

**Confirmed:** ☑

### 🟦 R6. A wrong word gets gentle feedback and costs nothing

The row shakes a little sideways. Its letters stay in place, so the player can fix a single letter (Q1, Q2). There's no limit on tries, and no penalty.

- 🟩 ZEBRE in ZEBRA's row shakes, and the letters stay
- 🟩 Replacing the last E with an A locks ZEBRA
- 🟩 The player can get it wrong any number of times

**Confirmed:** ☑

### 🟦 R7. Feedback doesn't block the player

- 🟩 The player can keep dragging, tapping or typing during any feedback

**Confirmed:** ☑

### 🟦 R8. A locked answer spelled again gives "already found" feedback, and the letters stay in place (D10)

*Changed by the designer: the letters no longer go back to the pool.* The locked row highlights briefly. "Already found" appears in the centre of the screen on a background, gently rises and fades out (Q4). The full row then behaves like a wrong word: the player can edit it.

This needs answers that share all their letters, because a level's pool only has enough letters for each answer once.

- 🟩 Answers TEAM and MEAT. With TEAM locked in row 1, spelling TEAM in row 2 shows "already found", and row 2 stays as it is
- 🟩 Swapping that row's T and M spells MEAT, which locks

**Confirmed:** ☑

### 🟦 R9. Hinted letters go back to the pool when no remaining answer can fit their row (D9)

After each lock, the game checks every unlocked row. If none of the answers still unlocked fits a row's revealed letters, all its hints go to the pool. The row's placed letters stay.

- 🟩 Answers TART and TREE, with R revealed in row 1 (`_ _ R _`). The player builds TART in row 2, and it locks with the player's own letters. The R leaves row 1 for the pool. Row 1 is now `_ _ _ _`, and the pool holds T, R, E, E.
- 🟩 As above, with an E placed in row 1 (`_ _ R E`). The R goes to the pool, and the E stays: `_ _ _ E`.
- 🟩 As above, with T and R revealed in row 1 (`T _ R _`, where only TART fits). Both go to the pool, and it holds T, R, E, E.

**Confirmed:** ☑

### 🟦 R10. A hinted letter that goes back to the pool becomes an ordinary letter

It can be dragged, tapped and typed like any other. For now it simply disappears from its row and its tile's count goes up. In the finished game it'll travel back to the pool (story 16).

- 🟩 After the revealed R goes to the pool, its tile count goes up by one, and it can be used in TREE

**Confirmed:** ☑

### 🟦 R11. Special characters never go to the pool (D18)

- 🟩 Answers HOT DOG and ICE TEA, with row 1 as `_ _ T ␣ _ _ _`. The player builds HOT DOG in row 2, and it locks. The T goes to the pool, and the space stays: `_ _ _ ␣ _ _ _`.

**Confirmed:** ☑

### 🟦 R12. If two rows fill at once, they're checked from the top

This can only happen with a swap.

- 🟩 A swap that completes LEMUR in the top row and ZEBRA in the middle row locks both, LEMUR first

**Confirmed:** ☑

### 🟦 R13. When the last word locks, the level moves to phase two

What that looks like is story 7.

- 🟩 After KANGAROO locks with LEMUR and ZEBRA already locked, phase one ends

**Confirmed:** ☑

### 🟦 R14. A locking word pulses briefly, then all its tiles take a new colour

*From Q3.* Revealed letters in that word take the locked colour too. It also gets a sound effect, which is in story 18.

- 🟩 When LEMUR locks, its row pulses, and all 5 tiles turn the locked colour

**Confirmed:** ☑

### 🟦 R15. Filling a row moves the selection on in every case

*From Q6.* Story 17's R5 applies to words that lock, wrong words and "already found" words alike, because the row keeps its letters.

- 🟩 With TEAM locked, typing TEAM in the selected row shows "already found", and the selection moves on

**Confirmed:** ☑

---

## Answered questions

### 🟥 Q1. How does a wrong word look?

**Answer:** A small sideways shake of the row (R6).

### 🟥 Q2. Do a wrong word's letters stay in place?

**Answer:** Yes (R6).

### 🟥 Q3. How does a locked word look?

**Answer:** A short pulse, then a new tile colour for the whole word, with a sound effect (R14).

### 🟥 Q4. How does "already found" look, beyond the highlight?

**Answer:** The text appears on a background in the centre of the screen, gently rises and fades out (R8).

### 🟥 Q5. What does a hinted letter look like when it leaves its row?

**Answer:** It simply disappears for now, but in the finished game it'll travel back to the pool (R10).

### 🟥 Q6. Where does the selection go after "already found" (story 17)?

**Answer:** It moves on as usual, because the row doesn't empty itself (R15).
