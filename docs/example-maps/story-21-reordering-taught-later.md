# Story 21: Reordering is taught later

**Status:** 🟢 Approved by the designer on 2026-11-03, and changed after playing (Q12). Built on 2026-11-03.

> *Changed by story 23 on 2026-11-04.* Each row now has its own pool ([story 23](story-23-a-pool-for-each-row.md)). Some of this story's examples changed to use a row's own letters, and scenarios whose rule no longer applies are in `archive/before-story-23/`, with the rule that replaced each.

*As a new player, I want to learn one move at a time, so that the early levels stay simple and reordering arrives as something new.*

The designer asked for this on 2026-11-03, before playing the content. Level 1 teaches only horizontal sliding. Reordering rows (dragging a handle up or down) is taught by its own tutorial, on **the first level that needs reordering**, whichever level that is. No level number is fixed in the rules or scenarios, because the content will change often until release. The answered questions are at the end.

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

All level 1 examples use the tutorial level: the answers FOX and OWL, and the final word OX. It starts as `F O _` and `O _ L`, and the rows go FOX, OWL (D5).

---

## Rules and examples

### 🟦 R1. The reordering tutorial shows on the first level whose rows, as the player locked them, need moving

*Changed by the designer, with Q10 and Q12.* It's worked out from the levels and from how the player locked the words, so nothing in a level's data marks it, and it moves when the content changes. A level needs reordering if its starting order, the rows' order by length (D5), isn't the order that spells the final word (Q10). Level 1, the onboarding tutorial, never counts: its rows swap in the ceremony (R2), since it teaches sliding only.

On a level that needs reordering, before reordering has been taught, the ceremony keeps the rows as the player locked them. If they can't spell the final word by sliding, the tutorial shows. If they can, because same-length words were locked the other way round (D8), there's no tutorial and no handles, and the tutorial waits for a later level (Q12).

Reordering is taught once the player makes the tutorial's move, and that's saved with their progress. Until then, phase two has no handles outside the tutorial, and rows can't be moved by mouse, touch or keyboard (D45). From then on, every level has handles.

- 🟩 In today's prototype, the first level that needs reordering is level 2
- 🟩 In the planned content, it's level 21, and level 20's phase two has no handles: Shift+Up does nothing
- 🟩 If an early level changes so that it needs reordering, the tutorial moves there, with no change to the rules or scenarios
- 🟩 In level 2, the player locks the two same-length words the other way round: the rows spell the final word by sliding, so there's no tutorial and no handles. Level 3 shows the tutorial, if its rows need moving
- 🟩 After the player makes the tutorial's move and closes the game, reopening it on the next level shows handles

**Confirmed:** ☑

### 🟦 R2. Before reordering is taught, the ceremony puts the rows in the designed order

*From Q1, Q5 and Q8.* Words can lock in any row of the same length (D8), and without handles the player couldn't fix that. So, if the rows as locked can't spell the final word, the rows glide into the solution's order while the words left-align, at the same time and speed. Only same-length rows ever swap. Phase one is unchanged. This doesn't apply on the level where the tutorial shows (R1). Once reordering is taught, rows keep their phase-one order (story 7, R3).

- 🟩 In level 1, FOX and OWL lock as FOX, OWL. During the ceremony, the rows swap to OWL, FOX, and the column reads O, F
- 🟩 After the reordering tutorial, two words locked in the other order stay as they are, and the player reorders them

**Confirmed:** ☑

### 🟦 R3. Level 1 teaches three steps: complete a word, finish the grid, slide the word

*From Q4.* Today's step 3, reordering, moves to the reordering tutorial. The ceremony puts OWL above FOX (R2), and the slide step comes straight after it, with today's text: "You can drag words side to side to find the word, try it!". The hand animates from the X of FOX to the column, and only FOX can be slid.

- 🟩 After the ceremony, the rows are OWL, FOX, there are no handles, and the hand shows FOX sliding
- 🟩 Sliding FOX until its X is in the column spells OX, and the level is won

**Confirmed:** ☑

### 🟦 R4. The reordering tutorial is strict, and only in phase two

