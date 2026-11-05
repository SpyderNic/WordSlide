# Story 19: Hints, part 1: how they behave

**Status:** 🟢 Approved by the designer on 2026-11-05. Scenarios in [story-19-hints.feature](../../features/story-19-hints.feature), waiting for the designer.

*As a player who's stuck, I want a hint that helps without solving the level for me, so that I can keep going.*

Added to the backlog on 2026-11-02, and brought into the prototype on 2026-11-04. *Split by the designer on 2026-11-04:* this part maps how hints behave, free and unlimited for now, to check they work as intended. How players get hints and what they cost comes after a discussion of the economy (coins and rewarded ads, story 20), in part 2 (story 27). *Rewritten on 2026-11-05 with the designer's list of hints.*

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

Examples use the test level ZEBRA, LEMUR and KANGAROO, with the final word ELK. The rows start as LEMUR, ZEBRA, KANGAROO (D5), and ELK needs ZEBRA on top: ZEBRA's E, LEMUR's L, KANGAROO's K.

---

## Rules and examples

### 🟦 R1. There are several hints, each with its own button and icon

*From the designer.* A hint only happens when the player presses its button. For now, hints are free and unlimited, so their behaviour can be played and checked. Part 2 (story 27) decides how they're earned, what they cost, and how they're limited. A hint that would do nothing isn't offered: its button is grey. Claude draws placeholder icons in code for now, and the designer can replace them (Q1).

| Phase | Hint | What it does |
|---|---|---|
| One | Letter | Locks a letter of the selected word (R3) |
| One | Declutter | *For later:* removes the red herring letters from the selected word's pool, in levels that have them |
| Two | Ordering | Puts the rows in the solution's order and removes the handles (R5) |
| Two | Reveal | Slides one word to its column letter, in gold, fixed there (R6) |

- 🟩 Pressing the Letter hint's button gives the hint, as often as the player likes

**Confirmed:** ☑

### 🟦 R2. The buttons are stacked above Recall All in phase one, and along the bottom in phase two

*From the designer.* In phase one, Recall All sits beside the pool, on its right (D36), and the hint buttons stack above it. In phase two, the pool has gone (D38), and the hint buttons sit along the bottom of the screen. Positions come from the screen size, in landscape and portrait (D28).

- 🟩 In phase one, the Letter hint's button is just above Recall All
- 🟩 In phase two, the hint buttons are centred along the bottom of the screen

**Confirmed:** ☑

### 🟦 R3. The Letter hint locks a letter of the selected word, at random

*From the designer.* It picks one of the selected row's cells that isn't fixed yet, at random, and puts the right letter there. The letter then looks and behaves like a letter revealed at the start of a level (D25): it's fixed, and can't be dragged. The letter comes from the row's pool if a copy is left there. Otherwise it's placed wrongly in another of the row's cells, and moves from there, leaving that cell empty (Q2).

- 🟩 With LEMUR's row selected and empty, the hint might lock M in its third cell. M's tile in the pool goes to x0
- 🟩 With U placed in LEMUR's first cell, the hint might pick that cell: U goes back to the pool, and L is locked there
- 🟩 With L placed in LEMUR's first cell, the hint might pick that cell: the L stays, now locked

**Confirmed:** ☑

### 🟦 R4. A locked letter can complete the word

If it fills the row's last empty cell and the row spells its word, the row locks as usual (story 23, R14).

- 🟩 With L E M U _ in LEMUR's row, the hint can only pick the last cell: it locks R there, and LEMUR locks

**Confirmed:** ☑

### 🟦 R5. The Ordering hint puts the rows in order and removes the handles

*From the designer.* The rows slide up and down into the solution's order, as a moved row does (D40), and the handles fade away: the order is fixed from then on. Words can still slide sideways. It's offered whenever the level has handles. *From the designer:* if the rows happen to be in the solution's order already, it just fades the handles out, and it's no longer offered. It uses the order that needs the fewest row moves from the rows as they are (Q3).

- 🟩 With the rows LEMUR, ZEBRA, KANGAROO, the hint swaps the top two rows to ZEBRA, LEMUR, KANGAROO, and the handles go
- 🟩 With the rows already in the solution's order, the hint fades the handles out, and its button goes

**Confirmed:** ☑

### 🟦 R6. The Reveal hint slides one word to its column letter, in gold

*From the designer.* The word slides sideways to the letter the solution puts in the column, and that letter turns gold. The word can't be slid again. Other words can still slide. The word is picked at random among those whose column letter isn't right yet (Q4). If it has the right letter twice, it slides to the nearer one.

- 🟩 With the rows ZEBRA, LEMUR, KANGAROO and the column reading Z, L, K, only ZEBRA isn't right: the hint slides it to its E, which turns gold, and ZEBRA stays there

**Confirmed:** ☑

### 🟦 R7. The Reveal hint only appears when the rows can't be reordered

*From the designer.* That's in levels without handles: before reordering is taught (story 21), or after the Ordering hint (R5). While the rows can still be reordered, only the Ordering hint shows.

- 🟩 Before reordering is taught, phase two shows the Reveal hint and no Ordering hint
- 🟩 After reordering is taught, phase two shows the Ordering hint. Once it's used, the Ordering hint goes, and the Reveal hint appears

**Confirmed:** ☑

### 🟦 R8. Revealing every word wins the level

Each Reveal puts one more letter of the final word in place. Once the column spells it, the level is won as usual (story 10). Hints never change the level's point (D23, Q5).

- 🟩 With ZEBRA and LEMUR revealed, revealing KANGAROO spells ELK, and the win plays

**Confirmed:** ☑

### 🟦 R9. Hints are saved

As with the rest of a level (story 11, R10), locked letters, gold words and fixed orders come back after reopening.

- 🟩 Closing after a Letter hint and opening again shows the letter still locked

**Confirmed:** ☑

### 🟦 R10. The tutorials have no hints

Level 1 and the reordering tutorial's step (story 21, R4) don't show hint buttons, so the tutorial stays focused. They appear from level 2, and in the reordering tutorial's level once its move is made.

- 🟩 Level 1 has no hint buttons

**Confirmed:** ☑

### 🟦 R11. The hint buttons pulse with the gentle nudge

When the player seems stuck, the nudge (story 26) pulses the theme, and the hint buttons pulse with it.

- 🟩 After the nudge's wait, the theme and the hint buttons pulse gently

**Confirmed:** ☑

---

## Left for part 2 (story 27)

- How hints are earned, what each costs, and how they're limited.
- Whether using a hint asks the player to confirm.
- What happens when the player can't afford one, such as offering a rewarded ad.

## Left for later

- The Declutter hint, once levels have red herrings (later ideas).

---

## Answered questions

### 🟥 Q1. Who draws the icons?

**Answer:** Claude draws placeholders in code for now (R1).

### 🟥 Q2. Where does the Letter hint's letter come from?

**Answer:** The row's pool if a copy is left, otherwise from another of the row's cells (R3).

### 🟥 Q3. Which order does the Ordering hint use?

**Answer:** The one that needs the fewest row moves (R5).

### 🟥 Q4. Which word does the Reveal hint slide?

**Answer:** A word at random, among those not right yet (R6).

### 🟥 Q5. Do hints change the point for a level (D23)?

**Answer:** No (R8).

### 🟥 Shuffling the pool (story 22)

**Answer:** Parked for now (2026-11-05).
