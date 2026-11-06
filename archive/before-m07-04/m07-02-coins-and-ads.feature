# Archived from features/7-worth-playing/m07-02-coins-and-ads.feature, before M07-04 (level series, with a full Level complete screen in place of the popup).
# The game as it was is tagged before-m07-04 in git. These scenarios no longer run.

Feature: m07-02-coins-and-ads (archived)

  # Archived for M07-04: the points are now part of the Level complete screen's order (M07-04, R3 and R4).
  Rule: Points move to the Level complete popup (R11)

    Scenario: Points count up under the golden word
      Given the player has 7 points
      When the player wins the level
      Then the Level complete popup shows "Points: 7" under the golden word
      And it counts up to "Points: 8"

    # From playing: the count was too quick to see.
    Scenario: The points wait, then change with a pulse
      Given the player has 7 points
      When the player wins the level
      Then the popup shows "Points: 7" until the points pause has passed
      And then "Points: 8", with a small pulse

