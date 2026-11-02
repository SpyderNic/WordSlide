# Status: approved by the designer on 2026-10-31.
# Map: docs/example-maps/story-16-visual-style.md
# A look can't be fully tested automatically. These scenarios cover what can be
# checked, and the designer judges the rest by eye.

Feature: Visual style
  As a player
  I want the game to look calm, clear and satisfying
  So that it's pleasant to spend time with

  Rule: Style never changes the rules

    Scenario: The other stories' scenarios pass with a different style
      Given the style's colours are changed
      When every approved scenario runs
      Then they all pass

  Rule: Colours, fonts, sizes and timings live in one style

    @browser
    Scenario Outline: One change applies everywhere
      When the <setting> is changed in the style file
      Then every use of it changes

      Examples:
        | setting             |
        | gold colour         |
        | tile font           |
        | letter travel time  |

    @browser
    Scenario: A second style can be added
      When a second style file is added
      Then the game can use it with no change to its rules or code

  Rule: Every tile state looks different at a glance

    Scenario: The states have different looks
      Then pool, grey x0, placed, revealed, locked and gold tiles each have their own look

    Scenario: A highlight stands out from the tiles
      Then the target highlight and the selected row each have their own look

  Rule: Text stays readable on the smallest screen

    @browser
    Scenario: Counts can be read at 800×450
      Given a screen of 800×450
      When a level opens
      Then the pool counts are at least the minimum readable size

  Rule: Colour isn't the only signal

    @browser
    Scenario: A grey tile still shows its count
      When a letter has no copies left
      Then its tile shows x0

  Rule: Letters travel between the pool and the cells

    @browser
    # Needs story 17.
    Scenario: A tapped letter travels to its cell
      Given a row is selected
      When the player taps a letter in the pool
      Then the letter travels to its cell in about 0.15 seconds

    @browser
    # Needs story 17.
    Scenario: Fast typing doesn't wait for the animation
      Given ZEBRA's row is selected
      When the player quickly types ZEBRA
      Then every letter counts as placed straight away
      And the letters arrive in order

    @browser
    Scenario Outline: Letters travel back to the pool
      When a letter goes back to the pool through <cause>
      Then it travels back to its tile

      Examples:
        | cause                      |
        | Recall All                 |
        | Backspace                  |
        | a hint leaving its row     |
        | a drop on a fixed cell     |

    @browser
    Scenario: A letter going back counts when it lands
      Given a Z placed in a cell
      When the player presses Recall All
      Then the Z tile shows x0 until the Z lands
      And then it shows x1

    @browser
    Scenario: A letter leaving the pool counts as it leaves
      Given a row is selected
      When the player taps the Z in the pool
      Then the Z tile shows x0 straight away

    @browser
    Scenario: Several letters go back one after another
      Given letters placed in three cells
      When the player presses Recall All
      Then they leave one after another, 0.03 seconds apart, from the top row down

    @browser
    Scenario: A dragged letter travels from where it was dropped
      When the player releases a letter with its centre over a cell
      Then it travels from there into the cell

    @browser
    Scenario: A letter dropped away from a cell travels to the pool
      When the player releases a letter away from any cell
      Then it travels from there to its tile in the pool

  Rule: The look is warm wood and brass, drawn in code

    @browser
    Scenario: Tiles look raised
      Given a Z placed in a cell
      Then its tile's top and left edges are lighter than it
      And its bottom and right edges are darker

    @browser
    Scenario: Words slide under the column's sides
      Given phase two has started
      Then the column's sides are drawn above the words
      And its tinted strip is drawn behind them

    Scenario: The prototype needs no image files
      When the game is built
      Then it contains no art images

  Rule: The font is bundled, with an open licence

    Scenario: The font ships with the game
      When the game is built
      Then it includes the font and its licence
