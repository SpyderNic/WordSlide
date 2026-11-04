# Status: approved by the designer on 2026-11-03, and changed after playing (Q12).
# Map: docs/example-maps/story-21-reordering-taught-later.md
# Level 1 is the tutorial level: the answers FOX and OWL, and the final word OX,
# starting as F O _ and O _ L. Other levels are test levels, arranged so that
# the first level needing reordering falls where each scenario needs it. No
# scenario depends on the prototype's levels or on a level number (D46, R1).

Feature: Reordering is taught later
  As a new player
  I want to learn one move at a time
  So that the early levels stay simple and reordering arrives as something new

  Rule: The reordering tutorial shows on the first level whose rows, as locked, need moving

    @browser
    Scenario: No handles before it
      Given a level before the first level that needs reordering
      When phase two starts
      Then no row has a handle

    @browser
    Scenario: Without handles, rows can't move by keyboard
      Given a level before the first level that needs reordering, in phase two
      And a row is selected
      When the player presses Shift+Up
      Then the rows don't change

    @browser
    Scenario: Handles from the tutorial on
      Given the first level that needs reordering
      When phase two starts
      Then every row has its handle

    @browser
    Scenario: Handles once reordering is taught, even where it isn't needed
      Given the player has been taught reordering
      And a level that doesn't need reordering
      When phase two starts
      Then every row has its handle

    Scenario: The tutorial follows the content
      Given levels where the first that needs reordering is the 3rd
      When the 2nd level changes so that it needs reordering
      Then the 2nd level is the reordering tutorial

  Rule: Before reordering is taught, the ceremony puts the rows in the designed order

    @browser
    Scenario: Same-length rows swap during the ceremony
      Given a new player on level 1
      And FOX and OWL are locked as FOX, OWL
      When the ceremony ends
      Then the rows are OWL, FOX
      And the column reads O, F

    @browser
    Scenario: The rows glide with the words
      Given a new player on level 1
      And FOX and OWL are locked as FOX, OWL
      When the ceremony plays
      Then the rows move into place at the same time and speed as the words left-align

    @browser
    Scenario: Rows already in the designed order stay
      Given a level before the first level that needs reordering, with two same-length answers
      And they are locked in the designed order
      When the ceremony ends
      Then the rows haven't changed order

  Rule: Level 1 teaches completing a word, finishing the grid and sliding the word

    @browser
    Scenario: The slide step follows the ceremony
      Given a new player on level 1
      When the ceremony has ended
      Then the rows are OWL, FOX
      And there are no handles
      And the text says "You can drag words side to side to find the word, try it!"
      And a hand animates from the X of FOX to the column

    @browser
    Scenario: Sliding FOX wins
      Given a new player on level 1
      And the ceremony has ended
      When the player slides FOX until its X is in the column
      Then the column reads O, X
      And the level is won

  Rule: The reordering tutorial is strict, and only in phase two

    Background:
      Given the first level that needs reordering is a 2-row test level, whose solution needs its top row moved down

    @browser
    Scenario: Phase one plays normally
      When the level opens
      Then there's no tutorial text and no hand
      And every phase-one action is allowed

    @browser
    Scenario: The step is shown after the ceremony
      When the ceremony has ended
      Then the text says "To find the vertical final word, you can reorder the words"
      And a hand starts on the top row's handle and shows the row being dragged down

    @browser
    Scenario Outline: Other moves do nothing
      Given the ceremony has ended
      When the player tries to <action>
      Then nothing moves

      Examples:
        | action                       |
        | drag the bottom row's handle |
        | slide the top word           |
        | slide the bottom word        |

    @browser
    Scenario: The right move ends the tutorial
      Given the ceremony has ended
      When the player drags the top row's handle down
      Then the rows have swapped
      And the text and the hand disappear

    @browser
    Scenario: After the move, the player plays freely
      Given the player has made the shown move
      When the player slides a word
      Then the word slides
      And the player can drag either handle

  Rule: Reopening mid-tutorial carries on at the same step

    @browser
    Scenario: Reopening at the reordering step
      Given the reordering tutorial's ceremony has ended
      When the game closes and opens again
      Then the text says "To find the vertical final word, you can reorder the words"
      And the hand shows the row being dragged down

  Rule: A level needs reordering if its starting order can't spell the final word

    Scenario: Rows that spell it in length order
      Given a level whose rows, in length order, spell the final word by sliding
      Then it doesn't need reordering

    Scenario: Two same-length rows the other way round
      Given a level that can only be solved with two same-length rows swapped
      Then it needs reordering

    Scenario: A longer row above a shorter one
      Given a level that can only be solved with a longer row above a shorter one
      Then it needs reordering

    Scenario: Level 1 never counts
      Given the levels start with the FOX, OWL and OX tutorial, followed by a level that needs reordering
      Then the 2nd level is the reordering tutorial

  Rule: On a level that needs several moves, the hand shows the first

    Background:
      Given the first level that needs reordering is a 3-row test level, whose solution needs the top row moved to the bottom and then the new top two rows swapped

    @browser
    Scenario: The hand shows the top-most row that's out of place
      When the ceremony has ended
      Then a hand starts on the top row's handle and shows it being dragged to the bottom

    @browser
    Scenario: After the first move, the player makes the rest freely
      Given the player has made the shown move
      When the player swaps the top two rows
      Then the rows are in the solution's order

  Rule: If the player's rows don't need moving, the tutorial waits (Q12)

    @browser
    Scenario: Making the move teaches reordering for good
      Given the reordering tutorial's ceremony has ended
      And the player has made the shown move
      When the player wins the level and the next level reaches phase two
      Then every row has its handle
      And there's no tutorial text and no hand

    @browser
    Scenario: Reopening after the move
      Given the reordering tutorial's ceremony has ended
      And the player has made the shown move
      When the game closes and opens again
      Then every row has its handle
      And there's no tutorial text and no hand

  # The planned content (R6) is checked in story 15.
