# Archived from features/story-11-next-level-and-progress.feature, before story 20 (coins and ads).
# The game as it was is tagged before-story-20 in git. These scenarios no longer run.

Feature: story-11-next-level-and-progress (archived)

  # Archived for story 20: points left the top bar (story 20, R11 and R14). The Level complete popup shows them now, counting up: story 20's "Points count up under the golden word".
  Rule: The new point shows when the popup appears

    @browser
    Scenario: The points go up with the popup
      Given the player has 3 points in total
      When the player wins a level
      Then the points still show 3 until the popup appears
      And the points show 4 with a small pulse as it appears

    @browser
    Scenario: The popup doesn't mention the point
      When the popup appears
      Then it doesn't mention points

