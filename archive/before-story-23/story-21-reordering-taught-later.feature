# Archived from features/story-21-reordering-taught-later.feature, before story 23 (a pool for each row).
# The game as it was is tagged before-story-23 in git. These scenarios no longer run.

Feature: story-21-reordering-taught-later (archived)

  # Archived for story 23: replaced by R5: same-length words can't be locked the other way round any more.
    @browser
    Scenario: Once reordering is taught, rows keep their phase-one order
      Given the player has been taught reordering
      And a level with two same-length answers
      And they are locked in the other order from the designed one
      When the ceremony ends
      Then the rows are in the order they were locked

  # Archived for story 23: replaced by R5: same-length words can't be locked the other way round any more.
    @browser
    Scenario: Locked so that no move is needed
      Given the first level that needs reordering
      And its same-length words are locked so that the rows spell the final word by sliding
      When the ceremony ends
      Then there's no tutorial text and no hand
      And no row has a handle

  # Archived for story 23: replaced by R5: same-length words can't be locked the other way round any more.
    @browser
    Scenario: The tutorial shows on a later level whose rows need moving
      Given the player locked the first level that needs reordering so that no move was needed
      When the player wins it and the next level, which needs reordering, reaches phase two
      Then the text says "To find the vertical final word, you can reorder the words"

