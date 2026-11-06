# Added by the test audit. This isn't a designed story: these check on screen what
# the approved scenarios settle in the logic tests, and the false-flick fix.

@browser
Feature: What the screen shows

  # Z is ZEBRA's letter: its row is selected first (M06-03).
  Scenario: A tile is grey exactly while it has no copies left
    When the player selects ZEBRA's row
    Then the Z tile is drawn in its ordinary colour
    When the player places the Z
    Then the Z tile is drawn grey
    When the player presses Recall All
    Then the Z tile is drawn in its ordinary colour

  Scenario: Picking up the last copy turns its tile grey straight away
    Given the player is holding the Z from the pool
    Then the Z tile is drawn grey

  Scenario: The Recall All button is grey exactly while there's nothing to recall
    When the level opens
    Then the Recall All button is drawn grey
    When the player places the Z
    Then the Recall All button is drawn in its ordinary colour
    When the player presses Recall All
    Then the Recall All button is drawn grey

  Scenario: A letter under a drag can be seen moving with the pointer
    Given the player is holding the Z from the pool
    Then a tile showing Z is under the pointer

  Scenario: A word that stopped before the release doesn't glide
    When the player swings LEMUR fast, stops, and releases it
    Then it snaps without gliding

  Scenario: A locked word alone leaves the Recall All button grey
    When LEMUR locks
    Then the Recall All button is drawn grey

  Scenario: A letter from the pool doesn't highlight a tile over the pool
    Given the player is holding the Z from the pool
    When the held letter moves over another pool tile
    Then no pool tile is highlighted

  Scenario Outline: A word stretches only a little past either end
    When the player drags LEMUR far past its <end> letter
    Then it stretches less than half a cell past that letter

    Examples:
      | end   |
      | first |
      | last  |

  Scenario: Handles resize with a rotation
    Given the ceremony has ended
    When the device rotates to 1000×800
    Then each handle is drawn at its full size
    And each handle shows three short horizontal lines

  Scenario: A row moved with the keyboard can win
    Given the rows are LEMUR, ZEBRA, KANGAROO with L, E, K in the column
    And ZEBRA's row is selected in slot 2
    When the player presses Shift+Up
    Then the level is won
