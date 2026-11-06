# Story 4: Return a single letter

**Status:** 🟢 Approved by the designer on 2026-10-31, along with its scenarios in [features/3-phase-one/story-04-return-a-letter.feature](../../../features/3-phase-one/story-04-return-a-letter.feature). Built on 2026-10-31.

> *Changed by story 23 on 2026-11-04.* Each row now has its own pool ([story 23](../6-content/story-23-a-pool-for-each-row.md)). Some of this story's examples changed to use a row's own letters, and scenarios whose rule no longer applies are in `archive/before-story-23/`, with the rule that replaced each.

*As a player, I want to take a placed letter back to the pool, so that I can change my mind without wasting letters.*

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

All examples use the answers ZEBRA, LEMUR and KANGAROO, with nothing revealed, unless they say otherwise. The rows are LEMUR, ZEBRA, KANGAROO (D5).

**Terms:** a *placed letter* is one the player has put in a cell and can still drag away. A *fixed cell* holds a revealed letter, a special character or a locked word's letter. Both are as in story 3.

This story covers dragging one letter back. Backspace is in story 17, and Recall All is story 5.

---

## Rules and examples

### 🟦 R1. A placed letter that doesn't land on a cell goes back to the pool

*Includes Q1.* A letter lands on a cell only if the tile's centre is over that cell (story 3, R15). Anywhere else, it goes to the pool. A fixed cell sends it to the pool too (story 3, R8).

- 🟩 Dragging a placed Z from LEMUR's cell 1 to the pool empties that cell
- 🟩 Releasing it over the theme does the same
- 🟩 Releasing it in the gap between two rows does the same
- 🟩 Releasing it on a revealed letter does the same
- 🟩 Releasing it over the pool does the same, even if the tile still touches the bottom row (Q2)

**Confirmed:** ☑

### 🟦 R2. The letter's count goes up by one when it's dropped, not when it's picked up

The letter stays on the board until it lands. This differs from pool letters, whose count drops on pick-up, because a placed letter isn't in the pool yet.

- 🟩 With A x2 and a placed A, picking up the placed A leaves A x2
- 🟩 Dropping it on the pool changes A x2 to A x3

**Confirmed:** ☑

### 🟦 R3. A letter goes back to its own tile, wherever it's dropped in the pool

- 🟩 Dropping a Z on top of the A tile changes the Z count, and the A count stays the same

**Confirmed:** ☑

### 🟦 R4. A grey tile becomes active again when a copy comes back

- 🟩 Returning the only Z changes the grey Z x0 to Z x1, which can be dragged again

**Confirmed:** ☑

### 🟦 R5. The emptied cell can be used again straight away

- 🟩 After the Z leaves LEMUR's cell 1, an L can be dropped there
- 🟩 With LEMUR's row selected, the next input fills that cell if it's the first empty one (story 17)

**Confirmed:** ☑

### 🟦 R6. A letter's own cell counts as empty during its drag

- 🟩 Picking up a placed Z and dropping it back on its own cell leaves it there, and the pool doesn't change

**Confirmed:** ☑

### 🟦 R7. Fixed cells can't be returned

- 🟩 With L revealed in LEMUR, trying to drag the L does nothing (story 3)
- 🟩 Trying to drag a letter of a locked word does nothing

**Confirmed:** ☑

### 🟦 R8. The letter's own tile highlights while a placed letter is over the pool

*From Q3.* This also applies to a grey x0 tile.

- 🟩 With a placed Z over the pool, the Z tile highlights, wherever in the pool the pointer is

**Confirmed:** ☑

---

## Answered questions

### 🟥 Q1. Where does a placed letter go when it's released away from any cell and the pool?

**Answer:** To the pool (R1).

### 🟥 Q2. What if a letter is released over the pool while still touching a cell?

**Answer:** Highlight rule wins, in the sense that only if the majority of the tile overlaps the cell, otherwise back to the pool. Q5 turned this into the tile's-centre rule, so the pool wins whenever the pointer is over it (R1).

### 🟥 Q3. Does the pool show it's the target?

**Answer:** Yes, the letter's own tile highlights (R8).

### 🟥 Q4. Is there a quicker way to return a letter by mouse or touch?

**Answer:** No, not for the prototype. Dragging, Backspace and Recall All are enough.

### 🟥 Q5. Does the majority rule from Q2 apply everywhere?

**Answer:** Yes, for every drag, measured by the tile's centre. Story 3's R15 was changed to match.
