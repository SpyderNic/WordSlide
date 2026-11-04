# Archived from features/story-06-check-and-lock-a-word.feature, before story 23 (a pool for each row).
# The game as it was is tagged before-story-23 in git. These scenarios no longer run.

Feature: story-06-check-and-lock-a-word (archived)

  # Archived for story 23: replaced by R6: a row only takes its own answer, or one made of the same letters.
    Scenario: An answer locks in another row of the same length
      When the player fills the top row with ZEBRA
      Then the word locks

  # Archived for story 23: replaced by R5: letters can't be swapped between rows.
  Rule: If two rows fill at once, they're checked from the top

    Scenario: A swap locks two words
      Given the top row reads L E M U A
      And ZEBRA's row reads Z E B R R
      When the player swaps the A and the last R of ZEBRA's row
      Then LEMUR locks first
      And ZEBRA locks second

  # Archived for story 23: replaced by R7 and R8.
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

  # Archived for story 23: replaced by R1: a row's pool only has its own letters, so CAFÉ's row has no plain E to try.
    Scenario: A plain letter doesn't stand in for an accented one
      Given a level containing the answer CAFÉ
      When the player fills its row with CAFE
      Then the word doesn't lock

  # Archived for story 23: replaced by R5: DOG's letters can't go into HOT POT's row.
    Scenario: A part of another answer that fits the row locks
      Given the answers HOT DOG and HOT POT
      When the player places D, O and G in the last three cells of HOT POT's row
      Then DOG locks

  # Archived for story 23: replaced by R5: CAT's letters can't go into HOT DOG's row.
    Scenario: A part goes back to the pool when its row can't fit any remaining answer
      Given the answers HOT DOG, DOG TAG and CAT
      And the player has filled HOT DOG's row with CAT DOG, so DOG locked
      When the player builds HOT DOG in DOG TAG's row
      Then HOT DOG locks in DOG TAG's row
      And HOT DOG's row reads C A T ␣ _ _ _
      And the pool holds D, O, G, T, A, G

  # Archived for story 23: replaced by R5: HOT DOG can't be built in HOT POT's row.
    Scenario: A part stays while its row can still fit a remaining answer
      Given the answers HOT DOG and HOT POT
      And the player has filled HOT DOG's row with HOT POG, so HOT locked
      When the player presses Recall All
      And the player builds HOT DOG in HOT POT's row
      Then HOT DOG locks in HOT POT's row
      And HOT DOG's row reads H O T ␣ _ _ _
      And HOT is still locked in HOT DOG's row

  # Archived for story 23: replaced by R5: HOT DOG can't be built in ICE TEA's row. Special characters still never go to the pool (D18).
  Rule: Special characters never go to the pool

    Scenario: The space stays when the hint goes
      Given the answers HOT DOG and ICE TEA
      And row 1 starts as _ _ T ␣ _ _ _
      When the player builds HOT DOG in row 2
      Then HOT DOG locks in row 2
      And row 1 reads _ _ _ ␣ _ _ _
      And the pool holds I, C, E, T, E, A

  # Archived for story 23: replaced by R14: a row shakes as a whole.
    @browser
    Scenario: In a split word, only the wrong part shakes
      Given a level containing the answer HOT DOG
      When the player fills HOT DOG's row with HOT GOD
      Then HOT locks
      And only GOD's tiles shake

  # Archived for story 23: replaced by R14: parts don't lock on their own.
    @browser
    Scenario: A part pulses the same way
      Given a level containing the answer HOT DOG
      When the player places H, O and T in the first three cells of HOT DOG's row
      Then its tiles keep their colour while they grow
      And they take the locked colour at their biggest

  # Archived for story 23: replaced by R14: a row locks all at once, or not at all.
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

    @browser
    Scenario: A part that's already locked doesn't pulse again
      Given a level containing the answer HOT DOG
      And HOT is locked in HOT DOG's row
      When the player places D, O and G in the last three cells of HOT DOG's row
      Then only DOG's tiles pulse

    Scenario: A wrong part doesn't lock
      Given a level containing the answer HOT DOG
      When the player places O, H and T in the first three cells of HOT DOG's row
      Then nothing locks and no feedback appears

    Scenario: A full row with one right part
      Given a level containing the answer T-REX
      When the player fills T-REX's row with T-RXE
      Then T locks
      And the X and the E stay placed
      And the row gets the wrong-word feedback

    Scenario: A full row with no right part
      Given a level containing the answer HOT DOG
      When the player fills HOT DOG's row with THO GOD
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

