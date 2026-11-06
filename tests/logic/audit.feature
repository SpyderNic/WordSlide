# Added by the test audit. This isn't a designed story: these rules can't be
# reached by playing yet, so they're checked on the game's rules directly.

Feature: Rules the screen can't reach yet

  Scenario: Recall All does nothing while a letter is held
    Given a Z held from the pool and an A placed
    When Recall All is asked for
    Then the A stays placed
    And the Z is still held

  # D45: handles only appear once the reordering tutorial has been shown. Nothing turns
  # this off until M05-03, so only the rule can be checked, not the screen.
  Scenario: Shift and an arrow don't move rows before the reordering tutorial
    Given phase two before the reordering tutorial, with the top row selected
    When the player presses Shift and Down
    Then the rows haven't moved
