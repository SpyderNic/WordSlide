# Status: approved by the designer on 2026-10-31.
# Map: docs/example-maps/story-03-place-a-letter.md
# Unless a scenario says otherwise, the level has the answers ZEBRA, LEMUR and
# KANGAROO, nothing is revealed, and the rows are LEMUR, ZEBRA, KANGAROO.
# Story 23 changed this file's examples on 2026-11-04: each row has its own pool, so examples use the row's own letters.

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
      When the player drags U from the pool to cell 1 of LEMUR's row
      Then cell 1 of LEMUR's row holds a U
      And nothing tells the player whether it's right

  Rule: The pool changes as soon as a letter is picked up

    Scenario: Picking up a letter lowers its count
      Given KANGAROO's row is selected
      And the pool shows A x2
      When the player picks up an A
      Then the pool shows A x1
      And another A can still be dragged

    Scenario: Picking up the last copy turns the tile grey
      Given ZEBRA's row is selected
      And the pool shows Z x1
      When the player picks up the Z
      Then the pool shows a grey Z x0

    Scenario: A grey tile can't be dragged
      Given ZEBRA's row is selected
      And the pool shows a grey Z x0
      When the player tries to drag the Z
      Then nothing is picked up

    @browser
    Scenario: Pool tiles and rows stay in place
      Given the positions of every pool tile and row
      When the player places the Z
      Then every pool tile and row is in the same position

  Rule: A pool letter replaces a placed letter

    Scenario: The old letter goes back to the pool
      Given an M placed in cell 1 of LEMUR's row
      When the player drags E from the pool to that cell
      Then that cell holds an E
      And the pool shows M x1
      And the M tile isn't grey

  Rule: A letter dropped on a fixed cell goes to the pool

    Scenario: A pool letter goes back to the pool
      Given L revealed at position 1 of LEMUR
      And the pool shows E x1
      When the player drags E from the pool onto the L
      Then the L is still in its cell
      And the pool shows E x1

    Scenario: A placed letter goes to the pool
      Given a level containing the answer T-REX
      And an R placed in cell 3 of T-REX's row
      When the player drags the R onto the hyphen
      Then cell 3 of T-REX's row is empty
      And the R count goes up by one

  Rule: A pool letter dropped away from any cell goes back to the pool

    Scenario: Releasing a letter over the theme
      Given the pool shows E x1
      When the player drags E from the pool and releases it over the theme
      Then the pool shows E x1
      And no cell has changed

  Rule: Placed letters can move to another empty cell

    Scenario: Moving a placed letter leaves the pool unchanged
      Given an M placed in cell 1 of LEMUR's row
      When the player drags the M to cell 3 of LEMUR's row
      Then cell 1 of LEMUR's row is empty
      And cell 3 of LEMUR's row holds an M
      And the pool shows a grey M x0

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

    @browser
    Scenario: The tile's centre stays on the pointer
      When the player picks up a tile by its corner
      Then the tile moves so that its centre is under the pointer

    @browser
    Scenario: The cell under the tile's centre is highlighted
      When the player drags a tile with its centre over cell 2 of ZEBRA's row, and touching cell 3
      Then cell 2 is highlighted
      And cell 3 isn't highlighted

    @browser
    Scenario: The letter lands in the highlighted cell
      Given a tile with its centre over cell 2 of ZEBRA's row, and touching cell 3
      When the player releases it
      Then the letter lands in cell 2

    @browser
    Scenario: The highlight follows the tile's centre
      Given cell 2 of ZEBRA's row is highlighted
      When the tile's centre moves over cell 3
      Then cell 3 is highlighted
      And cell 2 isn't highlighted

    @browser
    Scenario: A placed letter can be highlighted
      Given an M placed in cell 1 of LEMUR's row
      When the player drags a tile with its centre over that cell
      Then that cell is highlighted

    @browser
    Scenario: A tile away from every cell highlights nothing
      When the player drags a tile over the theme
      Then no cell is highlighted

    @browser
    Scenario: A tile in a gap highlights nothing, even if it touches cells
      Given KANGAROO's row is selected
      And the pool shows A x2
      When the player drags an A with its centre in the gap between two rows, and touching cells in both
      Then no cell is highlighted
      When the player releases it
      Then the pool shows A x2
      And no cell has changed

    @browser
    Scenario: A fixed cell doesn't highlight
      Given L revealed at position 1 of LEMUR
      When the player drags a tile with its centre over the L, and touching cell 2
      Then no cell is highlighted

  Rule: Mouse and touch work the same way, one drag at a time

    @browser
    Scenario Outline: Both inputs place a letter
      When the player drags Z to cell 1 of ZEBRA's row with a <input>
      Then cell 1 of ZEBRA's row holds a Z

      Examples:
        | input |
        | mouse |

      @touch
      Examples:
        | input  |
        | finger |

    @browser @touch
    Scenario: A second finger is ignored during a drag
      Given the player is dragging a letter with one finger
      When a second finger presses a pool tile
      Then nothing else is picked up
      And the first drag carries on

  Rule: Rotating a device keeps placed letters and cancels a drag

    @browser
    Scenario: Placed letters survive a rotation
      Given a Z and an E placed in cells
      When the device rotates
      Then the level is redrawn
      And the Z and E are in the same cells

    @browser
    Scenario: A pool letter being dragged goes back to the pool
      Given KANGAROO's row is selected
      And the pool shows A x2
      And the player is dragging an A from the pool
      When the device rotates
      Then the drag is cancelled
      And the pool shows A x2

    @browser
    Scenario: A placed letter being dragged goes back to its cell
      Given the player is dragging a placed M from cell 1 of LEMUR's row
      When the device rotates
      Then the drag is cancelled
      And the M is back in cell 1 of LEMUR's row
