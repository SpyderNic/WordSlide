# Archived from features/5-the-whole-game/m05-04-reordering-taught-later.feature, before M07-03 (buying hints).
# The game as it was is tagged before-m07-03 in git. These scenarios no longer run.

Feature: m05-04-reordering-taught-later (archived)

  # Archived for M07-03: the hand now shows every move, and the handles go once the rows are in a solving order (M07-03, R13): its scenarios "On a level needing two moves, the hand shows each in turn" and "The handles go once every move is made".
    @browser
    Scenario: After the first move, the player makes the rest freely
      Given the player has made the shown move
      When the player swaps the top two rows
      Then the rows are in the solution's order

