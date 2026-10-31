# Story 1: Level data and validator

**Status:** 🟢 Approved by the designer on 2026-10-30, along with its scenarios in [story-01-level-validator.feature](../../features/story-01-level-validator.feature). Not implemented yet.

*As the game's designer, I want every level described in a fixed format and checked automatically, so that no broken level ever reaches a player.*

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

All examples use the answers ZEBRA, LEMUR and KANGAROO, unless they say otherwise.

**Terms:** *characters* are letters (A–Z and accented letters such as É) and digits (0–9). *Special characters* are everything else, such as spaces, hyphens, apostrophes and other punctuation. An answer's *length* counts its characters only; its *cells* count everything.

---

## Rules and examples

### 🟦 R1. A level has a theme, answers, a final word and any revealed letters

- 🟩 **Passes:** theme Animals, the 3 answers, final word ELK
- 🟩 **Rejected:** no theme
- 🟩 **Rejected:** no final word

**Confirmed:** ☑

### 🟦 R2. The final word has one letter or digit per row, and no special characters

- 🟩 **Passes:** ELK (3 letters, 3 rows)
- 🟩 **Passes:** 2AD with the answers R2D2, CAT and DOG (Q10)
- 🟩 **Rejected:** ELKS (4 letters, 3 rows)
- 🟩 **Rejected:** E-K, because a hyphen can't be in the final word

**Confirmed:** ☑

### 🟦 R3. Each final-word letter must come from a different answer

- 🟩 **Passes:** ELK, with E from ZEBRA, L from LEMUR and K from KANGAROO
- 🟩 **Rejected:** ZOO, because LEMUR has no O, so 3 letters can't come from 3 rows

**Confirmed:** ☑

### 🟦 R4. The validator passes a level if at least one solution exists, whichever one the designer had in mind (D4)

The validator tries every way of matching final-word letters to answers, and one working match is enough.

- 🟩 **Passes:** final word ERA. One match is E from LEMUR, R from ZEBRA, A from KANGAROO. Another is E from ZEBRA, R from LEMUR, A from KANGAROO. Finding either is enough, and the player can win with either.
- 🟩 **Passes:** final word EEK, where the E's could come from ZEBRA and LEMUR in either order. Both orders work, and that's not a problem.

**Confirmed:** ☑

### 🟦 R5. A revealed letter must match its answer at that position

- 🟩 **Passes:** L as LEMUR's first letter
- 🟩 **Rejected:** X as LEMUR's first letter

**Confirmed:** ☑

### 🟦 R6. The pool is worked out automatically: all answer characters minus revealed copies

- 🟩 **Passes:** with L revealed, the pool has 17 letters and no L

**Confirmed:** ☑

### 🟦 R7. Row order and centring are worked out from D5, not written by the author

Rows are ordered by length, and centred by their cells.

- 🟩 **Passes:** the rows appear as LEMUR, ZEBRA, KANGAROO without the author ordering them
- 🟩 **ICE CREAM:** length 8, so it sorts as an 8-long word. It's centred as 9 cells, with the middle of its 5th cell (C) on the screen's centre line.

**Confirmed:** ☑

### 🟦 R8. A level has 3–5 rows, and each answer has a length of 2–8

Special characters don't count towards the length (Q9).

- 🟩 **Passes:** 3 rows; 5 rows; OX (2); E.T. (2); CAT (3); KANGAROO (8); ICE CREAM (8); R2D2 (4)
- 🟩 **Rejected:** 2 rows; 6 rows; X (1); CHAMELEON (9)

**Confirmed:** ☑

### 🟦 R9. A level can't contain the same answer twice

- 🟩 **Rejected:** ZEBRA, ZEBRA, LEMUR

**Confirmed:** ☑

### 🟦 R10. In phase two, every word always has one of its own cells in the column

There is no grid width. A word slides only until its first or last cell is in the column. So any letter of any word can always reach the column, and R3 is all the validator needs: it has no separate reachability check. Words may go off screen while sliding.

- 🟩 **LEMUR with L in the column:** it can slide up to 4 cells left (R in the column), and not right at all
- 🟩 **LEMUR with M in the column:** it can slide 2 cells left or 2 cells right

**Confirmed:** ☑

### 🟦 R11. Answers contain letters, digits and special characters

Digits behave exactly like letters: they're in the pool, are dragged the same way and count towards the length. Any other character is a special character, so answers are never rejected for their characters.

- 🟩 **Passes:** HOT DOG, T-REX, DON'T, R2D2, R&B, MR. T
- 🟩 **R2D2:** starts as 4 empty cells, and the pool gets R, 2, D, 2
- 🟩 **Accented letters are letters.** CAFÉ starts as 4 empty cells, has a length of 4, and the pool gets C, A, F, É.
- 🟩 **É and E are different letters.** É has its own pool tile, an E can't stand in for it, and the same goes for the final word. With the answers CAFÉ, OX and BEE, the final word EXE is rejected because only BEE has an E. ÉXE and BOA pass.

