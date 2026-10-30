# Word Slide — Game Design Context

> Original design-context document provided by the game's designer on 2026-10-29, kept as written (under the working title "Words Slide").
> Decisions made since then are in [decisions.md](decisions.md) and take precedence over this document.

## 1. Overview

**Working title:** Words Slide (or Word Slide)

**Platform:** CrazyGames, initially targeting a browser-based casual puzzle game.

**Genre:** Word puzzle / deduction / spatial reasoning.

**Design goal:** Create a relaxing but challenging word game that combines traditional word discovery with a unique spatial puzzle. Players should be able to take their time, experiment freely and solve puzzles without time pressure.

The game should be intuitive to pick up, satisfying to interact with, and progressively more challenging. The core gameplay should be strong enough to stand on its own, without requiring a complicated meta-game.

This document describes the current concept and design thinking. Some mechanics are decided, while others are ideas to explore later. Do not assume every speculative idea is approved for implementation.

## 2. Core Gameplay Concept

Each level contains several horizontal words that share a common theme. Players must discover and complete these words using letters from a pool at the bottom of the screen.

Once all horizontal words have been completed, the player must rearrange the words spatially to reveal a final word hidden vertically through the grid.

The final word is also related to the level's theme.

There are two distinct puzzle-solving phases:

1. **Horizontal word discovery:** Deduce the words using the theme, word lengths, starting-letter clues and the available letter pool.
2. **Vertical word discovery:** Slide the completed words horizontally and rearrange them vertically until their letters align to reveal the final answer.

Completing the vertical word wins the level and unlocks progression.

The spatial alignment mechanic is a key differentiator. This should feel like an integral part of the puzzle, not merely an animation after solving the words.

## 3. Phase One: Horizontal Word Discovery

### The grid

The main puzzle area contains multiple horizontal word slots.

- Each row has a defined word length.
- All horizontal words belong to a common theme.
- Some letters may be revealed at the beginning to help the player get started.
- The number of cells in each row indicates the word length.
- The player can fill the slots in any order.
- The level's intended answers are known in advance.

For example, an animal-themed puzzle might contain ZEBRA, LEMUR and KANGAROO.

The player should not have to solve the words in a prescribed sequence. Discovering one word may provide useful information for solving another.

### Free letter placement

Players can drag any available letter from the pool into any empty grid cell.

They do not need to select a particular word before placing letters. They can experiment with partial words and use the remaining letters to work out other answers.

Letters placed in incomplete words are removed from the available pool immediately. This is an intentional and important mechanic: as the player places letters, the pool becomes less cluttered, helping them recognise the remaining possibilities.

For example, a player may suspect that a particular word starts with Z and place a Z in the grid. Even before completing the word, that Z is no longer available in the pool. The changing pool provides information that helps with the rest of the puzzle.

### Recalling letters

Letters placed in incomplete words must remain reversible.

- An individual letter can be dragged back into the pool.
- A dedicated Recall All button returns every letter currently placed in incomplete words to the pool.
- Returning a letter restores its available count.
- Recall All must not undo words that have already been correctly completed and locked.

The player should be able to experiment freely without worrying about permanently wasting letters.

### Word validation and locking

Only the intended answers for the current level should be accepted.

When a row's letters match its intended answer, the word locks in and its letters become permanently unavailable for the remaining horizontal words. The corresponding letter counts in the pool decrease accordingly.

An arbitrary dictionary word should not be accepted simply because it is valid English. Each level has a predefined answer list, and validation must respect the intended solution.

Incorrect completed words should receive clear, gentle feedback without consuming letters or permanently penalising the player.

### The letter pool

The letter pool contains the letters available to solve the puzzle, including repeated letters.

Duplicate letters should be represented by a single tile with a count indicator in its bottom-right corner, for example:

- A x4
- E x3
- R x2
- Z x1

Dragging one copy of a letter out of the pool reduces its count by one. The remaining copies stay available.

When no copies remain, the tile can display `x0` and become grey and non-draggable. This is one proposed way of maintaining a consistent pool layout.

The pool should occupy a consistent amount of screen space so that its layout does not jump around as letters are used.

### Two possible pool layouts

This is an unresolved design question that should be tested.

**Option A: Show the entire alphabet**

Display all 26 letters at all times, potentially arranged in a QWERTY keyboard layout. Each letter has a count, and unused letters show x0.

Advantages:

