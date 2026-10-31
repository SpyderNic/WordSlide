# Checks the project's setup. This isn't a designed story.

Feature: Foundation

  Scenario: The game opens with no errors
    When the game opens
    Then the screen fills the window
    And there are no errors
