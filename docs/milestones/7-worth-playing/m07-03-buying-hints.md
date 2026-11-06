# M07-03: Hints, part 2: buying them (was story 27)

**Status:** 🟨 Drafted on 2026-11-06, waiting for the designer.

*As a player who's stuck, I want to buy a hint with coins I've earned, so that getting help is my choice and has a cost I can see.*

From the designer on 2026-11-04, and shaped by the economy discussion of 2026-11-05 ([D51](../../decisions.md)). [M07-01](m07-01-hints.md) made the hints and [M07-02](m07-02-currency-and-ads.md) the coins and the ad button. Until now hints are free and unlimited (M07-01): this story gives them prices.

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

**Settings (D52).** Rules name a setting in *italics*, never its value. Each example sets the values it uses. The values shipped today are in [D51](../../decisions.md): Letter 30, Reveal 40, Ordering 40, with each further Letter or Reveal in a level adding about 50% of its base price, rounded to 10, up to 5× its base.

| Setting | What it is |
|---|---|
| *Letter price*, *Reveal price*, *Ordering price* | What the first use of each hint costs in a level |
| *price step* | How much of the base price each further use in the level adds (50%) |
| *price cap* | The most a hint can cost, as a multiple of its base price (5×) |

---

## Rules and examples

### 🟦 R1. Every hint costs coins

Using a hint takes its price from the player's coins (M07-02). Hints are no longer free (this replaces M07-01's "free and unlimited for now", D50).

- 🟩 With a *Letter price* of 30 and 100 coins, using the Letter hint leaves 70 coins and locks a letter

**Confirmed:** ☐

### 🟦 R2. Each hint's button shows its current price

Next to or under its icon, with a small coin (see Q2 for where). The price shown is what the next use costs.

- 🟩 With a *Letter price* of 30, at the start of a level the Letter hint's button shows a coin and "30"

**Confirmed:** ☐

### 🟦 R3. Within a level, the Letter and Reveal hints cost more each time

Each further use in the same level adds the *price step* of the hint's base price, up to the *price cap*. Each hint counts its own uses: buying Letters doesn't raise the Reveal's price. See Q1 for how the step is rounded.

- 🟩 With a *Letter price* of 30, a *price step* of 50% and a *price cap* of 5×, the Letter hint costs 30, then 50, 70, 90, 110, 130, then stays at 150 (if the step is rounded first, Q1)
- 🟩 After two Letter hints in a level, the Reveal hint still costs its *Reveal price*

**Confirmed:** ☐

### 🟦 R4. The Ordering hint has one price

It can only be used once per level (it removes the handles, M07-01 R5), so it never escalates.

- 🟩 With an *Ordering price* of 40, the Ordering hint costs 40 in every level

**Confirmed:** ☐

### 🟦 R5. Prices go back to their base on the next level

- 🟩 After three Letter hints in level 6, level 7's Letter hint costs the *Letter price* again

**Confirmed:** ☐

### 🟦 R6. Prices are saved with the level

Like the rest of the level (M05-01, R10), so closing and reopening mid-level doesn't reset the escalation.

- 🟩 After two Letter hints at 30 and 50, closing and reopening the level shows the Letter hint at 70

**Confirmed:** ☐

### 🟦 R7. Spending is saved straight away

As earning is (M07-02, R4): closing the game right after buying a hint never gives the coins back or loses the hint.

- 🟩 With 100 coins, buying a 30-coin Letter hint and closing straight away reopens with 70 coins and the letter locked

**Confirmed:** ☐

### 🟦 R8. The tutorials still have no hints

Unchanged from M07-01 (R10), so nothing in a tutorial costs coins.

- 🟩 Level 1's tutorial shows no hint buttons

**Confirmed:** ☐

---

## Questions

### 🟥 Q1. How is the price step rounded?

From the economy discussion, never settled: "each use adds about 50% of the base, rounded to 10".

- **A (recommended):** The step is rounded once, then added each time. Letter 30 + 20 each time: 30, 50, 70, 90, 110, 130, 150 (cap). Reveal 40 + 20: 40, 60, 80 … 200 (cap). Even steps, easy to predict.
- **B:** Each price is rounded. Letter: 30, 45 → 50, 60, 75 → 80, 90, 105 → 110, … 150. Closer to 50% each time, but uneven.

**Answer:**

### 🟥 Q2. Where's the price on the button?

- **A (recommended):** Under the icon, inside the button: a small coin and the number, like the ad button's "+50" and coin (M07-02, R12).
- **B:** On a small tag at the button's corner, like a pool tile's count (M02-02).

**Answer:**

### 🟥 Q3. Does buying a hint need confirming?

- **A (recommended):** No: tapping the button buys and uses the hint straight away. The price is on the button, and hints are cheap enough that a mistake costs little.
- **B:** The first tap shows "Buy for 30?" on the button, and a second tap within a few seconds buys it.
- **C:** A small popup asks to confirm, with the price, Buy and Cancel.

**Answer:**

### 🟥 Q4. What happens when the player can't afford a hint?

- **A (recommended):** The button shows greyed out, with its price. Tapping it makes the ad button pulse, if an ad can play (M07-02, R7), so the player sees where coins come from. Nothing is bought.
- **B:** Tapping it opens a small popup: "Not enough coins", with "Watch an ad for +50" (when an ad can play) and Close.
- **C:** The button looks normal, and tapping it gives a gentle shake of the coin counter. Nothing else.

**Answer:**

### 🟥 Q5. How does spending show?

Earning has coins flying to the counter (M07-02, R15).

- **A (recommended):** A few coins fly from the counter to the hint's button, and the counter counts down as they leave. The hint plays once they arrive.
- **B:** The counter just counts down, and the hint plays straight away.

**Answer:**

### 🟥 Q6. Does a hint with nothing to do still cost?

M07-01 already hides or disables a hint with nothing to do (no open cell for the Letter hint, no reorderable rows for Ordering).

- **A (recommended):** It can't be bought then: the button stays as M07-01 has it, and its price isn't taken.
- **B:** Something else: write it in the answer.

**Answer:**

---

## Answered questions

None yet.
