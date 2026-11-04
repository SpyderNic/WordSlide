# Story 6: Check and lock a word

**Status:** 🟢 Approved by the designer on 2026-10-31, along with its scenarios in [story-06-check-and-lock-a-word.feature](../../features/story-06-check-and-lock-a-word.feature). Built on 2026-10-31. R16 (split words) added after playing milestone 5, and built on 2026-11-02.

> *Changed by story 23 on 2026-11-04.* Each row now has its own pool ([story 23](story-23-a-pool-for-each-row.md)). Some of this story's examples changed to use a row's own letters, and scenarios whose rule no longer applies are in `archive/before-story-23/`, with the rule that replaced each.

*As a player, I want the game to check each word I complete, so that correct words lock in and wrong ones can be fixed without penalty.*

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

All examples use the answers ZEBRA, LEMUR and KANGAROO, with nothing revealed, unless they say otherwise. The rows are LEMUR, ZEBRA, KANGAROO (D5).

**Terms:** a *full* row has no empty cell. A row's *hints* are its revealed letters, not counting special characters. A *fixed cell* holds a revealed letter, a special character or a locked word's letter.

This story brings together D8, D9, D10, D18 and D48. The switch to phase two is story 7.

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
- 🟩 In a split word, only the parts that didn't lock shake (Q12): HON DOG in HOT DOG's row locks DOG, and only HON shakes
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

*From Q3 and Q11.* Each tile grows 15% from its centre in 0.15 seconds, takes the locked colour at its biggest, then shrinks back in 0.2 seconds. A locking part (R16) pulses the same way. Revealed letters in that word take the locked colour too. The sound effect is parked with story 18.

- 🟩 When LEMUR locks, its row pulses, and all 5 tiles turn the locked colour
- 🟩 LEMUR's tiles keep their colour while they grow, and take the locked colour at their biggest
- 🟩 Each tile and its letter keep their centre while they pulse
- 🟩 Typing on while a part or word pulses doesn't cut the pulse short, and the same goes for the wrong-word shake (from playing milestone 5)

**Confirmed:** ☑

### 🟦 R15. Filling a row moves the selection on in every case

*From Q6.* Story 17's R5 applies to words that lock, wrong words and "already found" words alike, because the row keeps its letters.

- 🟩 With TEAM locked, typing TEAM in the selected row shows "already found", and the selection moves on

**Confirmed:** ☑

### 🟦 R16. A split word's parts lock on their own (D48)

*Added by the designer after playing milestone 5, on 2026-11-02, with Q7 to Q10.* A *part* is a run of letters between special characters, or between a special character and the end of the word. Once all of a part's cells are filled, it locks if it matches the same part of any not-yet-locked answer that fits the row. A full row is still checked as a whole. A word with no special character inside it has one part, so nothing changes for it.

- 🟩 Placing H, O, T in the first three letter cells of HOT DOG locks HOT, and DOG's cells stay empty
- 🟩 Placing R, E, X in the last three cells of T-REX locks REX, and T's cell stays empty
- 🟩 Placing T in T-REX's first cell locks T
- 🟩 With the answers HOT DOG and HOT POT, placing DOG in HOT POT's row locks it, because HOT DOG fits that row too
- 🟩 When HOT locks, only HOT's tiles pulse and take the locked colour
- 🟩 With HOT already locked, finding DOG locks HOT DOG, and only DOG's tiles pulse: HOT doesn't celebrate again (from playing milestone 5)
- 🟩 Placing C, A, T in HOT DOG's first three cells locks nothing, with no feedback, because the row isn't full
- 🟩 Placing D and REX in T-REX locks REX, the D stays placed, and the wrong-word feedback plays
- 🟩 Placing CAT DOP in HOT DOG's cells locks nothing, and the wrong-word feedback plays
- 🟩 A locked part's letters can't be dragged, and Recall All leaves them
- 🟩 With the rows HOT DOG, DOG TAG and CAT: CAT DOG in HOT DOG's row locks DOG. Then HOT DOG built in DOG TAG's row locks in full, and the DOG in HOT DOG's row goes back to the pool
- 🟩 With the rows HOT DOG and HOT POT: HOT POG in HOT DOG's row locks HOT. After Recall All, HOT DOG built in HOT POT's row locks in full, and HOT stays, because HOT POT can still go there

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

### 🟥 Q7. Which answers can a part match?

**Answer:** Any not-yet-locked answer that fits the row, as for whole words (R16).

### 🟥 Q8. Does a part of one letter lock on its own?

**Answer:** Yes, any part does, like the T in T-REX (R16).

### 🟥 Q9. What feedback does a locking part get?

**Answer:** Only the part's tiles pulse and take the locked colour (R16).

### 🟥 Q10. What happens to a locked part whose row can no longer fit any remaining answer?

**Answer:** Its letters go back to the pool, like stranded hints. If the row can still fit a remaining answer, the part stays (R16).

### 🟥 Q11. Can the lock pulse feel better?

*Asked by the designer after playing milestone 5.* **Answer:** Each tile grows 15% from its centre in 0.15 seconds, turns the locked colour at its biggest, then shrinks back in 0.2 seconds (R14).

### 🟥 Q12. In a split word, what shakes when the row is wrong?

*Asked by the designer after playing milestone 5.* **Answer:** Only the parts that didn't lock. Locked parts and special characters stay still (R6).
