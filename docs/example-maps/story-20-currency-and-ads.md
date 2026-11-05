# Story 20: Coins and ads

**Status:** 🟨 Redrafted on 2026-11-05 from the economy discussion ([D51](../decisions.md)), waiting for the designer. On hold before that, since 2026-11-04.

*As a player, I want to earn coins by playing and by choosing to watch ads, so that getting help is my choice and finishing levels pays off.*

Added to the backlog on 2026-11-02, and brought into the prototype on 2026-11-04 with hints (story 19). Spending coins on hints is story 27, series rewards are story 28, and bonus words are story 25. This story makes the coins and the ads.

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

**Settings (D52).** Rules name a setting in *italics*, never its value. Each example sets the values it uses, so it stays true whatever the game ships with. The values shipped today are in [D51](../decisions.md):

| Setting | What it is |
|---|---|
| *starting coins* | What a new player starts with |
| *ad reward* | What a rewarded ad watched to the end gives |
| *bonus word reward* | What a bonus word gives (story 25) |
| *first midgame level* | The first completed level after which a midgame ad is asked for |
| *rewarded ad wait* | How long before the rewarded ad offer can be used again (Q4) |

---

## CrazyGames' ad rules, checked on 2026-11-05

From their [ad requirements](https://docs.crazygames.com/requirements/ads/), [video ads](https://docs.crazygames.com/sdk/video-ads/) and [midgame pacing](https://docs.crazygames.com/resources/midgame-ads-pacing/) pages:

- Only ads requested through their SDK are allowed.
- **Midgame ads:** the SDK decides whether one plays: at most one every 3 minutes, counting rewarded ads too. A request too soon is simply ignored, so the game asks at every natural break and needs no timer of its own.
- **Rewarded ads:** they mustn't be offered too often, and the player should see that, with a timer or by hiding the offer. One reward never needs more than one ad. The offer's close button is never hidden or delayed, and the player must have another way to get the reward, such as coins earned by playing.
- Between two levels, there's either a midgame ad or a "watch an ad to keep playing" offer, never both. We have no keep-playing offer, so this doesn't apply.
- Ads are off during a game's Basic Launch on CrazyGames, so the game must work with no ads at all.

Nothing here changes D51. It does shape R6, R7, Q3 and Q4.

---

## Rules and examples

### 🟦 R1. There's one currency: coins

Shown as a gold coin icon with a number. Coins buy hints (story 27), and later maybe other things, such as styles (later ideas).

- 🟩 A player with 120 coins sees a coin and "120"

**Confirmed:** ☐

### 🟦 R2. A new player starts with the *starting coins*

- 🟩 With *starting coins* of 100, opening the game for the first time shows 100 coins

**Confirmed:** ☐

### 🟦 R3. Coins come from rewarded ads, bonus words and series

A rewarded ad watched to the end gives the *ad reward*, a bonus word the *bonus word reward* (once story 25 is built) and finishing a series its reward (story 28). Winning a single level gives none.

- 🟩 With an *ad reward* of 50 and 100 coins, watching a rewarded ad to the end makes 150
- 🟩 Winning a level that doesn't finish a series leaves the coins as they were

**Confirmed:** ☐

### 🟦 R4. Coins are saved with the player's progress

Through the platform interface (D32), like the rest of the progress (story 11). Earning and spending are saved straight away, so closing the game never loses or gives back coins.

- 🟩 With 100 coins and an *ad reward* of 50, closing right after the ad's reward, and opening again, still shows 150

**Confirmed:** ☐

### 🟦 R5. All ads go through the platform interface

Game code never calls an ad SDK (D32). The interface asks for a rewarded or a midgame ad, and says how it ended: watched to the end, closed early, or not available. A rewarded ad's coins are given only when it was watched to the end.

- 🟩 A rewarded ad closed early gives nothing
- 🟩 A rewarded ad that fails to load gives nothing, and the game carries on

**Confirmed:** ☐

### 🟦 R6. Rewarded ads are only ever the player's choice

No rewarded ad plays unless the player asks for one, on an offer that says what they'll get. One ad gives one reward. The offer can always be closed straight away.

- 🟩 With an *ad reward* of 50, pressing "Watch an ad for 50 coins" plays one. Nothing else starts a rewarded ad

**Confirmed:** ☐

### 🟦 R7. Ad offers only show when an ad can play

On a platform with no ads, during CrazyGames' Basic Launch, or when the platform says none is available (an ad blocker, for example), no rewarded ad offer appears. The game is fully playable on coins alone.

- 🟩 With ads off, the shop shows no "Watch an ad" offer (see Q2)

**Confirmed:** ☐

### 🟦 R8. A midgame ad may play between levels, after the first few

When the player presses "Play Level X" on the Level complete popup, the game asks for a midgame ad before the next level starts. The platform decides whether one actually plays (on CrazyGames, at most one every 3 minutes). None are asked for before the *first midgame level* is completed.

- 🟩 With a *first midgame level* of 5, completing level 3 and pressing "Play Level 4" goes straight to level 4
- 🟩 With a *first midgame level* of 5, completing level 5 and pressing "Play Level 6" asks for a midgame ad, then starts level 6 when it ends
- 🟩 If the platform plays no ad, level 6 starts straight away

**Confirmed:** ☐

### 🟦 R9. While any ad plays, the game pauses and is muted

Its input is ignored, and it carries on exactly where it was afterwards. Muting matters once there's sound (story 18).

- 🟩 Keys pressed during an ad do nothing

**Confirmed:** ☐

### 🟦 R10. The prototype fakes ads in development

So the flows can be tested before the CrazyGames SDK is added (out of scope for the prototype), the local platform pretends to play an ad: a short screen that says it's a pretend rewarded or midgame ad, with buttons to finish or close it. Development builds can also pretend no ads are available. Release builds on CrazyGames use their SDK, behind the same interface.

- 🟩 In development, with an *ad reward* of 50, finishing a pretend rewarded ad gives 50 coins, and closing it gives none

**Confirmed:** ☐

---

## Questions

### 🟥 Q1. Where's the balance shown?

The top bar has home, level number, theme, points, shop and settings (D30).

- **A (recommended):** Next to the points, as a coin with a number. Coins earned fly to it from where they came from, like a letter travelling to the pool (story 16), and the number counts up.
- **B:** Inside the shop button, as its label.
- **C:** In place of the points, if points (D23) go now that coins exist. See Q5.

**Answer:**

### 🟥 Q2. What does the shop button do?

It's visible but does nothing today (D30). Story 27 will also offer an ad from a hint the player can't afford.

- **A (recommended):** It opens a small panel with the balance, "Watch an ad for [*ad reward*] coins" (when an ad can play, R7) and a close button. It gives a place to earn coins before story 27, and later the place for styles.
- **B:** Still nothing. Ads are only offered from a hint the player can't afford (story 27).

**Answer:**

### 🟥 Q3. How does the offer show it can't be used again yet?

CrazyGames asks that rewarded ads aren't offered too often, and that the player can see it. Q4 is how long.

- **A (recommended):** The offer stays, greyed out, with a countdown to the end of the *rewarded ad wait* ("Next ad in 2:30").
- **B:** The offer is hidden until it's available again.

**Answer:**

### 🟥 Q4. How long is the *rewarded ad wait* to start with?

It runs from the end of the last rewarded ad. Its value goes in D51.

- **A (recommended):** 3 minutes, to tune after playing. That matches CrazyGames' own pace for midgame ads.
- **B:** No wait in the prototype, deciding after playing.
- **C:** Another length: write it in the answer.

**Answer:**

### 🟥 Q5. Do points (D23) stay now that there are coins?

- **A (recommended):** Yes, for now: points still count levels completed, and coins are spent. Decide after playing whether both are needed.
- **B:** No: coins replace points in the top bar.

**Answer:**

### 🟥 Q6. What do players who already have progress get?

Players who saved progress before coins existed (only you, in the prototype).

- **A (recommended):** The *starting coins*, once, plus the *bonus word reward* for each bonus word already found, if story 25 is built first and saves them.
- **B:** The *starting coins* only.

**Answer:**

### 🟥 Q7. Is a midgame ad asked for anywhere else?

R8 asks after "Play Level X". CrazyGames recommends asking at every natural break.

- **A (recommended):** Only there, for now.
- **B:** Also when the player goes home from a level, or replays one.

**Answer:**

---

## Answered questions

Answered in the economy discussion of 2026-11-05 ([D51](../decisions.md)): one currency, coins, which only buys hints, with no charges; the amounts (start 100, ad 50, bonus word 10, nothing for a single level, coins for a series); and midgame ads from level 5, kept as a setting. This replaces the first draft's questions on the currency's name, how it's earned and how much things give and cost.
