# Archived from features/4-phase-two/m04-04-win-check-and-celebration.feature, before M07-04 (level series, with a full Level complete screen in place of the popup).
# The game as it was is tagged before-m07-04 in git. These scenarios no longer run.

Feature: m04-04-win-check-and-celebration (archived)

  # Archived for M07-04: the top bar no longer all stays: only the coin counter does (M07-04, R3).
    Scenario: The gold word and column fade when the popup appears
      When the popup appears
      Then the gold word and the column fade away
      And the top of the screen stays

  # Archived for M07-04: the popup is now a full Level complete screen, titled "Level X Complete" (M07-04, R3).
    Scenario: The popup's contents
      Given the player has won level 4
      When the popup appears
      Then it's in the centre of the screen
      And it shows "Level complete"
      And it shows ELK in gold
      And its button says "Play Level 5"

