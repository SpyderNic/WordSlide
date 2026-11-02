# Status: approved by the designer on 2026-10-31.
# Map: docs/example-maps/story-06-check-and-lock-a-word.md
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

    # Needs story 17.
    Scenario: Typing triggers the check
      Given the top row reads L E M U _
      And the top row is selected
      When the player presses the R key
      Then the word locks

  Rule: A full row locks if its word is an unlocked answer and fits the row

    Scenario: An answer locks in its row
      When the player fills the top row with LEMUR
      Then the word locks

    Scenario: An answer locks in another row of the same length
      When the player fills the top row with ZEBRA
      Then the word locks

    Scenario Outline: Revealed letters decide what fits
      Given the answers <answers>
      And a row with T revealed first
      When the player fills that row with <word>
      Then the word <result>

      Examples:
        | answers      | word | result       |
        | TREE and TART | TREE | locks        |
        | TREE and TART | TART | locks        |
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
      When the player fills the top row with LEMON
      Then the word doesn't lock
      And the row gets the wrong-word feedback

    Scenario: A plain letter doesn't stand in for an accented one
      Given a level containing the answer CAFÉ
      When the player fills its row with CAFE
      Then the word doesn't lock

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
      And the pool shows A x3
      When the player drags A from the pool onto LEMUR's M
      Then LEMUR is unchanged
      And the pool shows A x3

  Rule: Locking doesn't change the pool

    Scenario: The counts stay the same
      Given the top row reads L E M U _
      And the pool counts are noted after placing the R
      When the word locks
      Then the pool counts are the same

  Rule: A wrong word gets gentle feedback and costs nothing

    @browser
    Scenario: The row shakes and the letters stay
      When the player fills ZEBRA's row with ZEBRE
      Then the row shakes a little sideways
      And the row still reads Z E B R E
      And the pool hasn't changed

    Scenario: A wrong word can be fixed
      Given ZEBRA's row reads Z E B R E
      When the player drags A from the pool onto the last E
      Then ZEBRA locks
      And the E goes back to the pool

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
      Given row 2 reads T E A M
      When the player swaps the T and the M
      Then MEAT locks

  Rule: Hinted letters go back to the pool when no remaining answer fits their row

    Background:
      Given the answers TART and TREE

    Scenario: A hinted letter goes back
      Given R revealed at position 3 of row 1
      When the player builds TART in row 2
      Then TART locks in row 2
      And row 1 reads _ _ _ _
      And the pool holds T, R, E, E

    Scenario: Placed letters stay
      Given R revealed at position 3 of row 1
      And an E placed in cell 4 of row 1
      When the player builds TART in row 2
      Then row 1 reads _ _ _ E
      And the pool holds T, R, E

    Scenario: All hinted letters in the row go back
      Given T revealed at position 1 of row 1
      And R revealed at position 3 of row 1
      When the player builds TART in row 2
      Then row 1 reads _ _ _ _
      And the pool holds T, R, E, E

    Scenario: A hint that still fits a remaining answer stays
      Given T revealed at position 1 of row 1
      When the player builds TART in row 2
      Then row 1 still reads T _ _ _

    Scenario: A returned hint is an ordinary letter
      Given R revealed at position 3 of row 1
      And the player has built TART in row 2
      When the player builds TREE in row 1
      Then TREE locks
      And phase one ends

    Scenario: A hinted letter disappears from its row for now
      Given R revealed at position 3 of row 1
      When the player builds TART in row 2
      Then the R disappears from row 1
      And the R count goes up by one

  Rule: Special characters never go to the pool

    Scenario: The space stays when the hint goes
      Given the answers HOT DOG and ICE TEA
      And row 1 starts as _ _ T ␣ _ _ _
      When the player builds HOT DOG in row 2
      Then HOT DOG locks in row 2
      And row 1 reads _ _ _ ␣ _ _ _
      And the pool holds I, C, E, T, E, A

  Rule: If two rows fill at once, they're checked from the top

    Scenario: A swap locks two words
      Given the top row reads L E M U A
      And ZEBRA's row reads Z E B R R
      When the player swaps the A and the last R of ZEBRA's row
      Then LEMUR locks first
      And ZEBRA locks second

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
    Scenario: Revealed letters change too
      Given L revealed at position 1 of LEMUR
      When LEMUR locks
      Then the L takes the locked colour

  Rule: A split word's parts lock on their own

    Scenario: The first part locks
      Given a level containing the answer HOT DOG
      When the player places H, O and T in the first three cells of HOT DOG's row
      Then HOT locks
      And DOG's cells stay empty

    Scenario: The last part locks
      Given a level containing the answer T-REX
      When the player places R, E and X in the last three cells of T-REX's row
      Then REX locks
      And T's cell stays empty

    Scenario: A part of another answer that fits the row locks
      Given the answers HOT DOG and HOT POT
      When the player places D, O and G in the last three cells of HOT POT's row
      Then DOG locks

    Scenario: A part of one letter locks
      Given a level containing the answer T-REX
      When the player places T in the first cell of T-REX's row
      Then T locks

    @browser
    Scenario: Only the part pulses
      Given a level containing the answer HOT DOG
      When the player places H, O and T in the first three cells of HOT DOG's row
      Then only HOT's tiles pulse
      And HOT's tiles take the locked colour

    Scenario: A wrong part doesn't lock
      Given the answers HOT DOG, CAT and PEA
      When the player places C, A and T in the first three cells of HOT DOG's row
      Then nothing locks and no feedback appears

    Scenario: A full row with one right part
      Given a level containing the answer T-REX
      When the player fills T-REX's row with D-REX
      Then REX locks
      And the D stays placed
      And the row gets the wrong-word feedback

    Scenario: A full row with no right part
      Given the answers HOT DOG, CAT and PEA
      When the player fills HOT DOG's row with CAT DOP
      Then nothing locks
      And the row gets the wrong-word feedback

    Scenario: A locked part's letter can't be dragged
      Given a level containing the answer HOT DOG
      And HOT is locked in HOT DOG's row
      When the player tries to drag its H
      Then nothing is picked up

    Scenario: Recall All leaves a locked part
      Given a level containing the answer HOT DOG
      And HOT is locked in HOT DOG's row
      And a D placed in cell 5 of HOT DOG's row
      When the player presses Recall All
      Then HOT DOG's row reads H O T ␣ _ _ _

    Scenario: A part goes back to the pool when its row can't fit any remaining answer
      Given the answers HOT DOG, DOG TAG and CAT
      And the player has filled HOT DOG's row with CAT DOG, so DOG locked
      When the player builds HOT DOG in DOG TAG's row
      Then HOT DOG locks in DOG TAG's row
      And HOT DOG's row reads C A T ␣ _ _ _
      And the pool holds D, O, G, T, A, G

    Scenario: A part stays while its row can still fit a remaining answer
      Given the answers HOT DOG and HOT POT
      And the player has filled HOT DOG's row with HOT POG, so HOT locked
      When the player presses Recall All
      And the player builds HOT DOG in HOT POT's row
      Then HOT DOG locks in HOT POT's row
      And HOT DOG's row reads H O T ␣ _ _ _
      And HOT is still locked in HOT DOG's row

  # Needs story 17.
  Rule: Filling a row moves the selection on in every case

    Scenario Outline: The selection moves on
      Given <row> is selected
      When the player's input fills it with <word>
      Then the selection moves on, as in story 17

      Examples:
        | row          | word  |
        | the top row  | LEMUR |
        | the top row  | LEMAR |
