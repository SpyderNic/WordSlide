# M07-05: Bonus words (was story 25)

**Status:** 🟢 Approved on 2026-11-06, with its [scenarios](../../../features/7-worth-playing/m07-05-bonus-words.feature).

*As a player who spells a word that fits the theme but isn't the answer, I want it to count for something, so that being clever is rewarded instead of feeling like a dead end.*

From playing on 2026-11-04: in one level, the designer spelled two animals in the column that weren't the answer, and found it frustrating. Of the ideas discussed, they chose bonus words: a small consolation prize that keeps the challenge. Bonus words give coins (M07-02), which the player can spend on hints of their own choosing (M07-03).

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

Examples use made-up levels, never the prototype's (D46). In the first, the theme is Animals, the answers are ZEBRA, LEMUR and KANGAROO, and the final word is ELK. In the second, the theme is Animals and one row's answer is NEWT, whose letters also spell WENT and (themed) no other animal; another row's answer is WOLF, whose letters also spell FOWL, an animal.

## Settings (D52)

| Setting | What it is |
|---|---|
| *bonus word reward* | The coins a bonus word gives. Already named in M07-02, and set to 10 by D51 |

The pulse, the "Bonus word!" text and the coin flight take their timings and colours from the style file (D27).

---

## Rules and examples

### 🟦 R1. A bonus word is a word from the theme's word list, other than the answer, spelled in the column

*From Q1.* Only words in the theme's word list (`content/word-lists/`) count, so no dictionary ships with the game. It doesn't win the level, and play carries on.

- 🟩 With the column reading E, L, K the level is won. Reading Z, E, N, it's nothing (not an animal). Reading a themed word that isn't ELK, it's a bonus word

**Confirmed:** ☑

### 🟦 R2. A full row can spell a bonus word too

*From Q2.* With a pool per row, a row can only spell anagrams of its own answer (M06-03, R6). A full row that spells a word from the theme's list, other than its own answer and the level's other answers, is a bonus word. The first time, it doesn't shake: it gets the bonus feedback (R4) and coins (R7) instead. Its letters stay in place, as with any word that isn't the row's (D37), so the player still has to make the row's answer.

- 🟩 Filling the WOLF row with F, O, W, L: the row pulses, "Bonus word!" appears, coins fly, and the row doesn't shake. Its letters stay where they are
- 🟩 Filling the NEWT row with W, E, N, T: WENT isn't an animal, so the row shakes, as now

**Confirmed:** ☑

### 🟦 R3. A bonus word is found when a word or row settles

*From Q3.* For the column, the same moment as the win check (M04-04, R1), so passing through a word mid-drag doesn't count. For a row, the moment it's full, when it's checked (D37). *From Q9:* rows are only filled in phase one and the column only exists in phase two (D6), so a row and the column can never find bonus words at the same moment. *From Q10:* the start of phase two counts as a settle. If the column already reads a bonus word when phase two starts (D6), it's found once the ceremony (D38) ends.

- 🟩 Sliding a word through a position that spells a bonus word, without stopping there, finds nothing
- 🟩 Phase two starts with the column reading a themed word that isn't the final word: once the ceremony ends, it's found, with the usual feedback and coins

**Confirmed:** ☑

### 🟦 R4. Finding one gives gentle feedback, and doesn't block play

*From Q4.* The bonus word's letters pulse once, like a locking word (D37) but without changing colour, and "Bonus word!" appears above the rows, gently rises and fades, like "Already found" (D10). For the column, the column's letters pulse; for a row, the row's.

- 🟩 The bonus word's letters pulse once, "Bonus word!" appears and fades, and the player can carry on straight away

**Confirmed:** ☑

### 🟦 R5. The first bonus word ever found says a little more

*From Q8.* The first time the player finds a bonus word, a short line appears under "Bonus word!", such as "Not the answer, but well spotted!", and fades with it. It never shows again, in any level, and this is saved with the player's progress.

- 🟩 The player's first bonus word shows "Bonus word!" with the line under it. Their second, in any level, shows "Bonus word!" alone

**Confirmed:** ☑

### 🟦 R6. Each bonus word counts once per level, wherever it's spelled

*From Q2 and Q6.* Once a word has been found in a level, spelling it again, in the same place or another, behaves as if it weren't a bonus word: a full row spelling it shakes, as any wrong word does, and the column reading it does nothing. No feedback, no coins.

