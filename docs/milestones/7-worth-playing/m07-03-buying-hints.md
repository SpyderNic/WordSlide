# M07-03: Hints, part 2: buying them (was story 27)

**Status:** ✅ Approved by the designer on 2026-11-06. Scenarios: [m07-03-buying-hints.feature](../../../features/7-worth-playing/m07-03-buying-hints.feature), waiting for approval.

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

**Confirmed:** ☑

### 🟦 R2. Each hint's button shows its current price

Under its icon, inside the button: a small coin and the number, like the ad button (Q2). The price shown is what the next use costs.

- 🟩 With a *Letter price* of 30, at the start of a level the Letter hint's button shows a coin and "30" under its icon

**Confirmed:** ☑

### 🟦 R3. Within a level, the Letter and Reveal hints cost more each time

*From Q1.* Each further use in the same level costs the *price step* more than the last price, rounded to the nearest 10 (5 rounds up), up to the *price cap*. Each hint counts its own uses: buying Letters doesn't raise the Reveal's price.

- 🟩 With a *Letter price* of 30, a *price step* of 50% and a *price cap* of 5×: 30, then 50 (45 rounded), 80 (75 rounded), 120, then 150 (180, capped), and 150 from then on
- 🟩 With a *Reveal price* of 40 and the same step and cap: 40, 60, 90, 140 (135 rounded), then 200 (210, capped)
- 🟩 After two Letter hints in a level, the Reveal hint still costs its *Reveal price*

**Confirmed:** ☑

### 🟦 R4. The Ordering hint has one price

It can only be used once per level (it removes the handles, M07-01 R5), so it never escalates.

- 🟩 With an *Ordering price* of 40, the Ordering hint costs 40 in every level

**Confirmed:** ☑

### 🟦 R5. Prices go back to their first price on the next level

- 🟩 After three Letter hints in level 6, level 7's Letter hint costs the *Letter price* again

**Confirmed:** ☑

### 🟦 R6. Prices are saved with the level

Like the rest of the level (M05-01, R10), so closing and reopening mid-level doesn't reset the escalation.

- 🟩 With a *Letter price* of 30, after two Letter hints (30, then 50), closing and reopening the level shows the Letter hint at 80

**Confirmed:** ☑

### 🟦 R7. Buying a hint is saved as one change: the coins and what the hint did

*From the designer's note.* The coins spent and the hint's effect are saved together, never one without the other. Closing the game straight after never gives the coins back, and never loses the hint.

- 🟩 With 100 coins, buying a 30-coin Letter hint and closing straight away reopens with 70 coins and the letter locked
- 🟩 Reopening never shows 70 coins without the letter, or 100 coins with it

**Confirmed:** ☑

### 🟦 R8. No hints in the tutorials, including the whole reordering tutorial

*From the designer's note.* Level 1's tutorial has no hint buttons (M07-01, R10). In the level that teaches reordering (M05-04), phase two has no hint buttons at all: not during the tutorial's move, and not after it either. (Until now they appeared once the move was made.) So nothing in a tutorial costs coins. The note's second part is R13.

- 🟩 Level 1's tutorial shows no hint buttons
- 🟩 In the reordering tutorial, after the player makes the shown move, there are still no hint buttons

**Confirmed:** ☑

### 🟦 R9. A hint the player can't afford opens "Not enough coins"

*From Q4.* Its button looks as usual, with its price. Tapping it buys nothing, and opens a small popup: "Not enough coins", with "Watch an ad for +[*ad reward*]" and Close. That ad button behaves like the one in the top bar (M07-02, R12 and R13): it plays a rewarded ad, and while the *rewarded ad wait* runs it shows the countdown, greyed out. *From Q7:* when no ad can play at all, the popup has no ad button: it says how to earn coins instead, and that an ad may be available later: "Finish a series or find bonus words to earn coins, or try watching an ad later."

- 🟩 With 20 coins and a *Letter price* of 30, tapping the Letter hint opens "Not enough coins", and the coins stay at 20
- 🟩 With an *ad reward* of 50, the popup's button reads "Watch an ad for +50"; watching it to the end gives 50 coins, so the player has 70
- 🟩 With a *rewarded ad wait* of 3 minutes, 30 seconds after an ad, the popup's ad button shows "2:30", greyed out
- 🟩 With no ad able to play, the popup says how to earn coins and to try an ad later, with Close and no ad button

**Confirmed:** ☑

### 🟦 R10. Spending counts the coins down, with a sound

*From Q5.* The counter counts down to the new balance, and the hint plays straight away. A spending sound plays too, once there's sound (M07-07): until then, this story builds it silent.

- 🟩 With 100 coins, buying a 30-coin hint counts the counter down from 100 to 70, as the hint plays

**Confirmed:** ☑

### 🟦 R11. The Letter hint can confirm a letter that's already right

*From Q8.* It picks any cell of the selected row that isn't revealed or locked, as now (M07-01, R3), including one where the player already placed the right letter. That's still worth something: it confirms the letter is right.

- 🟩 With L E M U _ in LEMUR's row and a *Letter price* of 30, a Letter hint on the first cell locks the L there, and costs 30

**Confirmed:** ☑

### 🟦 R12. The Ordering hint stays available when the rows are already in order

*From Q9.* Disabling it would tell the player for free that the order is right. Buying it then fixes the order and removes the handles, as usual (M07-01, R5), which confirms the player is on the right track.

- 🟩 With the rows already in a solving order, the Ordering hint can still be bought, and buying it removes the handles and leaves the rows where they are

**Confirmed:** ☑

### 🟦 R13. In the reordering tutorial, the handles go once the tutorial's moves are made

*From Q10, and the designer's note on R8.* Once the player has made the move (or moves) the tutorial shows (M05-04), the rows are in a solving order: the handles fade away, as after the Ordering hint, and only sliding is left. So the player can't move the rows out of a solvable order with no hints to help. Later levels have handles as usual.

- 🟩 In the reordering tutorial, after the shown move, there are no handles, and the rows stay in that order
- 🟩 In the next level that has handles, they're there as usual

**Confirmed:** ☑

---

## Questions

None left.

---

## Answered questions

### Q7. What does "Not enough coins" show when no ad can play at all?

**Answer:** A, but also say they can wait to watch an ad. → R9.

### Q8. When the Letter hint picks a cell, can it pick one that's already right?

**Answer:** B, because it does something: it confirms that letter as being correct. → R11.

### Q9. What about the Ordering hint when the rows are already in a solving order?

**Answer:** B, otherwise the player would know for free the order of the rows by seeing if the hint is available or not. Again, the hint does confirm the rows ordering, so the player knows they're on the right track. → R12.

### Q10. In the reordering tutorial, what does "only rearrange the rows in a way that the puzzle can be solved" mean?

**Answer:** C. → R13.

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
