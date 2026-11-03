# Story 14: Level generator

**Status:** 🟢 Approved by the designer on 2026-10-31, along with its scenarios in [story-14-level-generator.feature](../../features/story-14-level-generator.feature). Not implemented yet.

*As the game's designer, I want a tool that suggests levels from a theme's word list, so that making many levels doesn't mean finding every combination by hand.*

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

This is an offline tool, and it's not shipped with the game. Generating levels on players' devices is a [later idea](../later-ideas.md).

---

## Rules and examples

### 🟦 R1. The generator takes a theme, its word list and settings

The settings are the number of rows, the range of word lengths, the revealed letters (R9) and whether reordering is needed (R10), within story 1's limits.

- 🟩 Theme Animals, its word list, 3 rows, words of 4–8 letters, no revealed letters, reordering needed

**Confirmed:** ☑

### 🟦 R2. It starts from a final word, then finds answers that can spell it

Your document says not to assume a vertical word will emerge by chance.

- 🟩 For the final word ELK, it needs one answer with an E, one with an L and one with a K, each a different word

**Confirmed:** ☑

### 🟦 R3. The final word comes from the same theme

- 🟩 For the theme Animals, the final word is an animal too

**Confirmed:** ☑

### 🟦 R4. A final word can't also be one of its level's answers

- 🟩 ELK as the final word can't sit alongside ELK as an answer

**Confirmed:** ☑

### 🟦 R5. Every suggestion passes the validator, and none start already solved

*Includes Q5.* The validator allows those with a warning, but the generator doesn't offer them.

- 🟩 A suggestion with a repeated answer never appears
- 🟩 EMU, LION and KOALA with the final word ELK are never offered

**Confirmed:** ☑

### 🟦 R6. Nothing reaches the game until the designer approves it (D11)

For the prototype, Claude does this review, and the designer stays blind (D46). The generator only writes suggestions, never finished levels. Each run writes a colour-coded Markdown file, with a box to tick for each level you want (Q2).

- 🟩 Running the generator doesn't change the game's levels
- 🟩 Ticking a suggestion and approving the file adds that level

**Confirmed:** ☑

### 🟦 R7. The same input gives the same suggestions

Results can be repeated, tested and discussed.

- 🟩 Running it twice with the same settings gives the same list

**Confirmed:** ☑

### 🟦 R8. The generator doesn't need a browser or the game

Its logic is plain code, tested like the validator. This also keeps the door open for the later idea of generating levels on a device.

- 🟩 It runs from a single command

**Confirmed:** ☑

### 🟦 R9. Revealed letters are a setting, and the default is none

*From Q3.* The modes are none, each answer's first letter, or a number of letters at random. Random letters are picked when the level is generated, and they're fixed in the level from then on, so the game itself is never random.

- 🟩 By default, a suggestion reveals nothing
- 🟩 With 2 at random, a suggestion stores which 2 letters, and every player gets the same ones

**Confirmed:** ☑

### 🟦 R10. Whether reordering is needed is a setting

*Changed by story 21 on 2026-11-03.* "Needs reordering" means the rows, in their starting order (D5), can't spell the final word by sliding (story 21, Q10).

*From Q4.* With it on, the final word can't be spelled without moving a row. With it off, the rows' starting order can spell it, so sliding alone solves the level.

- 🟩 With reordering off, a suggestion can be solved by sliding only
- 🟩 With reordering on, a suggestion can't

**Confirmed:** ☑

### 🟦 R11. Within a theme, every word is unique across the curated levels

*From Q6, changed by the designer.* That covers answers and final words. The generator skips words already used by that theme's approved levels, and a word can appear in different themes. Generated levels after the end of the content can reuse words ([later ideas](../later-ideas.md)).

- 🟩 Once ZEBRA is in an approved Animals level, no Animals suggestion uses it
- 🟩 WINTER can appear in a Cold theme and in a Christmas theme

**Confirmed:** ☑

### 🟦 R12. Handles only appear once the reordering tutorial has been shown

*Changed by story 21 on 2026-11-03.* Moved to story 21: the reordering tutorial is the first level that needs reordering, so no level number is fixed.

*From Q7.* Today that's level 1 (story 12, step 3), so this changes nothing yet. It lets reordering be introduced later, say at level 20, as long as levels 1–19 don't need it. Without handles, rows can't be moved, by mouse, touch or keyboard.

- 🟩 If the reordering tutorial were at level 20, level 19's phase two would have no handles, and Shift+Up would do nothing
- 🟩 Today, level 2 has handles, because level 1 showed the tutorial

**Confirmed:** ☑

### 🟦 R13. ~~The validator rejects a level that needs reordering before the tutorial for it~~

*Changed by story 21 on 2026-11-03.* No longer needed: the first level that needs reordering is the tutorial, so no earlier level can need it.

Without this, a level could become impossible to solve, because the player couldn't move its rows.

- 🟩 If the reordering tutorial were at level 20, a level 19 that can't be solved by sliding alone is rejected

**Confirmed:** ☑

---

## Answered questions

### 🟥 Q1. Where do the word lists come from?

**Answer:** Claude writes a list per theme, and the designer reviews it.

The designer asked whether Claude sources them from somewhere. Claude writes them from its own general knowledge, not from a particular file, and individual common words aren't protected. A list can be checked against a permissive word list for spelling.

### 🟥 Q2. How do you review suggestions?

**Answer:** A Markdown file per run, colour-coded like the example maps (R6).

### 🟥 Q3. Which letters does a suggestion reveal?

**Answer:** Undefined for now, so no letters are revealed by default. Revealed letters must stay a capability of the generator and the game, so they're easy to add. It might be a number of letters at random, or first letters, depending on how difficult levels are to play (R9).

### 🟥 Q4. Must a suggestion need both sliding and reordering?

**Answer:** It should be a generation setting, so that levels aren't insanely difficult. Reordering might even be introduced on later levels, not level 1 (R10).

### 🟥 Q5. What about suggestions that start already solved (D7)?

**Answer:** The generator doesn't offer them (R5).

### 🟥 Q6. Can a word be reused in different levels?

**Answer:** Each word is unique within a theme, so a word such as WINTER can appear in a Cold theme and a Christmas theme. At the end of the content, words can reappear (R11).

### 🟥 Q7. In a level that doesn't need reordering, are the handles still there?

**Answer:** Handles only appear in phase two if the tutorial for them has been shown. This changes nothing today, but it allows reordering to be introduced at, say, level 20, as long as levels 1–19 don't need it (R12).
