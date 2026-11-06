# Archived from features/5-the-whole-game/m05-01-next-level-and-progress.feature, before M07-04 (level series, with a full Level complete screen in place of the popup).
# The game as it was is tagged before-m07-04 in git. These scenarios no longer run.

Feature: m05-01-next-level-and-progress (archived)

  # Archived for M07-04: "All levels complete!" now shows on the Level complete screen, where the button would be (M07-04, R12).
  Rule: After the last level, the popup has no button

    @browser
    Scenario: All levels complete
      Given the player is on the last level
      When the popup appears after the win
      Then it shows "All levels complete!"
      And it has no button

    @browser
    Scenario: Reopening shows the same popup
      Given the player has won the last level
      When the game closes and opens again
      Then the popup shows "All levels complete!"

