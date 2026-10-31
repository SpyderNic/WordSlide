# Story 17: Pool as a keyboard

**Status:** 🟢 Approved by the designer on 2026-10-31, along with its scenarios in [story-17-pool-as-a-keyboard.feature](../../features/story-17-pool-as-a-keyboard.feature). Not implemented yet. Build it after story 6, because its scenarios rely on rows locking.

*As a player, I want to select a word and then tap or type its letters, so that I can fill words quickly without dragging each letter.*

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

All examples use the answers ZEBRA, LEMUR and KANGAROO, with nothing revealed, unless they say otherwise. The rows are LEMUR, ZEBRA, KANGAROO (D5).

This is a second way to place letters. Drag and drop (story 3) stays. Everything here applies to phase one only.

**Terms:** *input* means tapping a pool letter or pressing its key. A *full* row has no empty cell.

---

## Rules and examples

### 🟦 R1. Tapping a row selects it, and only one row is selected at a time

The selected row is clearly marked.

- 🟩 Tapping any cell of ZEBRA's row selects it
- 🟩 Tapping LEMUR's row then moves the selection there

**Confirmed:** ☑

### 🟦 R2. With a row selected, tapping a pool letter moves it to that row's first available cell

"First available" means the first empty cell from the left.

- 🟩 With ZEBRA's row selected, tapping Z fills cell 1, then tapping E fills cell 2

**Confirmed:** ☑

### 🟦 R3. Filled cells are skipped

- 🟩 With L revealed, LEMUR starts as `L _ _ _ _`, and tapping E fills cell 2
- 🟩 With `_ E _ _ _`, tapping Z fills cell 1, and the next letter fills cell 3
- 🟩 With T-REX as `_ - _ _ _`, tapping T fills cell 1, and tapping R fills cell 3, skipping the hyphen

**Confirmed:** ☑

### 🟦 R4. Tapping behaves like dragging for the pool

The count drops by one, and a tile reaching zero turns grey (story 3, R4 and R5). There's no feedback on whether a letter is right.

- 🟩 Tapping A changes A x3 to A x2
- 🟩 Tapping a grey Z x0 does nothing
- 🟩 Tapping K with ZEBRA's row selected places K, and nothing says it's wrong

**Confirmed:** ☑

### 🟦 R5. When an input fills a row's last empty cell, the selection moves on

*Changed by the designer, reworded by Claude.* This also covers Q2. The selection moves to the next row down that has an empty cell. After the bottom row, it goes back to the topmost row with an empty cell. Locked and full rows are skipped, because they have no empty cell.

If no row has an empty cell, the selection stays where it is, so Backspace can still fix a mistake. If that row just locked, the selection goes to the topmost row that isn't locked.

- 🟩 Filling LEMUR moves the selection to ZEBRA
- 🟩 Filling KANGAROO, with LEMUR still incomplete, moves the selection up to LEMUR
- 🟩 Filling LEMUR, with ZEBRA full but wrong, moves the selection to KANGAROO
- 🟩 Filling the last empty cell in the level leaves that row selected, unless it locked

**Confirmed:** ☑

### 🟦 R6. A physical key acts the same as tapping that pool letter, if the letter exists and has a tile left

Upper and lower case are the same.

- 🟩 With ZEBRA's row selected, pressing `z` or `Z` fills cell 1
- 🟩 Digit keys work too: with R2D2's row selected, pressing `2` uses a 2
- 🟩 Pressing `Q` does nothing, because the level has no Q
- 🟩 Pressing `Z` with Z x0 does nothing

**Confirmed:** ☑

### 🟦 R7. Fast typing keeps its order

- 🟩 Typing `ZEBRA` quickly with ZEBRA's row selected fills the cells in that order

**Confirmed:** ☑

### 🟦 R8. A short press is a tap, and moving while pressed is a drag

- 🟩 Pressing and releasing a pool tile without moving it is a tap
- 🟩 Pressing a pool tile and moving it starts a drag, as in story 3
- 🟩 Pressing a placed letter and moving it drags the letter. Without moving, it selects the row.

**Confirmed:** ☑

### 🟦 R9. Tapping or typing is ignored during a drag

- 🟩 Pressing `A` while dragging a Z does nothing

**Confirmed:** ☑

### 🟦 R10. A tapped letter counts as placed straight away

Its trip to the cell is an animation, which comes with the visual style (story 16). Later inputs don't wait for it.

- 🟩 Tapping Z takes it from the pool and fills the cell right away, whatever the animation shows

**Confirmed:** ☑

