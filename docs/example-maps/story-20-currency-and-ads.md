# Story 20: Coins and ads

**Status:** ✅ Approved by the designer on 2026-11-05, after the economy discussion ([D51](../decisions.md)). Scenarios: [story-20-coins-and-ads.feature](../../features/story-20-coins-and-ads.feature), approved and built on 2026-11-05.

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
| *coin flight* | How many coins fly to the counter, and how fast (R15) |

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

**Confirmed:** ☑

### 🟦 R2. A new player starts with the *starting coins*

- 🟩 With *starting coins* of 100, opening the game for the first time shows 100 coins

**Confirmed:** ☑

### 🟦 R3. Coins come from rewarded ads, bonus words and series

A rewarded ad watched to the end gives the *ad reward*, a bonus word the *bonus word reward* (once story 25 is built) and finishing a series its reward (story 28). Winning a single level gives none.

- 🟩 With an *ad reward* of 50 and 100 coins, watching a rewarded ad to the end makes 150
- 🟩 Winning a level that doesn't finish a series leaves the coins as they were

**Confirmed:** ☑

### 🟦 R4. Coins are saved with the player's progress

Through the platform interface (D32), like the rest of the progress (story 11). Earning and spending are saved straight away, so closing the game never loses or gives back coins.

- 🟩 With 100 coins and an *ad reward* of 50, closing right after the ad's reward, and opening again, still shows 150

**Confirmed:** ☑

### 🟦 R5. All ads go through the platform interface

Game code never calls an ad SDK (D32). The interface asks for a rewarded or a midgame ad, and says how it ended: watched to the end, closed early, or not available. A rewarded ad's coins are given only when it was watched to the end.

- 🟩 A rewarded ad closed early gives nothing
- 🟩 A rewarded ad that fails to load gives nothing, and the game carries on

**Confirmed:** ☑

### 🟦 R6. Rewarded ads are only ever the player's choice

No rewarded ad plays unless the player asks for one, on an offer that says what they'll get. One ad gives one reward. The offer can always be closed straight away.

- 🟩 With an *ad reward* of 50, pressing the "+50" ad button plays one. Nothing else starts a rewarded ad

**Confirmed:** ☑

### 🟦 R7. Ad offers only show when an ad can play

On a platform with no ads, during CrazyGames' Basic Launch, or when the platform says none is available (an ad blocker, for example), no rewarded ad offer appears: the ad button (R12) is hidden. The game is fully playable on coins alone.

- 🟩 With ads off, there's no ad button in the top bar

**Confirmed:** ☑

### 🟦 R8. A midgame ad may play between levels, after the first few

When the player presses "Play Level X" on the Level complete popup, the game asks for a midgame ad before the next level starts. Going home from a level, or replaying one, asks too (Q7), once those exist: today the home button does nothing and there's no replay, so only "Play Level X" is built and tested now. The platform decides whether one actually plays (on CrazyGames, at most one every 3 minutes). None are asked for before the *first midgame level* is completed.

- 🟩 With a *first midgame level* of 5, completing level 3 and pressing "Play Level 4" goes straight to level 4
- 🟩 With a *first midgame level* of 5, completing level 5 and pressing "Play Level 6" asks for a midgame ad, then starts level 6 when it ends
- 🟩 If the platform plays no ad, level 6 starts straight away

**Confirmed:** ☑

### 🟦 R9. While any ad plays, the game pauses and is muted

Its input is ignored, and it carries on exactly where it was afterwards. Muting matters once there's sound (story 18).

- 🟩 Keys pressed during an ad do nothing

**Confirmed:** ☑

### 🟦 R10. The prototype fakes ads in development

So the flows can be tested before the CrazyGames SDK is added (out of scope for the prototype), the local platform pretends to play an ad: a short screen that says it's a pretend rewarded or midgame ad, with buttons to finish or close it. Development builds can also pretend no ads are available. Release builds on CrazyGames use their SDK, behind the same interface.

- 🟩 In development, with an *ad reward* of 50, finishing a pretend rewarded ad gives 50 coins, and closing it gives none

