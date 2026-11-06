# M07-03: Hints, part 2: buying them (was story 27)

**Status:** 🟨 Drafted on 2026-11-06. The designer answered Q1 to Q6 on 2026-11-06; their answers raise Q7 to Q10.

*As a player who's stuck, I want to buy a hint with coins I've earned, so that getting help is my choice and has a cost I can see.*

From the designer on 2026-11-04, and shaped by the economy discussion of 2026-11-05 ([D51](../../decisions.md)). [M07-01](m07-01-hints.md) made the hints and [M07-02](m07-02-currency-and-ads.md) the coins and the ad button. Until now hints are free and unlimited (M07-01): this story gives them prices.

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

**Settings (D52).** Rules name a setting in *italics*, never its value. Each example sets the values it uses. The values shipped today are in [D51](../../decisions.md).

| Setting | What it is |
|---|---|
| *Letter price*, *Reveal price*, *Ordering price* | What the first use of each hint costs in a level |
| *price step* | How much each further use costs more than the one before, as a share of it (50%) |
| *price cap* | The most a hint can cost, as a multiple of its first price (5×) |

---

## Rules and examples

### 🟦 R1. Every hint costs coins, and tapping its button buys it

Using a hint takes its price from the player's coins (M07-02). Tapping the button buys and uses it straight away, with no confirming (Q3). Hints are no longer free (this replaces M07-01's "free and unlimited for now", D50).

- 🟩 With a *Letter price* of 30 and 100 coins, tapping the Letter hint leaves 70 coins and locks a letter

**Confirmed:** ☐

### 🟦 R2. Each hint's button shows its current price

Under its icon, inside the button: a small coin and the number, like the ad button (Q2). The price shown is what the next use costs.

- 🟩 With a *Letter price* of 30, at the start of a level the Letter hint's button shows a coin and "30" under its icon

**Confirmed:** ☐

### 🟦 R3. Within a level, the Letter and Reveal hints cost more each time

*From Q1.* Each further use in the same level costs the *price step* more than the last price, rounded to the nearest 10 (5 rounds up), up to the *price cap*. Each hint counts its own uses: buying Letters doesn't raise the Reveal's price.

- 🟩 With a *Letter price* of 30, a *price step* of 50% and a *price cap* of 5×: 30, then 50 (45 rounded), 80 (75 rounded), 120, then 150 (180, capped), and 150 from then on
- 🟩 With a *Reveal price* of 40 and the same step and cap: 40, 60, 90, 140 (135 rounded), then 200 (210, capped)
- 🟩 After two Letter hints in a level, the Reveal hint still costs its *Reveal price*

**Confirmed:** ☐

### 🟦 R4. The Ordering hint has one price

It can only be used once per level (it removes the handles, M07-01 R5), so it never escalates.

- 🟩 With an *Ordering price* of 40, the Ordering hint costs 40 in every level

**Confirmed:** ☐

### 🟦 R5. Prices go back to their first price on the next level

- 🟩 After three Letter hints in level 6, level 7's Letter hint costs the *Letter price* again

**Confirmed:** ☐

### 🟦 R6. Prices are saved with the level

Like the rest of the level (M05-01, R10), so closing and reopening mid-level doesn't reset the escalation.

- 🟩 With a *Letter price* of 30, after two Letter hints (30, then 50), closing and reopening the level shows the Letter hint at 80

**Confirmed:** ☐

### 🟦 R7. Buying a hint is saved as one change: the coins and what the hint did

*From the designer's note.* The coins spent and the hint's effect are saved together, never one without the other. Closing the game straight after never gives the coins back, and never loses the hint.

- 🟩 With 100 coins, buying a 30-coin Letter hint and closing straight away reopens with 70 coins and the letter locked
- 🟩 Reopening never shows 70 coins without the letter, or 100 coins with it

**Confirmed:** ☐

### 🟦 R8. No hints in the tutorials, including the whole reordering tutorial

*From the designer's note.* Level 1's tutorial has no hint buttons (M07-01, R10). In the level that teaches reordering (M05-04), phase two has no hint buttons at all: not during the tutorial's move, and not after it either. (Until now they appeared once the move was made.) So nothing in a tutorial costs coins. See Q10 for the note's second part.

- 🟩 Level 1's tutorial shows no hint buttons
- 🟩 In the reordering tutorial, after the player makes the shown move, there are still no hint buttons

**Confirmed:** ☐

### 🟦 R9. A hint the player can't afford opens "Not enough coins"

*From Q4.* Its button looks as usual, with its price. Tapping it buys nothing, and opens a small popup: "Not enough coins", with "Watch an ad for +[*ad reward*]" and Close. That ad button behaves like the one in the top bar (M07-02, R12 and R13): it plays a rewarded ad, and while the *rewarded ad wait* runs it shows the countdown, greyed out. See Q7 for when no ad can play at all.

