# Story 9: Reorder rows

**Status:** 🟢 Approved by the designer on 2026-10-31, along with its scenarios in [story-09-reorder-rows.feature](../../features/story-09-reorder-rows.feature). Not implemented yet.

*As a player, I want to drag rows up and down, so that the letters in the column come in the right order to spell the final word.*

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

All examples use the answers ZEBRA, LEMUR and KANGAROO, unless they say otherwise. Phase two has started, and the rows are LEMUR, ZEBRA, KANGAROO.

The handles' position is story 7 (R15), sliding words is story 8, and checking for a win is story 10.

---

## Rules and examples

### 🟦 R1. Dragging a row's handle moves the whole row up or down

- 🟩 Dragging KANGAROO's handle up moves KANGAROO and its handle

**Confirmed:** ☑

### 🟦 R2. A row moves only up and down

Moving the pointer sideways during a drag doesn't move the row.

- 🟩 Dragging a handle diagonally moves the row by the up-and-down part only

**Confirmed:** ☑

### 🟦 R3. Other rows make way as the dragged row passes them

As in a typical phone app list. They move with a quick slide of about 0.1 seconds (Q1).

- 🟩 Dragging LEMUR down past ZEBRA moves ZEBRA up into the free slot
- 🟩 Dragging KANGAROO to the top moves LEMUR and ZEBRA down one slot each

**Confirmed:** ☑

### 🟦 R4. The dragged row is drawn on top of the others, and looks slightly raised

*Includes Q2.* It's a little larger, or has a shadow.

- 🟩 While KANGAROO passes ZEBRA, its tiles cover ZEBRA's

**Confirmed:** ☑

### 🟦 R5. On release, the row snaps into the nearest free slot

It uses the same 0.1 second bounce-out tween as a word snap (Q3, D39).

- 🟩 Releasing LEMUR just past halfway between slots 1 and 2 puts it in slot 2

**Confirmed:** ☑

### 🟦 R6. Reordering doesn't change any word's sideways position

The letter in the column stays the same for every word, and only the column's reading order changes.

- 🟩 With L, Z, K in the column, moving KANGAROO to the top gives K, L, Z

**Confirmed:** ☑

### 🟦 R7. Handles and words don't interfere

Dragging a word slides it, and dragging a handle moves its row.

- 🟩 Dragging a word's tiles upward never moves its row
- 🟩 Dragging a handle sideways never slides its word

**Confirmed:** ☑

### 🟦 R8. Handles are easy to grab on desktop and touchscreens

Each handle is at least as large as a tile. It shows three short horizontal lines (Q5).

- 🟩 On the smallest screen (800×450), a finger can grab a handle without touching its word

**Confirmed:** ☑

### 🟦 R9. Mouse and touch work the same way, one drag at a time

A word slide and a row drag can't happen together.

- 🟩 On a touchscreen, a second finger on a word is ignored while the first drags a handle

**Confirmed:** ☑

### 🟦 R10. A row drag works with keyboard selection like a word slide

A drag hides the selection until the next arrow (story 8, R17). The selection stays with its word, wherever that row ends up.

- 🟩 With ZEBRA selected, moving KANGAROO to the top leaves ZEBRA selected, in slot 3

**Confirmed:** ☑

### 🟦 R11. Rotating a device cancels a row drag (D29)

- 🟩 Rotating while dragging LEMUR puts every row back where it was before the drag

**Confirmed:** ☑

### 🟦 R12. Dragging past the top or bottom stretches slightly, and the row springs back

*From Q4.* This matches words (D39).

- 🟩 Dragging the top row further up moves it a little, and it springs back on release

**Confirmed:** ☑

### 🟦 R13. Shift+Up and Shift+Down move the selected row one slot

*From Q6.* They stop at the top and bottom, so they don't wrap around. With no row selected, they select the top row, as Left and Right do, and it moves if it can.

- 🟩 With ZEBRA selected in slot 2, Shift+Up moves it to slot 1, and LEMUR to slot 2
- 🟩 With LEMUR selected in slot 1, Shift+Up does nothing
- 🟩 With no row selected, Shift+Down selects LEMUR's row and moves it to slot 2
- 🟩 With no row selected, Shift+Up selects LEMUR's row, which stays in slot 1

**Confirmed:** ☑

---

## Answered questions

### 🟥 Q1. How do the other rows move out of the way?

**Answer:** A quick slide, about 0.1 seconds (R3).

### 🟥 Q2. How does the row being dragged look?

**Answer:** Slightly raised (R4).

### 🟥 Q3. How does the row settle on release?

**Answer:** The same 0.1 second bounce-out tween as a word snap (R5).

### 🟥 Q4. What happens past the top or bottom of the rows?

**Answer:** It stretches slightly and springs back (R12).

### 🟥 Q5. How does a handle look?

**Answer:** Three short horizontal lines (R8).

### 🟥 Q6. Can the keyboard move rows?

**Answer:** Yes, Shift+Up and Shift+Down (R13).
