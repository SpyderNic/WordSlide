# Status: approved by the designer on 2026-10-31.
# Map: docs/milestones/6-content/story-14-level-generator.md
# The generator is an offline tool and isn't shipped with the game.

Feature: Level generator
  As the game's designer
  I want a tool that suggests levels from a theme's word list
  So that making many levels doesn't mean finding every combination by hand

  Rule: The generator takes a theme, its word list and settings

    Scenario: A run with settings
      Given the theme Animals and its word list
      And the settings 3 rows, words of 4 to 8 letters, no revealed letters, reordering needed
      When the generator runs
      Then every suggestion has 3 answers of 4 to 8 letters

    Scenario: Settings outside the game's limits are refused
      Given the setting 6 rows
      When the generator runs
      Then it stops and says the setting is outside the limits

  Rule: It starts from a final word in the same theme

    Scenario: Answers can spell the final word
      Given a suggestion with the final word ELK
      Then one answer has an E
      And a different answer has an L
      And a different answer has a K

    Scenario: The final word is in the theme
      Given the theme Animals
      When the generator runs
      Then every final word comes from the Animals word list

    Scenario: A final word isn't also an answer
      When the generator runs
      Then no suggestion has its final word among its answers

  Rule: Every suggestion passes the validator

    Scenario: Suggestions pass
      When the generator runs
      Then every suggestion passes the validator

    Scenario: Suggestions never start already solved
      When the generator runs
      Then no suggestion gets the validator's already-solved warning

  Rule: Nothing reaches the game until the designer approves it

    Scenario: Running the generator doesn't change the game
      When the generator runs
      Then the game's levels haven't changed

    Scenario: Each run writes a review file
      When the generator runs
      Then it writes a Markdown file of its suggestions
      And each suggestion has a box to tick

    Scenario: Only ticked suggestions are added
      Given a review file with one suggestion ticked
      When the designer approves the file
      Then only that suggestion is added to the game's levels

  Rule: The same input gives the same suggestions

    Scenario: Two runs match
      Given the same settings and word list
      When the generator runs twice
      Then both runs give the same suggestions

  Rule: The generator doesn't need a browser or the game

    Scenario: It runs from a single command
      When the generator is started from a single command
      Then it runs without a browser

  Rule: Revealed letters are a setting

    Scenario: By default, nothing is revealed
      Given no setting for revealed letters
      When the generator runs
      Then no suggestion reveals a letter

    Scenario: First letters
      Given the setting first letters
      When the generator runs
      Then every answer in a suggestion has its first letter revealed

    Scenario: Random letters
      Given the setting 2 letters at random
      When the generator runs
      Then every suggestion reveals 2 letters

    Scenario: Random letters are fixed in the level
      Given an approved level with 2 random letters revealed
      When two players open that level
      Then both see the same 2 letters

  Rule: Whether reordering is needed is a setting

    Scenario: With reordering needed
      Given the setting reordering needed
      When the generator runs
      Then no suggestion can be solved by sliding alone

    Scenario: With reordering not needed
      Given the setting reordering not needed
      When the generator runs
      Then every suggestion can be solved by sliding alone

  # Handles and the validator's check before the reordering tutorial moved to
  # story 21, which puts that tutorial at level 21.

  Rule: Within a theme, every word is unique across the curated levels

    Scenario: Used words are skipped
      Given ZEBRA is in an approved Animals level
      When the generator runs for Animals
      Then no suggestion uses ZEBRA as an answer or final word

    Scenario: A word can appear in different themes
      Given WINTER is in an approved Cold level
      When the generator runs for Christmas
      Then a suggestion can use WINTER

    Scenario: Too few words left
      Given a theme with too few unused words for the settings
      When the generator runs
      Then it says so, and offers what it can