- 🟩 After FOWL is found in the WOLF row, emptying the row and filling it with F, O, W, L again: the row shakes, and no coins are given
- 🟩 After a bonus word is found in the column, sliding away and back to it again: nothing happens
- 🟩 After a word is found in a row, the column reading the same word in phase two: nothing happens. (The other way round can't happen: rows are filled before the column exists, R3.)

**Confirmed:** ☑

### 🟦 R7. A bonus word gives the bonus word reward

*From Q5: coins exist now (M07-02).* The coins fly from the bonus word to the counter, which counts up as they land (M07-02, R15).

- 🟩 Given a *bonus word reward* of 10 and 100 coins, finding a bonus word in the column: coins fly from the column to the counter, which counts up from 100 to 110

**Confirmed:** ☑

### 🟦 R8. There's nothing to miss

*From the designer: no fear of missing out, since won levels can't be replayed (M05-01, R9).* The game never says how many bonus words a level has, or which ones were left. Nothing locks away if they aren't found: no stars, no count, no collection to complete. They're a pleasant surprise, never a task.

- 🟩 Winning a level without finding its bonus words looks and feels the same as winning it with them

**Confirmed:** ☑

### 🟦 R9. Level 1 has no bonus words

*From Q7.* The tutorial stays focused on its steps. Its level has none anyway: the only themed word FOX and OWL can spell in the column is OX, its answer, and neither row can spell another animal. The first bonus word a player finds is a surprise in a later level.

- 🟩 In level 1, no bonus word can be found

**Confirmed:** ☑

### 🟦 R10. Each level stores its bonus words, worked out when the level is made

The generator (M06-01) lists, for each level, the words from the theme's list, other than the level's answers, that:

- its rows can spell vertically. Before the reordering tutorial, only the rows' starting order counts, since rows can't move then (M05-04). After it, any order counts.
- each row can spell from its own pool (R2).

Each list is saved in the level, so the game checks against it and needs no dictionary.

- 🟩 A level whose rows can spell two other animals in the column stores both
- 🟩 Before the reordering tutorial, an animal that needs the rows in another order isn't stored
- 🟩 A level with the WOLF row stores FOWL

**Confirmed:** ☑

### 🟦 R11. A level's found bonus words are saved with it

*From Q11.* The words found are saved with the level's progress, and finding one is saved as one change with its coins, like buying a hint (M07-03, R7).

- 🟩 After FOWL is found, closing and reopening the game, then filling the WOLF row with F, O, W, L again: the row shakes, and no coins are given
- 🟩 Closing the game straight after finding a bonus word: when it opens again, the coins are there

**Confirmed:** ☑

### 🟦 R12. The designer doesn't see the bonus words (D46)

Like the levels, the bonus lists are never quoted in chat, commits, test output or the docs, until the designer lifts this.

- 🟩 Claude can say how many levels have bonus words, but not which words they are

**Confirmed:** ☑

---

## What this changes elsewhere

- M06-01 (the generator) stores each level's bonus words, for the column and for each row (R10).
- M06-02's 40 levels get their bonus lists, drafted again with the generator. The levels themselves don't change.
- M07-02 (coins): the *bonus word reward* starts being given.
- The wrong-word shake (M04, M06-03) gains an exception: a row's first bonus word doesn't shake (R2).

---

## Decided while building

Choices the scenarios didn't cover, waiting for the designer to accept them:

- The game's 40 levels got their bonus lists from a new command, `npm run levels:bonus`, instead of being drafted again: it works the lists out from the word lists and leaves the levels exactly as they were. `levels:draft` does the same when it drafts. 19 of the 40 levels have bonus words, 32 in all.
- A level approved from the generator keeps only the column words its place allows: before the reordering tutorial, the rows' starting order (R10).
- "Bonus word!" shows on a highlighted background like "Already found", just above the top row, and rises from there. The first-time line is smaller, under it on the same background. In phase one, on a short landscape screen, it covers the theme while it shows; in phase two it sits above the column.
- A row's bonus pulse uses the lock pulse's timings (D37), and the column's pulse does too.
- If the Letter hint's letter is the one that completes a bonus word in a row, it counts like any other, with its feedback and coins (the hint never shakes a row, M07-01, R13).
- The starting feel setting, to tune by playing: "Bonus word!" rises and fades over 1.6 seconds (`bonusWord` in the style).

---

## Answered questions

Answered by the designer on 2026-11-06. Questions left blank took the recommendation.

### Q1. Which words count as bonus words?

- **A (recommended):** Only words in the theme's word list. *Chosen (recommendation).*
- **B:** Any real English word, with a dictionary shipped.

### Q2. Do horizontal words count too?

- **A (recommended):** Not for now: the column only.
- **B:** Yes: a full row spelling a themed anagram of its answer is a bonus word.

**Answer:** B, it doesn't shake the first time the bonus word is found (gentle pulse as per vertical bonus word), and give coins. If it's spelt again (on this row or another, or vertically in the same level), then it shakes as usual.

### Q3. When exactly is a bonus word found?

- **A (recommended):** When a word or row settles, the same moment as the win check. *Chosen (recommendation).*
- **B:** Only when the player stops for about half a second.

### Q4. How does finding one look?

- **A (recommended):** The letters pulse once, and "Bonus word!" rises and fades. *Chosen (recommendation).*
- **B:** As A, and the letters briefly turn gold.

### Q5. What happens before currency exists?

**Answer:** Currencies exist now. (M07-02 is built, so bonus words give coins straight away.)

### Q6. What if the player spells a bonus word they've already found in that level?

- **A (recommended):** Nothing: no feedback and no reward. *Chosen (recommendation).* With Q2's answer, a row spelling it again shakes as usual.
- **B:** A short "Already found", with no reward.

### Q7. Does level 1 have bonus words?

- **A (recommended):** No. *Chosen (recommendation).*
- **B:** Yes, if any exist.

### Q8. Is finding the first bonus word explained?

- **A (recommended):** Only by its own feedback, with a short line under it the first time only.
- **B:** A short tip the first time.

**Answer:** We might change how bonus words work later on, but because it's very simple now, A is fine.

### Q9. What if a row and the column find bonus words at the same moment?

- **A (recommended):** Both count, both pulse together, "Bonus word!" shows once.
- **B:** Both count, and the feedback plays twice.

**Answer:** Filling a word in the row can only happen in phase 1, which means there are no vertical word to find yet. This hypothetical cannot happen! (Recorded in R3.)

### Q10. Does a bonus word count if phase two starts on one?

- **A (recommended):** Yes. Once the ceremony ends, it's found, with the usual feedback and coins. *Chosen (recommendation). Recorded in R3.*
- **B:** No. Only a column the player made counts.

### Q11. Are a level's found bonus words saved with it?

- **A (recommended):** Yes, saved with the level, as one change with their coins. *Chosen (recommendation). Recorded in R11.*
- **B:** No, and they can be earned again after reopening.
