# Status: approved by the designer on 2026-10-31. Build after story 6.
# Map: docs/example-maps/story-17-pool-as-a-keyboard.md
# Unless a scenario says otherwise, the level has the answers ZEBRA, LEMUR and
# KANGAROO, nothing is revealed, and the rows are LEMUR, ZEBRA, KANGAROO.

Feature: Pool as a keyboard
  As a player
  I want to select a word and then tap or type its letters
  So that I can fill words quickly without dragging each letter

  Rule: Tapping a row selects it, one row at a time

    Scenario: Tapping a row selects it
      When the player taps a cell of ZEBRA's row
      Then ZEBRA's row is marked as selected

    Scenario: Tapping another row moves the selection
      Given ZEBRA's row is selected
      When the player taps a cell of LEMUR's row
      Then LEMUR's row is marked as selected
      And ZEBRA's row isn't

    Scenario: Tapping the selected row changes nothing
      Given ZEBRA's row is selected
      When the player taps a cell of ZEBRA's row
      Then ZEBRA's row is still selected

    Scenario: A locked row can't be selected
      Given LEMUR is locked
      And ZEBRA's row is selected
      When the player taps a cell of LEMUR's row
      Then ZEBRA's row is still selected

  Rule: A letter goes to the selected row's first empty cell

    Scenario: Letters fill from the left
      Given ZEBRA's row is selected
      When the player taps Z in the pool
      And the player taps E in the pool
      Then ZEBRA's row reads Z E _ _ _

    Scenario Outline: Filled cells are skipped
      Given a level containing the answer <answer>
      And that row starts as <before>
      And that row is selected
      When the player taps <letter> in the pool
      Then that row reads <after>

      Examples:
        | answer | before    | letter | after     |
        | LEMUR  | L _ _ _ _ | E      | L E _ _ _ |
        | ZEBRA  | _ E _ _ _ | Z      | Z E _ _ _ |
        | ZEBRA  | Z E _ _ _ | B      | Z E B _ _ |
        | T-REX  | T - _ _ _ | R      | T - R _ _ |

  Rule: Tapping behaves like dragging for the pool

    Scenario: Tapping lowers the count
      Given ZEBRA's row is selected
      And the pool shows A x3
      When the player taps A in the pool
      Then the pool shows A x2

    Scenario: A grey tile can't be tapped
      Given ZEBRA's row is selected
      And the pool shows a grey Z x0
      When the player taps Z in the pool
      Then nothing changes

    Scenario: A wrong letter gets no feedback
      Given ZEBRA's row is selected
      When the player taps K in the pool
      Then cell 1 of ZEBRA's row holds a K
      And nothing tells the player whether it's right

    Scenario: A tapped letter counts as placed straight away
      Given ZEBRA's row is selected
      When the player taps Z in the pool
      Then the Z is in cell 1 of ZEBRA's row
      And another letter can be tapped straight away

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

  Rule: An input on a full selected row moves the selection on

    Scenario: The letter lands in the next row
      Given ZEBRA's row is full and selected
      When the player taps A in the pool
      Then KANGAROO's row is selected
      And the A is in KANGAROO's row
      And ZEBRA's row hasn't changed

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

  Rule: A physical key acts like tapping its pool letter

    Scenario Outline: Upper and lower case are the same
      Given ZEBRA's row is selected
      When the player presses the <key> key
      Then cell 1 of ZEBRA's row holds a Z

      Examples:
        | key |
        | z   |
        | Z   |

    Scenario: Digit keys work
      Given a level containing the answer R2D2
      And that row is selected
      When the player presses the 2 key
      Then the 2 count drops by one
      And cell 1 of that row holds a 2

    Scenario: A key the level doesn't have does nothing
      Given ZEBRA's row is selected
      When the player presses the Q key
      Then nothing changes

    Scenario: A key with no tile left does nothing
      Given ZEBRA's row is selected
      And the pool shows a grey Z x0
      When the player presses the Z key
      Then nothing changes

    Scenario: Fast typing keeps its order
      Given ZEBRA's row is selected
      When the player quickly types ZEBRA
      Then ZEBRA's row reads Z E B R A

  Rule: Accented letters and keys

    Scenario: A plain key uses the plain letter first, then the accented one
      Given the pool shows E x1 and É x1
      And a row with empty cells is selected
      When the player presses the E key
      Then the E is used
      When the player presses the E key
      Then the É is used

    Scenario: An accented key uses that letter
      Given the pool shows E x1 and É x1
      And a row with empty cells is selected
      When the player presses the É key
      Then the É is used

    Scenario: An accented key doesn't fall back
      Given the pool shows E x1 and a grey É x0
      And a row with empty cells is selected
      When the player presses the É key
      Then nothing changes

  Rule: Tapping and dragging stay separate

    @browser
    Scenario: A press without moving is a tap
      Given ZEBRA's row is selected
      When the player presses and releases a pool tile without moving it
      Then its letter goes to ZEBRA's row

    @browser
    Scenario: A small wobble is still a tap
      Given ZEBRA's row is selected
      When the player presses a pool tile, wobbles less than 15% of a tile and releases it
      Then its letter goes to ZEBRA's row

    @browser
    Scenario: A press with movement is a drag
      When the player presses a pool tile and moves it
      Then a drag starts, as in story 3

    @browser
    Scenario: Moving just over 15% of a tile is a drag
      When the player presses a pool tile and moves it just over 15% of a tile
      Then a drag starts, as in story 3

    @browser
    Scenario: Pressing a placed letter without moving selects its row
      Given a Z placed in cell 1 of LEMUR's row
      When the player presses and releases the Z without moving it
      Then LEMUR's row is selected
      And the Z stays where it is

    @browser
    Scenario: Pressing a placed letter and moving drags it
      Given a Z placed in cell 1 of LEMUR's row
      When the player presses the Z and moves it
      Then a drag starts, as in story 3

    Scenario Outline: Other input is ignored during a drag
      Given the player is dragging a Z
      When the player <input>
      Then only the drag carries on

      Examples:
        | input               |
        | presses the A key   |
        | presses Backspace   |
        | presses Up          |

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

  Rule: Backspace sends a placed letter back to the pool

    Scenario: The rightmost placed letter goes back
      Given L revealed at position 1 of LEMUR
      And LEMUR's row reads L E Z _ _
      And LEMUR's row is selected
      When the player presses Backspace
      Then LEMUR's row reads L E _ _ _
      And the Z count goes up by one

    Scenario: Revealed letters stay
      Given L revealed at position 1 of LEMUR
      And LEMUR's row reads L _ _ _ _
      And no other row has a placed letter
      And LEMUR's row is selected
      When the player presses Backspace
      Then nothing changes

    Scenario: With nothing selected, Backspace does nothing
      Given no row is selected
      When the player presses Backspace
      Then nothing changes

    Scenario: Backspace doesn't wrap around
      Given LEMUR's row is selected and has no placed letters
      And KANGAROO's row has a placed letter
      When the player presses Backspace
      Then nothing changes

    Scenario: With no placed letters, Backspace goes back a row
      Given ZEBRA's row reads Z E B R E
      And KANGAROO's row is selected and has no placed letters
      When the player presses Backspace
      Then ZEBRA's row is selected
      And ZEBRA's row reads Z E B R _
      And the E count goes up by one

    Scenario: Locked rows are skipped when going back
      Given ZEBRA is locked
      And LEMUR's row has a placed letter
      And KANGAROO's row is selected and has no placed letters
      When the player presses Backspace
      Then LEMUR's row is selected
      And its rightmost placed letter goes back to the pool

  Rule: The Up and Down arrows change the selected row

    Scenario Outline: Arrows move the selection and wrap around
      Given <start>'s row is selected
      When the player presses <arrow>
      Then <end>'s row is selected

      Examples:
        | start    | arrow | end      |
        | ZEBRA    | Up    | LEMUR    |
        | ZEBRA    | Down  | KANGAROO |
        | LEMUR    | Up    | KANGAROO |
        | KANGAROO | Down  | LEMUR    |

    Scenario: Arrows skip locked rows
      Given LEMUR is locked
      And ZEBRA's row is selected
      When the player presses Up
      Then KANGAROO's row is selected

    Scenario: Arrows can select a full row
      Given ZEBRA's row is full but wrong
      And LEMUR's row is selected
      When the player presses Down
      Then ZEBRA's row is selected

    Scenario: With nothing selected, an arrow selects the top row
      Given no row is selected
      When the player presses Down
      Then LEMUR's row is selected
