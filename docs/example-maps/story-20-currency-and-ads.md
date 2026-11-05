# Story 20: Coins and ads

**Status:** 🟨 Redrafted on 2026-11-05 from the economy discussion ([D51](../decisions.md)). The designer answered Q1 to Q7 on 2026-11-05; their answers raise Q8 to Q12. On hold before that, since 2026-11-04.

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
| *rewarded ad wait* | How long after a rewarded ad before the ad button can be used again |

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

In a level, the top bar shows a gold coin icon with the player's balance, in place of the points (Q1). Coins buy hints (story 27), and later maybe other things, such as styles (later ideas).

- 🟩 A player with 120 coins sees a coin and "120" in the top bar, and no points

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

- 🟩 With an *ad reward* of 50, pressing the "+50" ad button plays one. Nothing else starts a rewarded ad

**Confirmed:** ☐

### 🟦 R7. Ad offers only show when an ad can play

On a platform with no ads, during CrazyGames' Basic Launch, or when the platform says none is available (an ad blocker, for example), no rewarded ad offer appears: the ad button (R12) is hidden. The game is fully playable on coins alone.

- 🟩 With ads off, there's no ad button in the top bar

**Confirmed:** ☐

### 🟦 R8. A midgame ad may play between levels, after the first few

When the player presses "Play Level X" on the Level complete popup, the game asks for a midgame ad before the next level starts. Going home from a level, or replaying one, asks too (Q7), once those exist: today the home button does nothing and there's no replay, so only "Play Level X" is built and tested now. The platform decides whether one actually plays (on CrazyGames, at most one every 3 minutes). None are asked for before the *first midgame level* is completed.

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

### 🟦 R11. Points move to the Level complete popup

*From Q1.* Points (D23) stay, but a level's top bar shows coins instead. The Level complete popup shows the player's points (see Q11 for how), and the main menu will too, once there is one.

- 🟩 With 7 points, completing a level shows 8 points on the Level complete popup

**Confirmed:** ☐

### 🟦 R12. The ad button: "+[ad reward]" in the top bar

*From Q1 and Q2.* The shop button is removed. In its place (see Q8) is an ad button showing "+", the *ad reward*, a coin icon and a video icon. Pressing it plays a rewarded ad straight away; watched to the end, it gives the *ad reward* (R3).

- 🟩 With an *ad reward* of 50, the top bar shows "+50", a coin and a video icon, and no shop button

**Confirmed:** ☐

### 🟦 R13. After a rewarded ad, the ad button waits, with a countdown

*From Q3 and Q4.* For the *rewarded ad wait* after a rewarded ad ends (watched or closed), the button stays in place, greyed out, showing a countdown instead of its reward, and pressing it does nothing. Then it's back to normal. It's built as one reusable piece, so a shop can later use the same button and behave the same.

- 🟩 With a *rewarded ad wait* of 3 minutes, the button reads "2:30" 30 seconds after an ad, and pressing it plays nothing
- 🟩 With a *rewarded ad wait* of 3 minutes, 3 minutes after an ad, the button shows "+50" again and plays an ad when pressed

**Confirmed:** ☐

---

## Questions

Raised by the answers to Q1 to Q7.

### 🟥 Q8. Where in the top bar does the ad button go?

Today, left to right: home, level number, theme, points, shop, settings (D30).

- **A (recommended):** Home, level number, theme, coins, ad button, settings: the ad button takes the shop's place, right next to the coins it adds to.
- **B:** Home, level number, theme, ad button, coins, settings: the "+" reads as part of the coin counter, like the later "+" for the shop (Q1).

**Answer:**

### 🟥 Q9. Is the ad button there in the tutorials?

Hints aren't in the tutorials (story 19), and nothing there costs coins.

- **A (recommended):** No: hidden in level 1's tutorial and the reordering tutorial, like the hints.
- **B:** Yes, everywhere.

**Answer:**

### 🟥 Q10. Do earned coins travel to the counter?

- **A (recommended):** Yes: a few coins fly from where they were earned (the ad button, a bonus word, the series bar) to the counter, and the number counts up as they land. How many and how fast are settings (D52).
- **B:** No: the number just counts up.

**Answer:**

### 🟥 Q11. How do points show on the Level complete popup?

It shows "Level complete", the golden word and the "Play Level X" button (story 10).

- **A (recommended):** A line under the golden word, "Points: 8", counting up from 7 as the popup opens.
- **B:** Just the number, with no counting up.

**Answer:**

### 🟥 Q12. Where does the later shop idea go?

*From Q1:* if and when there are in-app purchases, the coin counter becomes the shop: a "+" next to it, and the whole panel opens the shop when tapped.

- **A (recommended):** In later ideas, with the existing styles idea, so the code doesn't rule it out.
- **B:** Nowhere for now.

**Answer:**

---

## Answered questions

### Q1. Where's the balance shown?

**Answer:** In place of the points in a level, we'll show the points on the level completed screen, and the main menu. Remove the shop button. If and when IAPs are a thing, the shop button will be the coins counter: we'll add a "+" button next to it, the whole panel will be tappable to open the shop.

→ R1, R11, R12, Q12.

### Q2. What does the shop button do?

**Answer:** B, but there should be a "+50 [coin icon] [video icon]" button at the top of the screen that would trigger an ad watch.

→ R12, with the *ad reward* in place of 50 (D52). Q8 asks where it goes.

### Q3. How does the offer show it can't be used again yet?

**Answer:** A for the new button I've asked to add in Q2, and make it a reusable thing that can behave the same in the shop, if and when we have a shop.

→ R13.

### Q4. How long is the rewarded ad wait to start with?

**Answer:** Left empty, so the recommendation: 3 minutes, to tune after playing. → R13, and D51's settings.

### Q5. Do points (D23) stay now that there are coins?

**Answer:** Left empty, so the recommendation: yes, for now. With Q1's answer, they move to the Level complete popup (R11).

### Q6. What do players who already have progress get?

**Answer:** B, let's only worry about saved progress once the game is live, not during prototyping.

→ Saves from before this story get the *starting coins*, like a new player. No special handling.

### Q7. Is a midgame ad asked for anywhere else?

**Answer:** B, although we don't have a main menu yet.

→ R8: going home or replaying asks too, once those exist.

### From the economy discussion

Answered in the economy discussion of 2026-11-05 ([D51](../decisions.md)): one currency, coins, which only buys hints, with no charges; the amounts (start 100, ad 50, bonus word 10, nothing for a single level, coins for a series); and midgame ads from level 5, kept as a setting. This replaces the first draft's questions on the currency's name, how it's earned and how much things give and cost.
