# Story 23: A pool for each row

**Status:** 🟢 Approved by the designer on 2026-11-04. Approved along with its scenarios in [features/6-content/story-23-a-pool-for-each-row.feature](../../../features/6-content/story-23-a-pool-for-each-row.feature). Built on 2026-11-04.

*As a player, I want each word to have its own letters, so that finding the words is a fair challenge and the real puzzle is the vertical word.*

From playing milestone 6 on 2026-11-03: the designer found the game too hard, with every answer's letters mixed in one pool. On 2026-11-04 they asked for each row to have its own pool, keeping the core mechanics. Phase two doesn't change.

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

Examples use the test level ZEBRA, LEMUR and KANGAROO, whose rows go LEMUR, ZEBRA, KANGAROO (D5).

---

## Rules and examples

Rules marked *From the designer* come from the request.

### 🟦 R1. Each row has its own pool

*From the designer.* The pool shows the selected row's letters only: its answer's letters, minus any revealed ones, sorted as today (story 1). A letter with no copies left in that row stays as a grey x0 tile (D24). Extra letters can come later, as a generator setting per row (Q1).

- 🟩 With LEMUR's row selected, the pool shows E, L, M, R, U
- 🟩 With KANGAROO's row selected, it shows A x2, G, K, N, O x2, R

**Confirmed:** ☑

### 🟦 R2. A row is always selected in phase one

