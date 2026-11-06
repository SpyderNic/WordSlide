# Status: approved by the designer on 2026-11-06.
# Map: docs/milestones/7-worth-playing/m07-04-level-series.md
# Economy and feel values are settings (D52): each scenario sets the ones it uses.
# The series and levels are made up for the tests, never the prototype's (D46),
# except R9's scenario, which checks the prototype's series by level number only.
# Scenarios without @browser check the series rules alone, without the screen.
#
# This story replaces the Level complete popup with a full screen (R3). These
# older scenarios change with it, and are archived when M07-04 is built:
# - M04-04 "The popup's contents" (centre of the screen, "Level complete")
# - M04-04 "The gold word and column fade when the popup appears"
# - M05-01 "All levels complete" and "Reopening shows the same popup"
# - M07-02 "Points count up under the golden word" and its points pause scenario
# Their other checks carry over below, said of the Level complete screen.

Feature: Level series
  As a player
  I want my levels grouped into named series with a bar that fills as I go
  So that I always have a goal close by, and finishing one is worth coins

  Rule: Levels are grouped into named series, in order (R1)

    Scenario: Series follow on from each other
      Given the series are "First Steps" of 10 levels, then "Second Wind" of 15
      Then levels 1 to 10 are in "First Steps"
      And levels 11 to 25 are in "Second Wind"

  Rule: A series' progress is how many of its levels have been won (R2)

    Scenario: Progress comes from the player's level
      Given the series are "First Steps" of 10 levels, then "Second Wind" of 15
      When the player is on level 8
      Then "First Steps" has 7 of its 10 levels won

    @browser
    Scenario: A save from before series existed has the right progress
      Given the series are "First Steps" of 10 levels, then "Second Wind" of 15
      And a save from before this story, on level 8
      When the player wins level 8
      Then the bar fills from "7 / 10" to "8 / 10"

  @browser
  Rule: A full Level complete screen replaces the popup (R3)

    Scenario: The screen's contents, top to bottom
      Given the series are "First Steps" of 10 levels, then "Second Wind" of 15
      And the player has 7 points
      When the player wins level 8, whose final word is ELK
      And the Level complete screen has finished playing
      Then it reads, top to bottom: "Level 8 Complete", ELK in gold, "Points: 8", "First Steps", a bar showing "8 / 10", and a "Play Level 9" button
      And it covers the whole screen

    Scenario: Only the coin counter stays from the top bar
      Given the player has 120 coins
      When the Level complete screen is showing
      Then the coin counter shows 120 where it is in the top bar
      And the house button, the level number, the ad button and the cog button are hidden

    Scenario: The screen arrives after the celebration
      When the column spells the final word
      Then the Level complete screen starts fading in about 1.5 seconds later
      And the level fades out under it

    Scenario Outline: The button, Enter and Space start the next level
      Given the Level complete screen for level 8 has finished playing
      When the player presses <control>
      Then level 9 starts

      Examples:
        | control                   |
        | the "Play Level 9" button |
        | Enter                     |
        | Space                     |

  @browser
  Rule: The screen plays in order, and the button shows last (R4)

    Scenario: Everything but the button shows from the start
      Given the series are "First Steps" of 10 levels, then "Second Wind" of 15
      And the player has 7 points
      When the Level complete screen for level 8 appears
      Then it shows "Points: 7", "First Steps" and the bar at "7 / 10"
      And there's no button

    Scenario: The points change, then the bar fills, then the button shows
      Given the series are "First Steps" of 10 levels, then "Second Wind" of 15
      And the player has 7 points
      And the points pause is 0.5 seconds
      And the series bar pause is 0.4 seconds
      And the series bar fill is 0.8 seconds
      When the Level complete screen for level 8 appears
      Then the points change to "Points: 8" after 0.5 seconds
      And 0.4 seconds later the bar starts filling
      And it reaches "8 / 10" over 0.8 seconds, its count counting up with it
      And then the "Play Level 9" button shows

    Scenario Outline: Keys do nothing before the button shows
      Given the Level complete screen for level 8 is still filling the bar
      When the player presses <key>
      Then nothing happens
      And level 8's screen carries on playing

      Examples:
        | key   |
        | Enter |
        | Space |

  Rule: A finished series gives its reward (R5)

    Scenario Outline: The reward is the reward per level times the series' length
      Given the series reward per level is 4
      And a series of <length> levels
      When the player wins its last level
      Then the series gives <reward> coins

      Examples:
        | length | reward |
        | 10     | 40     |
        | 15     | 60     |

    Scenario: No reward before the last level
      Given the series reward per level is 4
      And the series are "First Steps" of 10 levels, then "Second Wind" of 15
      And the player has 40 coins
      When the player wins level 9
      Then the player has 40 coins

    @browser
    Scenario: The bar flashes, "Complete! +X" shows, then the coins fly
      Given the series reward per level is 4
      And the series are "First Steps" of 10 levels, then "Second Wind" of 15
      And the player has 40 coins
      When the player wins level 10
      And the bar fills to "10 / 10"
      Then the bar flashes
      And "First Steps" stays above the bar
      And "Complete! +40" with a coin icon shows under the bar
      And then coins fly from "Complete! +40" to the coin counter
      And the counter counts up from 40 to 80 as they land
      And then the "Play Level 11" button shows

  Rule: The reward is saved with the win, and given once (R6)

    @browser
    Scenario: Closing during the celebration keeps the reward
      Given the series reward per level is 4
      And the series are "First Steps" of 10 levels, then "Second Wind" of 15
      And the player has 40 coins
      When the player wins level 10
      And the game closes before the Level complete screen appears
      And the game opens again
      Then the player has 80 coins
      And level 11 is open

    @browser
    Scenario: Reopening never gives it again
      Given the series reward per level is 4
      And the series are "First Steps" of 10 levels, then "Second Wind" of 15
      And the player has 40 coins
      And the player has won level 10
      When the game closes and opens again
      And closes and opens again
      Then the player has 80 coins

  @browser
  Rule: A new series is announced with a full-screen interstitial (R7)

    Scenario: Moving on to a new series
      Given the series are "First Steps" of 10 levels, then "Second Wind" of 15
      And levels 10 and 11 have the same theme
      And the player has won level 10
      When the player presses "Play Level 11"
      Then a full-screen interstitial shows "New series" in small text and "Second Wind" large under it
      And it fades in and out, with no button
      And level 11 appears

    Scenario: Input is ignored during the series interstitial
      Given the series interstitial is showing
      When the player presses a key
      Then nothing changes

    Scenario: A new series and a new theme share one interstitial
      Given the series are "First Steps" of 10 levels, then "Second Wind" of 15
      And level 10's theme is Animals and level 11's is Food
      And the player has won level 10
      When the player presses "Play Level 11"
      Then one interstitial shows "New series", "Second Wind", and Food under them in the theme interstitial's style
      And level 11 appears

    Scenario: A theme change inside a series shows the theme on its own
      Given the series are "First Steps" of 10 levels, then "Second Wind" of 15
      And level 15's theme is Food and level 16's is Space
      And the player has won level 15
      When the player presses "Play Level 16"
      Then the theme interstitial names Space
      And it doesn't mention a series

    Scenario: The midgame ad plays before the series interstitial
      Given the first midgame level is 5
      And the series are "First Steps" of 10 levels, then "Second Wind" of 15
      And the player has won level 10
      When the player presses "Play Level 11"
      Then a midgame ad is asked for
      And when it ends, the series interstitial shows
      And then level 11 appears

    Scenario: The new series' first win starts its bar from empty
      Given the series are "First Steps" of 10 levels, then "Second Wind" of 15
      When the player wins level 11
      Then the Level complete screen shows "Second Wind"
      And the bar fills from "0 / 15" to "1 / 15"

    Scenario: The first series isn't announced
      Given the player has never played
      When the game opens
      Then the tutorial opens straight away, with no interstitial

  @browser
  Rule: A peek gives no reward (R8)

    Scenario: Winning a series' last level in a peek
      Given a development build
      And the series reward per level is 4
      And the series are "First Steps" of 10 levels, then "Second Wind" of 15
      And the player has 40 coins
      When the designer peeks at level 10 and wins it
      Then the bar fills to "10 / 10" and flashes
      And the player has 40 coins

  Rule: The prototype has three series (R9)

    Scenario: The prototype's series
      Given the prototype's levels
      Then levels 1 to 10 are in "Into the Wild"
      And levels 11 to 25 are in "Snacks in Orbit"
      And levels 26 to 40 are in "Cosmic Games"

  @browser
  Rule: The series shows only on the Level complete screen (R10)

    Scenario: No series during play
      Given the series are "First Steps" of 10 levels, then "Second Wind" of 15
      When level 8 opens
      Then neither the series' name nor a progress bar shows

  @browser
  Rule: Level 1 shows the bar too (R11)

    Scenario: The tutorial's Level complete screen
      Given the series are "First Steps" of 10 levels, then "Second Wind" of 15
      And level 1 is the tutorial
      When the player wins level 1
      Then the Level complete screen shows "First Steps"
      And the bar fills from "0 / 10" to "1 / 10"

  @browser
  Rule: After the last level, the last series finishes as usual (R12)

    Scenario: Winning the last level
      Given the series reward per level is 4
      And the last series has 15 levels and ends on the last level
      And the player has 40 coins
      When the player wins the last level
      Then the bar fills to "15 / 15" and flashes
      And "Complete! +60" with a coin icon shows under the bar
      And the counter counts up from 40 to 100
      And then "All levels complete!" shows where the button would be
      And there's no button

    Scenario: Reopening after the last level
      Given the series reward per level is 4
      And the last series has 15 levels and ends on the last level
      And the player has won the last level, and has 100 coins
      When the game closes and opens again
      Then the Level complete screen shows the bar full at "15 / 15"
      And "All levels complete!"
      And the player has 100 coins
