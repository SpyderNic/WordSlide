# M06-02: Draft the first levels (was story 15)

**Status:** 🟢 Approved by the designer on 2026-10-31, with Q13 and Q14 added on 2026-11-03, and built on 2026-11-03, along with its scenarios in [features/6-content/m06-02-draft-the-first-levels.feature](../../../features/6-content/m06-02-draft-the-first-levels.feature).

*As the game's designer, I want a first set of levels to play, so that I can find out whether the game is fun and how hard it should be.*

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

This story is about the content for the prototype. It has to come after the validator (M02-01) and the generator (M06-01).

---

## Rules and examples

### 🟦 R1. Every level passes the validator

- 🟩 The game can't be built with a level that fails (M02-01)

**Confirmed:** ☑

### 🟦 R2. Level 1 is the tutorial level (M05-03): FOX, OWL and OX

*From Q10.* It's the first Animals level (Q8). It needs revealed letters, as in M05-03, which is the only level in the prototype to have them.

- 🟩 Level 1 is the theme Animals, with the answers FOX and OWL, and the final word OX

**Confirmed:** ☑

### 🟦 R3. Every level, from level 1, has a clear, single theme

The theme is what the player sees at the top, and the answers and final word all belong to it.

- 🟩 Animals: every answer and the final word are animals

**Confirmed:** ☑

### 🟦 R4. Words are familiar, in English for the prototype, and suitable for all ages

Your document says words should be familiar enough to reason about. Other languages may come later ([later ideas](../../later-ideas.md)).

- 🟩 Early levels use everyday words, and nothing obscure

**Confirmed:** ☑

### 🟦 R5. Within a theme, every word is unique (D44)

- 🟩 A word can't appear in two levels of the same theme

**Confirmed:** ☑

### 🟦 R6. The designer doesn't see the prototype's levels or word lists

*Changed by the designer, replacing "word lists are reviewed before generating".* You want to play as a new player to judge difficulty. Claude writes the lists and picks the levels, and never quotes them in chat, commit messages, test output or the docs. Only the tutorial and the row counts are shared.

- 🟩 Claude can tell you a theme's row counts, but not its words

**Confirmed:** ☑

### 🟦 R7. Claude approves the prototype's levels in place of the designer

*Changed by the designer.* After playing, you'll judge whether players need easing in more, and by the end you'll curate the levels yourself. D11 and M06-01's review file apply from then on. Letting the generator take over is a [later idea](../../later-ideas.md).

- 🟩 For the prototype, Claude picks from the generator's suggestions

**Confirmed:** ☑

### 🟦 R8. The prototype has 40 levels: Animals, Food, Space and Sports, with 10 each

*From Q2, Q3, Q8 and Q9.* The tutorial is the first Animals level, so Animals has the tutorial and 9 more.

- 🟩 Levels 1–10 are Animals, and levels 11–20 are Food

**Confirmed:** ☑

### 🟦 R9. From level 2, no letters are revealed, and reordering follows M05-04

*Changed by M05-04 on 2026-11-03.* Levels 2 to 20 don't need reordering, so level 21, the first Space level, is the reordering tutorial. After it, each theme's first level at each row count doesn't need reordering, and the rest do (M05-04, R6). The generator's setting is chosen per level.

*From Q5 and Q6.* You can change this after playing.

- 🟩 The generator runs with reordering on and no revealed letters

**Confirmed:** ☑

### 🟦 R10. There are no chapters, just themes

*From Q7.*

- 🟩 The level number keeps counting up through the themes

**Confirmed:** ☑

### 🟦 R11. A full-screen interstitial shows when the theme changes

*From Q7 and Q11.* It names the new theme, fades in and out with no Continue button, and reveals the next level. It takes about 2 seconds, and input is ignored during it.

- 🟩 After pressing "Play Level 11", the Food interstitial fades in and out, and level 11 appears
- 🟩 Between two Animals levels, it doesn't appear

**Confirmed:** ☑

### 🟦 R12. Each theme's rows follow one pattern, as far as its words allow

*From Q4 and Q12.* The pattern is 2, 2, 3, 3, 3, 3, 4, 4, 4, 5. A 2-row level needs a 2-letter final word in the theme. If the theme has none left, those levels use 3 rows. If it has no 3-letter words either, Claude flags it, and they use 4 rows.

- 🟩 Animals uses its only 2-letter word for the tutorial, so its second level has 3 rows
- 🟩 A theme with no 2-letter final words runs 3, 3, 3, 3, 3, 3, 4, 4, 4, 5

**Confirmed:** ☑

### 🟦 R13. Answers grow longer with the rows

*From Q13.* Answers are 3–5 letters in 2- and 3-row levels, 3–6 in 4-row levels, and 4–7 in 5-row levels. The final word has one letter per row.

- 🟩 A 4-row level's answers have 3 to 6 letters, and its final word has 4

**Confirmed:** ☑

### 🟦 R14. Level 21 needs a longer row above a shorter one

*From Q14.* That way, no way of locking the words avoids the move (D8), so the reordering tutorial always shows there (M05-04, Q12).

- 🟩 Level 21's solution has a longer word above a shorter one

**Confirmed:** ☑

---

## Answered questions

### 🟥 Q13. How long are the answers in each level?

*Added on 2026-11-03.* **Answer:** They grow with the rows (R13).

### 🟥 Q14. Must level 21 always show the reordering tutorial?

*Added on 2026-11-03.* **Answer:** Yes. Level 21 needs a longer row above a shorter one (R14).

### 🟥 Q1. Do you want to keep FOX, OWL and OX as level 1?

**Answer:** Keep OX (Q10).

### 🟥 Q2. How many levels does the prototype need?

**Answer:** 40 levels: 10 levels per theme for now (R8).

### 🟥 Q3. Which themes?

**Answer:** Animals, Food and Space, plus Sports (R8).

### 🟥 Q4. How does difficulty rise within a theme?

**Answer:** Rows go 2, 2, 3, 3, 3, 3, 4, 4, 4, 5, as far as each theme's words allow (R12).

### 🟥 Q5. How often is reordering needed?

**Answer:** Every level after the tutorial, to start with (R9).

### 🟥 Q6. Do the levels reveal any letters?

**Answer:** None, in every level after the tutorial (R9).

### 🟥 Q7. Are the levels organised into chapters?

**Answer:** No chapters, just the theme, with an interstitial when the theme changes (R10, R11). A later main menu or level selector can group levels by theme. The same theme can reoccur in later levels, which is a [later idea](../../later-ideas.md).

### 🟥 Q8. Does the tutorial count as one of the 40 levels?

**Answer:** Yes (R8).

### 🟥 Q9. What's the fourth theme?

**Answer:** Sports (R8).

### 🟥 Q10. Which level 1 do you want?

**Answer:** FOX, OWL and OX (R2).

### 🟥 Q11. How does the theme interstitial look?

**Answer:** Full screen with no Continue button. It fades in and out to reveal the next level (R11).

### 🟥 Q12. What about the 2-row levels?

**Answer:** Only allow 2 rows when the theme has words that allow them. If there are none, start at 3. If there are no 3-letter words, flag it and start at 4 (R12).
