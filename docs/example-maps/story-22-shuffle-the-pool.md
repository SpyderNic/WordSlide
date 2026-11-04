# Story 22: Shuffle the pool

**Status:** 🟡 Draft, waiting for the designer.

*As a player stuck on a word, I want to shuffle the pool's letters, so that I can see them in a new order and spot the words.*

From playing milestone 6 on 2026-11-03: the designer found level 2 really difficult and couldn't find its 5-letter words. Shuffling was already part of story 19 (hints), and its questions are carried over here.

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

Examples use the test level ZEBRA, LEMUR and KANGAROO, whose pool starts alphabetical: A, B, E, G, K, L, M, N, O, R, U, Z.

---

## Rules and examples

These are drafts, to be confirmed once the questions are answered.

### 🟦 R1. A shuffle button puts the pool's tiles in a new random order

Each tile keeps its letter and its count, and only its place in the pool changes. Nothing on the board changes, and placed letters stay where they are.

- 🟩 After a shuffle, the pool still has A x3, B x1, E x2 and so on, in another order
- 🟩 With Z placed in ZEBRA's row, it stays there after a shuffle

**Confirmed:** ☐

### 🟦 R2. A shuffle always gives a different order

So that a press always visibly does something, as long as the pool has more than one tile.

- 🟩 Pressing shuffle twice in a row gives two different orders

**Confirmed:** ☐

### 🟦 R3. Shuffle is only in phase one

The pool fades away in phase two (D38), and the button goes with it.

- 🟩 After the ceremony, there's no shuffle button

**Confirmed:** ☐

### 🟦 R4. Everything else about the pool still works

Dragging, tapping and typing letters (story 17), sending letters back (story 4) and Recall All (story 5) work the same after a shuffle. A letter sent back goes to its tile, wherever that tile now is.

- 🟩 After a shuffle, pressing Z still sends Z to the selected row
- 🟩 After a shuffle, Recall All sends every letter back to its tile

**Confirmed:** ☐

---

## Questions

### 🟥 Q1. Is shuffle its own story, or part of story 19 (hints)?

- **A (recommended):** Its own story, this one. Story 19 keeps revealing letters, which raises more questions (cost, which cell, phase two). Shuffle can then ship first.
- **B:** Keep it in story 19, and map all of story 19 now.

**Answer:**

### 🟥 Q2. Is shuffle free?

- **A (recommended):** Free and unlimited. It only rearranges what the player already has, like turning tiles over on a table, so it isn't a hint.
- **B:** It costs a hint, or has a limited number per level, like story 19's other hints.

**Answer:**

### 🟥 Q3. Does the pool still start alphabetical, and is there a way back?

Story 19's note asked for a button that puts the pool back in alphabetical order.

- **A (recommended):** The pool starts alphabetical (story 1). This story also adds a second button that sorts it back.
- **B:** The pool starts alphabetical, and there's only the shuffle button.
- **C:** The pool starts shuffled, and a button sorts it.

**Answer:**

### 🟥 Q4. Where do the buttons go?

Recall All sits beside the pool, on its right (D36).

- **A (recommended):** Beside the pool on its left, mirroring Recall All, with the sort button under the shuffle button if there is one. It works the same in portrait (D28).
- **B:** In a row under the pool.
- **C:** In the top bar.

**Answer:**

### 🟥 Q5. How does a shuffle look?

- **A (recommended):** The tiles glide to their new places in about 0.3 seconds, with the timing in the style file (D27). A shuffle pressed during the glide starts from where the tiles are.
- **B:** The tiles jump to their new places at once.

**Answer:**

### 🟥 Q6. What happens to grey x0 tiles?

- **A (recommended):** They shuffle with the rest, so the pool keeps its shape.
- **B:** They move to the end of the pool, so the letters left to place come first.

**Answer:**

### 🟥 Q7. Is there a keyboard shortcut?

Letter and digit keys type letters (story 17), so a shortcut would need another key.

- **A (recommended):** None in the prototype, like Recall All (D36).
- **B:** A key such as Tab or Space.

**Answer:**

### 🟥 Q8. Is the shuffled order saved?

- **A (recommended):** Yes. Reopening the game mid-level shows the pool as the player left it (story 11, R10).
- **B:** No. Reopening shows the pool alphabetical again.

**Answer:**

### 🟥 Q9. Does level 1's tutorial show the buttons?

Level 1 hides Recall All (story 12, R10).

- **A (recommended):** Hidden in level 1 too, so the tutorial stays focused. They appear from level 2.
- **B:** Shown in level 1, but they do nothing until the tutorial ends.

**Answer:**

---

## Answered questions

None yet.
