# Status: approved by the designer on 2026-11-05.
# Map: docs/milestones/7-worth-playing/m07-02-currency-and-ads.md
# Economy values are settings (D52): each scenario sets the ones it uses, so
# these stay true whatever the game ships with.
# Ads are the pretend ads of development builds (R10): a screen with Finish and
# Close buttons. Tests can also make no ad available, or make one fail to load.

@browser
Feature: Coins and ads
  As a player
  I want to earn coins by playing and by choosing to watch ads
  So that getting help is my choice and finishing levels pays off

  Rule: The top bar shows the coins, the ad button and no shop (R1, R12, R14)

    Scenario: The top bar, left to right
      Given the ad reward is 50
      And the player has 120 coins
      When level 6 opens
      Then the top bar reads, left to right: a house button, "Level 6", the "+50" ad button, 120 coins and a cog button
      And the ad button is centred on the screen
      And there are no points and no shop button in the top bar

    Scenario: The theme shows below the top bar
      When level 6 opens
      Then the theme is centred just below the top bar, above the rows

    Scenario: The ad button shows its reward, a coin and a video icon
      Given the ad reward is 50
      When level 6 opens
      Then the ad button shows "+50", a coin icon and a video icon

  Rule: A new player starts with the starting coins (R2)

    Scenario: First time in the game
      Given the starting coins are 100
      And the player has never played
      When the game opens
      Then the player has 100 coins

  Rule: A rewarded ad watched to the end gives the ad reward, and nothing else does (R3, R5, R6)

    Scenario: Watching an ad to the end
      Given the ad reward is 50
      And the player has 100 coins
      When the player presses the ad button
      And watches the ad to the end
      Then the player has 150 coins

    Scenario: Closing an ad early gives nothing
      Given the ad reward is 50
      And the player has 100 coins
      When the player presses the ad button
      And closes the ad early
      Then the player has 100 coins

    Scenario: An ad that fails to load gives nothing, and play carries on
      Given the ad reward is 50
      And the player has 100 coins
      And the next ad will fail to load
      When the player presses the ad button
      Then the player has 100 coins
      And the player can still place a letter

    Scenario: Winning a level gives no coins
      Given the player has 100 coins
      When the player wins the level
      Then the player has 100 coins

    Scenario: Only the ad button starts a rewarded ad
      When the player plays the level through to the end without pressing the ad button
      Then no rewarded ad was asked for

  Rule: Coins are saved straight away (R4)

    Scenario: Closing right after an ad's reward
      Given the ad reward is 50
      And the player has 100 coins
      When the player watches an ad to the end
      And the game is closed and opened again
      Then the player has 150 coins

  Rule: The ad button only shows when an ad can play (R7, R12)

    Scenario: No ads available
      Given no ad can play
      When level 6 opens
      Then there's no ad button

    Scenario: Not in level 1's tutorial
      When level 1's tutorial starts
      Then there's no ad button

    Scenario: Not in the reordering tutorial
      Given the reordering tutorial hasn't been taught
      When the first level that needs reordering opens
      Then there's no ad button

  Rule: After an ad, the ad button waits, with a countdown (R13)

    Scenario: Waiting after an ad watched to the end
      Given the rewarded ad wait is 3 minutes
      When the player watches an ad to the end
      And 30 seconds pass
      Then the ad button is greyed out and reads "2:30"
      And pressing it plays no ad

    Scenario: Waiting after an ad closed early
      Given the rewarded ad wait is 3 minutes
      When the player presses the ad button
      And closes the ad early
      Then the ad button is greyed out and counts down from "3:00"

    Scenario: Back to normal once the wait is over
      Given the ad reward is 50
      And the rewarded ad wait is 3 minutes
      When the player watches an ad to the end
      And 3 minutes pass
      Then the ad button shows "+50"
      And pressing it plays an ad

  Rule: Earned coins fly to the counter (R15)

    Scenario: Coins from an ad come from the centre of the screen
      Given the ad reward is 50
      And the player has 100 coins
      When the player watches an ad to the end
      Then coins fly from the centre of the screen to the coin counter
      And the counter counts up from 100 to 150 as they land

  Rule: A midgame ad may play between levels, after the first midgame level (R8)

    Scenario: No midgame ad before the first midgame level
      Given the first midgame level is 5
      When the player completes level 3 and presses "Play Level 4"
      Then no midgame ad was asked for
      And level 4 opens

    Scenario: A midgame ad from the first midgame level on
      Given the first midgame level is 5
      When the player completes level 5 and presses "Play Level 6"
      Then a midgame ad plays
      And level 6 opens once it ends

    Scenario: The platform plays no midgame ad
      Given the first midgame level is 5
      And the platform will play no midgame ad
      When the player completes level 5 and presses "Play Level 6"
      Then level 6 opens straight away

  Rule: While an ad plays, the game is paused and ignores input (R9)

    # Muting can't be tested until there's sound (M07-07).
    Scenario: Keys during an ad do nothing
      Given LEMUR's row is selected
      When the player presses the ad button
      And presses L while the ad plays
      And closes the ad early
      Then LEMUR's row is as it was before the ad

  Rule: Development builds fake ads (R10)

    Scenario: A pretend ad says it's pretend
      When the player presses the ad button
      Then a pretend rewarded ad shows, with Finish and Close buttons