**Confirmed:** ☑

### 🟦 R12. Special characters are always revealed and never appear in the pool

This also applies to levels with no other revealed letters.

- 🟩 **HOT DOG:** starts as `_ _ _ ␣ _ _ _`, and the pool gets H, O, T, D, O, G and no space
- 🟩 **T-REX:** starts as `_ - _ _ _`
- 🟩 **DON'T:** starts as `_ _ _ ' _`
- 🟩 **Special characters can be anywhere in an answer** (Q13). ROCKIN' passes and ends with its apostrophe. 'TIS passes and starts as `' _ _ _`.
- 🟩 **Alphabetical order everywhere, in the pool and between words:** special characters, then letters, then 0 to 9. T-REX sorts before TREE, and TREE sorts before TRE1.
- 🟩 **Accented letters come right after their base letter:** E, É, F. CAFE sorts before CAFÉ, and CAFÉ sorts before CAFF.
- 🟩 **Fine detail:** standard character-code order among special characters (space, then apostrophe, then hyphen, and so on), and among accented versions of the same letter (É before Ê). These only matter for two same-length answers that differ by nothing else.

**Confirmed:** ☑

### 🟦 R13. Special characters never go back to the pool (exception to D9)

- 🟩 **Answers HOT DOG and ICE TEA.** Row 1 starts as `_ _ T ␣ _ _ _`, where only HOT DOG fits. The player builds HOT DOG in row 2, which locks. The T goes back to the pool, but the space stays. Row 1 is now `_ _ _ ␣ _ _ _`, and the pool holds I, C, E, T, E, A: exactly ICE TEA.

**Confirmed:** ☑

### 🟦 R14. Phase two starts with every word's first cell in the column, and the validator warns if that already spells the final word

*From Q6 and Q8.* The column is centred on the screen. The check reads the first cell of each row, in D5's row order. The level is allowed (D7).

- 🟩 **ZEBRA, LEMUR, KANGAROO:** starts as L, Z, K. With final word ELK, there's no warning.
- 🟩 **EMU, LION, KOALA with final word ELK:** starts as E, L, K. The validator warns.

**Confirmed:** ☑

---

## Answered questions

### 🟥 Q1. Who writes the levels?

**Answer:** Claude drafts them and the designer approves them.

### 🟥 Q2. What are the size limits?

**Answer:** 3–5 rows, words of 2–8 letters (R8; the minimum was changed from 3 to 2). How hard levels get will be defined later, with a sawtooth escalation per category in mind.

### 🟥 Q3. How wide is the grid, and can words slide partly off it?

**Answer:** There's no grid width. The "grid" is just all the cells of the horizontal words in phase one, and players can only drop letters in empty cells. In phase two, each word slides only within the column's reach, from its first letter to its last (R10).

### 🟥 Q4. Does the level include the solution arrangement?

**Answer:** No. The validator works one out and proves it exists. This replaces the design document's request for an explicit arrangement.

### 🟥 Q5. Can a level contain the same answer twice?

**Answer:** No (R9).

### 🟥 Q6. What should the validator do if a level's starting layout already spells the final word (D7)?

**Answer:** Warn but allow the level (R14).

### 🟥 Q7. Which characters are allowed in answers?

**Answer:** Letters, digits and special characters. Special characters are placed as hints and never appear in the pool. Digits behave like letters and sort after Z (R11, R12).

### 🟥 Q8. Where does the column sit when phase two starts?

**Answer:** It's centred on the screen, and all words have their first cell in the column. Words may go off screen in phase two (R10, R14).

### 🟥 Q9. Do spaces and hyphens count towards an answer's length?

**Answer:** No, only letters and digits count (R8). ICE CREAM has a length of 8 and needs 9 cells on screen.

### 🟥 Q11. What does "more likely to be locked in at the start" mean?

**Answer:** The row is tied to the word, not solved. Under D8, a revealed special character means only answers with one at that position fit that row, so the player gets a head start.

### 🟥 Q10. Can the final word contain a digit?

**Answer:** Yes, letters and digits (R2).

### 🟥 Q12. Which characters are "special characters"?

**Answer:** Any punctuation, not just spaces, hyphens and apostrophes (R11). Accented letters are letters, not special characters. The length limit still applies: SALT & PEPPER has a length of 10, so it's rejected by R8.

### 🟥 Q13. Can an apostrophe be first or last in an answer?

**Answer:** Yes, and the restriction is removed for all special characters: a legitimate word can use whatever it needs. Only the final word can't use special characters (R2, R12).
