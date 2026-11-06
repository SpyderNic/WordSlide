# Archived from features/7-worth-playing/m07-01-hints.feature, before M07-03 (buying hints).
# The game as it was is tagged before-m07-03 in git. These scenarios no longer run.

Feature: m07-01-hints (archived)

  # Archived for M07-03: hints cost coins now (M07-03, R1): its scenarios "Buying a Letter hint" and "The Letter hint's price goes up as it's used".
    Scenario: Hints are free and unlimited for now
      When the player uses the Letter hint 3 times
      Then 3 of LEMUR's cells are locked

