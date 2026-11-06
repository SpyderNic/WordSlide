# Status: approved by the designer on 2026-11-05.
# Map: docs/milestones/7-worth-playing/m07-01-hints.md
# Unless a scenario says otherwise, the level has the answers ZEBRA, LEMUR and
# KANGAROO, with the final word ELK, and the rows start as LEMUR, ZEBRA, KANGAROO.
# ELK needs ZEBRA on top: ZEBRA's E, LEMUR's L, KANGAROO's K.
# The Letter and Reveal hints pick at random: scenarios check what's true
# whichever they pick, or leave only one choice.

@browser
Feature: Hints, part 1: how they behave
  As a player who's stuck
  I want a hint that helps without solving the level for me
  So that I can keep going

  Rule: Each hint has its own button

    Scenario: Phase one shows the Letter hint above Recall All
      When the level opens
      Then the Letter hint's button is just above Recall All

    Scenario: Phase two shows its hints along the bottom
      When phase two starts
      Then the hint buttons are centred along the bottom of the screen

    Scenario: Hints are free and unlimited for now
      When the player uses the Letter hint 3 times
      Then 3 of LEMUR's cells are locked

  Rule: The Letter hint locks a letter of the selected word, at random

    Scenario: It locks the right letter in one of the row's cells
      When the player uses the Letter hint
      Then one of LEMUR's cells holds its right letter, locked
      And that letter's tile in the pool has one fewer

    Scenario: No letter is lost
      Given LEMUR's row reads U M R E L
      When the player uses the Letter hint
      Then one of LEMUR's cells holds its right letter, locked
      And LEMUR's letters, on the board and in its pool, are still L, E, M, U and R

    Scenario: A right letter already in its cell is kept
      Given L revealed at position 1 of LEMUR
      And E revealed at position 2 of LEMUR
      And M revealed at position 3 of LEMUR
      And LEMUR's row reads L E M U _
      When the player uses the Letter hint
      Then the U is still in LEMUR's fourth cell, and can't be dragged

    Scenario: A locked letter can complete the word
      Given L revealed at position 1 of LEMUR
      And E revealed at position 2 of LEMUR
      And M revealed at position 3 of LEMUR
      And U revealed at position 4 of LEMUR
      When the player uses the Letter hint
      Then LEMUR locks

  # From playing (R13, R14). The tests choose which cell the hint picks.
  Rule: The Letter hint never shakes a row, and its letter travels

    Scenario: A wrong word made by the hint doesn't shake
      Given LEMUR's row reads U E M L _
      And the Letter hint will pick the last cell
      When the player uses the Letter hint
      Then LEMUR's row reads U E M L R
      And LEMUR's row doesn't shake

    Scenario: A letter from the pool travels, even when it completes the word
      Given LEMUR's row reads L E M U _
      And the Letter hint will pick the last cell
      When the player uses the Letter hint
      Then the R travels from the pool to LEMUR's last cell
      And LEMUR locks

  Rule: The Ordering hint puts the rows in order and removes the handles

    Background:
      Given the ceremony has ended

    Scenario: The rows move into the solution's order
      When the player uses the Ordering hint
      Then the rows are ZEBRA, LEMUR, KANGAROO
      And there are no handles
      And the Ordering hint's button is gone
      And the Reveal hint's button shows

    Scenario: Rows already in order just lose their handles
      Given the rows are ZEBRA, LEMUR, KANGAROO with Z, L, K in the column
      When the player uses the Ordering hint
      Then the rows are ZEBRA, LEMUR, KANGAROO
      And there are no handles
      And the Ordering hint's button is gone

    Scenario: Words still slide afterwards
      Given the player has used the Ordering hint
      When the player slides ZEBRA
      Then ZEBRA moves

  Rule: The Reveal hint slides one word to its column letter, in gold

    Background:
      Given a level before the first level that needs reordering, in phase two

    Scenario: Only the Reveal hint shows when the rows can't be reordered
      Then the Reveal hint's button shows
      And there's no Ordering hint button

    Scenario: One word goes to its letter, in gold, and stays there
      When the player uses the Reveal hint
      Then one more word has its column letter in place, in gold
      And that word can't be slid

    # From playing (R12).
    Scenario: The revealed word's other letters fade
      When the player uses the Reveal hint
      Then the revealed word's letters other than the gold one are faded

    Scenario: Revealing every word wins the level
      When the player uses the Reveal hint 3 times
      Then the level is won

    Scenario: Hints don't change the point
      Given the player has 0 points in total
      When the player uses the Reveal hint 3 times
      Then the player has 1 point in total

  Rule: Hints are saved

    Scenario: A locked letter comes back
      Given the player has used the Letter hint
      When the game closes and opens again
      Then the hinted letter is still locked in its cell

    Scenario: A revealed word comes back
      Given a level before the first level that needs reordering, in phase two
      And the player has used the Reveal hint
      When the game closes and opens again
      Then the revealed word is still at its column letter, in gold, and can't be slid

  Rule: The tutorials have no hints

    Scenario: Level 1 has no hint buttons
      Given a new player on level 1
      When the level opens
      Then there are no hint buttons

    Scenario: The reordering tutorial's step has no hint buttons
      Given the first level that needs reordering is a 2-row test level, whose solution needs its top row moved down
      When the ceremony has ended
      Then there are no hint buttons

  # R11 (the buttons pulse with the gentle nudge) waits for M07-06, which isn't built yet.
