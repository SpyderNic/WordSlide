# Status: approved by the designer on 2026-10-31. Q13 and Q14 added on 2026-11-03.
# Map: docs/example-maps/story-15-draft-the-first-levels.md
# The designer plays these levels blind, so these scenarios check the structure
# of the levels and never name their words. Only level 1 is known.

Feature: Draft the first levels
  As the game's designer
  I want a first set of levels to play
  So that I can find out whether the game is fun and how hard it should be

  Rule: Every level passes the validator

    Scenario: The whole set is valid
      When the validator checks all the levels
      Then every level passes

  Rule: Level 1 is the tutorial level

    Scenario: The tutorial's content
      When level 1 is read
      Then its theme is Animals
      And its answers are FOX and OWL
      And its final word is OX
      And it's marked as the tutorial

  Rule: The prototype has 40 levels across 4 themes

    Scenario: The count is right
      When all the levels are counted
      Then there are 40 levels

    Scenario Outline: Each theme has 10 levels in a row
      When levels <from> to <to> are read
      Then all 10 have the theme <theme>

      Examples:
        | from | to | theme   |
        | 1    | 10 | Animals |
        | 11   | 20 | Food    |
        | 21   | 30 | Space   |
        | 31   | 40 | Sports  |

    Scenario: The level number counts straight through
      Given the player has won level 10
      When the next level opens
      Then the level number shows 11

  Rule: Within a theme, every word is unique

    Scenario: No repeats
      When the words in a theme's levels are compared
      Then no answer or final word appears twice

  Rule: Reordering is first needed at level 21, then eases in at each row count (story 21, R6)

    Scenario: Levels 2 to 20 don't need reordering
      When levels 2 to 20 are checked
      Then none of them needs reordering

    Scenario: Level 21 is the reordering tutorial
      When the levels are checked
      Then the first level that needs reordering is level 21

    Scenario: After it, each theme eases in at each row count
      When the Space and Sports levels are checked
      Then in each theme, the first level with each number of rows doesn't need reordering, apart from level 21
      And every other level does

  Rule: Answers grow longer with the rows (Q13)

    Scenario Outline: Answer lengths by rows
      When the levels with <rows> rows are checked
      Then their answers have <shortest> to <longest> letters

      Examples:
        | rows | shortest | longest |
        | 2    | 3        | 5       |
        | 3    | 3        | 5       |
        | 4    | 3        | 6       |
        | 5    | 4        | 7       |

  Rule: Level 21 needs a longer row above a shorter one (Q14)

    Scenario: No way of locking avoids the move
      When level 21 is checked
      Then its solution has a longer word above a shorter one

  Rule: From level 2, no letters are revealed (which levels need reordering is story 21)

    Scenario: Nothing is revealed but special characters
      When levels 2 to 40 are checked
      Then none of them has a revealed letter

  Rule: Rows follow the pattern as far as a theme's words allow

    Scenario: The pattern with no 2-letter final words
      Given a theme with no 2-letter final words left
      Then its levels have 3, 3, 3, 3, 3, 3, 4, 4, 4, 5 rows

    Scenario: The pattern with one 2-letter final word
      Given Animals, whose only 2-letter final word is used by the tutorial
      Then its levels have 2, 3, 3, 3, 3, 3, 4, 4, 4, 5 rows

    Scenario: A theme with no short final words is flagged
      Given a theme with no 2-letter or 3-letter final words
      When the levels are drafted
      Then Claude flags it to the designer
      And those levels have 4 rows

  Rule: A full-screen interstitial shows when the theme changes

    Scenario: The theme changes
      Given the player has won level 10
      When the player presses "Play Level 11"
      Then a full-screen interstitial names the theme Food
      And it fades in and out over about 2 seconds
      And level 11 appears

    Scenario: The theme stays the same
      Given the player has won level 4
      When the player presses "Play Level 5"
      Then no interstitial appears

    Scenario: There's no button
      When the interstitial is showing
      Then it has no button

    Scenario: Input is ignored during the interstitial
      Given the interstitial is showing
      When the player presses a key
      Then nothing changes
