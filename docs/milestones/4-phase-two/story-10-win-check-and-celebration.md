# Story 10: Win check and celebration

**Status:** 🟢 Approved by the designer on 2026-10-31, along with its scenarios in [features/4-phase-two/story-10-win-check-and-celebration.feature](../../../features/4-phase-two/story-10-win-check-and-celebration.feature). Built on 2026-10-31.

*As a player, I want the game to notice when I've spelled the final word and celebrate it, so that solving the puzzle feels satisfying.*

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

All examples use the answers ZEBRA, LEMUR and KANGAROO with the final word ELK, unless they say otherwise. Phase two has started.

Awarding the point and opening the next level are story 11.

---

## Rules and examples

### 🟦 R1. The column is checked each time a word or row settles

That means after a snap, a keyboard move or a row drop. It's never checked during a drag or a glide.

- 🟩 Dragging a word through the winning position without releasing it doesn't win
- 🟩 Pressing Left to bring the last letter into place wins

**Confirmed:** ☑

### 🟦 R2. The level is won when the column spells the final word, by any arrangement (D4)

- 🟩 Rows ZEBRA, LEMUR, KANGAROO, with E, L, K in the column, win
- 🟩 With the final word ERA, rows LEMUR, ZEBRA, KANGAROO with E, R, A win, and so do rows ZEBRA, LEMUR, KANGAROO with E, R, A

**Confirmed:** ☑

### 🟦 R3. The column is read from top to bottom only

- 🟩 K, L, E doesn't win when the final word is ELK

**Confirmed:** ☑

### 🟦 R4. Letters must match exactly (D21)

- 🟩 With the final word ÉXE, a plain E in the top row doesn't win

**Confirmed:** ☑

### 🟦 R5. If phase two starts solved, the win comes straight after the ceremony (D7)

- 🟩 EMU, LION and KOALA with the final word ELK win as soon as the ceremony ends, with no move from the player (story 7, R12)

**Confirmed:** ☑

### 🟦 R6. The column's letters pulse and turn gold one after another, from top to bottom, when the word is found

*From Q1, clarified by the designer.* It's staggered like a Mexican wave. They look ordinary until then (story 8, R13).

Each letter pulses like a locking tile (story 6, R14), and turns gold at its biggest. *From playing milestone 5.*

- 🟩 When E, L, K is spelled, the E pulses and turns gold first, then the L, then the K
- 🟩 Each letter keeps its colour while it grows, and turns gold at its biggest

**Confirmed:** ☑

### 🟦 R7. Once the level is won, words and rows can't be moved

- 🟩 Dragging a word during the celebration does nothing
- 🟩 The arrow keys do nothing

**Confirmed:** ☑

### 🟦 R8. The celebration plays before the player can continue

Your document asks for a satisfying moment before moving on.

- 🟩 The way to continue only appears once the celebration has played

**Confirmed:** ☑

### 🟦 R9. The other tiles fade away, and the board's last parts fade when the popup appears

*From Q2, changed by the designer: tiles no longer stay readable.* The tiles outside the column and the handles fade away as the top letter turns gold, so the gold word stands alone in the column. About 1.5 seconds later, the popup appears, and the gold word and the column fade as it does, because the popup shows the word. The top of the screen stays.

- 🟩 ZEBRA's Z, B, R and A start fading as the E turns gold, and the E stays until the popup appears

**Confirmed:** ☑

**Confirmed:** ☑

### 🟦 R10. A popup shows "Level complete", the golden word and a "Play Level X" button

*From Q3, Q4 and Q8.* The popup sits in the centre of the screen. X is the next level's number. It appears about 1.5 seconds after the word is found.

- 🟩 After winning level 4, the button says "Play Level 5"
- 🟩 With the final word ELK, the popup shows ELK in gold

**Confirmed:** ☑

### 🟦 R11. Enter or Space presses the button

*From Q5.*

- 🟩 Pressing Enter when the popup is showing starts the next level
- 🟩 Pressing Enter before the popup appears does nothing

**Confirmed:** ☑

### 🟦 R12. The handles fade away with the other tiles

They can't be used any more (R9).

- 🟩 After the win, no handles are on screen

**Confirmed:** ☑

### 🟦 R13. There are no other effects in the prototype

*From Q6.* The win sound is parked with story 18. Confetti and similar effects can come with story 16.

- 🟩 No confetti appears in the prototype

**Confirmed:** ☑

### 🟦 R14. Rotating a device during the celebration jumps to the end of it

*From Q7.*

- 🟩 Rotating shows the popup for the new orientation

**Confirmed:** ☑

---

## Answered questions

### 🟥 Q1. How do the column's letters change?

**Answer:** A short pulse, then a golden colour (R6).

### 🟥 Q2. What happens to the rest of the board?

**Answer:** First answered as dim but readable, then changed: everything can fade out, since a popup shows the word (R9).

### 🟥 Q3. What does the player see after that?

**Answer:** A simple panel with "Level complete", the final word, and a button with the level number, like "Play Level X" (R10).

### 🟥 Q4. How long before Next appears?

**Answer:** About 1.5 seconds (R10).

### 🟥 Q5. Can keyboard players continue?

**Answer:** Yes, Enter or Space (R11).

### 🟥 Q6. Are there other effects in the prototype?

**Answer:** Only a win sound (R13).

### 🟥 Q7. What does rotating a device do during the celebration?

**Answer:** It jumps to the end (R14).

### 🟥 Q8. Where does the panel go?

**Answer:** It's a popup, showing the golden word on it too (R10).