- Consistent layout.
- Players always know where to find each letter.
- Zero-count letters remain visible, making the available inventory explicit.

Potential disadvantage:

- More visual clutter and many inactive tiles.

**Option B: Show only letters relevant to the puzzle**

Display only the letters that occur in the puzzle, arranged alphabetically.

Advantages:

- Less clutter.
- Greater focus on the relevant letter combinations.
- Potentially more approachable for casual players.

Potential disadvantage:

- The pool may appear to change more as letters are consumed, although the overall container should remain a consistent size.

The preferred starting hypothesis is to show only relevant letters, arranged alphabetically, within a fixed-size pool area. However, the full-alphabet layout remains worth experimenting with. Do not treat this preference as a final decision.

### Letter inventory

The simplest initial design is for the pool to contain the combined letters of all intended horizontal answers, with any already-revealed grid letters excluded from the available counts.

For example, if a letter has already been provided as a starting clue, that copy should not also appear as an available copy in the pool.

A future difficulty modifier may add extra letters that do not belong to any intended answer. The underlying design should not permanently assume that every letter in the pool must be used.

## 4. Phase Two: Vertical Word Discovery

After all horizontal words have been solved, the game transitions into the final spatial puzzle.

The completed words must be rearranged so that a letter from each word forms a hidden vertical word in a highlighted central column.

The vertical word is thematically related to the horizontal answers.

### Horizontal movement

Players can grab any part of a completed word and drag the entire word left or right.

- The entire word moves as one unit.
- The player does not need to grab a particular letter or handle.
- When released, the word snaps to a valid horizontal position that fits the grid and its vertical alignment guide.
- A fixed vertical strip highlights the column where the final letters need to align.

Horizontal movement should feel fluid and forgiving. Snapping should make the intended alignment clear without requiring pixel-perfect positioning.

### Vertical movement

Players can rearrange the order of the completed words by dragging a dedicated handle on the left side of each row.

- The handle is separate from the word itself.
- Dragging the handle moves the row vertically.
- Rows rearrange as the dragged row passes other rows, like reordering items in a typical mobile application.
- The word itself should remain available for horizontal dragging, so the two interactions do not conflict.

The handle must be visually distinct and easy to grab on both desktop and touchscreens.

### Winning the level

The player wins when the letters in the highlighted vertical column form the intended final word in the correct order.

If the alignment is incorrect, the player can continue moving the words until they discover the solution.

The game should clearly communicate the successful reveal and provide a satisfying completion moment before allowing the player to continue.

### Generating valid puzzles

The final arrangement must be mathematically valid. The intended vertical word should determine the necessary horizontal offsets and row ordering.

The initial arrangement can then be shuffled from that known solution.

Do not create a collection of horizontal words and assume that a suitable vertical word will emerge by chance. Every level must have a verified solution, and the level data should explicitly describe the intended arrangement.

The central column and the letters that appear in it must be consistent with the final answer.

## 5. Difficulty and Level Design

The game should be relaxing, with no timer in the standard experience. Difficulty should come from deduction and spatial reasoning rather than speed.

Potential ways to increase difficulty include:

- Longer words.
- More horizontal rows.
- Fewer starting-letter clues.
- More repeated letters.
- Less obvious thematic connections.
- More complex vertical alignment arrangements.
- Additional letters that act as red herrings.

Levels should introduce the mechanics gradually and then combine them in more demanding ways.

The theme is an important part of the puzzle. Words should be familiar enough that players can reason about them, but not so obvious that the horizontal phase becomes trivial.

Level authors should consider how the horizontal words and vertical answer work together, rather than designing them independently.

## 6. Red Herrings — Future Possibility

One potential difficulty mechanic is to introduce extra letters that do not belong to any of the intended horizontal answers.

These red herrings would make the pool harder to interpret and could mislead players who assume every available letter must be used.

This could be especially suitable for HARD levels.

Possible considerations:

- Extra letters could be selected randomly from a predefined set.
- They must not make the intended solution ambiguous or impossible.
- The game should still have a verifiable intended solution.
- Players should be able to recognise that a puzzle may contain unused letters.

This is a thought experiment, not a requirement for the initial design. The immediate focus should remain on the core mechanics without red herrings.

## 7. Hints and Power-Ups

Optional hints are part of the intended game design, but the exact hint system is not finalised.

Potential hint types include:

- Reveal a letter in an unsolved horizontal word.
- Reveal an intended horizontal answer.
- Help with the final vertical alignment.

