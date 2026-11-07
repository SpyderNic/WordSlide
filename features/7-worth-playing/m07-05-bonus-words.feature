# Status: approved by the designer on 2026-11-06.
# Map: docs/milestones/7-worth-playing/m07-05-bonus-words.md
# Economy values are settings (D52): each scenario sets the ones it uses.
# Levels here are made up (D46). The theme is Animals. Unless a scenario says
# otherwise, the level's rows are WOLF, NEWT and others, and its bonus words
# include FOWL (from WOLF's letters) and one word its column can read in
# phase two, called "the column's bonus word". WENT isn't an animal.
# Scenarios without @browser check the generator and the game's levels,
# without the screen.

Feature: Bonus words
  As a player who spells a word that fits the theme but isn't the answer
  I want it to count for something
  So that being clever is rewarded instead of feeling like a dead end

  Rule: A themed word other than the answer, read in the column, is a bonus word (R1)

    @browser
    Scenario: The column reads a bonus word
      Given phase two has started
      When the player slides the words until the column reads the column's bonus word
      Then "Bonus word!" appears
      And the level isn't won

    @browser
    Scenario: The column reads a word that isn't an animal
      Given phase two has started
      When the player slides the words until the column reads a word that isn't in the bonus list
      Then "Bonus word!" doesn't appear

  Rule: A full row can spell a bonus word too, and doesn't shake the first time (R2)

    @browser
    Scenario: Filling WOLF's row with FOWL
      Given a bonus word reward of 10
      And the player has 100 coins
      When the player fills WOLF's row with F, O, W, L
      Then the row doesn't shake
      And the row's letters pulse once
      And "Bonus word!" appears
      And the player has 110 coins
      And WOLF's row still reads FOWL

    @browser
    Scenario: Filling NEWT's row with WENT
      When the player fills NEWT's row with W, E, N, T
      Then the row shakes
      And "Bonus word!" doesn't appear

  Rule: A bonus word is found when a word or row settles (R3)

    @browser
    Scenario: Sliding past a bonus word without stopping
      Given phase two has started
      When the player drags a word through the position that reads the column's bonus word, and lets go further on
      Then "Bonus word!" doesn't appear

    @browser
    Scenario: Phase two starts on a bonus word
      Given a bonus word reward of 10
      And the player has 100 coins
      And a level whose column reads a bonus word when phase two starts
      When phase two starts
      Then "Bonus word!" appears once the ceremony has ended
      And the player has 110 coins

  Rule: Finding one gives gentle feedback, and doesn't block play (R4)

    @browser
    Scenario: The column's feedback
      Given phase two has started
      When the player slides the words until the column reads the column's bonus word
      Then the column's letters pulse once and keep their colour
      And "Bonus word!" appears above the rows, rises and fades

    @browser
    Scenario: Carrying on straight away
      Given phase two has started
      When the player slides the words until the column reads the column's bonus word
      And the player slides another word while "Bonus word!" is showing
      Then that word moves

  Rule: The first bonus word ever found says a little more (R5)

    @browser
    Scenario: The first and the second
      Given the player has never found a bonus word
      When the player fills WOLF's row with F, O, W, L
      Then "Not the answer, but well spotted!" appears under "Bonus word!"
      When phase two starts
      And the player slides the words until the column reads the column's bonus word
      Then "Bonus word!" appears without the line under it

    @browser
    Scenario: Remembered after the game closes
      Given the player has found a bonus word in an earlier level
      When the game closes and opens again
      And the player fills WOLF's row with F, O, W, L
      Then "Bonus word!" appears without the line under it

  Rule: Each bonus word counts once per level, wherever it's spelled (R6)

    @browser
    Scenario: The same row again
      Given a bonus word reward of 10
      And the player has 100 coins
      And the player has filled WOLF's row with F, O, W, L
      When the player empties WOLF's row and fills it with F, O, W, L again
      Then the row shakes
      And "Bonus word!" doesn't appear
      And the player has 110 coins

    @browser
    Scenario: The same column again
      Given a bonus word reward of 10
      And the player has 100 coins
      And phase two has started
      And the player has slid the words until the column reads the column's bonus word
      When the player slides a word away and back again
      Then "Bonus word!" doesn't appear again
      And the player has 110 coins

    @browser
    Scenario: Found in a row, then read in the column
      Given a level where FOWL is in WOLF's letters and can also be read in the column
      And the player has filled WOLF's row with F, O, W, L
      When phase two starts
      And the player slides the words until the column reads FOWL
      Then "Bonus word!" doesn't appear

  Rule: A bonus word gives the bonus word reward (R7)

    @browser
    Scenario: Coins fly from the column
      Given a bonus word reward of 10
      And the player has 100 coins
      And phase two has started
      When the player slides the words until the column reads the column's bonus word
      Then coins fly from the column to the coin counter
      And the coin counter counts up from 100 to 110

    @browser
    Scenario: Coins fly from the row
      Given a bonus word reward of 10
      And the player has 100 coins
      When the player fills WOLF's row with F, O, W, L
      Then coins fly from WOLF's row to the coin counter
      And the coin counter counts up from 100 to 110

  Rule: A level's found bonus words are saved with it (R11)

    @browser
    Scenario: Reopening doesn't pay twice
      Given a bonus word reward of 10
      And the player has 100 coins
      And the player has filled WOLF's row with F, O, W, L
      When the game closes and opens again
      And the player empties WOLF's row and fills it with F, O, W, L again
      Then the row shakes
      And the player has 110 coins

    @browser
    Scenario: Closing straight after finding one
      Given a bonus word reward of 10
      And the player has 100 coins
      When the player fills WOLF's row with F, O, W, L and the game closes straight away
      And the game opens again
      Then the player has 110 coins

  Rule: There's nothing to miss (R8)

    @browser
    Scenario: Winning shows nothing about bonus words
      Given the player has found one of the level's bonus words
      When the player wins the level
      Then nothing on screen mentions bonus words, found or left

  Rule: Level 1 has no bonus words (R9)

    Scenario: The tutorial level
      Then the game's level 1 has no bonus words

  Rule: Each level stores its bonus words, worked out when it's made (R10)

    Scenario: Column words, with the rows in any order
      Given a level after the reordering tutorial
      When the generator works out its bonus words
      Then they include every word in the theme's list, other than the level's answers and final word, that the column can read with the rows in any order

    Scenario: Column words, before the reordering tutorial
      Given a level before the reordering tutorial
      And an animal its column can only read with the rows in another order
      When the generator works out its bonus words
      Then that animal isn't among them

    Scenario: Row words
      Given a level with the WOLF row
      When the generator works out its bonus words
      Then FOWL is among them

    Scenario: Answers are never bonus words
      Given a level one of whose rows can spell another of its answers
      When the generator works out its bonus words
      Then that answer isn't among them

    Scenario: Approved levels keep their bonus words
      Given a review file with a ticked suggestion
      When the designer approves it
      Then the level added to the game has its bonus words

    Scenario: The game's levels all have bonus lists
      Then every level in the game has a list of bonus words, even if it's empty

  Rule: The designer doesn't see the bonus words (R12)

    Scenario: The generator only prints counts
      When the generator works out a level's bonus words
      Then its output gives how many there are, and never the words
