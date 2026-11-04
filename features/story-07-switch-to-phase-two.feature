# Status: approved by the designer on 2026-10-31.
# Map: docs/example-maps/story-07-switch-to-phase-two.md
# Unless a scenario says otherwise, the level has the answers ZEBRA, LEMUR and
# KANGAROO, and the rows are LEMUR, ZEBRA, KANGAROO.

@browser
Feature: Switch to phase two
  As a player
  I want a short ceremony when all the words are solved
  So that I can see the puzzle change and know that a new challenge has begun

  Rule: The ceremony starts after the last lock

    Scenario: The lock feedback comes first
      Given LEMUR and ZEBRA are locked
      When KANGAROO locks
      Then its lock pulse plays
      And the ceremony starts after that

  Rule: Every word's first letter ends up in the column

    Scenario Outline: Each word moves a different distance
      Given a level containing the answer <answer>
      When the ceremony plays
      Then <answer> moves <distance> cells to the right
      And its first letter ends up in the column

      Examples:
        | answer    | distance |
        | LEMUR     | 2        |
        | ZEBRA     | 2        |
        | KANGAROO  | 3.5      |
        | ICE CREAM | 4        |
        | 'TIS      | 0.5      |

    Scenario: A long word can run off the screen
      Given a small screen
      When the ceremony plays
      Then the end of a long word can be off screen

  Rule: Rows keep their phase-one order, once the reordering tutorial has been shown (changed by story 21)

  Rule: The column appears

    Scenario: The column is centred on the screen
      When the ceremony plays
      Then the column is centred on the screen

    Scenario: The column reads each word's first letter
      When the ceremony plays
      Then the column reads L, Z, K from top to bottom

    Scenario Outline: The column is as tall as the rows
      Given a level with <rows> rows
      When the ceremony plays
      Then the column is one cell wide and <rows> cells tall

      Examples:
        | rows |
        | 3    |
        | 4    |
        | 5    |

    Scenario: The column has a notch at each end
      When the ceremony plays
      Then the column has a down-arrow notch at the top
      And it has an up-arrow notch at the bottom

  Rule: Handles appear last, at the left edge of the screen, once the tutorial has been shown

    Scenario: One handle per row
      When the ceremony ends
      Then there are 3 handles

    Scenario: The handles come after the words stop
      When the ceremony plays
      Then the handles appear once the words have stopped

    Scenario: The handles are in a fixed line
      When the ceremony ends
      Then the handles are in a line at the left edge of the screen
      And each handle is level with its row

  Rule: The pool fades, and the rows move to the vertical centre

    Scenario: The pool goes
      When the ceremony ends
      Then the pool is gone

    Scenario: The rows are centred in the new space
      When the ceremony ends
      Then the rows are vertically centred between the top of the screen and its bottom edge
      And the gaps between the rows haven't changed

    Scenario: Everything but the handles moves together
      When the ceremony plays
      Then the words slide, the rows centre, and the column and pool fade at the same time

  Rule: The top of the screen stays

    Scenario: Nothing changes along the top
      When the ceremony ends
      Then home, level number, theme, points, shop and settings are as they were

  Rule: Phase-one input ends

    Scenario: Recall All is gone
      When the ceremony ends
      Then there's no Recall All button

    # Needs story 17.
    Scenario: No row is selected
      Given KANGAROO's row was selected
      When the ceremony ends
      Then no row is marked as selected

    # Needs story 17.
    Scenario: Letter keys do nothing
      Given the ceremony has ended
      When the player presses a letter key
      Then nothing changes

  Rule: The ceremony takes about a second and ignores input

    Scenario: It's short
      When the ceremony plays
      Then it takes about 1 second

    Scenario: Dragging during the ceremony does nothing
      Given the ceremony is playing
      When the player tries to drag a word
      Then nothing is picked up

  Rule: An instant win comes after the ceremony

    Scenario: The player sees the column spell the word
      Given the answers EMU, LION and KOALA
      And the final word ELK
      And all the words are locked
      When the ceremony ends
      Then the column reads E, L, K
      And the win follows

  Rule: Rotating during the ceremony jumps to the end

    Scenario: The finished layout appears
      Given the ceremony is playing
      When the device rotates
      Then the finished phase-two layout appears for the new orientation
