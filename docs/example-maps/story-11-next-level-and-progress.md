# Story 11: Unlock the next level and save progress

**Status:** 🟢 Approved by the designer on 2026-10-31, along with its scenarios in [story-11-next-level-and-progress.feature](../../features/story-11-next-level-and-progress.feature). Not implemented yet.

*As a player, I want to move on to the next level and keep my progress, so that I can come back later and carry on where I stopped.*

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

The home, shop and settings buttons still do nothing (D30), so there's no way to pick a level. The game always opens on the player's current level.

---

## Rules and examples

### 🟦 R1. Levels come in a fixed order, and winning one unlocks the next

The player must complete the current level to reach the next.

- 🟩 Winning level 4 unlocks level 5
- 🟩 There's no way to reach level 6 before winning level 5

**Confirmed:** ☑

### 🟦 R2. Winning a level gives 1 point (D23)

An instant win (D7) counts the same.

- 🟩 With 3 points in total, winning a level brings the total to 4 points
- 🟩 EMU, LION and KOALA with the final word ELK give 1 point, with no move from the player

**Confirmed:** ☑

### 🟦 R3. The popup's button opens the next level from the start

The level appears with a quick fade of about 0.3 seconds (Q5).

- 🟩 Pressing "Play Level 5" opens level 5 in phase one, with nothing placed
- 🟩 The level number shows 5

**Confirmed:** ☑

### 🟦 R4. A new player starts at level 1 with 0 points

- 🟩 The first time the game opens, the level number shows 1 and the points show 0

**Confirmed:** ☑

### 🟦 R5. Progress is saved as soon as a level is won

Progress means the current level and the points. It's saved before the popup appears, so closing the game during the celebration loses nothing.

- 🟩 Winning level 4 and closing the game before the popup appears opens level 5 next time, with the point counted

**Confirmed:** ☑

### 🟦 R6. Reopening the game continues from the saved level

- 🟩 With level 5 reached and 4 points saved, the game opens on level 5 with 4 points

**Confirmed:** ☑

### 🟦 R7. Progress is saved on the player's device

The prototype saves locally, behind the interface in D32, so a platform's own save can replace it later.

- 🟩 Reloading the page in the same browser keeps progress

**Confirmed:** ☑

### 🟦 R8. If saving isn't possible, the game still plays

Some browsers block saving, for example in a private window.

- 🟩 With saving blocked, the player can still play through levels, and progress is lost on closing

**Confirmed:** ☑

### 🟦 R9. A won level can't be replayed in the prototype

There's no home menu or level list yet.

- 🟩 After winning level 4, the game has no way back to it

**Confirmed:** ☑

### 🟦 R10. Progress within a level is saved too

*From Q1.* The game saves after every change that settles: a letter placed or removed, a word locking, a word snapping, a row dropping.

Saved: placed letters, locked words, hinted letters that went back to the pool (D9), the phase, each word's position and the row order.

Not saved: the selected row, a drag in progress, and feedback that was playing.

- 🟩 With Z placed and LEMUR locked, reopening shows both, and the pool counts match
- 🟩 In phase two, with KANGAROO slid and moved to the top, reopening shows it there
- 🟩 Closing during a drag restores the board from before the drag
- 🟩 Closing during the phase-two ceremony reopens on the finished phase-two layout
- 🟩 Reopening has no row selected

**Confirmed:** ☑

### 🟦 R11. After the last level, the popup shows "All levels complete!" with no button

*From Q2.* This is for the prototype only. Reopening the game shows that popup again. Later, levels would be generated once the content runs out ([later ideas](../later-ideas.md)).

- 🟩 Winning the last level shows "All levels complete!"

**Confirmed:** ☑

### 🟦 R12. The new point shows when the popup appears

*From Q3 and Q4.* The points at the top of the screen go up with a small pulse. The popup doesn't mention the point.

- 🟩 With 3 points, the top of the screen shows 4 as the popup appears

**Confirmed:** ☑

### 🟦 R13. Development builds have a level picker and a progress reset

*From Q6.* They never reach players.

- 🟩 In a development build, the designer can jump to level 12
- 🟩 In a release build, neither exists

**Confirmed:** ☑

---

## Answered questions

### 🟥 Q1. Is progress within a level saved?

**Answer:** Yes, placed letters, locked words and word positions are all saved (R10).

### 🟥 Q2. What happens after the last level?

**Answer:** For the prototype, the popup shows "All levels complete!" with no button. Once end of content is reached, levels will be generated, which a future story outside the prototype will define (R11).

### 🟥 Q3. When does the top of the screen show the new point?

**Answer:** When the popup appears, with a small pulse (R12).

### 🟥 Q4. Does the popup mention the point?

**Answer:** No (R12).

### 🟥 Q5. How does the next level appear?

**Answer:** A quick fade, about 0.3 seconds (R3).

### 🟥 Q6. How do you test levels without playing through them all?

**Answer:** A level picker and a progress reset, in development builds only (R13).
