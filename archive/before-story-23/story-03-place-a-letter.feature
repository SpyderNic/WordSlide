# Archived from features/story-03-place-a-letter.feature, before story 23 (a pool for each row).
# The game as it was is tagged before-story-23 in git. These scenarios no longer run.

Feature: story-03-place-a-letter (archived)

  # Archived for story 23: story 24, R6: a placed letter dragged onto another makes the letters between move aside.
  Rule: Two placed letters swap

    Scenario: Dropping a placed letter on another swaps them
      Given an M placed in cell 1 of LEMUR's row
      And an E placed in cell 2 of LEMUR's row
      When the player drags the M onto the E
      Then cell 1 of LEMUR's row holds an E
      And cell 2 of LEMUR's row holds an M
      And the pool hasn't changed

