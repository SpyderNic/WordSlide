# Status: approved by the designer on 2026-10-31.
# Map: docs/example-maps/story-03-place-a-letter.md
# Unless a scenario says otherwise, the level has the answers ZEBRA, LEMUR and
# KANGAROO, nothing is revealed, and the rows are LEMUR, ZEBRA, KANGAROO.

Feature: Place a letter
  As a player
  I want to drag letters from the pool into any empty cell
  So that I can try out words and use the changing pool to work out the rest

  Rule: A letter can go in any empty cell, in any order

    Scenario: A dragged letter lands in an empty cell
      When the player drags Z from the pool to cell 1 of ZEBRA's row
      Then cell 1 of ZEBRA's row holds a Z

    Scenario: The player can fill cells in any order
      When the player drags A from the pool to cell 5 of KANGAROO's row
      And the player drags E from the pool to cell 2 of LEMUR's row
      Then cell 5 of KANGAROO's row holds an A
      And cell 2 of LEMUR's row holds an E

    Scenario: A wrong letter stays, with no feedback
      When the player drags Z from the pool to cell 3 of LEMUR's row
      Then cell 3 of LEMUR's row holds a Z
      And nothing tells the player whether it's right

  Rule: The pool changes as soon as a letter is picked up

    Scenario: Picking up a letter lowers its count
      Given the pool shows A x3
      When the player picks up an A
      Then the pool shows A x2
      And another A can still be dragged

    Scenario: Picking up the last copy turns the tile grey
      Given the pool shows Z x1
      When the player picks up the Z
      Then the pool shows a grey Z x0

    Scenario: A grey tile can't be dragged
      Given the pool shows a grey Z x0
      When the player tries to drag the Z
      Then nothing is picked up

    Scenario: Pool tiles and rows stay in place
      Given the positions of every pool tile and row
      When the player places the Z
      Then every pool tile and row is in the same position

  Rule: A pool letter replaces a placed letter

    Scenario: The old letter goes back to the pool
      Given a Z placed in cell 1 of LEMUR's row
      When the player drags E from the pool to that cell
      Then that cell holds an E
      And the pool shows Z x1
      And the Z tile isn't grey

  Rule: Two placed letters swap

    Scenario: Dropping a placed letter on another swaps them
      Given a Z placed in cell 1 of LEMUR's row
      And an E placed in cell 1 of ZEBRA's row
      When the player drags the Z onto the E
      Then cell 1 of LEMUR's row holds an E
      And cell 1 of ZEBRA's row holds a Z
      And the pool hasn't changed

  Rule: A letter dropped on a fixed cell goes back where it came from

    Scenario: A pool letter goes back to the pool
      Given L revealed at position 1 of LEMUR
      And the pool shows A x3
      When the player drags A from the pool onto the L
      Then the L is still in its cell
      And the pool shows A x3

    Scenario: A placed letter goes back to its cell
      Given a level containing the answer T-REX
      And a T placed in cell 1 of T-REX's row
      When the player drags the T onto the hyphen
      Then the T is back in cell 1
      And the pool hasn't changed

  Rule: A pool letter dropped away from any cell goes back to the pool

    Scenario: Releasing a letter over the theme
      Given the pool shows A x3
      When the player drags A from the pool and releases it over the theme
      Then the pool shows A x3
      And no cell has changed

  Rule: Placed letters can move to another empty cell

    Scenario: Moving a placed letter leaves the pool unchanged
      Given a Z placed in cell 1 of LEMUR's row
      When the player drags the Z to cell 1 of ZEBRA's row
      Then cell 1 of LEMUR's row is empty
      And cell 1 of ZEBRA's row holds a Z
      And the pool shows a grey Z x0

  Rule: Revealed letters and special characters can't be moved

    Scenario: A revealed letter can't be picked up
      Given L revealed at position 1 of LEMUR
      When the player tries to drag the L
      Then nothing is picked up

    Scenario: A special character can't be picked up
      Given a level containing the answer T-REX
      When the player tries to drag the hyphen
      Then nothing is picked up

  Rule: The dragged tile shows where the letter will land

    Scenario: The tile's centre stays on the pointer
      When the player picks up a tile by its corner
      Then the tile moves so that its centre is under the pointer

    Scenario: The cell overlapping the tile the most is highlighted
      When the player drags a tile mostly over cell 2 of ZEBRA's row, and slightly over cell 3
      Then cell 2 is highlighted
      And cell 3 isn't highlighted

    Scenario: The letter lands in the highlighted cell
      Given a tile mostly over cell 2 of ZEBRA's row, and slightly over cell 3
      When the player releases it
      Then the letter lands in cell 2

    Scenario: The highlight follows the tile
      Given cell 2 of ZEBRA's row is highlighted
      When the tile moves until cell 3 overlaps it the most
      Then cell 3 is highlighted
      And cell 2 isn't highlighted

    Scenario: A placed letter can be highlighted
      Given a Z placed in cell 1 of LEMUR's row
      When the player drags a tile mostly over that cell
      Then that cell is highlighted

    Scenario: A tile touching no cell highlights nothing
      When the player drags a tile over the theme
      Then no cell is highlighted

    Scenario: A fixed cell wins but doesn't highlight
      Given L revealed at position 1 of LEMUR
      When the player drags a tile mostly over the L, and slightly over cell 2
      Then no cell is highlighted

    Scenario: A tie between rows goes to the upper cell
      When the player drags a tile that overlaps cells in two rows exactly equally
      Then the upper cell is highlighted

    Scenario: A tie within a row goes to the left cell
      When the player drags a tile that overlaps two cells in one row exactly equally
      Then the left cell is highlighted

  Rule: Mouse and touch work the same way, one drag at a time

    Scenario Outline: Both inputs place a letter
      When the player drags Z to cell 1 of ZEBRA's row with a <input>
      Then cell 1 of ZEBRA's row holds a Z

      Examples:
        | input  |
        | mouse  |
        | finger |

    Scenario: A second finger is ignored during a drag
      Given the player is dragging a letter with one finger
      When a second finger presses a pool tile
      Then nothing else is picked up
      And the first drag carries on

  Rule: Rotating a device keeps placed letters and cancels a drag

    Scenario: Placed letters survive a rotation
      Given a Z and an E placed in cells
      When the device rotates
      Then the level is redrawn
      And the Z and E are in the same cells

    Scenario: A pool letter being dragged goes back to the pool
      Given the pool shows A x3
      And the player is dragging an A from the pool
      When the device rotates
      Then the drag is cancelled
      And the pool shows A x3

    Scenario: A placed letter being dragged goes back to its cell
      Given the player is dragging a placed Z from cell 1 of LEMUR's row
      When the device rotates
      Then the drag is cancelled
      And the Z is back in cell 1 of LEMUR's row
