# Checks the project's setup. This isn't a designed story.

Feature: Foundation

  Scenario: Saved values can be read back
    Given a working save
    When "progress" is saved as "level 5"
    Then loading "progress" gives "level 5"

  Scenario: A value that was never saved is empty
    Given a working save
    Then loading "progress" gives nothing

  Scenario: Blocked saving doesn't stop the game
    Given saving is blocked
    When "progress" is saved as "level 5"
    Then loading "progress" gives nothing

  Scenario: The current style has the letter travel time
    Then the letter travel time is 150 milliseconds