### 🟦 R11. No row is selected when a level opens, and the first input selects the top row

*From Q1, Claude's wording.* The letter lands in that row. "Top row" means the topmost row with an empty cell. An input that does nothing doesn't select a row.

- 🟩 When the level opens, tapping Z selects LEMUR's row and puts the Z in its cell 1
- 🟩 Pressing `Q` selects nothing, because the level has no Q

**Confirmed:** ☑

### 🟦 R12. A locked row can't be selected, and tapping the selected row keeps it selected

*From Q3 and Q4.*

- 🟩 Tapping a locked row leaves the selection where it was
- 🟩 Tapping ZEBRA's row while it's selected changes nothing

**Confirmed:** ☑

### 🟦 R13. A drag hides the selection, and the next input brings it back

*From Q5, Claude's wording.* The mark disappears when a drag starts, but the row is remembered. It comes back with the next input, and that letter lands in the remembered row. Tapping a row or using an arrow key also ends the hiding.

- 🟩 With ZEBRA's row selected, dragging an A to KANGAROO hides the mark. Tapping E then shows ZEBRA's row selected again, and puts the E in it.

**Confirmed:** ☑

### 🟦 R14. A key for an accented letter uses that letter only, and a plain key falls back to accented letters

*From Q6.* The plain letter comes first. Fallback then follows D21's order.

- 🟩 With E x1 and É x1, pressing `E` uses the E, and pressing it again uses the É
- 🟩 Pressing `É` uses the É
- 🟩 With É x0 and E x1, pressing `É` does nothing

**Confirmed:** ☑

### 🟦 R15. Backspace sends the selected row's rightmost placed letter back to the pool

*From Q7 and Q9.* Revealed letters and locked words stay. If the selected row has no placed letters, the selection moves to the nearest row above with a placed letter, and removes that row's rightmost placed letter. If no row above has one, Backspace does nothing: it doesn't wrap around.

- 🟩 With L revealed and `L E Z _ _`, Backspace removes the Z, and the Z count goes up by one
- 🟩 With nothing selected, Backspace does nothing
- 🟩 After a mistyped last letter fills ZEBRA and the selection moves to an empty KANGAROO, Backspace moves it back to ZEBRA and removes that letter

**Confirmed:** ☑

### 🟦 R16. The Up and Down arrows change the selected row, skipping locked rows

*From Q8 and Q10.* Full rows can be selected, so that Backspace can reach them. With nothing selected, an arrow selects the topmost row that isn't locked. The arrows wrap around at both ends.

- 🟩 With ZEBRA's row selected, Up selects LEMUR
- 🟩 With LEMUR locked and ZEBRA selected, Down selects KANGAROO
- 🟩 With LEMUR selected, Up selects KANGAROO

**Confirmed:** ☑

### 🟦 R17. An input on a full selected row moves the selection on, and the letter lands in that next row

*From Q11.* The selection moves as in R5. If no row has an empty cell, nothing happens.

- 🟩 With ZEBRA's row full and selected, tapping A selects KANGAROO and puts the A in it

**Confirmed:** ☑

---

## Answered questions

### 🟥 Q1. Is a row selected when a level opens?

**Answer:** No, but if the player taps a letter or presses a key, the first row is selected automatically (R11).

### 🟥 Q2. What happens to the selection when a word locks?

**Answer:** It moves on to a row that isn't locked (R5).

### 🟥 Q3. Can a locked row be selected?

**Answer:** No. Tapping it does nothing, and the selection stays where it was (R12).

### 🟥 Q4. What does tapping the selected row do?

**Answer:** Nothing, it stays selected (R12).

### 🟥 Q5. Does dragging a letter change the selection?

**Answer:** Visually, the word is unselected. If the player then taps a letter, the previously selected word shows again (R13).

### 🟥 Q6. How do players type accented letters?

**Answer:** An exact key selects the exact accented letter. Otherwise, a plain key falls back to the accented letter (R14).

### 🟥 Q7. Does Backspace remove a letter?

**Answer:** Yes (R15).

### 🟥 Q8. Can the keyboard change the selected row?

**Answer:** Yes, the Up and Down arrows (R16).

### 🟥 Q9. What does Backspace do when the selected row has no placed letters?

**Answer:** It goes back to the nearest row above with a placed letter, and removes that row's rightmost placed letter (R15).

### 🟥 Q10. What do the arrows do at the top and bottom of the list?

**Answer:** They wrap around (R16).

### 🟥 Q11. What does an input do when the selected row is already full?

**Answer:** The selection moves on as in R5, and the letter lands in that next row (R17).
