# Archived from features/story-12-first-level-tutorial.feature, before story 23 (a pool for each row).
# The game as it was is tagged before-story-23 in git. These scenarios no longer run.

Feature: story-12-first-level-tutorial (archived)

  # Archived for story 23: replaced by R11: level 1 starts as F _ _ and O _ _.
  Rule: Step 1 is completing a word

    Scenario: The step is shown
      When the level opens
      Then the text says "Drag a letter to complete a word"
      And a hand animates between the X in the pool and the top word's empty cell

    Scenario: The right move locks the word
      When the player drags the X to the top word's empty cell
      Then FOX locks

    Scenario: The X dropped elsewhere goes back
      When the player drags the X and releases it anywhere else
      Then the X is back in the pool
      And the text says "Drag a letter to complete a word"

    Scenario: The W can't be dragged yet
      When the player tries to drag the W
      Then nothing is picked up

  # Archived for story 23: replaced by R11.
  Rule: Step 2 is finishing the grid

    Background:
      Given FOX is locked

    Scenario: The text changes, with no hand
      Then the text says "Finish the grid!"
      And there's no hand

    Scenario: Finishing the grid starts phase two
      When the player drags the W to the last empty cell
      Then OWL locks
      And the phase-two ceremony plays

  # Archived for story 23: replaced by R11: FOX now needs two letters.
    Scenario: Typing the X completes the word
      When the player presses X
      Then FOX locks

  # Archived for story 23: replaced by R11: OWL now needs two letters.
    Scenario: Typing the W finishes the grid
      Given FOX is locked
      When the player presses W
      Then OWL locks

  # Archived for story 23: replaced by R11: OWL now needs two letters.
    Scenario: Tapping the W finishes the grid
      Given FOX is locked
      When the player taps the W in the pool
      Then OWL locks

  # Archived for story 23: replaced by R11: FOX now needs two letters.
    Scenario: Tapping the X completes the word
      When the player taps the X in the pool
      Then FOX locks

