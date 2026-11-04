# Story 25: Bonus words

**Status:** 🟡 Draft, waiting for the designer.

*As a player who spells a word that fits the theme but isn't the answer, I want it to count for something, so that being clever is rewarded instead of feeling like a dead end.*

From playing on 2026-11-04: in one level, the designer spelled two animals in the column that weren't the answer, and found it frustrating. Of the ideas discussed, they chose bonus words: a small consolation prize that keeps the challenge. Bonus words will give currency (story 20), which the player can spend on hints of their own choosing.

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

Examples use made-up levels, never the prototype's (D46). In the first, the theme is Animals, the answers are ZEBRA, LEMUR and KANGAROO, and the final word is ELK.

---

## Rules and examples

### 🟦 R1. A bonus word is a word from the theme, other than the answer, spelled in the column

It doesn't win the level, and play carries on. See Q1 for which words count, and Q2 for horizontal words.

- 🟩 With the column reading E, L, K the level is won. Reading Z, E, N, it's nothing (not an animal). Reading a themed word that isn't ELK, it's a bonus word

**Confirmed:** ☐

### 🟦 R2. A bonus word is found when a word or row settles

The same moment as the win check (story 10, R1), so passing through a word mid-drag doesn't count. See Q3.

- 🟩 Sliding a word through a position that spells a bonus word, without stopping there, finds nothing

**Confirmed:** ☐

### 🟦 R3. Finding one gives gentle feedback, and doesn't block play

See Q4 for how it looks.

- 🟩 The bonus word's letters pulse once, "Bonus word!" appears and fades, and the player can carry on straight away

**Confirmed:** ☐

### 🟦 R4. Each bonus word counts once per level

See Q6 for spelling it again.

- 🟩 Spelling the same bonus word a second time in a level gives no reward

**Confirmed:** ☐

### 🟦 R5. There's nothing to miss

*From the designer: no fear of missing out, since won levels can't be replayed (story 11, R9).* The game never says how many bonus words a level has, or which ones were left. Nothing locks away if they aren't found: no stars, no count, no collection to complete. They're a pleasant surprise, never a task.

- 🟩 Winning a level without finding its bonus words looks and feels the same as winning it with them

**Confirmed:** ☐

### 🟦 R6. A bonus word earns currency, once story 20 exists

See Q5 for what happens before then.

- 🟩 With currency, finding a bonus word adds some to the player's total, which they can spend on hints

**Confirmed:** ☐

### 🟦 R7. Each level stores its bonus words, worked out when the level is made

The generator (story 14) lists, for each level, the theme's words other than the answer that its rows can spell vertically, so the game needs no dictionary. Before the reordering tutorial, only the rows' starting order counts, since rows can't move then (story 21). After it, any order counts. Each list is saved in the level, so the game checks against it.

- 🟩 A level whose rows can spell two other animals stores both
- 🟩 Before the reordering tutorial, an animal that needs the rows in another order isn't stored

**Confirmed:** ☐

### 🟦 R8. The designer doesn't see the bonus words (D46)

Like the levels, the bonus lists are never quoted in chat, commits, test output or the docs, until the designer lifts this.

- 🟩 Claude can say how many levels have bonus words, but not which words they are

**Confirmed:** ☐

---

## Questions

### 🟥 Q1. Which words count as bonus words?

- **A (recommended):** Only words in the theme's word list (`content/word-lists/`). The lists can grow to cover more of the theme, and every bonus word fits the theme, as the designer asked.
- **B:** Any real English word. This needs a dictionary shipped with the game, and a filter for unsuitable words. It's the old bonus-words idea in later ideas.

**Answer:**

### 🟥 Q2. Do horizontal words count too?

With a pool per row, a row can only spell anagrams of its own answer (story 23, R6).

- **A (recommended):** Not for now: the column only. A full row that spells a themed anagram of its answer shakes, as any wrong word does.
- **B:** Yes: a full row spelling a themed anagram of its answer (not another of the level's answers) is a bonus word. It still shakes, as it isn't the row's word.

**Answer:**

### 🟥 Q3. When exactly is a bonus word found?

- **A (recommended):** When a word or row settles and the column reads it, the same moment as the win check (R2).
- **B:** Only when the player stops for a moment, about half a second, so quick slides past a word don't count.

**Answer:**

### 🟥 Q4. How does finding one look?

- **A (recommended):** The column's letters pulse once, like a locking word (D37), and "Bonus word!" appears above the rows, gently rises and fades, like "Already found" (D10). Timings and colours live in the style file (D27).
- **B:** As A, and the letters briefly turn gold, like the win's wave (D41) but not as long.

**Answer:**

### 🟥 Q5. What happens before currency exists?

- **A (recommended):** The feedback plays, and the bonus words found are saved with the player's progress, so that when currency arrives (story 20), they can be credited. Nothing is shown about the total yet.
- **B:** The feedback only. Nothing is saved, and currency starts from zero when story 20 is built.

**Answer:**

### 🟥 Q6. What if the player spells a bonus word they've already found in that level?

- **A (recommended):** Nothing: no feedback and no reward, so the player isn't tempted to repeat it.
- **B:** A short "Already found" like D10, with no reward.

**Answer:**

### 🟥 Q7. Does level 1 have bonus words?

- **A (recommended):** No. The tutorial stays focused on its steps, and its level has none anyway (only OX can be spelled from FOX and OWL as a themed word). The first bonus word a player finds is a surprise in a later level.
- **B:** Yes, if any exist, with the same feedback.

**Answer:**

### 🟥 Q8. Is finding the first bonus word explained?

- **A (recommended):** Only by its own feedback: "Bonus word!" says it all, and a short line under it, such as "Not the answer, but well spotted!", appears the first time only.
- **B:** A short tip the first time, like level 2's theme tip (story 12, R12).

**Answer:**

---

## What this changes elsewhere

- Story 14 (the generator) stores each level's bonus words (R7).
- Story 15's 40 levels get their bonus lists, drafted again with the generator. The levels themselves don't change.
- Story 20 (currency) gains bonus words as a way to earn it.

---

## Answered questions

None yet.