*From the designer.* The pool needs a row to show, so a row is selected from the moment the level opens, not only once the keyboard is used (this replaces story 17's "no row is selected when a level opens"). It's the top unfinished row (Q2).

- 🟩 When the level opens, LEMUR's row is selected and the pool shows its letters

**Confirmed:** ☑

### 🟦 R3. Rows that aren't selected and aren't finished are faded

*From the designer.* So it's clear letters can't go there. The selected row looks as it does today, and locked rows keep their locked colour. A faded row's empty cells and placed letters show at about half their usual strength, and fading in or out takes about 0.2 seconds (Q8).

- 🟩 With LEMUR's row selected, ZEBRA's and KANGAROO's rows are faded
- 🟩 Once LEMUR locks and ZEBRA's row is selected, LEMUR keeps its locked colour, and only KANGAROO's row is faded

**Confirmed:** ☑

### 🟦 R4. Tapping a row selects it, and the pool changes to its letters

Any unfinished row can be selected, by tapping it or with Up and Down (D35). The pool changes straight away, in about 0.25 seconds: letters both pools have glide to their new places, letters the new pool doesn't have fade out, and its new letters fade in (Q3). Letters already placed in the row stay, and its pool shows what's left.

- 🟩 With E and L placed in LEMUR's row, tapping KANGAROO's row shows KANGAROO's letters. Tapping LEMUR's row again shows M, R, U, with E and L as x0
- 🟩 Going from LEMUR's pool to ZEBRA's, E glides to its new place and R stays in its place (it's the fourth tile in both), L, M and U fade out, and A, B and Z fade in. *Corrected while building: the example first had R gliding too.*

**Confirmed:** ☑

### 🟦 R5. Letters only go into the selected row

*From the designer.* A letter from the pool can only go into the selected row. Letters can't be dragged from one row to another any more. A placed letter can still move to another empty cell in its own row (D33), or go back to the pool. A letter dropped on a row that isn't selected goes back to the pool, like a letter dropped anywhere else (Q4).

- 🟩 Dragging Z from ZEBRA's pool onto LEMUR's row does nothing to LEMUR's row
- 🟩 In LEMUR's row, a placed M can be dragged to another empty cell of LEMUR

**Confirmed:** ☑

### 🟦 R6. A row takes its own answer, or another one made of the same letters

*From the designer, with Q7.* A row's pool only has its own answer's letters, so the only other answer it can spell is one with exactly the same letters, such as MEAT for TEAM. If that answer isn't locked yet, it locks there, and the other row now expects the row's own answer. If it's already locked, "already found" shows (D10), and the letters stay. The locking rules stay as they are (D8, D9): they just apply far less often, because letters can no longer go from one row to another.

- 🟩 With TEAM in row 1 and MEAT in row 2, spelling MEAT in row 1 locks it, and row 2 now expects TEAM
- 🟩 With MEAT already locked in row 2, spelling MEAT in row 1 shows "already found"

**Confirmed:** ☑

### 🟦 R7. A wrong word shakes, and the selection stays

*From the designer.* A full row that isn't its answer shakes (D37), its letters stay in place, and its row stays selected, so the player can fix it. This replaces story 17's "when an input fills a row, the selection moves on".

- 🟩 Typing L, E, M, R, U in LEMUR's row shakes it, and LEMUR's row is still selected

**Confirmed:** ☑

### 🟦 R8. A word that locks moves the selection on

The lock pulse plays (D37), then the next unfinished row below is selected, wrapping to the top, and the pool changes to its letters (Q5).

- 🟩 When LEMUR locks, ZEBRA's row is selected and the pool shows ZEBRA's letters

**Confirmed:** ☑

### 🟦 R9. The keyboard works on the selected row

Typing a letter sends it to the selected row's first empty cell, if the selected row's pool has it (story 17). A letter only in another row's pool does nothing. Backspace takes back the selected row's last placed letter, and Up and Down change the selected row, skipping locked rows.

- 🟩 With LEMUR's row selected, pressing Z does nothing, because Z is only in ZEBRA's pool

**Confirmed:** ☑

### 🟦 R13. Recall All empties the selected row

*From Q6.* It sends the selected row's placed letters back to its pool, since that's the only pool on screen. It's grey when the selected row has nothing to recall (D36).

- 🟩 With Z placed in ZEBRA's row and L in LEMUR's row, and ZEBRA's row selected, Recall All sends Z back and leaves L in place

**Confirmed:** ☑

### 🟦 R14. A row locks all at once, or not at all

*From the designer, on 2026-11-04, while this story was being built.* With a pool per row, locking a split word's parts on their own (D48) isn't needed any more. A row is checked only when it's full: it locks as a whole, or the whole row shakes. Special characters still stay still.

- 🟩 Placing H, O and T in HOT DOG's row locks nothing, and gives no feedback
- 🟩 Filling HOT DOG's row with HOT GOD shakes the whole row, and nothing locks
- 🟩 Filling it with HOT DOG locks it

**Confirmed:** ☑

### 🟦 R10. Saving and reopening keep the board and the selected row

As today (story 11, R10), reopening mid-level shows the board as the player left it, with the same row selected and its pool.

- 🟩 Closing with ZEBRA's row selected, and opening again, shows ZEBRA's row selected and its pool

**Confirmed:** ☑

### 🟦 R11. Level 1's tutorial teaches the row's pool

*From the designer, with Q9.* Level 1 starts as `F _ _` and `O _ _`, so the player places several letters.

- Step 1: "Drag letters to complete a word". The hand goes from the O in the pool to FOX's first empty cell, and only O and X can be used, dragged, tapped or typed.
- Step 2: when FOX locks, the pool changes to OWL's letters, and the text says "Each word has its own letters. Finish the grid!", with no hand.
- Step 3: the slide step, as today (story 21, R3).

Tapping a row isn't taught, because the selection moves on by itself.

- 🟩 Step 1: FOX's row is selected, the pool shows O and X, and the player completes FOX
- 🟩 When FOX locks, OWL's row is selected, the pool changes to W and L, and the text points the change out

**Confirmed:** ☑

### 🟦 R12. Phase two doesn't change

The ceremony, sliding, reordering and the win stay as they are (stories 7 to 10 and 21). Since letters can't go from one row to another, a level's rows start phase two in the length order (D5), apart from an answer locked in the row of another made of the same letters (R6).

- 🟩 After the ceremony, the rows are LEMUR, ZEBRA, KANGAROO, as they were in phase one

**Confirmed:** ☑

---

## How it will be built

- **Archiving, not deleting.** Before the change, the current state is tagged in git (`before-story-23`), so the whole game can be rolled back. Scenarios that no longer apply move, with their steps, to `archive/before-story-23/`, outside the test runs, with a note saying which rule replaced each. Scenarios that change are edited through their maps first, as usual.
- **Part locking (R14):** story 6's rule "A split word's parts lock on their own", its "only the wrong part shakes" and "a part pulses" scenarios, and story 11's "a locked part comes back" are archived.
- **Stories affected:** 3, 4, 5, 6 and 17 (placing, returning, Recall All, locking, the keyboard), 12 (the tutorial), 16 (letters travelling between rows) and 21 (the ceremony's reordering). Decisions D35 (the keyboard) and D36 (Recall All) change, and D48 (parts locking) is replaced by R14. D8, D9 and D10 stay, but only apply to answers made of the same letters (R6).
- **Content:** the 40 levels stay as they are.
- **Shuffling (story 22):** the designer will review whether it's needed once this story is built (Q10).

### Scenarios archived or changed

To approve with this story's scenarios. Everything archived goes to `archive/before-story-23/` with a note naming the rule that replaced it.

**Archived, because their rule no longer exists:**

- Story 17: "No row is selected when a level opens" and "With nothing selected, an arrow selects the top row" (replaced by R2). "Filling a row moves the selection on" and "An input on a full selected row moves the selection on" (R7, R8). "A drag hides the selection until the next input" (R2: the selected row always shows). Backspace going back to an earlier row, skipping locked rows or doing nothing with no selection (R9).
- Story 6: "An answer locks in another row of the same length" (R6). "If two rows fill at once, they're checked from the top", which needed a swap between rows (R5). "Filling a row moves the selection on in every case" (R7, R8).
- Story 5: "Letters in several rows go back", "A hidden selection stays hidden" (R13, R2).
- Story 12: steps 1 and 2 as they are today, with `F O _` and `O _ L` (R11: story 23's tutorial scenarios replace them).
- Story 21: the scenarios where same-length words are locked the other way round, including Q12's "locked so that no move is needed" (R5: with a pool per row, that's only possible with answers of the same letters).

**Changed:**

- Story 3: "Two placed letters swap" keeps its rule, within one row.
- Story 6: the scenarios where hinted letters go back to the pool (D9) use answers made of the same letters, such as MEAT and TEAM, since that's now the only way it can happen. Any that can't be set up that way are archived.
- Story 16: "Several letters go back one after another" uses Recall All on one row.

**Unchanged:** every other scenario. Some test steps that place letters in several rows now select each row first, but the scenarios read the same.

---

## Answered questions

### 🟥 Q1. Does a row's pool show only its own letters?

**Answer:** Yes, for now. Extra letters can come later, per row (R1).

### 🟥 Q2. Which row is selected when a level opens?

**Answer:** The top unfinished row (R2).

### 🟥 Q3. How does the pool change from one row's letters to another's?

**Answer:** Letters in common animate to their new location, unneeded letters fade out, and new letters fade in, all in 0.25 seconds (R4).

### 🟥 Q4. What happens to a letter dropped on a row that isn't selected?

**Answer:** It goes back to the pool (R5).

### 🟥 Q5. Which row is selected after a lock?

**Answer:** The next unfinished row below, wrapping to the top (R8).

### 🟥 Q6. What does Recall All do?

**Answer:** It empties the selected row (R13).

### 🟥 Q7. What if a row spells another row's answer?

**Answer:** With TEAM and MEAT, placing MEAT in row 1 (instead of TEAM) locks MEAT there, and row 2 now expects TEAM. If row 2 is already locked with MEAT, placing MEAT in row 1 shows "already found" (R6).

### 🟥 Q8. How do faded rows look?

**Answer:** About half their usual strength, fading in about 0.2 seconds (R3).

### 🟥 Q9. What are level 1's steps and text?

**Answer:** As recommended (R11).

### 🟥 Q10. Where does story 22, shuffling the pool, go?

**Answer:** The designer will review whether shuffling is needed after story 23 is built.
