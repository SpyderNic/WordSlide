# Archived from tests/browser/screen-audit.feature, before story 23 (a pool for each row).
# The game as it was is tagged before-story-23 in git. These scenarios no longer run.

Feature: screen-audit (archived)

  # Archived for story 23: replaced by R2: the selected row always shows.
  Scenario: The selected row is marked until a drag hides it
    When the level opens
    And the player clicks a cell of ZEBRA's row
    Then ZEBRA's row is marked as selected
    When the player drags a letter
    Then no row is drawn as selected

