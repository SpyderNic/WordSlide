# Status: approved by the designer on 2026-11-04.
# Map: docs/example-maps/story-24-after-playing-story-23.md
# Unless a scenario says otherwise, the level has the answers ZEBRA, LEMUR and
# KANGAROO, and the rows are LEMUR, ZEBRA, KANGAROO.

@browser
Feature: Changes after playing story 23
  As a player
  I want level 1 and the rows to behave the way the per-row pool suggests
  So that the game feels natural from the first minute

  Rule: Step 1 shows each letter in turn, and only that move works

    Background:
      Given a new player on level 1

    Scenario: The hand shows the O first
      When the level opens
      Then a hand animates between the O in the pool and FOX's second cell

    Scenario: The O can't go in the third cell
      When the player drags the O onto FOX's third cell
      Then FOX's third cell is empty
      And the pool shows O, X

    Scenario: Then the hand shows the X
      Given the O is in FOX's second cell
      Then a hand animates between the X in the pool and FOX's third cell

    Scenario Outline: Typing and tapping follow the same order
      When the player <input> the X first
      Then nothing is placed in FOX's row

      Examples:
        | input   |
        | presses |
        | taps    |

  Rule: OWL's step lets the player make mistakes, and fix them

    Background:
      Given a new player on level 1
      And FOX is locked

    Scenario: A letter can go in the wrong cell
      When the player drags the L to OWL's second cell
      Then the L is in OWL's second cell

    Scenario: A full wrong row shakes
      Given the L is in OWL's second cell
      When the player drags the W to OWL's third cell
      Then OWL's row shakes

    Scenario: Moving a letter along the row fixes it
      Given OWL's row reads O L W
      When the player drags the W onto the L
      Then OWL locks

    Scenario: Backspace takes a letter back
      Given the L is in OWL's second cell
      When the player presses Backspace
      Then OWL's second cell is empty

  Rule: Level 1's slide step can be played with the keyboard

    Background:
      Given a new player on level 1
      And the ceremony has ended

    Scenario: The arrow keys slide FOX
      When the player uses the keys Down, Down, Left
      Then FOX slides one letter

    Scenario: Sliding FOX's X into the column wins
      When the player uses the keys Down, Down, Left, Left
      Then the level is won

    Scenario: OWL still can't slide
      When the player uses the keys Down, Left
      Then nothing moves

  Rule: The reordering tutorial can be played with the keyboard too

    Background:
      Given the first level that needs reordering is a 2-row test level, whose solution needs its top row moved down
      And the ceremony has ended

    Scenario: Shift and an arrow make the shown move
      When the player uses the keys Down, Shift+Down
      Then the rows have swapped
      And the text and the hand disappear

    Scenario: Any other row move does nothing
      When the player uses the keys Down, Down, Shift+Up
      Then nothing moves

    Scenario: Left and Right don't slide before the move
      When the player uses the keys Down, Left
      Then nothing moves

  Rule: A dragged letter only highlights cells in its own row

    Scenario: A faded row doesn't highlight
      When the player drags E from LEMUR's pool over ZEBRA's row
      Then no cell is highlighted

  Rule: A small pool sits on one line

    Scenario: Level 1's pool is on one line
      Given a new player on level 1
      When the level opens
      Then the pool's tiles are side by side, on one line

    # A row has at most eight cells, so only a word of eight different letters can need two lines.
    Scenario: A pool too wide for one line fills the first line first
      Given a level containing the answer DOLPHINS
      And a narrow screen
      When the player selects DOLPHINS's row
      Then the pool's first line is full before the next one starts

  Rule: A placed letter dragged along its row makes the others move aside

    Scenario Outline: Letters shift over
      Given LEMUR's row reads <before>
      When the player drags the <letter> onto the <target>
      Then LEMUR's row reads <after>

      Examples:
        | before    | letter | target | after     |
        | U L E M _ | U      | M      | L E M U _ |
        | L E M U _ | U      | L      | U L E M _ |

    Scenario: A letter dropped on an empty cell just moves there
      Given LEMUR's row reads M E _ _ _
      When the player drags the M to LEMUR's fourth cell
      Then LEMUR's row reads _ E _ M _

    Scenario: Letters slide aside during the drag
      Given LEMUR's row reads U L E M _
      When the player holds the U over the M
      Then L, E and M slide one cell left in about 0.1 seconds

    # From playing: the letters that moved aside travelled again from their old cells.
    Scenario: Letting go, only the dragged letter travels
      Given LEMUR's row reads U L E M _
      And the player is holding the U over the M
      When the player lets go of it
      Then only the U travels to its cell
      And L, E and M stay where they are

    # From playing: a letter moving aside slid under the cells it passed over.
    Scenario: Letters moving aside slide above the other cells
      Given LEMUR's row reads U L E M _
      When the player holds the U over the M
      Then L, E and M are drawn above the cells they slide over

    # From playing: the empty cells between slid along with the letters.
    Scenario: Empty cells don't move aside
      Given LEMUR's row reads M _ _ L _
      When the player holds the M over the L
      Then the L slides one cell left
      And no empty cell moves

    Scenario: A revealed letter doesn't move
      Given L revealed at position 1 of LEMUR
      And LEMUR's row reads L U E M _
      When the player drags the U onto the M
      Then LEMUR's row reads L E M U _

    Scenario: A special character is jumped
      Given a level containing the answer HOT DOG
      And HOT DOG's row reads H O T ␣ D G O
      When the player drags the last O onto the H
      Then HOT DOG's row reads O H O ␣ T D G
