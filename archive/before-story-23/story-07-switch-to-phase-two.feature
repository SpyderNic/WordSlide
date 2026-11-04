# Archived from features/story-07-switch-to-phase-two.feature, before story 23 (a pool for each row).
# The game as it was is tagged before-story-23 in git. These scenarios no longer run.

Feature: story-07-switch-to-phase-two (archived)

  # Archived for story 23: replaced by R5: ZEBRA's letters can't go into LEMUR's row.
    Scenario: Words locked in a different order stay there
      Given the reordering tutorial has been shown
      And ZEBRA is locked in the top row
      And LEMUR is locked in the middle row
      When the ceremony plays
      Then ZEBRA is in the top row
      And LEMUR is in the middle row

