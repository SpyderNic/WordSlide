# Status: approved by the designer on 2026-10-31.
# Map: docs/milestones/4-phase-two/m04-04-win-check-and-celebration.md
# Unless a scenario says otherwise, the level has the answers ZEBRA, LEMUR and
# KANGAROO, the final word is ELK, and phase two has started.

@browser
Feature: Win check and celebration
  As a player
  I want the game to notice when I've spelled the final word and celebrate it
  So that solving the puzzle feels satisfying

  Rule: The column is checked each time a word or row settles

    Scenario: A word dragged through the winning position doesn't win
      Given the column would spell ELK with ZEBRA's E in place
      When the player drags ZEBRA through that position without releasing it
      Then the level isn't won

    Scenario: A snap can win
      Given the rows are ZEBRA, LEMUR, KANGAROO with Z, L, K in the column
      When the player slides ZEBRA and releases it with its E in the column
      Then the level is won

    Scenario: A row drop can win
      Given the rows are LEMUR, ZEBRA, KANGAROO with L, E, K in the column
      When the player drags ZEBRA's handle to the top row and releases it
      Then the level is won

    Scenario: A keyboard move can win
      Given ZEBRA's row is selected in the top row, with its Z in the column
      And the rest of the column reads L, K
      When the player presses Left
      Then the level is won

    Scenario: A glide wins only when it stops
      Given a flicked word glides through the winning position and stops elsewhere
      Then the level isn't won

  Rule: The level is won when the column spells the final word, by any arrangement

    Scenario: The designed arrangement wins
      Given the rows are ZEBRA, LEMUR, KANGAROO
      When the column reads E, L, K
      Then the level is won

    Scenario Outline: Any arrangement that spells the word wins
      Given the final word is ERA
      And the rows are <rows>
      When the column reads E, R, A
      Then the level is won

      Examples:
        | rows                    |
        | LEMUR, ZEBRA, KANGAROO  |
        | ZEBRA, LEMUR, KANGAROO  |

  Rule: The column is read from top to bottom only

    Scenario: The reverse doesn't win
      When the column reads K, L, E
      Then the level isn't won

  Rule: Letters must match exactly

    Scenario: A plain letter doesn't count as an accented one
      Given the answers CAFÉ, OX and BEE
      And the final word is ÉXE
      When the column reads E, X, É
      Then the level isn't won

  Rule: An already-solved start wins after the ceremony

    Scenario: No move is needed
      Given the answers EMU, LION and KOALA
      And the final word ELK
      When the phase-two ceremony ends
      Then the level is won

  Rule: The column's letters pulse and turn gold

    Scenario: The answer stands out, one letter after another
      When the column spells the final word
      Then the E pulses and turns gold first
      And then the L does
      And then the K does

    Scenario: Each letter turns gold at the biggest point of its pulse
      When the column spells the final word
      Then each letter keeps its colour while it grows
      And turns gold at its biggest

  Rule: The board fades away

    Scenario: The other tiles and handles fade as the top letter turns gold
      When the top letter of the column turns gold
      Then the tiles outside the column start to fade away
      And the handles start to fade away
      And the gold word ends up alone in the column

    Scenario: The gold word and column fade when the popup appears
      When the popup appears
      Then the gold word and the column fade away
      And the top of the screen stays

  Rule: Once the level is won, nothing can be moved

    Scenario Outline: Input does nothing
      Given the level is won
      When the player <action>
      Then nothing moves

      Examples:
        | action                  |
        | tries to drag a word    |
        | presses an arrow key    |

  Rule: A popup follows the celebration

    Scenario: The popup waits for the celebration
      When the column spells the final word
      Then the popup appears about 1.5 seconds later

    Scenario: The popup's contents
      Given the player has won level 4
      When the popup appears
      Then it's in the centre of the screen
      And it shows "Level complete"
      And it shows ELK in gold
      And its button says "Play Level 5"

    Scenario: The button starts the next level
      Given the popup is showing
      When the player presses its button
      Then the next level starts

  Rule: Enter or Space presses the button

    Scenario Outline: The keyboard continues
      Given the popup is showing
      When the player presses <key>
      Then the next level starts

      Examples:
        | key   |
        | Enter |
        | Space |

    Scenario: The keys do nothing before the popup appears
      Given the level is won
      And the popup hasn't appeared yet
      When the player presses Enter
      Then nothing happens

  Rule: Rotating a device jumps to the end of the celebration

    Scenario: The finished celebration appears
      Given the celebration is playing
      When the device rotates
      Then the popup appears for the new orientation
