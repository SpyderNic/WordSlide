# Story 7: Switch to phase two

**Status:** 🟢 Approved by the designer on 2026-10-31, along with its scenarios in [story-07-switch-to-phase-two.feature](../../features/story-07-switch-to-phase-two.feature). Not implemented yet. Two scenarios need story 17, and the instant win needs story 10.

*As a player, I want a short ceremony when all the words are solved, so that I can see the puzzle change and know that a new challenge has begun.*

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

All examples use the answers ZEBRA, LEMUR and KANGAROO, unless they say otherwise. The rows are LEMUR, ZEBRA, KANGAROO (D5).

This story covers the change from phase one to phase two (D6). Sliding words is story 8, reordering rows is story 9, and the win itself is story 10.

---

## Rules and examples

### 🟦 R1. The ceremony starts after the last word's lock feedback

- 🟩 When KANGAROO locks last, its pulse plays, and then the ceremony starts

**Confirmed:** ☑

### 🟦 R2. Every word slides sideways until its first letter is in the column (D19)

Rows start centred (D5), so each word moves a different distance to the right.

- 🟩 LEMUR and ZEBRA move 2 cells right
- 🟩 KANGAROO moves 3.5 cells right
- 🟩 ICE CREAM moves 4 cells right
- 🟩 'TIS moves 0.5 cells right, so that its T is in the column, not its apostrophe

**Confirmed:** ☑

### 🟦 R3. Rows keep the order they had in phase one

Words can lock in a different row of the same length (D8), so this may not be the designed order.

- 🟩 With ZEBRA locked in the top row and LEMUR in the middle row, they stay that way

**Confirmed:** ☑

### 🟦 R4. The column appears, centred on the screen (D6, D19)

It wasn't visible in phase one.

- 🟩 After the ceremony, the column reads L, Z, K, top to bottom

**Confirmed:** ☑

### 🟦 R5. A handle appears for each row (D6)

Using them is story 9.

- 🟩 Three rows get three handles

**Confirmed:** ☑

### 🟦 R6. Words may run off the right of the screen (D20)

- 🟩 On a small screen, the end of a long word can be off screen after the ceremony

**Confirmed:** ☑

### 🟦 R7. The theme and the top of the screen stay as they are

- 🟩 Home, level number, theme, points, shop and settings don't change

**Confirmed:** ☑

### 🟦 R8. Phase-one input ends

Placing letters, selecting rows by tapping and Recall All only exist in phase one, so letter keys do nothing in phase two. Arrow keys slide words (story 8).

- 🟩 The Recall All button is gone after the ceremony (story 5, R6)
- 🟩 No row is selected (story 17)
- 🟩 Pressing a letter key does nothing

**Confirmed:** ☑

### 🟦 R9. The pool fades away, and the rows move to the vertical centre of the new space

*From Q1.* The space runs from below the top of the screen to the bottom edge. The rows move as a group, and the gaps between them stay the same.

- 🟩 Three rows sit in the middle of the space the pool has left

**Confirmed:** ☑

### 🟦 R10. The ceremony plays all at once, then the handles appear

*From Q2.* The words slide, the rows centre, and the column and pool fade together. The handles come last, as a sign that the player can act.

- 🟩 The handles appear once the words have stopped

**Confirmed:** ☑

### 🟦 R11. The ceremony takes about 1 second, and input is ignored until it ends

*From Q3 and Q4.* The top buttons still respond, though they do nothing yet.

- 🟩 Dragging a word during the ceremony does nothing

**Confirmed:** ☑

### 🟦 R12. If phase two starts already solved, the instant win comes after the ceremony (D7)

*From Q5.* The player sees the words line up and the column spell the word.

- 🟩 EMU, LION and KOALA with the final word ELK: the ceremony plays, the column reads E, L, K, and then the win follows (story 10)

**Confirmed:** ☑

### 🟦 R13. The column is a strip one cell wide and as tall as the rows, with an arrow notch at each end

*From Q6.* It has a down-arrow notch at the top and an up-arrow notch at the bottom, like a cryptex or Caesar cipher. It's one cell wide on the inside, with clearance around the tiles.

- 🟩 With 3 rows, the strip is 3 cells tall
- 🟩 With 5 rows, it's 5 cells tall

**Confirmed:** ☑

### 🟦 R14. Rotating a device during the ceremony jumps to the end of it

D29 says the layout adapts live, but a half-played animation cannot be redrawn usefully.

- 🟩 Rotating halfway through shows the finished phase-two layout for the new orientation

**Confirmed:** ☑

### 🟦 R15. The handles sit in a fixed line at the left edge of the screen

*From Q7.* They stay reachable when words slide off screen.

- 🟩 With KANGAROO slid far left, its handle stays at the left edge

**Confirmed:** ☑

---

## Answered questions

### 🟥 Q1. What happens to the pool?

**Answer:** It fades away, and the rows align vertically on screen with the new space (R9).

### 🟥 Q2. In what order do things happen?

**Answer:** All together, then the handles (R10).

### 🟥 Q3. How long does the ceremony take?

**Answer:** About 1 second (R11).

### 🟥 Q4. Can the player do anything during the ceremony?

**Answer:** No, input is ignored until it ends (R11).

### 🟥 Q5. If phase two starts already solved (D7), when does the instant win happen?

**Answer:** After the ceremony (R12).

### 🟥 Q6. How does the column look?

**Answer:** A vertical strip, one cell wide of clearance, X cells high, X being how many horizontal words there are. The top has a down-arrow notch, and the bottom an up-arrow notch, like a Caesar codex (R13).

### 🟥 Q7. Where do the handles sit?

**Answer:** In a fixed line at the left edge of the screen (R15).
