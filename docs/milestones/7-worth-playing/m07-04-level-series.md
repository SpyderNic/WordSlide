# M07-04: Level series (was story 28)

**Status:** 🟡 Draft, waiting for the designer.

*As a player, I want my levels grouped into named series with a bar that fills as I go, so that I always have a goal close by and finishing one feels like an achievement worth coins.*

From the economy discussion on 2026-11-05 ([D51](../../decisions.md)): winning a single level gives no coins, finishing a series does. Coins and their flight to the counter are [M07-02](m07-02-currency-and-ads.md) (R15 already says series coins fly from the progress bar). The sound for a finished series waits for M07-07.

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

**Settings (D52).** Rules name a setting in *italics*, never its value. Each example sets the values it uses. The values shipped today go in [D51](../../decisions.md).

| Setting | What it is |
|---|---|
| *series lengths* | How many levels each series has, in order (10, 15, then 15 for the prototype) |
| *series reward* | The coins a finished series gives (see Q6 for how it's set, and its value) |
| *series bar pause*, *series bar fill* | Feel settings: how long before the bar starts filling, and how long it takes (in `src/style`, D27) |

Examples use made-up series, never the prototype's levels (D46). Series names aren't words from the levels, so they can be shared.

---

## Rules and examples

### 🟦 R1. Levels are grouped into named series, in order, separate from themes

Each series has a name and a length, and starts where the last one ended. A series can cover one theme, part of one, or several (D51). The level number keeps counting up through the series, as it does through themes (M06-02, R10). The series are written in the game's content, next to the levels, so they can change without changing the rules.

- 🟩 With *series lengths* of 10 then 15, levels 1 to 10 are the first series and levels 11 to 25 the second
- 🟩 A series can end in the middle of a theme: the theme interstitial (M06-02, R11) still shows only when the theme changes

**Confirmed:** ☐

### 🟦 R2. A series' progress is how many of its levels have been won

It comes from the player's level (D42), so there's nothing new to save for it, and a save from before this story already has the right progress.

- 🟩 With a first series of 10, a player on level 8 has won 7 of its 10 levels

**Confirmed:** ☐

### 🟦 R3. The Level complete popup shows the series' name and a progress bar

See Q2 for where it sits on the popup, Q3 for what's written on it, and Q9 for whether the series shows anywhere else.

- 🟩 Winning level 8 of a 10-level series called "Into the Wild", the popup shows "Into the Wild" and a bar at 8 of 10

**Confirmed:** ☐

### 🟦 R4. The bar fills from where it was to where it is now

When the popup opens, the bar shows the progress from before this level. After the *series bar pause*, it fills over the *series bar fill* to the new progress (D51). See Q4 for how this fits with the points changing.

- 🟩 Winning level 8 of a 10-level series, the bar opens at 7 of 10, then fills to 8 of 10

**Confirmed:** ☐

### 🟦 R5. When the bar reaches the end, the series is finished and gives the *series reward*

The bar flashes, and the coins fly from the bar to the coin counter, which counts up as they land (M07-02, R15). A sound joins in once M07-07 exists. See Q5 for what else shows.

- 🟩 With a *series reward* of 100 and 40 coins, winning the last level of a series fills the bar, it flashes, and coins fly from it to the counter, which counts up from 40 to 140

Note: It should also indicate "+X<coins>"
**Confirmed:** ☐

### 🟦 R6. The reward is saved with the win, before the popup appears

Like progress (M05-01, R4), so closing the game during the celebration loses nothing, and it's given once only: reopening the game never gives it again.

- 🟩 With a *series reward* of 100 and 40 coins, winning the last level of a series and closing the game before the popup appears reopens with 140 coins, on the next series' first level
- 🟩 Reopening the game after that gives no more coins for the finished series

**Confirmed:** ☐

### 🟦 R7. The next level's win shows the next series

After a finished series, the next level won shows the new series' name and its bar from empty to 1. See Q8 for whether a new series is announced when it starts.

- 🟩 With series of 10 then 15, winning level 11 shows the second series' name and its bar filling from 0 to 1 of 15

**Confirmed:** ☐

### 🟦 R8. A peek gives no reward

Development builds' `?level=N` saves nothing (D42), so winning a series' last level in a peek shows the bar and its flash but adds no coins.

- 🟩 Peeking at level 10, the last of a 10-level series, and winning it, the bar fills and flashes, and the coins stay as they were

**Confirmed:** ☐

### 🟦 R9. The prototype has three series, named by Claude after their themes

With *series lengths* of 10, 15 and 15 (D51), and four themes of 10 levels: the first series is Animals, the second is Food and the first half of Space, the third is the rest of Space and Sports. See Q1 for the names.

- 🟩 Level 21 is in the second series, and level 26 starts the third

**Confirmed:** ☐

---

## Questions

### 🟥 Q1. What are the prototype's three series called?

- **A (recommended):** "Into the Wild" (Animals), "Snacks in Orbit" (Food, then Space), "Cosmic Games" (Space, then Sports).
- **B:** Plain names: "Series 1", "Series 2", "Series 3".
- **C:** Make the series follow the themes instead, four series of 10, each named after its theme. This changes D51's lengths.

**Answer:**

### 🟥 Q2. Where does the series sit on the Level complete popup?

Today the popup shows "Level complete", the golden word, "Points: N" and the "Play Level X" button (D41, M07-02 R11).

- **A (recommended):** Between "Points: N" and the button: the series' name in small text, with the bar under it. The popup grows to fit.
- **B:** Under the popup, as its own small panel, so the popup itself doesn't change.
- **C:** It replaces the points line, and points move elsewhere.

**Answer:**

### 🟥 Q3. What's written on the bar?

- **A (recommended):** The count, "8 / 10", on or beside the bar, counting up as it fills.
- **B:** A percentage, "80%".
- **C:** Nothing: the bar only.

**Answer:**

### 🟥 Q4. When does the bar fill, compared with the points?

The points change after the *points pause* (M07-02, R11).

- **A (recommended):** After the points have changed: points first, then the bar after the *series bar pause*, so each gets its moment.
- **B:** At the same time as the points.

**Answer:**

### 🟥 Q5. What does a finished series show, besides the flash and the coins?

- **A (recommended):** "Series complete!" replaces the series' name above the bar, with "+100" and a coin beside it as the coins fly, then the popup stays as it is until the player moves on.
- **B:** Its own popup, "Into the Wild complete!", with the reward and a Continue button, before the Level complete popup's button can be pressed.
- **C:** Only the flash and the coins flying.

**Answer:**

### 🟥 Q6. How is the *series reward* set, and what does the prototype ship with?

- **A (recommended):** A number of coins for each level in the series, the *series reward per level*, shipping at 10: series of 10, 15 and 15 give 100, 150 and 150. Longer series give more, and one setting tunes them all.
- **B:** One amount for every series, the *series reward*, shipping at 100.
- **C:** Each series has its own reward, written in the content with its name and length.

For comparison: a hint costs 30 to 40, and an ad gives 50 (D51).

**Answer:**

### 🟥 Q7. Can the player move on before the bar finishes?

- **A (recommended):** Yes: "Play Level X", Enter and Space work at once. If the bar is still going, it skips to the end, any coins land straight away, and the next level opens as usual (with its midgame ad, M07-02 R8).
- **B:** No: the button appears, or wakes up, once the bar and any coins have finished.

**Answer:**

### 🟥 Q8. Is a new series announced when it starts?

- **A (recommended):** No: the player sees its name on the next Level complete popup (R7). The theme interstitial stays about themes.
- **B:** Yes, with a full-screen interstitial like the theme's, naming the series. When a theme changes at the same time, one interstitial shows both.
- **C:** Yes, but only inside the theme interstitial, when one happens to show.

**Answer:**

### 🟥 Q9. Does the series show during play?

- **A (recommended):** No, only on the Level complete popup, as D51 says. The main menu (milestone 8) can show it later.
- **B:** Yes, a thin bar under the theme, without its name.

**Answer:**

### 🟥 Q10. Does the tutorial's popup (level 1) show the bar?

Level 1 is the first series' first level.

- **A (recommended):** Yes, from 0 to 1 of 10, so the player meets the series straight away.
- **B:** No: the first bar shows from level 2, and it opens at 1 already.

**Answer:**

### 🟥 Q11. What happens after the last level?

Today its popup shows "All levels complete!" with no button (M05-01, R11), and reopening the game shows it again.

- **A (recommended):** The last series finishes as usual on that popup, with its reward. Reopening shows "All levels complete!" with the bar full, and no reward.
- **B:** The popup shows "All levels complete!" only, and the reward is given without a bar.

**Answer:**

### 🟥 Q12. Can the player double the reward by watching an ad?

A common pattern in other word games.

- **A (recommended):** Not now: put it in [later ideas](../../later-ideas.md), to try after playing the economy.
- **B:** Yes: a button under the bar, "×2" with a video icon, plays a rewarded ad and doubles the reward. It follows the ad button's rules (M07-02).

**Answer:**

---

## What this changes elsewhere

- The levels' content gains the series: names and lengths (R1, R9).
- M07-02's Level complete popup gains the series (R3), and its coins flight gains the bar as a place coins come from (R15 already says so).
- D51's settings gain the *series reward* and its shipped value (Q6).
- M07-07 (sound) adds the finished series' sound.

---

## Answered questions

None yet.
