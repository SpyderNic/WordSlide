# Archived from features/story-17-pool-as-a-keyboard.feature, before story 23 (a pool for each row).
# The game as it was is tagged before-story-23 in git. These scenarios no longer run.

Feature: story-17-pool-as-a-keyboard (archived)

  # Archived for story 23: replaced by R7 (a wrong word keeps the selection) and R8 (a lock moves it on).
  Rule: Filling a row moves the selection on

    Scenario: The selection moves to the next row down
      Given LEMUR's row is selected
      When an input fills LEMUR's last empty cell
      Then ZEBRA's row is selected

    Scenario: After the bottom row, it goes back to the top
      Given KANGAROO's row is selected
      And LEMUR's row has an empty cell
      When an input fills KANGAROO's last empty cell
      Then LEMUR's row is selected

    Scenario: Full rows are skipped
      Given LEMUR's row is selected
      And ZEBRA's row is full but wrong
      When an input fills LEMUR's last empty cell
      Then KANGAROO's row is selected

    Scenario: Locked rows are skipped
      Given LEMUR's row is selected
      And ZEBRA is locked
      When an input fills LEMUR's last empty cell
      Then KANGAROO's row is selected

    Scenario: With no empty cell left, the selection stays
      Given KANGAROO's row is selected
      And LEMUR's and ZEBRA's rows are full
      When an input fills KANGAROO's last empty cell with a wrong letter
      Then KANGAROO's row is still selected

    Scenario: With no empty cell left, a row that locks passes the selection on
      Given KANGAROO's row is selected
      And LEMUR is locked
      And ZEBRA's row is full but wrong
      When an input completes KANGAROO, which locks
      Then ZEBRA's row is selected

  # Archived for story 23: replaced by R5 and R7: letters only go into the selected row.
  Rule: An input on a full selected row moves the selection on

    Scenario: The letter lands in the next row
      Given ZEBRA's row is full and selected
      When the player taps A in the pool
      Then KANGAROO's row is selected
      And the A is in KANGAROO's row
      And ZEBRA's row hasn't changed

  # Archived for story 23: replaced by R2: a row is always selected.
  Rule: No row is selected when a level opens

    Scenario: Nothing is selected at the start
      When the level opens
      Then no row is marked as selected

    Scenario Outline: The first input selects the top row
      When the level opens
      And the player <input>
      Then LEMUR's row is selected
      And the Z is in its cell 1

      Examples:
        | input               |
        | taps Z in the pool  |
        | presses the Z key   |

    Scenario: The top row is the first with an empty cell
      Given LEMUR's row is full
      And no row is selected
      When the player taps A in the pool
      Then ZEBRA's row is selected

    Scenario: An input that does nothing selects nothing
      When the level opens
      And the player presses the Q key
      Then no row is marked as selected

  # Archived for story 23: replaced by R2: the selected row always shows.
  Rule: A drag hides the selection until the next input

    Scenario: A drag hides the mark
      Given ZEBRA's row is selected
      When the player starts dragging a letter
      Then no row is marked as selected

    Scenario: The next input brings the selection back
      Given ZEBRA's row is selected
      And the player has dragged an A to KANGAROO's row
      When the player taps E in the pool
      Then ZEBRA's row is marked as selected
      And the E is in ZEBRA's row

    Scenario: Tapping a row ends the hiding
      Given ZEBRA's row was selected before a drag
      When the player taps a cell of LEMUR's row
      Then LEMUR's row is marked as selected

    Scenario: An arrow ends the hiding
      Given ZEBRA's row was selected before a drag
      When the player presses Up
      Then LEMUR's row is marked as selected

  # Archived for story 23: replaced by R2: a row is always selected.
    Scenario: With nothing selected, Backspace does nothing
      Given no row is selected
      When the player presses Backspace
      Then nothing changes

  # Archived for story 23: replaced by R9: Backspace only works on the selected row.
    Scenario: Backspace doesn't wrap around
      Given LEMUR's row is selected and has no placed letters
      And KANGAROO's row has a placed letter
      When the player presses Backspace
      Then nothing changes

  # Archived for story 23: replaced by R9: Backspace only works on the selected row.
    Scenario: With no placed letters, Backspace goes back a row
      Given ZEBRA's row reads Z E B R E
      And KANGAROO's row is selected and has no placed letters
      When the player presses Backspace
      Then ZEBRA's row is selected
      And ZEBRA's row reads Z E B R _
      And the E count goes up by one

  # Archived for story 23: replaced by R9: Backspace only works on the selected row.
    Scenario: Locked rows are skipped when going back
      Given ZEBRA is locked
      And LEMUR's row has a placed letter
      And KANGAROO's row is selected and has no placed letters
      When the player presses Backspace
      Then LEMUR's row is selected
      And its rightmost placed letter goes back to the pool

  # Archived for story 23: replaced by R2: a row is always selected.
    Scenario: With nothing selected, an arrow selects the top row
      Given no row is selected
      When the player presses Down
      Then LEMUR's row is selected

