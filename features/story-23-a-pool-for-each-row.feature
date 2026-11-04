# Status: approved by the designer on 2026-11-04.
# Map: docs/example-maps/story-23-a-pool-for-each-row.md
# Unless a scenario says otherwise, the level has the answers ZEBRA, LEMUR and
# KANGAROO, and the rows are LEMUR, ZEBRA, KANGAROO.

@browser
Feature: A pool for each row
  As a player
  I want each word to have its own letters
  So that finding the words is a fair challenge and the real puzzle is the vertical word

  Rule: Each row has its own pool

    Scenario: The pool shows the selected row's letters
      When the level opens
      Then LEMUR's row is selected
      And the pool shows E, L, M, R, U

    Scenario Outline: Each row's pool
      When the player selects <word>'s row
      Then the pool shows <pool>

      Examples:
        | word     | pool                         |
        | ZEBRA    | A, B, E, R, Z                |
        | KANGAROO | A x2, G, K, N, O x2, R       |

    Scenario: Revealed letters aren't in the pool
      Given LEMUR with L revealed at position 1
      When the level opens
      Then the pool shows E, M, R, U

    Scenario: A letter with no copies left stays, grey
      When the player places E in LEMUR's row
      Then the pool's E tile is grey and shows x0

  Rule: A row is always selected in phase one

    Scenario: The top unfinished row is selected when a level opens
      Given LEMUR is locked
      When the game closes and opens again
      Then ZEBRA's row is selected

  Rule: Rows that aren't selected and aren't finished are faded

    Scenario: Other unfinished rows are faded
      When the level opens
      Then ZEBRA's and KANGAROO's rows are faded
      And LEMUR's row isn't faded

    Scenario: Locked rows keep their colour
      Given LEMUR is locked
      Then LEMUR's row isn't faded
      And KANGAROO's row is faded

    Scenario: Fading takes about 0.2 seconds
      When the player selects ZEBRA's row
      Then ZEBRA's row comes forward and LEMUR's row fades, both in about 0.2 seconds

  Rule: Selecting a row changes the pool

    Scenario: Tapping a row selects it
      When the player taps ZEBRA's row
      Then ZEBRA's row is selected
      And the pool shows A, B, E, R, Z

    Scenario: Up and Down select rows, skipping locked ones
      Given LEMUR is locked
      And ZEBRA's row is selected
      When the player presses Up
      Then KANGAROO's row is selected

    Scenario: A locked row can't be selected
      Given LEMUR is locked
      When the player taps LEMUR's row
      Then LEMUR's row isn't selected

    Scenario: Placed letters stay, and the pool shows what's left
      Given E and L are placed in LEMUR's row
      When the player selects KANGAROO's row, then LEMUR's row again
      Then E and L are still in LEMUR's row
      And the pool shows M, R, U, with E and L as x0

    Scenario: Letters both pools have glide, the others fade
      When the player selects ZEBRA's row
      # Corrected while building: R is the fourth tile in both pools, so it stays.
      Then E glides to its new place
      And R stays in its place
      And L, M and U fade out
      And A, B and Z fade in
      And the change takes about 0.25 seconds

  Rule: Letters only go into the selected row

    Scenario: A letter dropped on another row goes back to the pool
      When the player drags E from the pool onto ZEBRA's row
      Then ZEBRA's row is still empty
      And E is back in the pool

    Scenario: A placed letter can move within its row
      Given M is placed in LEMUR's first cell
      When the player drags it to LEMUR's third cell
      Then M is in LEMUR's third cell

    Scenario: A placed letter dropped on another row goes back to the pool
      Given M is placed in LEMUR's first cell
      When the player drags it onto ZEBRA's row
      Then ZEBRA's row is still empty
      And M is back in LEMUR's pool

  Rule: A row takes its own answer, or another made of the same letters

    Background:
      Given a level with the answers MEAT and TEAM

    Scenario: Another answer of the same letters locks, and swaps what the rows expect
      When the player spells TEAM in MEAT's row
      Then TEAM locks there
      And the other row now locks with MEAT

    Scenario: An answer already found shows "already found"
      Given TEAM is locked in TEAM's row
      When the player spells TEAM in MEAT's row
      Then "already found" shows
      And the letters stay in place

  Rule: A row locks all at once, or not at all

    Background:
      Given a level containing the answer HOT DOG

    Scenario: A filled part doesn't lock
      When the player places H, O and T in the first three cells of HOT DOG's row
      Then nothing in HOT DOG's row locks
      And no feedback appears

    Scenario: A wrong split word shakes as a whole
      When the player fills HOT DOG's row with HOT GOD
      Then every tile of HOT DOG's row shakes
      And nothing in HOT DOG's row locks

    Scenario: The right split word locks
      When the player fills HOT DOG's row with HOT DOG
      Then HOT DOG's row locks

  Rule: A wrong word shakes, and the selection stays

    Scenario: The row shakes and stays selected
      When the player types L, E, M, R, U
      Then LEMUR's row shakes
      And the letters stay in place
      And LEMUR's row is still selected

  Rule: A word that locks moves the selection on

    Scenario: The next unfinished row below is selected
      When the player spells LEMUR
      Then LEMUR locks
      And ZEBRA's row is selected
      And the pool shows A, B, E, R, Z

    Scenario: After the bottom row, it wraps to the top
      Given ZEBRA is locked
      And KANGAROO's row is selected
      When the player spells KANGAROO
      Then LEMUR's row is selected

  Rule: The keyboard works on the selected row

    Scenario: A key goes to the selected row
      When the player presses M
      Then M is in LEMUR's first cell

    Scenario: A key only in another row's pool does nothing
      When the player presses Z
      Then nothing changes

    Scenario: Backspace takes back the selected row's last letter
      Given E and L are placed in LEMUR's row
      And ZEBRA's row has a placed Z
      When the player presses Backspace
      Then L is back in LEMUR's pool
      And ZEBRA's Z stays

  Rule: Recall All empties the selected row

    Scenario: Only the selected row is emptied
      Given Z is placed in ZEBRA's row
      And L is placed in LEMUR's row
      And ZEBRA's row is selected
      When the player presses Recall All
      Then Z is back in ZEBRA's pool
      And L is still in LEMUR's row

    Scenario: The button is grey when the selected row has nothing to recall
      Given L is placed in LEMUR's row
      When the player selects ZEBRA's row
      Then the Recall All button is grey

  Rule: Saving and reopening keep the board and the selected row

    Scenario: Reopening mid-level
      Given L is placed in LEMUR's row
      And ZEBRA's row is selected
      When the game closes and opens again
      Then L is still in LEMUR's row
      And ZEBRA's row is selected
      And the pool shows A, B, E, R, Z

  Rule: Level 1's tutorial teaches the row's pool

    Background:
      Given a new player on level 1

    Scenario: Level 1 starts with two letters to place in each word
      When the level opens
      Then the rows start as F _ _ and O _ _
      And FOX's row is selected
      And the pool shows O, X

    Scenario: Step 1
      When the level opens
      Then the text says "Drag letters to complete a word"
      And a hand animates between the O in the pool and FOX's first empty cell

    Scenario: Only FOX's letters can be used in step 1
      When the player tries to drag a letter onto OWL's row
      Then nothing is placed in OWL's row

    Scenario: Step 2 points out the new pool
      When the player completes FOX
      Then OWL's row is selected
      And the pool shows L, W
      And the text says "Each word has its own letters. Finish the grid!"
      And there's no hand

    Scenario: Finishing the grid starts phase two
      Given FOX is locked
      When the player completes OWL
      Then the phase-two ceremony plays

  Rule: Phase two doesn't change

    Scenario: The rows keep their length order
      When the player spells every word
      And the ceremony ends
      Then the rows are LEMUR, ZEBRA, KANGAROO
