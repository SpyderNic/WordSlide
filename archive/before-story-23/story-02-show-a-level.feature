# Archived from features/story-02-show-a-level.feature, before story 23 (a pool for each row).
# The game as it was is tagged before-story-23 in git. These scenarios no longer run.

Feature: story-02-show-a-level (archived)

  # Archived for story 23: replaced by R1: a row's pool has no tile for a letter that's only revealed.
    Scenario: A letter with no copies left to place gets a grey tile
      Given L revealed at position 1 of LEMUR
      When the level opens
      Then the pool shows a grey L x0 tile between K and M