Hints should assist players without removing the satisfaction of solving the puzzle themselves.

A possible approach is to use hints without preventing level completion, while recording whether assistance was used. However, the game is not timed, and there is no agreed scoring system or star-rating system.

Power-ups are another possible future addition. They should be designed after the core prototype has demonstrated that the basic puzzle is enjoyable. Avoid inventing a full power-up economy or complicated abilities at this stage.

## 8. Progression and Meta-Game

The current preference is for lightweight progression through themed chapters, with levels unlocked sequentially.

Potential chapter themes include:

- Animals.
- Food.
- Nature.
- Space.
- Pop culture.

These are examples rather than a final chapter list. Themes should be selected based on the availability of suitable words and vertical answers.

### No star-rating system

A star-rating system was considered but is currently rejected.

The reason is that the game is untimed and has fixed answers. Once a player knows the solution, replaying the same puzzle more quickly does not represent meaningful improvement. A speed-based score would not suit the intended relaxing experience.

For now:

- Completing a level is the achievement.
- The player must complete the current puzzle to unlock the next level.
- Progress can be represented by completed levels or chapters.
- There is no agreed scoring or points economy.

A points system may be considered later if points serve a meaningful purpose, such as unlocking content or tracking a broader achievement. Points should not be added simply for the sake of having a score.

Likewise, stars, collectibles, daily challenges and elaborate meta-game systems are not currently required.

The game should first prove that its core puzzle loop is engaging.

## 9. User Experience and Presentation

The intended experience is calm, clear and satisfying.

Important principles:

- No timer in the standard game.
- No pressure to solve words in a particular order.
- Free experimentation with incomplete words.
- Reversible letter placements.
- Clear visual feedback when a word locks.
- A stable letter-pool layout.
- Obvious distinction between horizontal word dragging and vertical row reordering.
- A clearly highlighted target column during the final phase.
- Smooth snapping and row-reordering interactions.
- A satisfying reveal when the final vertical word is found.
- Support for mouse and touchscreen interaction.

The game should feel approachable to casual players while offering enough depth to challenge experienced puzzle fans.

## 10. Current Decisions vs Open Questions

### Current design decisions

- Working title: Words Slide / Word Slide.
- The game is a themed word puzzle with horizontal and vertical phases.
- Horizontal words share a common theme.
- Some starting letters may be revealed.
- Players freely drag letters into any empty grid cell.
- Letters placed in incomplete words are removed from the pool immediately.
- Individual letters can be returned to the pool.
- A Recall All button returns letters from incomplete words.
- Duplicate pool letters are combined into counted tiles such as x2 or x3.
- Zero-count letters may remain visible as grey, non-draggable x0 tiles.
- Only intended level answers are accepted.
- Correct horizontal words lock and consume their letters.
- Completed words slide horizontally as whole units.
- Horizontal dragging can begin from any part of the word.
- Words snap to valid positions when released.
- A dedicated left-side handle is used to reorder rows vertically.
- The final answer is revealed through a highlighted vertical column.
- The standard game is untimed and intended to be relaxing.
- Progression is level-based, with future themed chapters and sequential unlocks.
- There is no star-rating system in the current design.
- Power-ups and red herrings are deferred until the core mechanics have been tested.

### Open questions and future experiments

- Whether to show all 26 letters or only the letters relevant to the current puzzle.
- The exact hint types and whether hints are unlimited or limited.
- What, if anything, points should unlock or represent.
- The eventual chapter structure and number of levels.
- How difficulty should be communicated to players.
- Whether to introduce red herrings into harder levels.
- Which power-ups might add meaningful variety without overcomplicating the game.
- Whether a more substantial meta-game would improve retention.
- How the final vertical answer should be displayed and celebrated.
- How best to balance puzzle difficulty and thematic familiarity.

## 11. Design Philosophy

The central priority is to make the puzzle itself enjoyable.

The letter pool is not just a source of letters; it is a deduction tool that becomes clearer as the player experiments. The horizontal phase should reward logical thinking, and the vertical phase should transform the solved words into a second, spatial challenge.

Keep the experience relaxed, responsive and intuitive. Prefer mechanics that create interesting decisions over systems that merely add complexity.

The game should be developed iteratively, with the design remaining open to change when actual playtesting reveals what works.

For now, treat this document as background context for discussion and design. Do not begin implementation or assume that deferred ideas are part of the initial playable version unless explicitly requested.
