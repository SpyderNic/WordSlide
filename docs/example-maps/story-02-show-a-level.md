# Story 2: Show a level

**Status:** 🟢 Approved by the designer on 2026-10-31, along with its scenarios in [story-02-show-a-level.feature](../../features/story-02-show-a-level.feature). Built on 2026-10-31.

*As a player, I want to see the level's theme, rows and available letters when it opens, so that I can start working out the words.*

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

All examples use the answers ZEBRA, LEMUR and KANGAROO, unless they say otherwise. This story only covers what's on screen when a level opens. Dragging is story 3, the Recall All button is story 5, and choosing which level opens is story 11.

---

## Rules and examples

### 🟦 R1. The screen shows the theme, the rows and the pool, in landscape

The theme is at the top, the rows are in the middle, and the pool is at the bottom.

- 🟩 Theme "Animals" above the 3 rows, with the pool below them

**Confirmed:** ☑

### 🟦 R2. Rows appear in D5's order, centred on the screen

- 🟩 The rows appear as LEMUR, ZEBRA, KANGAROO, top to bottom
- 🟩 The screen's centre line falls on the middle of ZEBRA's cell 3, and between KANGAROO's cells 4 and 5

**Confirmed:** ☑

### 🟦 R3. Each row shows one cell per character, and all cells are on screen

- 🟩 LEMUR shows 5 cells, and KANGAROO shows 8
- 🟩 ICE CREAM shows 9 cells, including its space
- 🟩 A level with 5 rows fits on the smallest screen (800×450)

**Confirmed:** ☑

### 🟦 R4. Revealed letters and special characters are already in their cells; every other cell is empty

- 🟩 With L revealed, LEMUR starts as `L _ _ _ _`
- 🟩 HOT DOG starts as `_ _ _ ␣ _ _ _`
- 🟩 T-REX starts as `_ - _ _ _`

**Confirmed:** ☑

### 🟦 R5. The pool shows each character once, with its count in the tile's bottom-right corner

- 🟩 With nothing revealed, the pool has 12 tiles holding 18 letters: A x3, B x1, E x2, G x1, K x1, L x1, M x1, N x1, O x2, R x3, U x1, Z x1
- 🟩 R2D2 gives 2 x2

**Confirmed:** ☑

### 🟦 R6. The pool shows only the level's characters, in D21's alphabetical order

*Changed by the designer.* There's one layout. The all-letters layout and the debug switch are removed, because they created friction with accents and digits.

- 🟩 A, B, E, G, K, L, M, N, O, R, U, Z
- 🟩 CAFÉ and FEE give A, C, E, É, F
- 🟩 CAT and R2D2 give A, C, D, R, T, 2

**Confirmed:** ☑

### 🟦 R7. The pool area has a fixed size

- 🟩 The pool area is the same size whether a level has 8 tiles or 20
- 🟩 Rows don't move when the pool changes

**Confirmed:** ☑

### 🟦 R8. The column and the row handles aren't shown (D6)

- 🟩 When a level opens, there's no highlighted column and no handles

**Confirmed:** ☑

### 🟦 R9. A letter with no copies left to place gets a grey x0 tile

*From Q2.* It matches how a letter looks once all its copies are used.

- 🟩 With L revealed in LEMUR, the pool shows a grey L x0 tile, in its alphabetical place

**Confirmed:** ☑

### 🟦 R10. Revealed letters use a different tile colour from letters the player places

*From Q4.* The player can see which ones can't be moved.

- 🟩 The L in `L _ _ _ _` is on a revealed-colour tile

**Confirmed:** ☑

### 🟦 R11. All special characters look the same: no tile and no cell outline, one cell wide

*From Q5, reworded by Claude.* A space shows nothing, and any other special character shows just its symbol on the background.

- 🟩 HOT DOG shows a one-cell gap between HOT and DOG
- 🟩 T-REX shows a bare hyphen between its first two cells, with no tile behind it

**Confirmed:** ☑

### 🟦 R12. Tiles are the same size in every level

*From Q7.* Tiles are sized for the smallest screen, with room for about 16 cells across, 5 rows and a two-row pool. Small levels simply have more empty space.

- 🟩 A 3-row level and a 5-row level use the same tile size

**Confirmed:** ☑

### 🟦 R13. The screen also shows the level number, the player's points and three buttons: home, shop and settings

*From Q6.* The shop button is provisional, to see how it looks with a shop.

- 🟩 Level 4, with 3 points so far, shows "4" and "3"

**Confirmed:** ☑

### 🟦 R14. Positions and sizes come from the screen size (D28)

This story only has to show landscape, but nothing may rule out portrait later.

- 🟩 The same level can be laid out for 800×450 and for 360×800 without changing the level's data or the player's progress

**Confirmed:** ☑

### 🟦 R15. When a device rotates during a level, the layout adapts live

*From Q12.* The level redraws for the new orientation and keeps the player's progress. A drag in progress is cancelled and its letter goes back to where it came from. Progress and drags don't exist until story 3, so those two parts get their scenarios there.

- 🟩 Turning the device redraws the open level for the new screen size

**Confirmed:** ☑

### 🟦 R16. The home, shop and settings buttons are visible but do nothing

*From Q10.* We're working towards a prototype, not a release. If the layout works and the game is fun, stories for a path to release get added then.

- 🟩 Pressing any of the three leaves the level exactly as it was

**Confirmed:** ☑

### 🟦 R17. Home and the level number are top left, the theme is top centre, and points, shop and settings are top right

*From Q11.*

- 🟩 Left to right along the top: home, level number, theme, points, shop, settings

**Confirmed:** ☑

### Plain placeholder look

*From Q8.* Simple colours and a standard font for now. The real style is story 16.

---

## Answered questions

### 🟥 Q1. What did "only use letters (accented or not) when a level uses them" mean?

**Answer:** All letters. The all-letters layout and its debug switch are removed (R6). This changes D3.

### 🟥 Q2. In the puzzle layout, does a letter with no copies left to place get a tile?

**Answer:** Yes, a grey x0 tile (R9).

### 🟥 Q3. What order does the all-letters layout use?

**Answer:** No longer relevant.

### 🟥 Q4. Do revealed letters look different from letters the player places?

**Answer:** Yes, a different tile colour (R10).

### 🟥 Q5. How does a space look in a row?

**Answer:** A gap, and all special characters look the same (R11).

### 🟥 Q6. What else is on screen when a level opens?

**Answer:** The level number, the player's points, and home, shop and settings buttons (R13).

### 🟥 Q7. Is the tile size the same in every level?

**Answer:** Yes (R12).

### 🟥 Q8. How much of the visual style do we decide now?

**Answer:** A plain placeholder look for now, with the real style as a later story.

### 🟥 Q9. How does the debug switch work?

**Answer:** No longer relevant.

### 🟥 Q10. What do the three buttons do in the first playable version?

**Answer:** All three are visible but do nothing for now. No stories are added for them yet: if the layout works and the game is fun, stories for a path to release come later (R16).

### 🟥 Q11. Where do these go on screen?

**Answer:** Home at the top left, then the level number. Points, shop and settings at the top right. The theme stays in the top centre (R17).

### 🟥 Q12. What happens when a device rotates during a level?

**Answer:** The layout adapts live (R15).