- 🟩 With 20 coins and a *Letter price* of 30, tapping the Letter hint opens "Not enough coins", and the coins stay at 20
- 🟩 With an *ad reward* of 50, the popup's button reads "Watch an ad for +50"; watching it to the end gives 50 coins, so the player has 70
- 🟩 With a *rewarded ad wait* of 3 minutes, 30 seconds after an ad, the popup's ad button shows "2:30", greyed out

**Confirmed:** ☐

### 🟦 R10. Spending counts the coins down, with a sound

*From Q5.* The counter counts down to the new balance, and the hint plays straight away. A spending sound plays too, once there's sound (M07-07): until then, this story builds it silent.

- 🟩 With 100 coins, buying a 30-coin hint counts the counter down from 100 to 70, as the hint plays

**Confirmed:** ☐

---

## Questions

Raised by the answers to Q1 to Q6.

### 🟥 Q7. What does "Not enough coins" show when no ad can play at all?

When an ad is only waiting (the countdown), the popup shows the timer (R9). With no ads at all (an ad blocker, CrazyGames' Basic Launch, M07-02 R7), there's no ad to offer.

- **A (recommended):** The popup shows "Not enough coins" and a line on how to earn them ("Finish a series or find bonus words to earn coins"), with Close. No ad button.
- **B:** The popup shows "Not enough coins" and Close only.

**Answer:**

### 🟥 Q8. When the Letter hint picks a cell, can it pick one that's already right?

*Your Q6 asked when a hint does nothing.* Today the Letter hint picks any cell of the selected row that isn't revealed or locked, including one where the player has already placed the right letter. Then it only locks that letter in place: the player pays for nothing new.

- **A (recommended):** It only picks cells that don't hold their right letter yet. When every open cell is already right, the row is complete and locks anyway, so this never leaves the hint with nothing to pick.
- **B:** Keep it as it is: any open cell.

**Answer:**

### 🟥 Q9. What about the Ordering hint when the rows are already in a solving order?

*Also from Q6.* Today the Ordering hint is offered whenever the level has handles. If the rows are already in an order that solves the level, using it only removes the handles: the player pays for nothing new.

- **A (recommended):** It shows disabled then, and can't be bought, until the rows are moved out of a solving order again.
- **B:** It stays available, and buying it fixes the order (no more handles), which helps a player who isn't sure the order is right.

**Answer:**

### 🟥 Q10. In the reordering tutorial, what does "only rearrange the rows in a way that the puzzle can be solved" mean?

From your note on R8. Today the tutorial allows only its one shown move, which leads to a solving order. Afterwards the handles stay free, so a player can move the rows anywhere, and always move them back.

- **A (recommended):** After the tutorial's move, the rows can still be moved freely: any order can be put right again, so the puzzle stays solvable. Nothing changes.
- **B:** After the tutorial's move, a row can only go where the level can still be solved (a move that leaves no solving order is refused, and the row goes back).
- **C:** After the tutorial's move, the handles go: the rows stay in the solving order, and only sliding is left.

**Answer:**

---

## Answered questions

### Q1. How is the price step rounded?

**Answer:** It should add 50% each time: 30, 45 → 50, 75 → 80, 120, 180 → 150 (capped).

→ R3: each price is 50% more than the last one, rounded to 10. *price step* now means a share of the last price, not of the first.

### Q2. Where's the price on the button?

**Answer:** Left empty, so the recommendation: under the icon, inside the button, a small coin and the number. → R2.

### Q3. Does buying a hint need confirming?

**Answer:** Left empty, so the recommendation: no, tapping buys and uses it straight away. → R1.

### Q4. What happens when the player can't afford a hint?

**Answer:** The button looks normal, and tapping it opens a small popup: "Not enough coins", with "Watch an ad for +50" (when an ad can play) and Close. If no ad can play it'll show the timer on the watch ad button.

→ R9, with the *ad reward* in place of 50 (D52). Q7 asks about having no ads at all.

### Q5. How does spending show?

**Answer:** B, with a sound effect.

→ R10. The sound waits for M07-07.

### Q6. Does a hint with nothing to do still cost?

**Answer:** Please clarify the possible scenarios in which a hint would do nothing.

→ Here they are, from the game as built:

- **Letter hint:** it's disabled only while a letter is being dragged. Otherwise it always has a cell to lock, but it can pick a cell that already holds the right letter, which helps nothing (Q8).
- **Ordering hint:** offered whenever the level has handles. If the rows are already in a solving order, it only removes the handles (Q9).
- **Reveal hint:** offered only when the rows can't be reordered, and it only picks words that aren't right yet, so it always helps. Once every word is right, the level is won and the hints are gone.
- **No buttons at all:** during the phase-two ceremony, after the win, and in the tutorials (R8).

So a hint never costs while it's disabled: the questions are whether to disable it in Q8's and Q9's cases.
