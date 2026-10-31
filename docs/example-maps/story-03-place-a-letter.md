# Story 3: Place a letter

**Status:** 🟢 Approved by the designer on 2026-10-31, along with its scenarios in [story-03-place-a-letter.feature](../../features/story-03-place-a-letter.feature). Not implemented yet.

*As a player, I want to drag letters from the pool into any empty cell, so that I can try out words and use the changing pool to work out the rest.*

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

All examples use the answers ZEBRA, LEMUR and KANGAROO, with nothing revealed, unless they say otherwise. The rows are LEMUR, ZEBRA, KANGAROO (D5).

This story covers placing letters only. Taking a letter back to the pool is story 4, Recall All is story 5, and what happens when a row is full is story 6.

**Terms:** a *placed letter* is one the player has put in a cell and can still drag away. A *fixed cell* can't change: it holds a revealed letter, a special character or a letter of a locked word.

---

## Rules and examples

### 🟦 R1. The player drags a pool tile into an empty cell, and the letter lands there

- 🟩 Dragging Z onto the first cell of the middle row puts a Z there

**Confirmed:** ☑

### 🟦 R2. Any empty cell in any row works, in any order

The player doesn't choose a row first.

- 🟩 The first letter placed goes in KANGAROO's cell 5
- 🟩 The next letter goes in LEMUR's cell 2

**Confirmed:** ☑

### 🟦 R3. Any letter can go in any empty cell, with no feedback on whether it's right

- 🟩 Z placed in LEMUR's cell 3 stays there, and nothing tells the player it's wrong

**Confirmed:** ☑

### 🟦 R4. The tile's count drops by one as soon as the player picks up a letter

- 🟩 Picking up an A changes A x3 to A x2, before it's dropped
- 🟩 The remaining copies stay available to drag

**Confirmed:** ☑

### 🟦 R5. When no copies remain, the tile shows x0, turns grey and can't be dragged

- 🟩 Picking up the Z changes Z x1 to a grey Z x0
- 🟩 Trying to drag the grey Z does nothing

**Confirmed:** ☑

### 🟦 R6. Pool tiles and rows stay where they are as letters are used

- 🟩 After the Z is used, every tile is still in the same place
- 🟩 The rows don't move when the pool changes (story 2, R7)

**Confirmed:** ☑

### 🟦 R7. Dropping a pool letter on a placed letter replaces it, and the old letter goes back to the pool

*Changed by the designer (Q1).* This changes D14.

- 🟩 With Z placed in LEMUR's cell 1, dropping an E there leaves the E in the cell. The pool gets the Z back: the grey Z x0 becomes Z x1.

**Confirmed:** ☑

### 🟦 R8. Dropping a letter on a fixed cell sends it to the pool

*From Q1. Changed on 2026-10-31: a placed letter used to go back to its cell.*

- 🟩 With L revealed in LEMUR, dropping an A from the pool on the L leaves the L in place, and A x2 returns to A x3
- 🟩 Dropping a placed T on the hyphen in T-REX empties the T's cell, and the T count goes up by one

**Confirmed:** ☑

### 🟦 R9. Dropping a pool letter away from any cell sends it back to the pool

- 🟩 Releasing an A over the theme changes A x2 back to A x3

**Confirmed:** ☑

### 🟦 R10. A placed letter can be dragged directly to another empty cell

*From Q2.*

- 🟩 Dragging a placed Z from LEMUR's cell 1 to ZEBRA's cell 1 empties the first cell and fills the second, and Z stays at x0

**Confirmed:** ☑

### 🟦 R11. Revealed letters and special characters can't be moved

From story 2's R10.

- 🟩 With L revealed in LEMUR, trying to drag the L does nothing
- 🟩 Trying to drag the hyphen in T-REX does nothing

**Confirmed:** ☑

### 🟦 R12. Mouse and touch work the same way, one drag at a time

- 🟩 Dragging with a mouse or a finger gives the same result
- 🟩 On a touchscreen, a second finger on the pool is ignored while the first is dragging

**Confirmed:** ☑

### 🟦 R13. Rotating a device keeps placed letters and cancels a drag (D29)

- 🟩 With Z and E placed, rotating redraws the level with Z and E in the same cells
- 🟩 Rotating while dragging an A puts it back where it came from, so A x2 returns to A x3

**Confirmed:** ☑

### 🟦 R14. During a drag, the tile's centre stays on the pointer or finger

*From Q3.*

- 🟩 Picking up a tile by its corner moves it so that its centre is under the pointer

**Confirmed:** ☑

### 🟦 R15. During a drag, the cell under the tile's centre is highlighted, and that's where the letter lands

*From Q3, Q4 and Q7. Changed on 2026-10-31 by story 4's Q5, which replaced "the cell overlapping the tile the most".*

The tile's centre is the pointer (R14), so this means the tile mostly covers the cell. Empty cells and placed letters highlight, because a drop on either works.

- 🟩 A tile with its centre over ZEBRA's cell 2, and slightly touching cell 3, highlights cell 2, and lands there
- 🟩 A tile moving across a cell boundary switches the highlight when its centre crosses
- 🟩 A tile with its centre in a gap between rows highlights nothing, even if it touches cells, and R9 applies
- 🟩 A tile with its centre over a revealed letter highlights nothing, even if it touches an empty cell. Dropping it there sends the letter to the pool (R8).

**Confirmed:** ☑

### 🟦 R16. Dropping a placed letter on another placed letter swaps them

*From Q8.* Both stay on the board, and the pool doesn't change.

- 🟩 With Z in LEMUR's cell 1 and E in ZEBRA's cell 1, dragging the Z onto the E puts E in LEMUR's cell 1 and Z in ZEBRA's cell 1

**Confirmed:** ☑

---

## Answered questions

### 🟥 Q1. Where does a letter go when it's dropped on a filled cell?

**Answer:** It depends on the cell. On a placed letter, the new letter replaces it, and the old one goes back to the pool (R7). On a revealed or locked letter, the dropped letter goes to the pool (R8).

### 🟥 Q2. Can a placed letter be dragged directly to another cell?

**Answer:** Yes (R10).

### 🟥 Q3. How close to a cell does a letter have to be dropped?

**Answer:** The tile's centre stays on the pointer (R14). The highlighted cell is the one under the tile's centre (R15).

### 🟥 Q4. Does the target cell highlight during a drag?

**Answer:** Yes (R15).

### 🟥 Q5. Are there other ways to place a letter in the prototype?

**Answer:** Yes, but not in this story. Selecting a word, then tapping pool letters or typing, is story 17, queued right after this one. This story stays dragging only.

### 🟥 Q6. Does the prototype have sound?

**Answer:** First answered as yes, with simple placeholder sounds in story 18. Sound was parked for the prototype on 2026-10-31.

### 🟥 Q7. What if the cell under the tile is a fixed cell?

**Answer:** It still wins. Nothing highlights, and dropping sends the letter to the pool (R15).

### 🟥 Q8. What happens when a placed letter is dropped on another placed letter?

**Answer:** They swap cells, and both stay on the board (R16).
