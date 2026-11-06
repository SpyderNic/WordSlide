# Status: approved by the designer on 2026-10-31.
# Map: docs/milestones/4-phase-two/m04-03-reorder-rows.md
# Unless a scenario says otherwise, the level has the answers ZEBRA, LEMUR and
# KANGAROO, phase two has started, every word's first letter is in the column,
# and the rows are LEMUR, ZEBRA, KANGAROO.

@browser
Feature: Reorder rows
  As a player
  I want to drag rows up and down
  So that the letters in the column come in the right order to spell the final word

  Rule: Dragging a handle moves its whole row, up and down only

    Scenario: The row moves with its handle
      When the player drags KANGAROO's handle up
      Then KANGAROO and its handle move up

    Scenario: Sideways movement is ignored
      When the player drags a handle diagonally
      Then the row moves by the up-and-down part only

  Rule: Other rows make way

    Scenario: A passed row moves into the free slot
      When the player drags LEMUR down past ZEBRA
      Then ZEBRA moves up into slot 1

    Scenario: Several rows can make way
      When the player drags KANGAROO to the top
      Then LEMUR and ZEBRA each move down one slot

    Scenario: Rows make way with a quick slide
      When a row makes way
      Then it slides to its new slot in about 0.1 seconds

  Rule: The dragged row is on top and looks raised

    Scenario: The dragged row covers the others
      When KANGAROO passes ZEBRA during a drag
      Then KANGAROO's tiles cover ZEBRA's

    Scenario: The dragged row looks raised
      When the player drags a handle
      Then its row looks slightly raised
      And it looks normal again after release

  Rule: On release, the row snaps into the nearest slot

    Scenario Outline: The nearest slot wins
      When the player releases LEMUR <position>
      Then LEMUR is in slot <slot>

      Examples:
        | position                                  | slot |
        | just before halfway between slots 1 and 2 | 1    |
        | just past halfway between slots 1 and 2   | 2    |

    Scenario: The snap is a quick bounce
      When the player releases a row
      Then it snaps with a bounce-out tween of 0.1 seconds

  Rule: Reordering doesn't change any word's sideways position

    Scenario: Only the column's reading order changes
      Given the column reads L, Z, K
      When the player moves KANGAROO to the top
      Then the column reads K, L, Z

    Scenario: A slid word keeps its position
      Given LEMUR with its M in the column
      When the player moves LEMUR to the bottom
      Then LEMUR still has its M in the column

  Rule: Handles and words don't interfere

    Scenario: Dragging a word never moves its row
      When the player drags a word's tiles upward
      Then its row stays in its slot

    Scenario: Dragging a handle never slides its word
      When the player drags a handle sideways
      Then its word doesn't slide

  Rule: Handles are easy to grab

    Scenario: A handle is at least as large as a tile
      When phase two starts
      Then each handle is at least as large as a tile

    Scenario: A handle shows a grip
      When phase two starts
      Then each handle shows three short horizontal lines

    @touch
    Scenario: A finger can grab a handle on the smallest screen
      Given a screen of 800×450
      When a finger presses a handle
      Then the handle is grabbed
      And the word isn't touched

  Rule: Mouse and touch work the same way, one drag at a time

    Scenario Outline: Both inputs move a row
      When the player drags a handle with a <input>
      Then its row moves

      Examples:
        | input |
        | mouse |

      @touch
      Examples:
        | input  |
        | finger |

    @touch
    Scenario: A second finger on a word is ignored
      Given the player is dragging a handle with one finger
      When a second finger presses a word
      Then that word doesn't move
      And the first drag carries on

    @touch
    Scenario: A second finger on a handle is ignored
      Given the player is sliding a word with one finger
      When a second finger presses a handle
      Then that row doesn't move
      And the first drag carries on

  Rule: A row drag works with keyboard selection like a word slide

    Scenario: A row drag hides the mark
      Given ZEBRA's row is selected
      When the player starts dragging KANGAROO's handle
      Then no row is marked as selected

    Scenario: The selection stays with its word
      Given ZEBRA's row is selected
      When the player moves KANGAROO to the top
      And the player presses Left
      Then ZEBRA's row is marked as selected
      And ZEBRA's row is in slot 3

  Rule: Rotating a device cancels a row drag

    Scenario: Every row goes back
      Given the player is dragging LEMUR's handle
      And ZEBRA has already moved up to make way
      When the device rotates
      Then the drag is cancelled
      And the rows are LEMUR, ZEBRA, KANGAROO

  Rule: Dragging past the top or bottom stretches and springs back

    Scenario Outline: The row stretches and returns
      When the player drags the <row> row further <direction>
      Then it moves a little
      And when released, it springs back to its slot

      Examples:
        | row    | direction |
        | top    | up        |
        | bottom | down      |

  Rule: Shift+Up and Shift+Down move the selected row one slot

    Scenario: Shift+Up moves the row up
      Given ZEBRA's row is selected
      When the player presses Shift+Up
      Then the rows are ZEBRA, LEMUR, KANGAROO
      And ZEBRA's row is still selected

    Scenario: Shift+Down moves the row down
      Given ZEBRA's row is selected
      When the player presses Shift+Down
      Then the rows are LEMUR, KANGAROO, ZEBRA

    Scenario Outline: The row stops at the ends
      Given <row>'s row is selected
      When the player presses <keys>
      Then the rows don't change

      Examples:
        | row      | keys       |
        | LEMUR    | Shift+Up   |
        | KANGAROO | Shift+Down |

    Scenario: With no row selected, Shift+Down selects the top row and moves it
      Given no row is selected
      When the player presses Shift+Down
      Then LEMUR's row is selected
      And the rows are ZEBRA, LEMUR, KANGAROO

    Scenario: With no row selected, Shift+Up selects the top row, which stays
      Given no row is selected
      When the player presses Shift+Up
      Then LEMUR's row is selected
      And the rows don't change