*From Q2 and Q6.* Phase one plays normally, with no text. After the ceremony, the text says "To find the vertical final word, you can reorder the words". A hand shows one row being dragged by its handle, and only that move works. The hand shows the first move: the top-most row that isn't in its slot goes to its slot, so any level can be the tutorial, however many moves it needs (Q11). After it, the text and the hand go, and the player plays freely to win.

- 🟩 Trying to slide a word before making the shown move does nothing
- 🟩 After the move, any word can be slid and any row moved
- 🟩 On a level that needs two moves, the hand shows only the first, and the player makes the second freely

**Confirmed:** ☑

### 🟦 R5. Reopening mid-tutorial carries on at the same step

As in story 12, R8.

- 🟩 Closing the game during the reordering step and opening it again shows the same text and hand

**Confirmed:** ☑

### 🟦 R6. The planned content: reordering first at level 21, then easing in at each row count

*From Q3, Q7 and Q9.* This is a plan for story 15's levels, not a rule of the game, so its scenarios live in story 15. Levels 2 to 20 don't need reordering, so level 21, the first Space level with 2 rows, is the reordering tutorial. After it, in each theme, the first level with a new number of rows doesn't need reordering, and the rest do.

- 🟩 Space: 22 needs reordering, 23 (the first 3-row level) doesn't, 24–26 do, 27 (the first 4-row level) doesn't, 28–29 do, and 30 (5 rows) doesn't
- 🟩 Sports: 31, 33, 37 and 40 don't need reordering, and the others do

**Confirmed:** ☑

---

## What this changes elsewhere, once approved

- D43 and story 12: level 1 loses its reordering step, which moves to the reordering tutorial.
- D45, story 7 R5 and story 14 R12 and R13: the reordering tutorial is the first level that needs reordering, not level 1. Story 14's validator check (no reordering before the tutorial) is no longer needed, since that's true by definition. Story 14's "reordering needed" setting follows Q10.
- Story 7 R3: rows keep their phase-one order only from the reordering tutorial (R2).
- D47 and story 15 R9: the planned content follows R6.

---

## Answered questions

### 🟥 Q12. What if the player locks the tutorial level's words so that no move is needed?

*From playing on 2026-11-03.* **Answer:** The tutorial is skipped, and the handles stay hidden, until a level where the player's rows do need moving (R1).

### 🟥 Q10. What counts as "needs reordering"?

**Answer:** The starting order differs from the order that spells the final word (R1). Level 1 never counts, since it teaches sliding only.

### 🟥 Q11. If the tutorial level needs more than one row moved, which move does the hand show?

**Answer:** The first: the top-most row that isn't in its slot goes there. Then the player plays freely (R4).

### 🟥 Q1. Without handles, how is a solvable row order guaranteed?

**Answer:** The ceremony puts the rows in the designed order (R2).

### 🟥 Q2. How strict is the reordering tutorial?

**Answer:** Strict, like level 1 (R4).

### 🟥 Q3. Which level teaches reordering?

**Answer:** The first level that needs reordering, whichever that is (R1). *Changed by the designer on 2026-11-03:* first answered as level 21, then made flexible so that content changes don't change the scenarios. Level 21 stays the plan for the content (R6).

### 🟥 Q4. Does level 1 stay FOX, OWL and OX?

**Answer:** Yes. The ceremony puts OWL above FOX, then the player slides FOX (R3).

### 🟥 Q5. Before the reordering tutorial, may the designed order differ from the length order?

**Answer:** Only same-length rows swap (R2). Q10 settles whether such a swap counts as needing reordering.

### 🟥 Q6. In the reordering tutorial, what's restricted around the reordering step?

**Answer:** Phase one plays normally. In phase two, only the shown row move works, then the player plays freely (R4).

### 🟥 Q7. After the reordering tutorial, is reordering needed in every level?

**Answer:** No. Levels that need reordering mix with some that don't (R6).

### 🟥 Q8. Does the row swap in the ceremony show?

**Answer:** Yes. The rows glide into place as the words left-align (R2).

### 🟥 Q9. After the reordering tutorial, how are the two kinds of level mixed?

**Answer:** Each theme eases in at each row count (R6).
