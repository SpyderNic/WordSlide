# Status: approved by the designer on 2026-10-31.
# Map: docs/milestones/3-phase-one/m03-04-check-and-lock-a-word.md
# M06-03 changed this file's examples on 2026-11-04: each row has its own pool, so examples use the row's own letters.
# Unless a scenario says otherwise, the level has the answers ZEBRA, LEMUR and
# KANGAROO, nothing is revealed, and the rows are LEMUR, ZEBRA, KANGAROO.

Feature: Check and lock a word
  As a player
  I want the game to check each word I complete
  So that correct words lock in and wrong ones can be fixed without penalty

  Rule: A row is checked as soon as it's full

    Scenario: The last letter triggers the check
      Given the top row reads L E M U _
      When the player places R in its last cell
      Then the word locks

    Scenario: A swap can trigger the check
      Given the top row reads L E M R U
      When the player swaps the R and the U
      Then the word locks

    Scenario: A row with an empty cell isn't checked
      Given the top row reads L E M U _
      Then nothing locks and no feedback appears

    # Needs M03-05.
    Scenario: Typing triggers the check
      Given the top row reads L E M U _
      And the top row is selected
      When the player presses the R key
      Then the word locks

  Rule: A full row locks if its word is an unlocked answer and fits the row

    Scenario: An answer locks in its row
      When the player fills the top row with LEMUR
      Then the word locks

    Scenario Outline: Revealed letters decide what fits
      Given the answers <answers>
      And a row with T revealed first
      When the player fills that row with <word>
      Then the word <result>

      Examples:
        | answers      | word | result       |
        | TREE and TART | TREE | locks        |
        | TREE and PALM | TREE | locks        |

    Scenario: A word that doesn't fit a revealed letter can't be spelled there
      Given the answers TREE and PALM
      And a row with T revealed first
      Then PALM can't be placed in that row, because its first cell is taken

    Scenario: An answer with a special character only fits a matching row
      Given a level containing the answers HOT DOG and TOASTER
      Then TOASTER can't be placed in HOT DOG's row, because its space takes a cell

  Rule: Only the level's answers lock

    Scenario: A real word that isn't an answer doesn't lock
      Given the answers TEAM and ZEBRA
      When the player fills the top row with MATE
      Then the word doesn't lock
      And the row gets the wrong-word feedback

  Rule: A locked word's cells become fixed

    Scenario: A locked letter can't be dragged
      Given LEMUR is locked
      When the player tries to drag its M
      Then nothing is picked up

    Scenario: Recall All leaves a locked word
      Given LEMUR is locked
      When the player presses Recall All
      Then LEMUR is still locked

    Scenario: A dropped letter goes to the pool
      Given LEMUR is locked
      And the pool shows A x1
      When the player drags A from the pool onto LEMUR's M
      Then LEMUR is unchanged
      And the pool shows A x1

  Rule: Locking doesn't change the pool

    Scenario: The counts stay the same
      Given the top row reads L E M U _
      And the pool counts are noted after placing the R
      When the word locks
      Then the pool counts are the same

  Rule: A wrong word gets gentle feedback and costs nothing

    @browser
    Scenario: The row shakes and the letters stay
      When the player fills ZEBRA's row with ZEBAR
      Then the row shakes a little sideways
      And the row still reads Z E B A R
      And the pool hasn't changed

    Scenario: A wrong word can be fixed
      Given ZEBRA's row reads Z E B A R
      When the player swaps the A and the R
      Then ZEBRA locks

    Scenario: There's no limit on tries
      Given the player has spelled a wrong word 10 times
      When the player spells the right word
      Then the word locks

  Rule: Feedback doesn't block the player

    @browser
    Scenario Outline: The player can act during feedback
      Given <feedback> is showing
      When the player drags a letter
      Then the drag works as usual

      Examples:
        | feedback                  |
        | the wrong-word shake      |
        | the lock pulse            |
        | the "already found" text  |

  Rule: A locked answer spelled again gives "already found" feedback

    Background:
      Given the answers TEAM and MEAT
      And TEAM is locked in row 1

    @browser
    Scenario: The feedback appears and the letters stay
      When the player spells TEAM in row 2
      Then row 1 highlights briefly
      And "Already found" appears on a background in the centre of the screen
      And row 2 still reads T E A M
      And the pool hasn't changed

    @browser
    Scenario: The text rises and fades
      When "Already found" appears
      Then it gently rises and fades out

    Scenario: The row can still be fixed
      # Changed by M06-04, R6: dragging a letter onto another moves the letters between aside.
      Given row 2 reads T E A M
      When the player drags the M onto the T, then the T onto the A
      Then MEAT locks

  Rule: Hinted letters go back to the pool when no remaining answer fits their row

    # With a pool per row, this only happens with answers made of the same letters (M06-03, R6).
    # MEAT is row 1 and TEAM row 2.
    Background:
      Given the answers MEAT and TEAM

    Scenario: A hinted letter goes back
      Given M revealed at position 1 of row 1
      When the player builds MEAT in row 2
      Then MEAT locks in row 2
      And row 1 reads _ _ _ _
      And the pool holds A, E, M, T

    Scenario: Placed letters stay
      Given M revealed at position 1 of row 1
      And an E placed in cell 4 of row 1
      When the player builds MEAT in row 2
      Then row 1 reads _ _ _ E
      And the pool holds A, M, T

    Scenario: All hinted letters in the row go back
      Given M revealed at position 1 of row 1
      And T revealed at position 4 of row 1
      When the player builds MEAT in row 2
      Then row 1 reads _ _ _ _
      And the pool holds A, E, M, T

    Scenario: A hint that still fits a remaining answer stays
      Given E revealed at position 2 of row 1
      When the player builds MEAT in row 2
      Then row 1 still reads _ E _ _

    Scenario: A returned hint is an ordinary letter
      Given M revealed at position 1 of row 1
      And the player has built MEAT in row 2
      When the player builds TEAM in row 1
      Then TEAM locks
      And phase one ends

    Scenario: A hinted letter disappears from its row for now
      Given M revealed at position 1 of row 1
      When the player builds MEAT in row 2
      Then the M disappears from row 1
      And the M count goes up by one

  Rule: When the last word locks, the level moves to phase two

    Scenario: The last lock ends phase one
      Given LEMUR and ZEBRA are locked
      When KANGAROO locks
      Then phase one ends

    Scenario: Phase one continues while words remain
      When LEMUR locks
      Then phase one continues

  Rule: A locking word pulses, then changes colour

    @browser
    Scenario: The whole word changes
      When LEMUR locks
      Then its row pulses briefly
      And all 5 tiles take the locked colour

    @browser
    Scenario: The colour changes at the biggest point of the pulse
      When LEMUR locks
      Then its tiles keep their colour while they grow
      And they take the locked colour at their biggest

    @browser
    Scenario: The pulse is quick and grows 15%
      When LEMUR locks
      Then its tiles grow 15% in about 0.15 seconds
      And they shrink back in about 0.2 seconds

    @browser
    Scenario: Tiles grow from their centre
      When LEMUR locks
      Then each tile and its letter keep their centre while they pulse

    @browser
    # Changed by M06-03, R14: parts don't lock on their own, so a whole word pulses.
    Scenario: Typing on doesn't cut a pulse short
      When the player types LEMUR and then Z straight away
      Then LEMUR's tiles grow 15% and shrink back, without being cut short

    @browser
    Scenario: Typing on doesn't cut a shake short
      Given the top row is selected
      When the player types LEMRU and then presses Down straight away
      Then the top row shakes for the whole shake, without being cut short

    @browser
    Scenario: Revealed letters change too
      Given L revealed at position 1 of LEMUR
      When LEMUR locks
      Then the L takes the locked colour
