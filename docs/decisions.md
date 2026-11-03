# Word Slide — Decisions Log

Decisions made by the designer. They take precedence over [design-context.md](design-context.md).
Anything not recorded here or in an agreed example map is **not decided**: ask, don't assume.

## How we work

| Topic | Decision |
|---|---|
| Requirements | Defined story by story in **Example Mapping** sessions. Each story has its own file, `docs/example-maps/story-NN-<name>.md`, colour-coded 🟦 rules, 🟩 examples, 🟥 questions. |
| Acceptance | **BDD**: Claude drafts Gherkin `.feature` files (Given/When/Then) from each map. The designer approves them before implementation starts. A story is done when its scenarios pass. |
| Plan discipline | Build exactly what was agreed. Anything unclear or unspecified goes back to the designer as a question with options. Nothing gets added quietly. |
| Tests | Most scenarios run against pure TypeScript game logic, kept separate from Phaser. Playwright browser tests cover screens, controls and the main path through the game. |
| Source control | One git repository per game: [SpyderNic/WordSlide](https://github.com/SpyderNic/WordSlide). |
| Stack | Phaser 3 + Vite + TypeScript, published on CrazyGames as HTML5 (Vite `base: './'`). |

## Game decisions (2026-10-29)

### D1. Name
The game is called **Word Slide**.

### D2. Orientation: landscape
The designer preferred portrait but asked for landscape unless evidence favoured portrait, and none was found. CrazyGames requires desktop play in landscape, its key iframe sizes (mobile included) are 16:9, and the supported mobile orientation is set on the submission form, with the site prompting players to rotate.

### D3. Pool layout: only the level's characters
*Changed 2026-10-31.* The pool shows only the level's characters. The all-letters layout and the debug switch are removed, because they created friction with accents and digits.

### D4. Winning rule
The level is won when the highlighted column spells the final word, by **any** arrangement of the rows, not only the designed one.

### D5. Phase-one layout (fixed, not random)
- Rows are ordered by **ascending word length**, ties broken **alphabetically** (length and sort order as in D12 and D21).
  Example: ZEBRA, LEMUR, KANGAROO → LEMUR, ZEBRA, KANGAROO.
- Each row is **centred**, by its cells, on the screen's vertical centre line:
  - odd length: the middle tile's centre sits on the line (ZEBRA: the middle of B);
  - even length: the line falls between the two middle tiles (KANGAROO: between G and A).

```
        L  E |M| U  R
        Z  E |B| R  A
     K  A  N  G | A  R  O  O
```

### D6. Phase-two reveal
- The highlighted column and the vertical-drag handles are **hidden** during phase one and appear only in phase two.
- Entering phase two plays a "ceremony": the words rearrange from centred to left-aligned and the column appears.
- "Left-aligned" means each word's first letter is in the column, and the column is centred on the screen (D19).
- The ceremony's details are deferred to its own mapping session.

### D7. Already-solved start = instant win (for now)
If the layout at the start of phase two already spells the final word, the player wins immediately. This covers:
- the fixed starting layout happening to spell the final word;
- same-length words locked in a different order than the level defines.

It's accepted as an easy out for the few affected levels and may be revisited. How the instant win looks is for the win story's mapping session.

### D8. Which row a word can lock in
**Rule:** a filled row locks if its word is one of the level's not-yet-locked answers, has the row's length, and matches every revealed (hinted) letter in that row.

| Answers | Revealed letters in the row | Word typed | Result |
|---|---|---|---|
| ZEBRA, LEMUR | none | ZEBRA in the row designed for LEMUR | Locks |
| TREE, TART | first letter T | TREE or TART | Either locks |
| TREE, PALM | first letter T | PALM | Doesn't fit. Only TREE can lock there |
| TREE, TART | A (TART's second letter) | TREE | Doesn't fit. Only TART can lock there |

### D9. Word found outside its hinted row
When a word locks in a row other than the one its hinted letters reserved for it:
- the word locks where the player built it, with the player's own letters;
- **all** hinted letters in the row that reserved it go back to the pool.

In general: after each lock, if none of the answers still unlocked fits a row's revealed letters, all its hinted letters go to the pool, and its placed letters stay.

Example: answers TART and TREE, with R revealed in row 1 (`_ _ R _`, where only TART fits). The player builds TART in row 2 → TART locks in row 2. The revealed R leaves row 1 for the pool. Row 1 is now empty and the pool holds T, R, E, E: exactly TREE.

Rejected alternatives: moving the hinted letter into the accepted word; sending the player's own letter back to the pool.

### D10. Already-found word
*Changed 2026-10-31.* Spelling an answer that's already locked in another row shows **"already found"** feedback, and the letters stay in place. The locked row highlights briefly, and "Already found" appears on a background in the centre of the screen, gently rises and fades out.

This needs answers that share all their letters, such as TEAM and MEAT, because a pool only has enough letters for each answer once.

## Game decisions (2026-10-30)

From the mapping of [story 1](example-maps/story-01-level-data-and-validator.md).

### D11. Level authoring
Claude drafts the levels and the designer approves them. For the prototype only, the designer plays them blind, so Claude approves them instead (D46).

### D12. Level size
*Changed 2026-10-31.* A level has 2–5 rows, and answers have a length of 2–8. Length counts letters and digits, not special characters: ICE CREAM has a length of 8 and needs 9 cells on screen. Level 1 is the tutorial. Easy, medium and hard levels will later have their own limits on rows and word length, and extra letters in the pool, with a sawtooth escalation per category in mind.

### D13. There is no grid width
The "grid" is just all the cells of the horizontal words in phase one. In phase two, a word slides only within the column's reach, from its first letter to its last, and only a letter can stop in the column: with L in the column, LEMUR can slide 4 cells left and no further.

### D14. Where letters can be dropped
*Changed 2026-10-31.* Letters can be dropped in empty cells and on placed letters. A pool letter replaces a placed letter, which goes back to the pool. A placed letter swaps with the other placed letter, so both stay on the board. Dropping on a fixed cell (a revealed letter, a special character or a locked word's letter) sends the letter to the pool.

### D15. No written solution arrangement
Levels don't include a solution arrangement. The validator works one out and proves it exists. This replaces the design document's request for an explicit arrangement.

### D16. No repeated answers
A level can't contain the same answer twice.

### D17. Already-solved levels get a warning
The validator warns about a level whose starting layout already spells the final word, but allows it (see D7).

### D18. Special characters in answers
Answers may contain special characters: anything that isn't a letter (accented letters included) or digit (0–9), such as spaces, hyphens, apostrophes and other punctuation. They can be anywhere in an answer. They're always revealed, never appear in the pool, and never go back to it. This is an exception to D9: the hinted letters leave the row, but its special characters stay.

A revealed special character ties a row to the answers that have one at that position (D8). It doesn't complete the word.

### D19. Column position
The column is centred on the screen. Phase two starts with every word's first letter in the column.

### D20. Words may go off screen in phase two
Only phase one needs all of a word's cells on screen.

### D21. Digits and sort order
Digits behave like letters: they're in the pool, are dragged the same way and count towards length. Alphabetical order, in the pool and between words, is: special characters, then letters, then 0 to 9. T-REX sorts before TREE, and TREE sorts before TRE1.

Accented letters are letters. They come right after their base letter: E, É, F. É and E are different letters: É has its own pool tile, and an E can't stand in for it.

Fine detail: standard character-code order among special characters, and among accented versions of the same letter.

### D22. Final word characters
The final word contains letters and digits only, never special characters.

## Game decisions (2026-10-31)

### D23. Points instead of stars
There are no stars. The player gets 1 point per level completed. This replaces the design document's "no agreed scoring".

From here on, decisions come from the mapping of [story 2](example-maps/story-02-show-a-level.md).

### D24. Letters with no copies left
A letter with no copies left to place stays in the pool as a grey x0 tile, including from the start of a level.

### D25. Revealed letters look different
Revealed letters use a different tile colour from letters the player places.

### D26. Tile size
*Changed 2026-10-31.* On a given screen, tiles are the same size in every level. They're sized for 9 cells across, and only a level with a longer row that wouldn't fit shrinks them. The pool uses more rows on narrow screens. On a portrait screen, the top of the screen has two lines, with the theme on the second.

### D27. The prototype's look
*Changed 2026-10-31, detailed 2026-11-02.* The prototype has a clean, simple look: warm wood and brass, like a cryptex, drawn in code, with gold for the win and a rounded open-licence font: the "honey oak" palette, Nunito, and tiles with a soft bevel, lighter at the top and left and darker at the bottom and right. Words slide under the column's brass sides. A letter going back to the pool adds to its count when it lands. Letters fly between the pool and the cells in about 0.15 seconds, and several letters going back leave one after another, 0.03 seconds apart. The full art style waits until the game proves fun, and will probably use an asset pack, or an artist or AI image tool. The game is built so that several styles can exist, though the prototype has one.

### D28. Layouts leave room for portrait
Landscape stays the orientation for the CrazyGames launch (D2), but layouts must be able to support portrait later, for a possible Google Play release. Positions and sizes come from the screen size, not fixed coordinates.

### D29. Rotating a device
When a device rotates during a level, the layout adapts live. The level redraws for the new orientation and keeps the player's progress. A drag in progress is cancelled and its letter goes back to where it came from.

### D30. Top of the screen
Along the top, left to right: home, level number, theme, points, shop, settings. The home, shop and settings buttons are visible but do nothing for now. The shop button is provisional.

### D31. Working towards a prototype
The current goal is a working prototype, not a release. If the layout works and the game is fun, stories for a path to release get added then.

### D32. The game may become multi-platform
The game might later release on web (CrazyGames, Poki, YouTube Playables), Android (Google Play) and PC (Steam). The architecture is Claude's responsibility: game code must never call a platform's SDK directly. Saving, ads, purchases, player identity and similar services go through one interface, with one implementation per platform, chosen at build time. The prototype only has a simple local implementation, and no platform SDK is added until a story asks for it.

### D33. Placed letters can move
A placed letter can be dragged directly to another empty cell, and the pool doesn't change. During a drag, the tile's centre stays on the pointer or finger. The cell under the tile's centre is highlighted and is where the letter lands. If that's a fixed cell, nothing highlights and the letter goes to the pool.

A letter that doesn't land on an empty cell or a placed letter goes to the pool, whether it came from the pool or a cell. A placed letter over the pool highlights its own tile.

### D34. Sound
*Changed 2026-10-31.* Sound is parked for the prototype, which has no sound.

### D35. Pool as a keyboard
A second way to place letters, alongside dragging. Tapping a row selects it, then tapping a pool letter or pressing its key sends the letter to that row's first empty cell. No row is selected when a level opens, and the first input selects the top row. When an input fills a row, the selection moves to the next row with an empty cell, wrapping to the top. Backspace and the Up and Down arrows also work. The full rules are in [story 17](example-maps/story-17-pool-as-a-keyboard.md).

### D36. Recall All
Recall All sends every placed letter back to the pool at once, with no confirmation. It's an icon of two arrows pointing down, beside the pool on its right. It's grey with nothing to recall. It has no keyboard shortcut in the prototype.

### D37. Checking a word
A row is checked as soon as it's full, with no button. A wrong word's row shakes a little, its letters stay in place, and there's no limit on tries. A word that locks pulses, then all its tiles take a new colour: each tile grows 15% from its centre in 0.15 seconds, takes the new colour at its biggest, and shrinks back in 0.2 seconds. In a split word (D48), only the parts that didn't lock shake, and special characters stay still. Moving on, say by typing the next letter, never cuts a pulse or a shake short.

### D38. The phase-two ceremony
Details of D6. The ceremony starts after the last word's lock feedback, takes about 1 second and ignores input. The words slide, the rows move to the vertical centre of the space, and the pool and column fade together. The handles appear last. The column is a strip one cell wide and as tall as the rows, with a down-arrow notch at the top and an up-arrow notch at the bottom. The handles sit in a fixed line at the left edge of the screen. An instant win (D7) comes after the ceremony.

### D39. Sliding words
A word follows the pointer smoothly, then snaps to its nearest letter with a 0.1 second bounce-out tween. Past the end of its range it stretches slightly and springs back. A fast flick glides on and eases to a stop on a letter over 0.25 seconds, with no bounce. Letters in the column look ordinary until the right word is found.

On a keyboard, Up and Down select a row and wrap around. Left and Right slide it one letter at a time and don't wrap. With no row selected, Left or Right selects the top row. A drag hides the selection until the next arrow.

### D40. Reordering rows
A row's handle shows three short horizontal lines and is at least as large as a tile. Dragging it moves the row up or down, slightly raised, and the other rows slide out of the way in about 0.1 seconds. On release, the row snaps to the nearest slot with the same tween as a word (D39). Past the top or bottom, it stretches and springs back. Words keep their sideways position. On a keyboard, Shift+Up and Shift+Down move the selected row one slot and don't wrap around.

### D41. Winning a level
The column is checked each time a word or row settles, and reads top to bottom. When the word is found, its letters pulse and turn gold one after another, top to bottom, like a Mexican wave. Each pulses like a locking tile (D37), turning gold at its biggest. The other tiles and the handles fade away as the top letter turns gold. About 1.5 seconds later, a popup in the centre of the screen shows "Level complete", the golden word and a "Play Level X" button, which Enter or Space also presses. The gold word and column fade as the popup appears.

### D42. Levels and saving
Levels come in a fixed order, and winning one unlocks the next. The player's level, points and progress within a level are saved on their device after every change that settles, behind the D32 interface. The game always opens where the player left off. The new point shows at the top of the screen when the popup appears. After the last level, the prototype's popup shows "All levels complete!" with no button. Development builds have a level picker and a progress reset, in the address: `?level=N` opens level N as a peek that saves nothing, and `?reset` clears progress. The next level fades in over about 0.3 seconds.

### D43. Level 1 is a strict tutorial
Level 1 walks the player through placing letters and sliding a word, with fixed text and an animated hand. Reordering has its own tutorial, on the first level that needs it (story 21). The player can only do the current step, and Recall All doesn't appear. In steps 1 and 2, typing or tapping the step's letter works too (tapping in step 1 added 2026-11-03). The text sits above the rows and below the theme. Level 2 highlights the theme once, with a short tip. The tutorial is a level marked as such, themed Animals, and its steps come from its solution. A pointing hand, drawn in code, shows each step, and the theme gets a gently pulsing outline in level 2. The full rules are in [story 12](example-maps/story-12-first-level-onboarding.md).

### D44. Level generator
An offline tool suggests levels from a theme's word list, written by Claude and reviewed by the designer. It starts from a final word in the same theme, and every suggestion passes the validator and is reviewed in a Markdown file. Rows, word lengths, revealed letters and whether reordering is needed are settings. No letters are revealed by default for now, and any random letters are fixed when a level is generated. Within a theme, every word is unique across the curated levels, so a word can appear in different themes.

The game keeps full support for revealed letters (D8, D9), so they can come back.

### D45. Handles depend on the reordering tutorial
*Changed by story 21 on 2026-11-03.* Reordering is taught on the first level that needs it: one whose rows, in their starting order (D5), can't spell the final word by sliding. It's worked out from the levels, so it moves when the content changes, and level 1 never counts. Before it, phase two has no handles, rows can't be moved by any input, and the ceremony puts the rows in the designed order. From it on, every level has handles. Its tutorial is strict: after the ceremony, a hand shows the first move (the top-most row that isn't in its slot goes to it), only that move works, and then the player plays freely. The full rules are in [story 21](example-maps/story-21-reordering-taught-later.md).

### D46. Blind prototype levels
The designer wants to play the prototype as a new player, to judge difficulty. Claude writes the word lists and picks the levels, and never shows them. Only the tutorial level and the row counts are shared. After playing, the designer decides whether players need easing in more, and by the end curates the levels.

### D47. Prototype content
40 levels: Animals, Food, Space and Sports, with 10 each, and the tutorial (FOX, OWL, OX) as the first Animals level. Each theme follows the rows 2, 2, 3, 3, 3, 3, 4, 4, 4, 5, as far as its words allow: with no 2-letter final word, those levels use 3 rows, and with no 3-letter words either, Claude flags it and they use 4. From level 2, no letters are revealed. Levels 2 to 20 don't need reordering, so level 21 teaches it, and after that each theme's first level at each row count doesn't need it and the rest do (story 21, R6). A full-screen interstitial naming the new theme fades in and out when the theme changes.

### D48. A split word's parts lock on their own
*From playing milestone 5, on 2026-11-02.* A *part* is a run of letters between special characters, or between a special character and the end of the word: HOT DOG has the parts HOT and DOG, and T-REX has T and REX. Once all of a part's cells are filled, it locks if it matches the same part of any not-yet-locked answer that fits the row (D8), even a part of one letter. Only its tiles pulse and take the locked colour, and its letters become fixed, like a locked word's. When the last part completes the word, the parts that had already locked don't pulse again. A full row is still checked as a whole: it locks, or the wrong-word feedback plays, and any locked parts stay. If a row with locked parts can no longer fit any remaining answer, its locked letters go back to the pool, like hints (D9). A word with no special character inside it has one part, so it's unchanged.

### D49. The tutorial's hand is the designer's image
*2026-11-03.* The tutorial's pointing hand is `assets/Pointer.png`, the designer's pixel-art hand, in place of the one drawn in code (story 12, Q9). It's about a tile tall, drawn without smoothing, and its fingertip is where the hand points.
