# Checks the project's setup. This isn't a designed story.

@browser
Feature: Foundation

  Scenario: The game opens with no errors
    When the game opens
    Then the screen fills the window
    And there are no errors

  Scenario: Real key presses reach the game
    When the game opens
    And the player types L on the keyboard
    Then the first row shows L

  Scenario: Keys pressed at the same moment all count
    When the game opens
    And the player quickly types L, E and M
    Then the first row shows L, E and M
