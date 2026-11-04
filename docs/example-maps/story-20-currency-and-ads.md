# Story 20: Currency and ads

**Status:** ⏸ On hold since 2026-11-04: to be redrafted after the economy discussion. The designer's direction so far: the game is on CrazyGames only for now, so it earns through rewarded ads only, which pay best. Coins reward winning levels, so players have a reason to win (maybe a meta later, with no content treadmill). Open: whether an ad gives coins or a hint directly, hint bundles, and different hint types.

*As a player, I want to earn a currency by playing and spend it on hints, so that getting help is my choice and being clever pays off.*

Added to the backlog on 2026-11-02, and brought into the prototype on 2026-11-04 with hints (story 19). Bonus words earn it too (story 25).

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

---

## Rules and examples

### 🟦 R1. There's one currency

It's earned by playing and spent on hints (story 19). See Q1 for its name and look.

- 🟩 The player's balance shows at the top of the screen, and goes down when a hint is bought

**Confirmed:** ☐

### 🟦 R2. The player earns it in a few ways

See Q2 for which, and Q3 for how much.

- 🟩 Finding a bonus word adds some (story 25)

**Confirmed:** ☐

### 🟦 R3. The balance is saved with the player's progress

Through the platform interface (D32), like the rest of the progress (story 11). Spending and earning are saved straight away, so closing the game never loses or gives back currency.

- 🟩 Closing right after buying a hint, and opening again, shows the lower balance and the hint in place

**Confirmed:** ☐

### 🟦 R4. Rewarded ads go through the platform interface

Game code never calls an ad SDK (D32). The interface asks for a rewarded ad and says whether it was watched to the end. Only then is the reward given. While an ad plays, the game pauses and its input is ignored.

- 🟩 An ad closed early gives nothing
- 🟩 On a platform with no ads, the ad offer doesn't appear

**Confirmed:** ☐

### 🟦 R5. Ads are only ever the player's choice

No ad plays unless the player asks for one, for a reward they can see. Before building, Claude checks CrazyGames' current rules for rewarded ads (their SDK guidance) and reports anything that changes this map.

- 🟩 Pressing "Watch an ad for 2 coins" plays one. Nothing else starts an ad

**Confirmed:** ☐

### 🟦 R6. The prototype fakes ads in development

So the flow can be tested before the CrazyGames SDK is added (it's out of scope for the prototype), the local platform pretends to play an ad: a short screen that says so, with a button to finish or skip it. Release builds on CrazyGames use their SDK, behind the same interface.

- 🟩 In development, watching a pretend ad to the end gives the reward

**Confirmed:** ☐

---

## Questions

### 🟥 Q1. What's the currency called, and how does it look?

- **A (recommended):** Coins: a gold coin icon with a number. It's generic, so it can buy other things later, such as styles (later ideas).
- **B:** Lightbulbs: hints themselves, one lightbulb per hint. Simpler, but it can only ever buy hints.

**Answer:**

### 🟥 Q2. How does the player earn coins?

- **A (recommended):** Bonus words (story 25), winning a level, and rewarded ads.
- **B:** Bonus words and rewarded ads only, so winning gives points (D23) and coins stay special.

**Answer:**

### 🟥 Q3. How much does each give and cost?

A starting point, to tune after playing. The prices live in one place, so they're easy to change.

- **A (recommended):** The player starts with 3 coins. Winning a level gives 1, a bonus word 1, and a rewarded ad 3. A phase-one letter costs 1, a phase-two letter 2, and ordering the rows 3.
- **B:** Different numbers: write them in the answer.

**Answer:**

### 🟥 Q4. Where's the balance shown?

The top bar has home, level number, theme, points, shop and settings (D30).

- **A (recommended):** Next to the points, as a coin with a number. A coin earned flies to it, like a letter travelling to the pool (story 16).
- **B:** In place of the points, if points and coins become one thing.

**Answer:**

### 🟥 Q5. What does the shop button do?

It's visible but does nothing today (D30).

- **A (recommended):** Still nothing in the prototype. Earning by ad is offered where it's needed: from a hint the player can't afford (story 19, Q7).
- **B:** It opens a small panel with the balance and "Watch an ad for coins".

**Answer:**

### 🟥 Q6. Is there a limit on rewarded ads?

- **A (recommended):** No limit in the prototype. After playing, the designer can decide on one, such as a few an hour, along with CrazyGames' guidance.
- **B:** A limit now: write it in the answer.

**Answer:**

### 🟥 Q7. Do bonus words found before this story count?

Story 25, Q5 recommends saving the bonus words found, so they can be credited later.

- **A (recommended):** Yes. When coins first appear, each bonus word already found adds its coin, once.
- **B:** No. Coins start from the starting balance.

**Answer:**

---

## Answered questions

None yet.
