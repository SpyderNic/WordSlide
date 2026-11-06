# M07-04: Level series (was story 28)

**Status:** ✅ Approved by the designer on 2026-11-06. Scenarios: [m07-04-level-series.feature](../../../features/7-worth-playing/m07-04-level-series.feature), approved and built on 2026-11-06.

*As a player, I want my levels grouped into named series with a bar that fills as I go, so that I always have a goal close by and finishing one feels like an achievement worth coins.*

From the economy discussion on 2026-11-05 ([D51](../../decisions.md)): winning a single level gives no coins, finishing a series does. Coins and their flight to the counter are [M07-02](m07-02-currency-and-ads.md). The sound for a finished series waits for M07-07.

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

**Settings (D52).** Rules name a setting in *italics*, never its value. Each example sets the values it uses. The values shipped today go in [D51](../../decisions.md).

| Setting | What it is |
|---|---|
| *series lengths* | How many levels each series has, in order (10, 15, then 15 for the prototype) |
| *series reward per level* | The coins a finished series gives for each of its levels |
| *series bar pause*, *series bar fill* | Feel settings: how long before the bar starts filling, and how long it takes (in `src/style`, D27) |

Examples use made-up series, never the prototype's levels (D46). Series names aren't words from the levels, so they can be shared.

---

## Rules and examples

### 🟦 R1. Levels are grouped into named series, in order, separate from themes

Each series has a name and a length, and starts where the last one ended. A series can cover one theme, part of one, or several (D51). The level number keeps counting up through the series, as it does through themes (M06-02, R10). The series are written in the game's content, next to the levels, so they can change without changing the rules.

- 🟩 With *series lengths* of 10 then 15, levels 1 to 10 are the first series and levels 11 to 25 the second

**Confirmed:** ☑

### 🟦 R2. A series' progress is how many of its levels have been won

It comes from the player's level (D42), so there's nothing new to save for it, and a save from before this story already has the right progress.

- 🟩 With a first series of 10, a player on level 8 has won 7 of its 10 levels

**Confirmed:** ☑

### 🟦 R3. A full Level complete screen replaces the popup

*From Q2.* It shows, from top to bottom: "Level X Complete", where X is the level just won; the golden word; "Points: N"; the series' name; its progress bar with the count (Q3); and the "Play Level X+1" button, which Enter or Space also presses. This replaces D41's popup and M07-02's R11 popup. *From Q14:* only the coin counter stays, where it is in the top bar; home, the level number, the ad button and settings hide while the screen shows. *From Q15:* the screen arrives with D41's timing, about 1.5 seconds after the golden wave, fading in over the level in the style's background colour while the level fades out under it.

- 🟩 Winning level 8 of a 10-level series called "Into the Wild", the screen reads "Level 8 Complete", the golden word, the points, "Into the Wild", a bar showing "8 / 10", and "Play Level 9"
- 🟩 While the screen shows, the coin counter is the only part of the top bar left

**Confirmed:** ☑

### 🟦 R4. The screen plays in order, and the button shows last

*From Q2, Q4 and Q7.* The points change first (after the *points pause*, M07-02 R11). After the *series bar pause*, the bar fills over the *series bar fill* from the progress before this level to the new progress, and its count counts up with it. If the series is finished, its reward plays (R5). Only then does the "Play Level X+1" button show, and Enter and Space do nothing before it. *From Q16:* everything but the button shows from the start, with the old points and the bar at its old progress, and then changes in order.

- 🟩 Winning level 8 of a 10-level series, the points change, then the bar fills from "7 / 10" to "8 / 10", then "Play Level 9" shows
- 🟩 Pressing Enter while the bar is still filling does nothing
- 🟩 As the screen appears, it already shows the series' name and the bar at "7 / 10"

**Confirmed:** ☑

### 🟦 R5. When the bar reaches the end, the series is finished and gives its reward