**Confirmed:** ☑

### 🟦 R11. Points move to the Level complete popup

*From Q1.* *And Q11.* Points (D23) stay, but a level's top bar shows coins instead. The Level complete popup shows a line under the golden word, "Points: N", counting up from the points before the level as the popup opens. The main menu will show them too, once there is one.

- 🟩 With 7 points, completing a level shows "Points: 7" under the golden word, counting up to "Points: 8"
- 🟩 *From playing, on 2026-11-05:* the count was too quick to see. The popup opens showing the old points; after the *points pause*, a feel setting (D52), they change to the new points with a small pulse, like a locking tile (D37)

**Confirmed:** ☑

### 🟦 R12. The ad button: "+[ad reward]" in the top bar

*From Q1, Q2 and Q9.* The shop button is removed. The top bar has an ad button instead (R14), showing "+", the *ad reward*, a coin icon and a video icon. Pressing it plays a rewarded ad straight away; watched to the end, it gives the *ad reward* (R3). It's hidden in the tutorials (level 1's and the reordering tutorial), like the hints.

- 🟩 With an *ad reward* of 50, the top bar shows "+50", a coin and a video icon, and no shop button
- 🟩 During level 1's tutorial, there's no ad button

**Confirmed:** ☑

### 🟦 R13. After a rewarded ad, the ad button waits, with a countdown

*From Q3 and Q4.* For the *rewarded ad wait* after a rewarded ad ends (watched or closed), the button stays in place, greyed out, showing a countdown instead of its reward, and pressing it does nothing. Then it's back to normal. It's built as one reusable piece, so a shop can later use the same button and behave the same.

- 🟩 With a *rewarded ad wait* of 3 minutes, the button reads "2:30" 30 seconds after an ad, and pressing it plays nothing
- 🟩 With a *rewarded ad wait* of 3 minutes, 3 minutes after an ad, the button shows "+50" again and plays an ad when pressed

**Confirmed:** ☑

### 🟦 R14. The top bar, left to right

*From Q8.* Home, as a square button with a house icon; the level number; the ad button, centred on the screen; the coins; settings, as a square button with a cog icon. The icons are placeholders drawn in code, like the hint icons (story 19). Home and settings still do nothing (D30). *From Q13:* the theme moves out of the bar, to just below it, centred above the rows, in the same style as now.

- 🟩 In level 6, the top bar reads: house button, "Level 6", "+50" ad button in the middle, the coins, cog button
- 🟩 The theme shows centred just below the top bar, above the rows

**Confirmed:** ☑

### 🟦 R15. Earned coins fly to the counter

*From Q10.* A few coins fly to the coin counter from where they were earned, and the number counts up as they land. Coins from a rewarded ad come from the centre of the screen; from a bonus word, from the word (story 25); from a series, from its progress bar (story 28). How many fly, and how fast, is the *coin flight* (D52).

- 🟩 With an *ad reward* of 50 and 100 coins, after an ad is watched, coins fly from the centre of the screen to the counter, which counts up from 100 to 150 as they land

**Confirmed:** ☑

---

## Questions

None left.

---

## Answered questions

### Q13. Where does the theme go?

**Answer:** Below the top bar (A). → R14.

### Q8. Where in the top bar does the ad button go?

**Answer:** Home (square button with house icon), Level Number, ad button (centred), coins, settings (square button with a cog icon).

→ R14. It leaves the theme out: Q13.

### Q9. Is the ad button there in the tutorials?

**Answer:** Left empty, so the recommendation: no, hidden in the tutorials like the hints. → R12.

### Q10. Do earned coins travel to the counter?

**Answer:** A, except when watching an ad, the coins spawn from the centre of the screen.

→ R15.

### Q11. How do points show on the Level complete popup?

**Answer:** Left empty, so the recommendation: "Points: N" under the golden word, counting up. → R11.

### Q12. Where does the later shop idea go?

**Answer:** Left empty, so the recommendation: in later ideas.

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
