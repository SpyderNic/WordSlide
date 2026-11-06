# Status: approved by the designer on 2026-10-31.
# Map: docs/milestones/5-the-whole-game/m05-01-next-level-and-progress.md

Feature: Unlock the next level and save progress
  As a player
  I want to move on to the next level and keep my progress
  So that I can come back later and carry on where I stopped

  Rule: Levels come in a fixed order

    Scenario: Winning a level unlocks the next
      Given the player is on level 4
      When the player wins the level
      Then level 5 is unlocked

    @browser
    Scenario: A later level can't be reached early
      Given the player is on level 5
      Then there's no way to reach level 6

  Rule: Winning a level gives 1 point

    Scenario: The total goes up by one
      Given the player has 3 points in total
      When the player wins a level
      Then the player has 4 points in total

    @browser
    Scenario: An instant win counts the same
      Given the player has 3 points in total
      And a level that starts phase two already solved
      When the ceremony ends
      Then the player has 4 points in total

  Rule: The popup's button opens the next level from the start

    @browser
    Scenario: The next level starts fresh
      Given the player has won level 4
      When the player presses "Play Level 5"
      Then level 5 opens in phase one
      And no letters are placed
      And the level number shows 5

    @browser
    Scenario: The next level fades in
      When the player presses "Play Level 5"
      Then level 5 appears with a fade of about 0.3 seconds

  Rule: A new player starts at the beginning

    @browser
    Scenario: First time
      Given the game has never been played on this device
      When the game opens
      Then the level number shows 1
      And the player has 0 points in total

  Rule: Progress is saved as soon as a level is won

    @browser
    Scenario: Closing during the celebration loses nothing
      Given the player has 3 points in total
      When the player wins level 4
      And the game closes before the popup appears
      And the game opens again
      Then the level number shows 5
      And the player has 4 points in total

  Rule: Reopening the game continues from the saved level

    @browser
    Scenario: The game opens where the player left off
      Given level 5 reached and 4 points saved
      When the game opens
      Then the level number shows 5
      And the player has 4 points in total

    @browser
    Scenario: Reloading the page keeps progress
      Given level 5 reached and 4 points saved
      When the page reloads
      Then the level number shows 5

  Rule: If saving isn't possible, the game still plays

    @browser
    Scenario: Blocked saving doesn't stop the game
      Given saving is blocked
      When the player wins level 1
      Then level 2 opens as usual

    @browser
    Scenario: Blocked saving loses progress on closing
      Given saving is blocked
      And the player has reached level 2
      When the game closes and opens again
      Then the level number shows 1

  Rule: A won level can't be replayed

    @browser
    Scenario: There's no way back
      Given the player has won level 4
      Then there's no way to open level 4

  Rule: Progress within a level is saved

    @browser
    Scenario: Phase-one progress comes back
      Given a Z placed in a cell
      And LEMUR is locked
      When the game closes and opens again
      Then the Z is in the same cell
      And LEMUR is still locked
      And the pool counts are the same

    @browser
    Scenario: A hinted letter that went to the pool stays there
      # M06-03: with a pool per row, a hint only leaves its row for answers made of the same letters.
      Given the answers MEAT and TEAM
      And M revealed at position 1 of row 1
      And the player has built MEAT in row 2
      When the game closes and opens again
      Then row 1 reads _ _ _ _
      And the pool holds A, E, M, T

    @browser
    Scenario: Phase-two progress comes back
      Given phase two has started
      And KANGAROO has its N in the column, in the top row
      When the game closes and opens again
      Then the game is in phase two
      And KANGAROO has its N in the column, in the top row
      And the column and handles are showing

    @browser
    Scenario: Closing during a drag restores the board from before it
      Given the player is dragging a Z from the pool
      When the game closes and opens again
      Then the Z is back in the pool

    @browser
    Scenario: Closing during the ceremony opens on the finished layout
      Given the phase-two ceremony is playing
      When the game closes and opens again
      Then the finished phase-two layout appears

    @browser
    Scenario: Winning clears the level's saved progress
      Given the player has won level 4
      When the game closes and opens again
      Then level 5 opens in phase one
      And no letters are placed

  Rule: Development builds have a level picker and a progress reset

    @browser
    Scenario: The designer can jump to a level
      Given a development build
      When the designer picks level 12
      Then level 12 opens

    @browser
    Scenario: A picked level isn't saved
      Given a development build
      And level 5 reached and 4 points saved
      When the designer picks level 12
      And the player wins the level
      And the game opens
      Then the level number shows 5
      And the player has 4 points in total

    @browser
    Scenario: The designer can reset progress
      Given a development build
      And level 5 reached and 4 points saved
      When the designer resets progress
      Then the level number shows 1
      And the player has 0 points in total

    Scenario: Players never see them
      Given a release build
      Then there's no level picker and no progress reset
