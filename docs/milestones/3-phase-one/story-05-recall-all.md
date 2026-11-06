# Story 5: Recall All

**Status:** 🟢 Approved by the designer on 2026-10-31, along with its scenarios in [features/3-phase-one/story-05-recall-all.feature](../../../features/3-phase-one/story-05-recall-all.feature). Built on 2026-10-31.

> *Changed by story 23 on 2026-11-04.* Each row now has its own pool ([story 23](../6-content/story-23-a-pool-for-each-row.md)). Some of this story's examples changed to use a row's own letters, and scenarios whose rule no longer applies are in `archive/before-story-23/`, with the rule that replaced each.

*As a player, I want one button that clears all my placed letters, so that I can start again without losing the words I've solved.*

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

All examples use the answers ZEBRA, LEMUR and KANGAROO, with nothing revealed, unless they say otherwise. The rows are LEMUR, ZEBRA, KANGAROO (D5).

**Terms:** a *placed letter* is one the player has put in a cell and can still drag away. A *fixed cell* holds a revealed letter, a special character or a locked word's letter. Both are as in story 3.

---

## Rules and examples

### 🟦 R1. Recall All sends every placed letter back to the pool

This covers every row, including full rows with a wrong word.

- 🟩 With Z in LEMUR's row and A, N in KANGAROO's row, Recall All empties those three cells
- 🟩 With ZEBRA's row full but wrong, Recall All empties the whole row

**Confirmed:** ☑

### 🟦 R2. Fixed cells stay as they are

- 🟩 With L revealed, LEMUR's `L E Z _ _` becomes `L _ _ _ _`
- 🟩 With LEMUR locked, its letters stay, and its letters stay out of the pool
- 🟩 T-REX's hyphen stays

**Confirmed:** ☑

### 🟦 R3. Counts go back up, and grey tiles become active again

Each letter goes to its own tile.

- 🟩 Recalling a Z, an A and an N changes Z x0 to Z x1, A x2 to A x3 and N x0 to N x1

**Confirmed:** ☑

### 🟦 R4. Pool tiles and rows stay where they are

- 🟩 After Recall All, every pool tile and row is in the same position

**Confirmed:** ☑

### 🟦 R5. The button can't be used during a drag

One action happens at a time (story 3, R12).

- 🟩 On a touchscreen, a second finger on Recall All is ignored while the first is dragging

**Confirmed:** ☑

### 🟦 R6. The button is only there in phase one

Phase two has no placed letters. Hiding it belongs with story 7.

- 🟩 When a level opens, the button is on screen

**Confirmed:** ☑

### 🟦 R7. The button is an icon of two arrows pointing down, beside the pool on its right

*From Q1 and Q2.*

- 🟩 The button sits to the right of the pool, with no text on it

**Confirmed:** ☑

### 🟦 R8. With nothing to recall, the button is grey and does nothing

*From Q3.* It's grey when a level opens, and active as soon as a letter is placed.

- 🟩 When a level opens, the button is grey
- 🟩 After a letter is placed, the button is active
- 🟩 After Recall All, the button is grey again

**Confirmed:** ☑

### 🟦 R9. Recall All happens at once, with no confirmation

*From Q4.*

- 🟩 Pressing the button clears the letters straight away

**Confirmed:** ☑

### 🟦 R10. The selected row doesn't change

*From Q5.* This needs story 17. A selection hidden by a drag stays hidden.

- 🟩 With ZEBRA's row selected, Recall All leaves it selected, and the next input goes to its first empty cell

**Confirmed:** ☑

---

## Answered questions

### 🟥 Q1. Where does the button go?

**Answer:** Beside the pool, on its right (R7).

### 🟥 Q2. How does the button look?

**Answer:** An icon of two arrows pointing down (R7).

### 🟥 Q3. What happens with nothing to recall?

**Answer:** The button turns grey and does nothing (R8).

### 🟥 Q4. Does Recall All ask for confirmation?

**Answer:** No (R9).

### 🟥 Q5. What happens to the selected row (story 17)?

**Answer:** It stays selected (R10).

### 🟥 Q6. Is there a keyboard shortcut?

**Answer:** No, not for the prototype.
