# Status: approved by the designer on 2026-10-31.
# Map: docs/example-maps/story-08-slide-a-word.md
# Unless a scenario says otherwise, the level has the answers ZEBRA, LEMUR and
# KANGAROO, phase two has started, every word's first letter is in the column,
# and the rows are LEMUR, ZEBRA, KANGAROO.

@browser
Feature: Slide a word horizontally
  As a player
  I want to slide a solved word left and right
  So that I can bring the letter I need into the column

  Rule: The player can grab any part of a word

    Scenario Outline: The whole word moves
      When the player grabs LEMUR by its <letter> and drags left
      Then all 5 tiles move together

      Examples:
        | letter |
        | L      |
        | M      |
        | R      |

  Rule: A word moves only left and right, following the pointer

    Scenario: Up and down movement is ignored
      When the player drags LEMUR diagonally
      Then it moves by the sideways part only
      And it stays in its row

    Scenario: The word follows the pointer smoothly
      When the player drags LEMUR slowly to the left
      Then it moves with the pointer, not in cell-sized steps

  Rule: A word can't slide past its first or last letter

    Scenario Outline: The range depends on the letter in the column
      Given LEMUR with its <letter> in the column
      Then it can slide up to <left> cells left
      And it can slide up to <right> cells right

      Examples:
        | letter | left | right |
        | L      | 4    | 0     |
        | E      | 3    | 1     |
        | M      | 2    | 2     |
        | U      | 1    | 3     |
        | R      | 0    | 4     |

    Scenario: A long word has a long range
      Given KANGAROO with its K in the column
      Then it can slide up to 7 cells left

    Scenario Outline: The range ends at a letter, not a special character
      Given a level containing the answer <answer>
      Then its range ends at its <end>

      Examples:
        | answer  | end   |
        | 'TIS    | T     |
        | ROCKIN' | N     |

  Rule: On release, the word snaps to its nearest letter

    Scenario: The nearest letter snaps into the column
      When the player releases LEMUR with its E nearly in the column
      Then the E is exactly in the column

    Scenario: The snap is a quick bounce
      When the player releases a word
      Then it snaps with a bounce-out tween of 0.1 seconds

  Rule: Only a letter can stop in the column

    Scenario Outline: A word passes over a special character
      Given a level containing the answer HOT DOG
      When the player releases it with its space in the column, slightly nearer its <nearest>
      Then its <nearest> is exactly in the column

      Examples:
        | nearest |
        | T       |
        | D       |

  Rule: Only the dragged word moves

    Scenario: The other rows stay
      When the player slides ZEBRA
      Then LEMUR and KANGAROO stay where they are

  Rule: Words may go off screen

    Scenario: A word off screen can still be grabbed
      Given a small screen
      And KANGAROO with its last O in the column
      Then most of KANGAROO is off the left of the screen
      And the O can still be grabbed

  Rule: Mouse and touch work the same way, one drag at a time

    Scenario Outline: Both inputs slide a word
      When the player slides LEMUR left with a <input>
      Then LEMUR moves

      Examples:
        | input |
        | mouse |

      @touch
      Examples:
        | input  |
        | finger |

    @touch
    Scenario: A second finger is ignored
      Given the player is sliding LEMUR with one finger
      When a second finger presses ZEBRA
      Then ZEBRA doesn't move
      And the first slide carries on

  Rule: Rotating a device cancels a slide

    Scenario: The word goes back
      Given LEMUR with its L in the column
      And the player is sliding LEMUR
      When the device rotates
      Then the slide is cancelled
      And LEMUR has its L in the column

  Rule: Tapping a word does nothing

    Scenario: A tap leaves the word where it is
      When the player presses and releases LEMUR without moving
      Then LEMUR stays where it is
      And no row is marked as selected

  Rule: Dragging past the end of the range stretches and springs back

    Scenario: The word stretches and returns
      Given LEMUR with its L in the column
      When the player drags it to the right
      Then it moves a little
      And when released, it springs back with its L in the column

  Rule: A fast flick glides before snapping

    Scenario: The word carries on after a flick
      When the player flicks LEMUR to the left
      Then it keeps moving for a moment after release
      And then it snaps to its nearest letter

    Scenario: A flick stops at the end of the range
      When the player flicks KANGAROO hard to the left
      Then it stops with its last O in the column at the furthest

    Scenario: A slow release doesn't glide
      When the player drags LEMUR slowly and releases it
      Then it snaps without gliding

  Rule: Letters in the column look ordinary

    Scenario: The column doesn't highlight its letters during play
      When a letter is in the column
      Then it looks like any other tile

  Rule: The Up and Down arrows select a row

    Scenario Outline: Up and Down move the selection and wrap around
      Given <start>'s row is selected
      When the player presses <arrow>
      Then <end>'s row is selected

      Examples:
        | start    | arrow | end      |
        | ZEBRA    | Up    | LEMUR    |
        | ZEBRA    | Down  | KANGAROO |
        | LEMUR    | Up    | KANGAROO |
        | KANGAROO | Down  | LEMUR    |

    Scenario: No row is selected when phase two starts
      When phase two starts
      Then no row is marked as selected

    Scenario: The first arrow selects the top row
      Given no row is selected
      When the player presses Down
      Then LEMUR's row is selected

  Rule: The Left and Right arrows slide the selected row one letter at a time

    Scenario: Left brings the next letter into the column
      Given LEMUR's row is selected with its L in the column
      When the player presses Left
      Then the E is in the column

    Scenario: Right brings the previous letter into the column
      Given LEMUR's row is selected with its E in the column
      When the player presses Right
      Then the L is in the column

    Scenario: Keys pressed at the same moment both count
      Given ZEBRA's row was selected before a drag
      When the player quickly presses Up, then Down
      Then ZEBRA's row is selected

    Scenario: Special characters are skipped
      Given a level containing the answer HOT DOG
      And its row is selected with its T in the column
      When the player presses Left
      Then the D is in the column

    Scenario Outline: Left and Right don't wrap around
      Given LEMUR's row is selected with its <letter> in the column
      When the player presses <arrow>
      Then LEMUR doesn't move

      Examples:
        | letter | arrow |
        | L      | Right |
        | R      | Left  |

    Scenario: The arrows use the snap tween
      Given LEMUR's row is selected
      When the player presses Left
      Then the word moves with a bounce-out tween of 0.1 seconds

  Rule: With no row selected, Left or Right selects the top row and slides it

    Scenario: Left selects and slides
      Given no row is selected
      When the player presses Left
      Then LEMUR's row is selected
      And its E is in the column

    Scenario: Right selects, and the word can't move
      Given no row is selected
      When the player presses Right
      Then LEMUR's row is selected
      And LEMUR doesn't move

  Rule: A drag hides the selection until the next arrow

    Scenario: A drag hides the mark
      Given ZEBRA's row is selected
      When the player starts dragging KANGAROO
      Then no row is marked as selected

    Scenario Outline: The next arrow brings the selection back
      Given ZEBRA's row was selected before a drag
      When the player presses <arrow>
      Then the selection is marked again, and the arrow takes effect from ZEBRA's row

      Examples:
        | arrow |
        | Left  |
        | Right |
        | Up    |
        | Down  |
