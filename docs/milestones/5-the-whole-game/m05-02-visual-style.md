# M05-02: Visual style (was story 16)

**Status:** 🟢 Approved by the designer on 2026-10-31, along with its scenarios in [features/5-the-whole-game/m05-02-visual-style.feature](../../../features/5-the-whole-game/m05-02-visual-style.feature). Built on 2026-11-02.

> *Changed by M06-03 on 2026-11-04.* Each row now has its own pool ([M06-03](../6-content/m06-03-a-pool-for-each-row.md)). Some of this story's examples changed to use a row's own letters, and scenarios whose rule no longer applies are in `archive/before-story-23/`, with the rule that replaced each.

*As a player, I want the game to look calm, clear and satisfying, so that it's pleasant to spend time with.*

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

Earlier, you chose a plain placeholder look for now (D27), with the real style to come once the game proves fun. Q1 asks how much of it belongs in the prototype. Your document's aim is "calm, clear and satisfying".

---

## Rules and examples

### 🟦 R1. Style never changes the rules

Every approved scenario still passes with any style, so the style can change at any time.

- 🟩 Changing the tile colours doesn't change how a word locks

**Confirmed:** ☑

### 🟦 R2. Colours, fonts, sizes and timings live in one style, and the game can hold several styles

A new style or a different speed means changing one file, not the whole game. The prototype has one style, but the game is built so that several can exist, and players might choose between them later (D27, [later ideas](../../later-ideas.md)). Timings include the 0.15 second letter travel (Q6), so they're easy to tweak.

- 🟩 Changing the gold colour once changes it everywhere
- 🟩 Changing the letter travel time once changes it for every letter
- 🟩 Adding a second style file needs no change to the game's rules or code

**Confirmed:** ☑

### 🟦 R3. Every tile state looks different at a glance

The states are: pool tile, grey x0 tile, placed letter, revealed letter, locked letter and gold letter. Target highlights and the selected row are also distinct.

- 🟩 A revealed letter and a placed letter can be told apart without reading them

**Confirmed:** ☑

### 🟦 R4. Text stays readable on the smallest screen (800×450)

CrazyGames asks for this. No text is smaller than 12 pixels at 800×450 (Q8).

- 🟩 Pool counts such as x2 can be read at 800×450

**Confirmed:** ☑

### 🟦 R5. Colour isn't the only signal for the important states

Some players can't tell certain colours apart, so grey x0 tiles also show x0, and locked rows also can't be moved.

- 🟩 A grey x0 tile still shows x0

**Confirmed:** ☑

### 🟦 R6. A letter travels to its destination, wherever it starts

*Changed by the designer: this includes dragged letters.* A tapped or typed letter travels from the pool to its cell, and a dragged letter travels from where it was dropped to its cell or the pool. It takes about 0.15 seconds (Q6). It's only a visual: the letter counts as placed straight away (M03-05, R10), so fast typing never waits for it.

- 🟩 Typing a whole word quickly shows the letters flying in, in order
- 🟩 A letter released near a cell travels the rest of the way into it
- 🟩 A letter released away from any cell travels from there to the pool

**Confirmed:** ☑

### 🟦 R7. Letters travel back to the pool the same way

This covers Recall All, Backspace and hinted letters going back (D9). When several letters go back at once, they leave one after another, 0.03 seconds apart, from the top row down and left to right (Q10).

- 🟩 Recall All sends each letter back along a short path
- 🟩 Recall All with three placed letters sends them back one after another
- 🟩 A letter going back adds to its pool count only when it lands, and a letter leaving the pool lowers the count as it leaves (Q13)

**Confirmed:** ☑


### 🟦 R8. The look is warm wood and brass, like a cryptex, drawn in code

*From Q2 and Q4.* The tiles look like wood, the column like brass, and gold is kept for the win. The prototype's version is simple, using shapes and gradients. The full game will probably use an asset pack, or an artist or AI image tool.

- 🟩 The column's strip and notches look like brass

The palette is "honey oak": today's colours, refined, with green for locked letters and gold for the win. Each tile has a soft bevel, lighter top and left edges and darker bottom and right edges, so it looks raised, like a carved wooden block. The column has a grey sheen line, like glass, and its two brass sides; both are drawn above the words, so letters slide under them like a real cryptex. Its tinted strip stays behind the letters (Q7, Q9, Q11, Q12, Q14).

- 🟩 A placed tile's top and left edges are lighter than it, and its bottom and right edges darker
- 🟩 A word sliding through the column passes under its sides and its glass line
- 🟩 A row lifted by its handle passes under the glass line too, though above the sides (from playing milestone 5)

**Confirmed:** ☑

### 🟦 R9. The font is a rounded, friendly sans serif with an open licence

*From Q3, Q5 and Q7.* It's Nunito, under the SIL Open Font License, bundled with the game.

- 🟩 The font's licence is kept with the game's files

**Confirmed:** ☑

---

## Answered questions

### 🟥 Q1. How much style goes in the prototype?

**Answer:** A clean, simple look plus the letter travel. The full art style waits until the game proves fun.

### 🟥 Q2. What's the mood?

**Answer:** Warm wood and brass, like a cryptex, with gold as the win colour (R8).

### 🟥 Q3. What font style?

**Answer:** A rounded, friendly sans serif (R9).

### 🟥 Q4. Where does the art come from?

**Answer:** Drawn in code for the prototype, and probably a licensed asset pack or an artist or AI image tool for the full game (R8).

### 🟥 Q5. Which font source?

**Answer:** A free font with an open licence, bundled with the game (R9).

### 🟥 Q6. How fast do letters travel?

**Answer:** About 0.15 seconds, and it should be easily tweakable (R6, R2).

### 🟥 Q7. Which palette and font?

*Asked with previews on 2026-11-02.* **Answer:** Palette A, "honey oak", and Nunito (R8, R9).

### 🟥 Q8. What's the smallest readable text size?

**Answer:** 12 pixels at 800×450, Claude's recommendation, which the designer approved with the plan (R4).

### 🟥 Q9. How are the wood and brass drawn?

**Answer:** A soft bevel on each tile, and a sheen line on the column (R8).

### 🟥 Q10. When several letters go back at once, do they travel together?

**Answer:** One after another, 0.03 seconds apart, top row first (R7).

### 🟥 Q11. Should tiles look more 3D?

*From playing milestone 5.* **Answer:** Yes: lighter on the left too, and darker on the right (R8).

### 🟥 Q12. Which parts of the column are drawn above the words?

*From playing milestone 5.* **Answer:** Just its two sides. The tinted strip stays behind, so the column's letters stay easy to read (R8).

### 🟥 Q13. When does a pool count change?

*From playing milestone 5.* **Answer:** A letter going back adds to the count when it lands on its tile. A letter leaving lowers it as it leaves, as picking up a tile does (R7).

### 🟥 Q14. Is the column's glass line above the words too?

*From playing milestone 5.* **Answer:** Yes, like its sides (R8).
