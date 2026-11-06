# Status: draft, waiting for the designer's approval.
# Map: docs/milestones/7-worth-playing/m07-03-buying-hints.md
# Economy values are settings (D52): each scenario sets the ones it uses.
# Unless a scenario says otherwise, the level has the answers ZEBRA, LEMUR and
# KANGAROO, with the final word ELK, and LEMUR's row is selected.
# Scenarios without @browser check the price rule alone, without the screen.

Feature: Hints, part 2: buying them
  As a player who's stuck
  I want to buy a hint with coins I've earned
  So that getting help is my choice and has a cost I can see

  Rule: Every hint costs coins, and tapping its button buys it (R1)

    @browser
    Scenario: Buying a Letter hint
      Given the Letter price is 30
      And the player has 100 coins
      When the player uses the Letter hint
      Then the player has 70 coins
      And one of LEMUR's cells holds its right letter, locked

    @browser
    Scenario: Buying the Ordering hint
      Given the Ordering price is 40
      And the player has 100 coins
      When the player uses the Ordering hint
      Then the player has 60 coins
      And there are no handles

  Rule: Each hint's button shows its current price (R2)

    @browser
    Scenario: Phase one's Letter hint
      Given the Letter price is 30
      When the level opens
      Then the Letter hint's button shows a coin and "30" under its icon

    @browser
    Scenario: Phase two's Ordering hint
      Given the Ordering price is 40
      When phase two starts
      Then the Ordering hint's button shows a coin and "40" under its icon

  Rule: Within a level, the Letter and Reveal hints cost more each time (R3)

    Scenario Outline: Each price is the price step more than the last, rounded to 10, up to the cap
      Given a first price of <first>, a price step of 50% and a price cap of 5 times the first price
      Then the prices in one level are <prices>

      Examples:
        | first | prices                       |
        | 30    | 30, 50, 80, 120, 150, 150    |
        | 40    | 40, 60, 90, 140, 200, 200    |

    @browser
    Scenario: The Letter hint's price goes up as it's used
      Given the Letter price is 30
      And the price step is 50% and the price cap is 5 times
      And the player has 1000 coins
      And KANGAROO's row is selected
      When the player uses the Letter hint 5 times
      Then the player has 570 coins
      And the Letter hint's button shows a coin and "150" under its icon

    @browser
    Scenario: The Reveal hint's price goes up as it's used
      Given a level whose rows can't be reordered
      And the Reveal price is 40
      And the price step is 50% and the price cap is 5 times
      And the player has 1000 coins
      When the player uses the Reveal hint 2 times
      Then the player has 900 coins
      And the Reveal hint's button shows a coin and "90" under its icon

    @browser
    Scenario: Each hint counts its own uses
      Given a level whose rows can't be reordered
      And the Letter price is 30
      And the Reveal price is 40
      And the player has 1000 coins
      When the player uses the Letter hint 2 times
      And phase two starts
      Then the Reveal hint's button shows a coin and "40" under its icon

  Rule: The Ordering hint has one price (R4)

    @browser
    Scenario: The Ordering hint costs the same in the next level
      Given the Ordering price is 40
      And the player has 100 coins
      When the player uses the Ordering hint
      And the player wins the level and plays the next one
      And phase two starts
      Then the Ordering hint's button shows a coin and "40" under its icon

  Rule: Prices go back to their first price on the next level (R5)

    @browser
    Scenario: A new level, a new price
      Given the Letter price is 30
      And the player has 1000 coins
      When the player uses the Letter hint 3 times
      And the player wins the level and plays the next one
      Then the Letter hint's button shows a coin and "30" under its icon

  Rule: Prices are saved with the level (R6)

    @browser
    Scenario: Reopening keeps the escalation
      Given the Letter price is 30
      And the price step is 50% and the price cap is 5 times
      And the player has 1000 coins
      When the player uses the Letter hint 2 times
      And the game closes and opens again
      Then the Letter hint's button shows a coin and "80" under its icon

  Rule: Buying a hint is saved as one change (R7)

    @browser
    Scenario: Closing straight after buying
      Given the Letter price is 30
      And the player has 100 coins
      When the player uses the Letter hint and the game closes straight away
      And the game opens again
      Then the player has 70 coins
      And the hinted letter is still locked in its cell

  Rule: No hints in the tutorials, including the whole reordering tutorial (R8)

    @browser
    Scenario: No hints after the reordering tutorial's move
      Given the first level that needs reordering is a 2-row test level, whose solution needs its top row moved down
      When the player makes the reordering tutorial's move
      Then there are no hint buttons

  Rule: A hint the player can't afford opens "Not enough coins" (R9)

    @browser
    Scenario: Not enough coins
      Given the Letter price is 30
      And the player has 20 coins
      When the player uses the Letter hint
      Then "Not enough coins" opens, with a "Watch an ad for +50" button and Close
      And the player has 20 coins
      And none of LEMUR's cells is locked

    @browser
    Scenario: Closing it leaves the level as it was
      Given the Letter price is 30
      And the player has 20 coins
      When the player uses the Letter hint
      And closes "Not enough coins"
      Then the level is as it was before the hint was tapped

    @browser
    Scenario: Watching its ad
      Given the ad reward is 50
      And the Letter price is 30
      And the player has 20 coins
      When the player uses the Letter hint
      And watches the popup's ad to the end
      Then the player has 70 coins

    @browser
    Scenario: Its ad button waits like the top bar's
      Given the ad reward is 50
      And the rewarded ad wait is 3 minutes
      And the Letter price is 100
      And the player has 20 coins
      When the player watches an ad to the end
      And 30 seconds pass
      And the player uses the Letter hint
      Then "Not enough coins" opens, with its ad button greyed out and reading "2:30"

    @browser
    Scenario: With no ads, it says how to earn coins
      Given no ad can play
      And the Letter price is 30
      And the player has 20 coins
      When the player uses the Letter hint
      Then "Not enough coins" says "Finish a series or find bonus words to earn coins, or try watching an ad later."
      And it has Close and no ad button

  Rule: Spending counts the coins down (R10)

    # The spending sound waits for M07-07 (sound).
    @browser
    Scenario: The counter counts down
      Given the Letter price is 30
      And the player has 100 coins
      When the player uses the Letter hint
      Then the coin counter counts down from 100 to 70

  Rule: The Letter hint can confirm a letter that's already right (R11)

    @browser
    Scenario: A right letter is locked, and paid for
      Given the Letter price is 30
      And the player has 100 coins
      And LEMUR's row reads L E M U _
      And the Letter hint will pick the first cell
      When the player uses the Letter hint
      Then LEMUR's first cell holds L, locked
      And the player has 70 coins

  Rule: The Ordering hint stays available when the rows are already in order (R12)

    @browser
    Scenario: Rows already in a solving order
      Given the Ordering price is 40
      And the player has 100 coins
      And the rows are ZEBRA, LEMUR, KANGAROO with Z, L, K in the column
      When the player uses the Ordering hint
      Then the player has 60 coins
      And there are no handles
      And the rows are ZEBRA, LEMUR, KANGAROO

  Rule: In the reordering tutorial, the handles go once its moves are made (R13)

    @browser
    Scenario: Only sliding is left
      Given the first level that needs reordering is a 2-row test level, whose solution needs its top row moved down
      When the player makes the reordering tutorial's move
      Then there are no handles
      And the rows stay in the order the move made

    @browser
    Scenario: Later levels have handles as usual
      Given the first level that needs reordering is a 2-row test level, whose solution needs its top row moved down
      When the player makes the reordering tutorial's move
      And the player wins the level and plays the next one
      And phase two starts
      Then every row has its handle
