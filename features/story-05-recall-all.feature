# Status: approved by the designer on 2026-10-31.
# Map: docs/example-maps/story-05-recall-all.md
# Unless a scenario says otherwise, the level has the answers ZEBRA, LEMUR and
# KANGAROO, nothing is revealed, and the rows are LEMUR, ZEBRA, KANGAROO.

Feature: Recall All
  As a player
  I want one button that clears all my placed letters
  So that I can start again without losing the words I've solved

  Rule: Recall All sends every placed letter back to the pool

    Scenario: Letters in several rows go back
      Given a Z placed in LEMUR's row
      And an A and an N placed in KANGAROO's row
      When the player presses Recall All
      Then those three cells are empty

    Scenario: A full row with a wrong word is cleared
      Given ZEBRA's row is full but wrong
      When the player presses Recall All
      Then ZEBRA's row is empty

  Rule: Fixed cells stay as they are

    Scenario: A revealed letter stays
      Given L revealed at position 1 of LEMUR
      And LEMUR's row reads L E Z _ _
      When the player presses Recall All
      Then LEMUR's row reads L _ _ _ _

    Scenario: A locked word stays, and its letters stay out of the pool
      Given LEMUR is locked
      And a Z placed in ZEBRA's row
      When the player presses Recall All
      Then LEMUR is still locked
      And the M count hasn't changed

    Scenario: A special character stays
      Given a level containing the answer T-REX
      And T-REX's row reads T - R _ _
      When the player presses Recall All
      Then T-REX's row reads _ - _ _ _

  Rule: Counts go back up

    Scenario: Each letter goes to its own tile
      Given a Z, an A and an N placed in cells
      And the pool shows a grey Z x0, A x2 and a grey N x0
      When the player presses Recall All
      Then the pool shows Z x1, A x3 and N x1
      And the Z and N tiles aren't grey

  Rule: Pool tiles and rows stay in place

    @browser
    Scenario: Nothing moves
      Given the positions of every pool tile and row
      And a Z placed in a cell
      When the player presses Recall All
      Then every pool tile and row is in the same position

  Rule: The button can't be used during a drag

    @browser @touch
    Scenario: A second finger on the button is ignored
      Given a Z placed in a cell
      And the player is dragging a letter with one finger
      When a second finger presses Recall All
      Then the Z stays in its cell
      And the first drag carries on

  Rule: The button's place and look

    @browser
    Scenario: The button is beside the pool
      When the level opens
      Then the Recall All button is to the right of the pool

    @browser
    Scenario: The button is an icon
      When the level opens
      Then the Recall All button shows two arrows pointing down
      And it has no text

  Rule: With nothing to recall, the button is grey and does nothing

    Scenario: The button is grey when a level opens
      When the level opens
      Then the Recall All button is grey

    Scenario: A grey button does nothing
      Given L revealed at position 1 of LEMUR
      And no placed letters
      When the player presses Recall All
      Then nothing changes

    Scenario: Placing a letter activates the button
      When the player places a letter
      Then the Recall All button is active

    Scenario: The button goes grey again after a recall
      Given a Z placed in a cell
      When the player presses Recall All
      Then the Recall All button is grey

    Scenario: Returning the last placed letter turns the button grey
      Given a Z placed in a cell
      When the player returns the Z to the pool
      Then the Recall All button is grey

  Rule: Recall All happens at once

    Scenario: There's no confirmation
      Given a Z placed in a cell
      When the player presses Recall All
      Then no confirmation appears
      And the Z is back in the pool

  Rule: The selected row doesn't change

    # Needs story 17.
    Scenario: A selected row stays selected
      Given ZEBRA's row reads Z E _ _ _
      And ZEBRA's row is selected
      When the player presses Recall All
      Then ZEBRA's row is still selected
      And the next input goes to its cell 1

    # Needs story 17.
    Scenario: A hidden selection stays hidden
      Given ZEBRA's row was selected before a drag
      And a letter was placed by that drag
      When the player presses Recall All
      Then no row is marked as selected
      When the player taps E in the pool
      Then ZEBRA's row is marked as selected
