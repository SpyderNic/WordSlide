# Status: approved by the designer on 2026-10-31, and changed by story 21 on 2026-11-03.
# Map: docs/milestones/5-the-whole-game/story-12-first-level-onboarding.md
# These scenarios use the designer's sample level, which isn't final: the
# answers FOX and OWL, the final word OX, starting as F O _ and O _ L.

@browser
Feature: First-level tutorial
  As a new player
  I want the first level to walk me through each step
  So that I understand the game within a minute without reading instructions

  Background:
    Given a new player on level 1

  Rule: Step 3 is sliding the word (changed by story 21: reordering moved to its own tutorial)

    Background:
      Given the ceremony has ended

    Scenario: The step is shown
      Then the text says "You can drag words side to side to find the word, try it!"
      And a hand animates from the X of FOX to the column

    Scenario: The right move wins
      When the player slides FOX until its X is in the column
      Then the column reads O, X
      And the level is won

    Scenario: Stopping on another letter carries on
      When the player slides FOX and releases it with its O in the column
      Then the O stays in the column
      And the hand carries on

    Scenario Outline: Other moves do nothing
      When the player tries to <action>
      Then nothing moves

      Examples:
        | action            |
        | slide OWL         |

  Rule: The win is the normal win

    Scenario: The tutorial ends
      When the column spells OX
      Then the text and the hand disappear
      And the celebration plays as usual
      And the player has 1 point in total
      And the popup's button says "Play Level 2"

  Rule: Text and hands follow the current step

    Scenario: The text changes straight away
      When the player finishes step 1
      Then step 1's text is gone
      And step 2's text shows

    Scenario Outline: The text stays in one place
      Given step <step> is showing
      Then the text is above the rows and below the theme

      Examples:
        | step |
        | 1    |
        | 2    |
        | 3    |

    # Added on 2026-11-03: the text and the hand stayed where they were after a rotation.
    # The sliding step gets an example once story 21 is built.
    Scenario Outline: The text and the hand follow a rotation
      Given step <step> is showing
      When the device rotates
      Then the text is above the rows and below the theme
      And the text fits on the screen
      And <hand>

      Examples:
        | step | hand                                                                    |
        | 1    | a hand animates between the O in the pool and the top word's first empty cell |
        | 2    | there's no hand                                                         |

    Scenario: The hand repeats until the step is done
      Given step 1 is showing
      When the player waits
      Then the hand animates again after a short pause

    Scenario: The hand stops during a drag
      Given step 1 is showing
      When the player starts dragging the X
      Then the hand stops

  Rule: The game carries on at the same step after reopening

    Scenario: Reopening mid-tutorial
      Given FOX is locked
      When the game closes and opens again
      Then the text says "Each word has its own letters. Finish the grid!"
      And FOX is still locked

  Rule: Recall All doesn't appear, and only the step's letters can be typed

    Scenario: There's no Recall All button
      When the player finishes step 1
      Then there's no Recall All button

    Scenario Outline: Other keys do nothing
      When the player presses <key>
      Then nothing changes

      Examples:
        | key       |
        | W         |
        | Up        |
        | Left      |
        | Backspace |

  Rule: Level 2 highlights the theme once

    Background:
      Given the player has won level 1

    Scenario: The tip shows when level 2 opens
      When level 2 opens
      Then the theme is highlighted
      And the text says "All words in a level relate to a theme."

    Scenario: The tip doesn't restrict the player
      When level 2 opens
      Then every normal action is allowed

    Scenario: Placing a letter doesn't end the tip
      Given the tip is showing
      When the player places a letter
      Then the theme is still highlighted
      And the tip is still showing

    Scenario: Finding the first word ends the tip
      Given the tip is showing
      When the player's first word locks
      Then the theme is no longer highlighted
      And the tip is gone

    Scenario: The tip shows only in level 2
      When level 3 opens
      Then the theme isn't highlighted
      And there's no tip
