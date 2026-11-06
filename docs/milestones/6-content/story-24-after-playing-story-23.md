# Story 24: Changes after playing story 23

**Status:** 🟢 Approved by the designer on 2026-11-04. Scenarios in [features/6-content/story-24-after-playing-story-23.feature](../../../features/6-content/story-24-after-playing-story-23.feature). Built on 2026-11-04.

*As a player, I want level 1 and the rows to behave the way the per-row pool suggests, so that the game feels natural from the first minute.*

From the designer, on 2026-11-04, after playing story 23.

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

Unless an example says otherwise, the test level has the answers ZEBRA, LEMUR and KANGAROO, and the rows are LEMUR, ZEBRA, KANGAROO.

---

## Rules and examples

### 🟦 R1. ~~Level 1 is COW and FOX~~

*Removed by the designer (Q1):* level 1 stays FOX and OWL, starting as `F _ _` and `O _ _` (story 23, R11).

### 🟦 R2. Step 1 shows each letter in turn, and only that move works

*From the designer, first written for COW, and kept for FOX when level 1 stayed FOX and OWL (Q1).* The hand shows dragging the O to FOX's second cell. Once it's there, the hand shows the X to the third cell. The O can't go in the third cell. Typing and tapping follow the same order: only the letter the hand shows works (Q2). OWL's step isn't guided, as today (Q3).

- 🟩 The hand goes from the O in the pool to FOX's second cell
- 🟩 Dropping the O on FOX's third cell sends it back to the pool
- 🟩 With the O placed, the hand goes from the X to FOX's third cell
- 🟩 Typing X first does nothing

**Confirmed:** ☑

### 🟦 R7. OWL's step lets the player make mistakes, and fix them

*From the designer, on 2026-11-04, after playing: dropping OWL's L in its second cell left the player stuck.* FOX's step stays guided, with no mistakes possible (R2). In OWL's step, any of OWL's letters can go in any of its empty cells, by dragging, tapping or typing. A mistake can be fixed by dragging a placed letter along the row (R6) or with Backspace, and a full wrong row shakes as usual. Recall All stays hidden in level 1 (story 12, R10).

- 🟩 With FOX locked, the L can go in OWL's second cell
- 🟩 Then the W in the third cell makes O L W, which shakes
- 🟩 Dragging the W onto the L gives O W L, which locks
- 🟩 With the L in the second cell, Backspace takes it back

**Confirmed:** ☑

### 🟦 R8. Level 1's slide step can be played with the keyboard

*From the designer, on 2026-11-04, after playing.* As in any level (D39), Up and Down select a row, and Left and Right slide the selected word one letter. The step still only lets FOX slide: an arrow on OWL's row selects it, and nothing slides.

- 🟩 Down, Down, then Left selects FOX's row and slides FOX one letter
- 🟩 Down, Down, then Left twice puts FOX's X in the column, and the level is won
- 🟩 Down, then Left selects OWL's row, and nothing moves

**Confirmed:** ☑

### 🟦 R9. The reordering tutorial can be played with the keyboard too

*From the designer, on 2026-11-04.* Up and Down select a row, and Shift with Up or Down moves the selected row (D40). Only the move the hand shows works (story 21, R4): any other row move, or Left and Right, only selects the row. After the move, the player plays freely, keys included.

- 🟩 In the 2-row test level where the top row moves down, Down then Shift+Down makes the move, and the text and hand go
- 🟩 Down, Down, then Shift+Up, moving the bottom row up, does nothing
- 🟩 Down, then Left does nothing

**Confirmed:** ☑

### 🟦 R3. A dragged letter only highlights cells in its own row

*From the designer.* Faded rows (story 23, R3) never highlight, since a letter can't land there.

- 🟩 Dragging E from LEMUR's pool over ZEBRA's row highlights nothing

**Confirmed:** ☑

### 🟦 R4. A small pool sits on one line

*From the designer.* The pool's tiles go left to right, centred, and only wrap to a second line when the first is full. The pool area keeps its size (story 2).

- 🟩 Level 1's pool shows O and X side by side
- 🟩 A pool too wide for one line fills the first line, and the rest go on the line below. *A row has at most eight cells, so this only happens with eight different letters on a narrow screen, such as DOLPHINS.*

**Confirmed:** ☑

### 🟦 R5. A letter from the pool replaces a placed letter

*From the designer.* As today (story 3): the placed letter goes back to the pool.

- 🟩 With M in LEMUR's first cell, dropping E from the pool there puts E in it, and M goes back to the pool

**Confirmed:** ☑

### 🟦 R6. A placed letter dragged along its row makes the others move aside

*From the designer.* Instead of swapping (story 3, "Two placed letters swap"), the letters between where it was and where it goes shift over by one cell, the way rows make way for a moved row in phase two (story 9). They slide aside during the drag, in about 0.1 seconds, as the dragged letter passes over them (Q5). Dropped on an empty cell, a letter just moves there (Q4). Letters moving aside skip over fixed cells (revealed letters and special characters) and never move them (Q6).

- 🟩 LEMUR's row reads U L E M _. Dragging the U onto the M gives L E M U _
- 🟩 LEMUR's row reads L E M U _. Dragging the U onto the L gives U L E M _
- 🟩 LEMUR's row reads M E _ _ _. Dragging the M to the fourth cell gives _ E _ M _
- 🟩 With L revealed first, LEMUR's row reads L U E M _. Dragging the U onto the M gives L E M U _, and the L doesn't move
- 🟩 HOT DOG's row reads H O T ␣ D G O. Dragging the last O onto the H gives O H O ␣ T D G: the T jumps the space
- 🟩 *From playing, on 2026-11-04:* letting go, only the dragged letter travels to its cell. The letters that moved aside stay where they are, and don't travel again
- 🟩 *From playing, on 2026-11-05:* a letter moving aside is drawn above the cells it slides over, never under them
- 🟩 *From playing, on 2026-11-05:* only letters move aside: empty cells stay where they are. With M _ _ L _ in LEMUR's row, holding the M over the L slides the L one cell left, and the empty cells don't move

**Confirmed:** ☑

---

## What this changes elsewhere

- Story 3: the rule "Two placed letters swap" is archived, replaced by R6.
- Story 6: "The row can still be fixed" turned TEAM into MEAT with a swap. It now takes two drags: the M onto the T, then the T onto the A.

---

## Answered questions

### 🟥 Q1. What's level 1's final word?

**Answer:** Keep OWL, and remove the rule that says to use COW (R1).

### 🟥 Q2. In step 1, do typing and tapping follow the same order?

**Answer:** Yes (R2).

### 🟥 Q3. Is FOX's step guided the same way?

**Answer:** No, OWL's step stays unguided (R2). *The question was written for COW and FOX: with FOX and OWL, it's OWL's step.*

### 🟥 Q4. What happens when a placed letter is dropped on an empty cell?

**Answer:** It moves there (R6).

### 🟥 Q5. When do the other letters move aside?

**Answer:** During the drag (R6).

### 🟥 Q6. What about cells that can't move?

**Answer:** Letters skip over them (R6).
