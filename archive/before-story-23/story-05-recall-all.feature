# Archived from features/story-05-recall-all.feature, before story 23 (a pool for each row).
# The game as it was is tagged before-story-23 in git. These scenarios no longer run.

Feature: story-05-recall-all (archived)

  # Archived for story 23: replaced by R13: Recall All empties the selected row.
    Scenario: Letters in several rows go back
      Given a Z placed in LEMUR's row
      And an A and an N placed in KANGAROO's row
      When the player presses Recall All
      Then those three cells are empty

  # Archived for story 23: replaced by R2: the selected row always shows.
    # Needs story 17.
    Scenario: A hidden selection stays hidden
      Given ZEBRA's row was selected before a drag
      And a letter was placed by that drag
      When the player presses Recall All
      Then no row is marked as selected
      When the player taps E in the pool
      Then ZEBRA's row is marked as selected

