# Story 12: First-level tutorial

**Status:** 🟢 Approved by the designer on 2026-10-31, along with its scenarios in [features/5-the-whole-game/story-12-first-level-tutorial.feature](../../../features/5-the-whole-game/story-12-first-level-tutorial.feature). Built on 2026-11-02.

> *Changed by story 23 on 2026-11-04.* Each row now has its own pool ([story 23](../6-content/story-23-a-pool-for-each-row.md)). Some of this story's examples changed to use a row's own letters, and scenarios whose rule no longer applies are in `archive/before-story-23/`, with the rule that replaced each.

*As a new player, I want the first level to walk me through each step, so that I understand the game within a minute without reading instructions.*

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

CrazyGames expects the first minute to make it clear what to do, with minimal reading or instructions.

All examples use the designer's sample level, which isn't final: the answers FOX and OWL, and the final word OX. It starts as:

```
F O _
O _ L
```

The pool shows W x1, X x1, and grey x0 tiles for F, L and O (D24).

---

## Rules and examples

### 🟦 R1. Level 1 is a strict tutorial, and the only one

From level 2, the game plays normally, apart from one theme tip (R12). A won level can't be replayed (story 11, R9), so a player sees the tutorial once.

- 🟩 Level 2 has no hand and no restrictions

**Confirmed:** ☑

### 🟦 R2. In the tutorial, the player can only do the current step

Anything else does nothing, and every other rule of the game still applies to the allowed action.

- 🟩 In step 1, trying to drag the W does nothing
- 🟩 In step 3, trying to slide OWL does nothing

**Confirmed:** ☑

### 🟦 R3. Step 1: complete a word

The text says "Drag a letter to complete a word". A hand animates between the X in the pool and the empty cell of the top word. Only the X can be dragged, and only to that cell.

- 🟩 Dropping the X anywhere else sends it back to the pool, and the step carries on
- 🟩 Dropping it in the top word's empty cell locks FOX

**Confirmed:** ☑

### 🟦 R4. Step 2: finish the grid

The text changes to "Finish the grid!". There's no hand. Only the W can be dragged, and only to the last empty cell.

- 🟩 Dropping the W there locks OWL, and the phase-two ceremony plays as usual (story 7)

**Confirmed:** ☑

### 🟦 R5. ~~Step 3: reorder the words~~

*Changed by story 21 on 2026-11-03.* Reordering moved to its own tutorial, on the first level that needs it. In level 1, the ceremony puts OWL above FOX instead, with no handles.

### 🟦 R6. Step 3: slide the word

*Changed by story 21 on 2026-11-03.* After the ceremony, the text says "You can drag words side to side to find the word, try it!". A hand animates from the X of FOX, now in row 2, to the column. Only FOX can be slid. It snaps as usual, so it can stop on another letter, and the hand carries on until the X is in the column (Q3).

- 🟩 Sliding FOX until its X is in the column spells OX

**Confirmed:** ☑

### 🟦 R7. The win is the normal win (story 10)

The text and the hand disappear, and the celebration and popup play as usual.

- 🟩 The player gets 1 point, and the popup says "Play Level 2"

**Confirmed:** ☑

### 🟦 R8. Text and hands follow the current step only

- 🟩 Finishing step 1 replaces its text straight away
- 🟩 The text sits above the rows and below the theme, in both phases (Q4)
- 🟩 Reopening the game mid-tutorial carries on at the same step, with the board as saved (Q5)
- 🟩 *Added on 2026-11-03, after the text and hand were found stuck after a rotation.* Rotating the device moves the text and the hand to the new layout, at every step (D29). Scenarios cover steps 1 and 2 for now, and the sliding step once story 21 is built

**Confirmed:** ☑

### 🟦 R9. The hand repeats until the step is done

It pauses briefly between repeats, and it stops while the player is dragging.

- 🟩 A player who waits sees the hand again

**Confirmed:** ☑

### 🟦 R10. Recall All doesn't appear in the tutorial, and only the step's letters can be typed

*Changed by story 24, R7, on 2026-11-04:* in OWL's step, any of OWL's letters can be typed, and Backspace works. Recall All still doesn't appear. *And by story 24, R8:* the slide step can be played with the arrow keys.

*Changed by the designer, then again after playing milestone 5 (Q11), and again on 2026-11-03.* In steps 1 and 2, typing the step's letter or tapping it in the pool works like dragging it. Arrow keys, Backspace and every other key do nothing, and steps 3 and 4 are dragging only.

- 🟩 In step 1, pressing `X` completes FOX
- 🟩 In step 1, pressing `W` does nothing
- 🟩 In step 1, tapping the X in the pool completes FOX
- 🟩 In step 2, pressing `W` finishes the grid, and so does tapping the W
- 🟩 Level 1 shows no Recall All button at any point

**Confirmed:** ☑

### 🟦 R11. The tutorial's level must suit its steps

This is a requirement on story 15. It needs two steps of filling, and a final word that needs one row moved and then one word slid.

- 🟩 FOX, OWL and OX work: moving FOX gives O, F, and sliding FOX gives O, X

**Confirmed:** ☑

### 🟦 R12. Level 2 highlights the theme once, with a short tip

*From Q6.* The theme is highlighted, and the tip says "All words in a level relate to a theme." It sits where the tutorial text goes (Q4). It doesn't restrict anything, and it disappears when the player finds their first word, meaning when a word first locks in level 2.

- 🟩 When level 2 opens, the theme is highlighted and the tip shows
- 🟩 Placing letters doesn't end them
- 🟩 Locking the first word ends both
- 🟩 Level 3 has neither

**Confirmed:** ☑

---

## Answered questions

### 🟥 Q1. Can the tutorial level have 2 rows?

**Answer:** The validator should allow 2 rows in general. Difficulty constraints come later: level 1 is the tutorial, and easy, medium and hard levels will have their own limits on rows and word length, and extra letters in the pool. Story 1's R8 changed to match.

### 🟥 Q2. In step 3, is FOX dragged by its handle?

**Answer:** Yes, by the handle (R5).

### 🟥 Q3. In step 4, what if the player stops FOX on its O?

**Answer:** It snaps as usual, and the hand carries on (R6).

### 🟥 Q4. Where does the tutorial text go?

**Answer:** Above the rows, below the theme (R8).

### 🟥 Q5. What if the player closes the game during the tutorial?

**Answer:** It carries on at the same step (R8).

### 🟥 Q6. Does the tutorial teach the theme?

**Answer:** Not in level 1. Level 2 highlights the theme, with text saying something like "All words in a level relate to a theme." (R12).

### 🟥 Q7. Where does the tutorial level go among the playtest levels?

**Answer:** First. The FOX and OWL sample, already one of the three playtest levels, becomes level 1, and the other two follow. The level is marked as the tutorial in its data, so a final tutorial level can replace it later.

### 🟥 Q8. What's the tutorial level's theme?

**Answer:** Animals.

### 🟥 Q9. How does the hand look?

**Answer:** A simple pointing hand, drawn in code. It glides from its start to its target in about 1 second, pauses about 0.6 seconds, and repeats. The timings live in the style file.

### 🟥 Q10. How does level 2 highlight the theme?

**Answer:** A gently pulsing outline around it, in the highlight colour, until the first word locks (R12).

### 🟥 Q11. Can the player type the letters in the tutorial?

*From playing milestone 5.* **Answer:** Yes, in steps 1 and 2: typing the step's letter works like dragging it. Tapping it works in step 2 (R10). *Changed on 2026-11-03:* tapping works in step 1 too.
