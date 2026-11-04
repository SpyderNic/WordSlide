# Archived from features/story-11-next-level-and-progress.feature, before story 23 (a pool for each row).
# The game as it was is tagged before-story-23 in git. These scenarios no longer run.

Feature: story-11-next-level-and-progress (archived)

  # Archived for story 23: replaced by R2 and R10: a row is always selected, and reopening keeps it.
    @browser
    Scenario: No row is selected after reopening
      Given ZEBRA's row is selected
      When the game closes and opens again
      Then no row is marked as selected

  # Archived for story 23: replaced by R2 and R10.
    @browser
    Scenario: No row is selected after reopening, even with letters placed
      Given a Z placed in cell 1 of ZEBRA's row
      And ZEBRA's row is selected
      When the game closes and opens again
      Then no row is marked as selected

  # Archived for story 23: replaced by R14: parts don't lock on their own.
    @browser
    Scenario: A locked part comes back
      Given a level containing the answer HOT DOG
      And HOT is locked in HOT DOG's row
      When the game closes and opens again
      Then HOT is still locked in HOT DOG's row

