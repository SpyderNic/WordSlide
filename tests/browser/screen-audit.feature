# Added by the test audit. This isn't a designed story: these check on screen what
# the approved scenarios settle in the logic tests, and the false-flick fix.

@browser
Feature: What the screen shows

  Scenario: A tile is grey exactly while it has no copies left
    When the level opens
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

  Scenario: The selected row is marked until a drag hides it
    When the level opens
    And the player clicks a cell of ZEBRA's row
    Then ZEBRA's row is marked as selected
    When the player drags a letter
    Then no row is drawn as selected

  Scenario: A letter under a drag can be seen moving with the pointer
    Given the player is holding the Z from the pool
    Then a tile showing Z is under the pointer

  Scenario: A word that stopped before the release doesn't glide
    When the player swings LEMUR fast, stops, and releases it
    Then it snaps without gliding
