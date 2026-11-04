# Story 19: Hints

**Status:** 🟡 Draft, waiting for the designer.

*As a player who's stuck, I want to choose to buy a hint, so that I can keep going without the game deciding for me.*

Added to the backlog on 2026-11-02, and brought into the prototype on 2026-11-04: "the game is fun, it's time to make it worth playing". Hints cost currency (story 20), so the player asks for one when they want it (from the bonus words discussion). This map replaces story 19's backlog notes, written before each row had its own pool (story 23) and before rows locked all at once (story 23, R14).

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

Examples use the test level ZEBRA, LEMUR and KANGAROO, with the final word ELK. The rows are LEMUR, ZEBRA, KANGAROO.

---

## Rules and examples

### 🟦 R1. A hint is bought, never given

A hint costs currency (story 20) and only happens when the player asks for it. See Q1 for whether the player confirms first.

- 🟩 Pressing the hint button with enough currency spends it and gives the hint

**Confirmed:** ☐

### 🟦 R2. In phase one, a hint reveals a letter in the selected row

The letter goes in its cell, takes the locked colour with the lock pulse (D37), and becomes fixed, like a revealed letter. It comes out of the row's pool. See Q2 for which cell.

- 🟩 With LEMUR's row selected and empty, a hint puts L in its first cell, locked, and the pool's L goes to x0

**Confirmed:** ☐

### 🟦 R3. A revealed letter can complete the word

If it fills the row's last cell with the right word, the row locks as usual.

- 🟩 With L E M U _ in LEMUR's row, a hint puts R in the last cell, and LEMUR locks

**Confirmed:** ☐

### 🟦 R4. In phase two, a hint puts one word's column letter in place

The word slides to its letter in the solution's column, turns gold there, and can't be slid again. See Q3 for which word, and Q4 for which solution.

- 🟩 With the rows ZEBRA, LEMUR, KANGAROO and the column reading Z, L, K, a hint slides ZEBRA so its E is in the column, gold, and ZEBRA stays there

**Confirmed:** ☐

### 🟦 R5. In phase two, a second hint puts the rows in order

Once reordering has been taught (story 21), a hint can move the rows into the solution's order and keep them there: their handles go, and words can still slide. It's only offered while the order isn't right. See Q5.

- 🟩 With the rows LEMUR, ZEBRA, KANGAROO, where ELK needs ZEBRA on top, the hint swaps the top two rows to ZEBRA, LEMUR, KANGAROO and hides the handles

**Confirmed:** ☐

### 🟦 R6. Hints are saved

As with the rest of a level (story 11, R10), revealed letters, gold words and locked orders come back after reopening. Currency spent stays spent.

- 🟩 Closing after a hint and opening again shows the hinted letter still in place

**Confirmed:** ☐

### 🟦 R7. The tutorials have no hints

Level 1 and the reordering tutorial's step (story 21, R4) don't show hint buttons, so the tutorial stays focused. They appear from level 2, and in the reordering tutorial's level once its move is made.

- 🟩 Level 1 has no hint button

**Confirmed:** ☐

### 🟦 R8. The hint button pulses with the gentle nudge

When the player seems stuck, the nudge (story 26) pulses the theme, and the hint button pulses with it.

- 🟩 After the nudge's wait, the theme and the hint button pulse gently

**Confirmed:** ☐

---

## Questions

### 🟥 Q1. Does buying a hint ask the player to confirm?

- **A (recommended):** No. The button shows the price, and one press buys it, so it's quick. A hint that would do nothing (R2 with the row already right, for example) isn't offered.
- **B:** Yes: a small "Spend 1 coin?" confirmation first.

**Answer:**

### 🟥 Q2. In phase one, which cell gets the letter?

- **A (recommended):** The selected row's first cell that's empty or holds a wrong letter. A wrong letter there goes back to the pool.
- **B:** A random cell that isn't right yet.
- **C:** The player taps the cell they want, after pressing the hint button.

**Answer:**

### 🟥 Q3. In phase two, which word gets its letter put in place?

- **A (recommended):** The top-most word whose column letter isn't right yet.
- **B:** The selected word, or the top-most one if none is selected.
- **C:** A random word that isn't right yet.

**Answer:**

### 🟥 Q4. Which solution does a phase-two hint follow?

A level can have several arrangements that spell the final word (story 10, R2).

- **A (recommended):** The one closest to where the player is: the arrangement that needs the fewest moves from the rows as they are.
- **B:** Always the designed one, the generator's.

**Answer:**

### 🟥 Q5. Are the phase-two hints separate buttons?

- **A (recommended):** Yes: "Place a letter" and "Order the rows", each with its price, shown in phase two where the pool was. Before reordering is taught, only the first shows.
- **B:** One button, which orders the rows first if they're wrong, then places letters.

**Answer:**

### 🟥 Q6. Where's the hint button in phase one?

Recall All sits beside the pool, on its right (D36).

- **A (recommended):** Beside the pool on its left, mirroring Recall All: a lightbulb with its price under it. It works in portrait too (D28).
- **B:** In the top bar, next to the points.

**Answer:**

### 🟥 Q7. What if the player can't afford a hint?

- **A (recommended):** The button shows grey with its price. Pressing it offers a rewarded ad to earn some (story 20), where ads are available.
- **B:** The button is grey and does nothing.

**Answer:**

### 🟥 Q8. Do hints change the point for a level (D23)?

- **A (recommended):** No. Winning always gives 1 point, hints or not, so using one never feels like a penalty.
- **B:** A level won without hints gives a bonus.

**Answer:**

### 🟥 Q9. What happens to story 22, shuffling the pool?

Story 19's first notes had shuffle and sort buttons among the hints. Story 22 maps them separately, as free tools, waiting for the designer to decide whether they're still needed after story 23.

- **A (recommended):** They stay out of this story: shuffling is free, so it isn't a hint. Story 22 is decided on its own.
- **B:** Fold shuffle and sort into this story, as free buttons next to the hint.

**Answer:**

---

## Answered questions

None yet.
