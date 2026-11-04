# Status: approved by the designer on 2026-10-31. "The next input can fill it" needs story 17.
# Map: docs/example-maps/story-04-return-a-letter.md
# Unless a scenario says otherwise, the level has the answers ZEBRA, LEMUR and
# KANGAROO, nothing is revealed, and the rows are LEMUR, ZEBRA, KANGAROO.
# Story 23 changed this file's examples on 2026-11-04: each row has its own pool, so examples use the row's own letters.

Feature: Return a single letter
  As a player
  I want to take a placed letter back to the pool
  So that I can change my mind without wasting letters

  Rule: A placed letter that doesn't land on a cell goes back to the pool

    @browser
    Scenario Outline: The letter leaves the board
      Given an M placed in cell 1 of LEMUR's row
      And R revealed at position 4 of ZEBRA
      When the player drags the M and releases it <place>
      Then cell 1 of LEMUR's row is empty
      And the pool shows M x1

      Examples:
        | place                       |
        | over the pool               |
        | over the theme              |
        | in the gap between two rows |
        | on the revealed R           |

    @browser
    Scenario: The pool wins even if the tile touches the bottom row
      Given an M placed in cell 1 of LEMUR's row
      When the player drags the M with its centre over the pool, and touching KANGAROO's row
      And the player releases it
      Then no cell of KANGAROO's row has changed
      And the pool shows M x1

  Rule: The count goes up when the letter is dropped

    Scenario: Picking up a placed letter leaves the count alone
      Given KANGAROO's row is selected
      And the pool shows A x1
      And an A placed in a cell
      When the player picks up the placed A
      Then the pool shows A x1

    Scenario: Dropping it raises the count
      Given KANGAROO's row is selected
      And the pool shows A x1
      And the player is dragging a placed A
      When the player releases it over the pool
      Then the pool shows A x2

  Rule: A letter goes back to its own tile

    Scenario: Dropping on another tile changes nothing but its own count
      Given ZEBRA's row is selected
      And a Z placed in a cell
      And the pool shows A x1
      When the player drags the Z and releases it on the A tile
      Then the pool shows Z x1
      And the pool shows A x1

    Scenario: A grey tile becomes active again
      Given ZEBRA's row is selected
      And a Z placed in a cell
      And the pool shows a grey Z x0
      When the player returns the Z to the pool
      Then the pool shows Z x1
      And the Z tile isn't grey
      And the Z can be dragged again

  Rule: The emptied cell can be used again

    Scenario: Another letter can be dropped there
      Given an M placed in cell 1 of LEMUR's row
      When the player returns the M to the pool
      And the player drags L from the pool to cell 1 of LEMUR's row
      Then cell 1 of LEMUR's row holds an L

    Scenario: The next input can fill it
      Given LEMUR's row reads M E _ _ _
      And LEMUR's row is selected
      When the player returns the M to the pool
      And the player taps L in the pool
      Then LEMUR's row reads L E _ _ _

  Rule: A letter's own cell counts as empty during its drag

    Scenario: Dropping a letter back on its own cell
      Given an M placed in cell 1 of LEMUR's row
      When the player picks up the M and releases it over cell 1 of LEMUR's row
      Then cell 1 of LEMUR's row holds an M
      And the pool shows a grey M x0

  Rule: Fixed cells can't be returned

    Scenario: A revealed letter can't be picked up
      Given L revealed at position 1 of LEMUR
      When the player tries to drag the L
      Then nothing is picked up

    Scenario: A locked word's letter can't be picked up
      Given LEMUR is locked
      When the player tries to drag one of its letters
      Then nothing is picked up

  Rule: The letter's own tile highlights over the pool

    @browser
    Scenario: The tile highlights wherever the pointer is in the pool
      Given the player is dragging a placed Z
      When the pointer is over any part of the pool
      Then the Z tile is highlighted
      And no other tile is highlighted

    @browser
    Scenario: A grey tile highlights too
      Given ZEBRA's row is selected
      And the pool shows a grey Z x0
      And the player is dragging a placed Z
      When the pointer is over the pool
      Then the grey Z tile is highlighted

    @browser
    Scenario: The highlight ends when the pointer leaves the pool
      Given the Z tile is highlighted
      When the pointer moves away from the pool
      Then the Z tile isn't highlighted