*From Q5 and Q6.* The reward is the *series reward per level* times the series' length. The bar flashes, the series' name stays, and "Complete! +X" with a coin icon shows under the bar. Then coins fly to the coin counter, which counts up as they land (M07-02, R15). A sound joins in once M07-07 exists. *From Q17:* the coins fly from "Complete! +X", the line that names them (this replaces M07-02 R15's "from its progress bar").

- 🟩 With a *series reward per level* of 4 and 40 coins, winning the last level of a 10-level series fills the bar, it flashes, "Complete! +40" with a coin shows under it, then coins fly to the counter, which counts up from 40 to 80
- 🟩 With the same setting, a 15-level series gives 60

**Confirmed:** ☑

### 🟦 R6. The reward is saved with the win, before the screen appears

Like progress (M05-01, R4), so closing the game during the celebration loses nothing, and it's given once only: reopening the game never gives it again.

- 🟩 With a *series reward per level* of 4 and 40 coins, winning the last level of a 10-level series and closing the game before the screen appears reopens with 80 coins, on the next series' first level
- 🟩 Reopening the game after that gives no more coins for the finished series

**Confirmed:** ☑

### 🟦 R7. A new series is announced with a full-screen interstitial

*From Q8.* When the player moves on to a series' first level, an interstitial like the theme's (M06-02, R11) names the new series: it fades in and out with no Continue button, and input is ignored during it. When the theme changes at the same level, one interstitial shows both. Any midgame ad plays first (M07-02, R8), as it does before the theme's. *From Q18:* it shows "New series" in small text, and the series' name large under it; when the theme changes too, the theme's name follows under the series, in the theme interstitial's style. *From Q19:* the first series isn't announced: the game still opens straight on the tutorial, and the player meets the first series on level 1's Level complete screen (R11).

- 🟩 With series of 10 then 15, pressing "Play Level 11" shows the second series' interstitial, then level 11, whose win shows the bar from "0 / 15" to "1 / 15"
- 🟩 When level 11 also starts a new theme, one interstitial names both the series and the theme
- 🟩 When a theme changes in the middle of a series, the theme's interstitial shows on its own, as now
- 🟩 Opening the game for the first time goes straight to the tutorial, with no interstitial

**Confirmed:** ☑

### 🟦 R8. A peek gives no reward

Development builds' `?level=N` saves nothing (D42), so winning a series' last level in a peek shows the bar and its flash but adds no coins.

- 🟩 Peeking at level 10, the last of a 10-level series, and winning it, the bar fills and flashes, and the coins stay as they were

**Confirmed:** ☑

### 🟦 R9. The prototype has three series

*From Q1.* With *series lengths* of 10, 15 and 15 (D51), and four themes of 10 levels: "Into the Wild" is Animals, "Snacks in Orbit" is Food and the first half of Space, and "Cosmic Games" is the rest of Space and Sports.

- 🟩 Level 21 is in "Snacks in Orbit", and level 26 starts "Cosmic Games"

**Confirmed:** ☑

### 🟦 R10. The series shows only on the Level complete screen

*From Q9.* Not during play. The main menu (milestone 8) can show it later.

**Confirmed:** ☑

### 🟦 R11. Level 1 shows the bar too

*From Q10.* The tutorial's Level complete screen shows the first series, from "0 / 10" to "1 / 10".

**Confirmed:** ☑

### 🟦 R12. After the last level, the last series finishes as usual

*From Q11.* Its reward plays on that level's screen, and "All levels complete!" shows where the button would be, with no button (M05-01, R11). Reopening the game shows that screen with the bar full and no reward.

- 🟩 With a *series reward per level* of 4, winning the last level of a 15-level series gives 60 coins, then "All levels complete!" shows

**Confirmed:** ☑

---

## Questions

None left.

---

## What this changes elsewhere

- D41 and M07-02's R11: the Level complete popup becomes a full screen (R3), titled "Level X Complete".
- M05-01, R11: "All levels complete!" sits on that screen (R12).
- M06-02, R11: the theme interstitial can share the screen with a new series (R7).
- M07-02, R15: series coins fly from "Complete! +X" instead of the bar (R5).
- The levels' content gains the series: names and lengths (R1, R9).
- D51's settings gain the *series reward per level*, shipping at 4 (Q13).
- M07-07 (sound) adds the finished series' sound.
- Later ideas gain doubling the reward with an ad (Q12).

---

## Answered questions

### 🟥 Q1. What are the prototype's three series called?

**Answer:** Left empty, so the recommendation: "Into the Wild", "Snacks in Orbit" and "Cosmic Games" (R9).

### 🟥 Q2. Where does the series sit on the Level complete popup?

**Answer:** The popup is replaced by a full screen: "Level X Complete", the golden word, the points going up, the series' name and its bar going up, then "Play Level X+1" (R3, R4).

### 🟥 Q3. What's written on the bar?

**Answer:** Left empty, so the recommendation: the count, "8 / 10", counting up as it fills (R3, R4).

### 🟥 Q4. When does the bar fill, compared with the points?

**Answer:** Left empty, so the recommendation: after the points have changed (R4).

### 🟥 Q5. What does a finished series show, besides the flash and the coins?

**Answer:** The series' name stays, with "Complete! +100" and a coin icon under the bar. From R5's note: "+X" and the coin show before the coins fly (R5).

### 🟥 Q6. How is the series reward set?

**Answer:** Left empty, so the recommendation: a *series reward per level*, times the series' length. The example totals were changed to 40, 60 and 60, so see Q13 for the shipped value (R5).

### 🟥 Q7. Can the player move on before the bar finishes?

**Answer:** No: the button shows once the bar and any coins have finished (R4).

### 🟥 Q8. Is a new series announced when it starts?

**Answer:** Yes, with a full-screen interstitial like the theme's. When the theme changes at the same time, one interstitial shows both (R7).

### 🟥 Q9. Does the series show during play?

**Answer:** Left empty, so the recommendation: no, only on the Level complete screen (R10).

### 🟥 Q10. Does the tutorial's popup show the bar?

**Answer:** Left empty, so the recommendation: yes, from 0 to 1 of 10 (R11).

### 🟥 Q11. What happens after the last level?

**Answer:** Left empty, so the recommendation: the last series finishes as usual, with its reward, and reopening shows the bar full and no reward (R12).

### 🟥 Q12. Can the player double the reward by watching an ad?

**Answer:** Left empty, so the recommendation: not now, it goes in later ideas.

### 🟥 Q13. What does the series reward per level ship at?

**Answer:** Left empty, so the recommendation: 4, giving 40, 60 and 60 coins for the prototype's series.

### 🟥 Q14. Does the top bar stay on the Level complete screen?

**Answer:** Left empty, so the recommendation: only the coin counter stays (R3).

### 🟥 Q15. How does the screen arrive?

**Answer:** Left empty, so the recommendation: with D41's timing, fading in over the level (R3).

### 🟥 Q16. What shows when the screen first appears?

**Answer:** Left empty, so the recommendation: everything but the button, at the old values (R4).

### 🟥 Q17. Where do the reward's coins fly from?

**Answer:** Left empty, so the recommendation: from "Complete! +X" (R5).

### 🟥 Q18. What does the series interstitial say?

**Answer:** Left empty, so the recommendation: "New series" small, the series' name large, and the theme under it when it changes too (R7).

### 🟥 Q19. Is the first series announced before level 1?

**Answer:** Left empty, so the recommendation: no (R7, R11).
