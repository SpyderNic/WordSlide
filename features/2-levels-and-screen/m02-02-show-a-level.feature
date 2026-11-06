# Status: approved by the designer on 2026-10-31.
# Map: docs/milestones/2-levels-and-screen/m02-02-show-a-level.md
# M06-03 changed this file's examples on 2026-11-04: each row has its own pool, so examples use the row's own letters. The pool shows the selected row's letters (M06-03, R1).
# Unless a scenario says otherwise, the level has the theme "Animals",
# the answers ZEBRA, LEMUR and KANGAROO, and nothing revealed.

@browser
Feature: Show a level
  As a player
  I want to see the level's theme, rows and available letters when it opens
  So that I can start working out the words

  Rule: The screen shows the level in landscape

    Scenario: The main areas are in their places
      When the level opens
      Then the theme "Animals" is at the top of the screen
      And the rows are in the middle of the screen
      And the pool is at the bottom of the screen

    Scenario: The top of the screen is laid out from left to right
      When the level opens
      Then the top of the screen reads, from left to right: home, level number, ad button, coins, settings

    Scenario: The level number is shown
      Given the player is on level 4
      When the level opens
      Then the level number shows 4

  Rule: Rows appear in order, centred on the screen

    Scenario: Rows are ordered by length, then alphabetically
      When the level opens
      Then the rows are LEMUR, ZEBRA, KANGAROO from top to bottom

    Scenario Outline: Rows are centred by their cells
      When the level opens
      Then the screen's centre line falls <position> of <answer>'s row

      Examples:
        | answer   | position                |
        | ZEBRA    | on the middle of cell 3 |
        | KANGAROO | between cells 4 and 5   |

  Rule: Each row shows one cell per character, and all cells are on screen

    Scenario Outline: A row has one cell per character
      Given a level containing the answer <answer>
      When the level opens
      Then its row has <cells> cells

      Examples:
        | answer    | cells |
        | LEMUR     | 5     |
        | KANGAROO  | 8     |
        | ICE CREAM | 9     |

    Scenario: A full level fits on the smallest screen
      Given a level with 5 rows
      And a screen of 800×450
      When the level opens
      Then every cell and every pool tile is on screen

  Rule: Revealed letters and special characters are already in place

    Scenario Outline: A row starts with only its revealed characters filled in
      Given a level containing the answer <answer>
      And <revealed> revealed
      When the level opens
      Then its row starts as <row>

      Examples:
        | answer  | revealed           | row           |
        | LEMUR   | nothing            | _ _ _ _ _     |
        | LEMUR   | L at position 1    | L _ _ _ _     |
        | HOT DOG | nothing            | _ _ _ ␣ _ _ _ |
        | T-REX   | nothing            | _ - _ _ _     |

    Scenario: Revealed letters have their own tile colour
      Given L revealed at position 1 of LEMUR
      When the level opens
      Then the L is on a revealed-colour tile

  Rule: Special characters have no tile and no cell outline

    Scenario: A space is a one-cell gap
      Given a level containing the answer HOT DOG
      When the level opens
      Then there's a one-cell gap between HOT and DOG
      And that gap has no tile and no outline

    Scenario: Other special characters show only their symbol
      Given a level containing the answer T-REX
      When the level opens
      Then cell 2 shows a hyphen
      And that cell has no tile and no outline

  Rule: The pool shows each of the level's characters once, with its count

    Scenario: Copies of a letter share one tile
      When the player selects KANGAROO's row
      Then the pool has 6 tiles holding 8 letters
      And the pool shows these tiles in this order:
        | tile | count |
        | A    | x2    |
        | G    | x1    |
        | K    | x1    |
        | N    | x1    |
        | O    | x2    |
        | R    | x1    |

    Scenario: The count is in the tile's bottom-right corner
      When the level opens
      Then each pool tile shows its count in its bottom-right corner

    Scenario Outline: The pool follows alphabetical order
      Given the answers <answers>
      When the level opens
      Then the pool order is <order>

      Examples:
        | answers      | order            |
        | ÉLEVÉ and TROMBONE | E, É, L, V |
        | R2D2 and CAROUSEL  | D, R, 2    |

    Scenario: Digits share a tile too
      Given a level containing the answer R2D2
      When the player selects R2D2's row
      Then the pool shows 2 x2

  Rule: The pool area and tiles have fixed sizes

    Scenario: The pool area doesn't depend on how many tiles it holds
      Given one level with 8 pool tiles and one with 20
      And both levels have 3 rows
      When each level opens
      Then the pool area is the same size in both
      And the rows are in the same place in both

    Scenario: Tiles are the same size in every level on a screen
      Given one level with 3 rows and one with 5
      When each level opens on the same screen
      Then the tiles are the same size in both

    Scenario: Tiles use the width of a narrow screen
      Given a screen of 494×880
      When the level opens
      Then the tiles are at least 40 pixels wide

    Scenario: A long row fits a wide screen at normal size
      Given a level containing the answer A B C D E F
      And a screen of 800×450
      When the level opens
      Then the tiles are the normal size for this screen
      And every cell and every pool tile is on screen

    Scenario: A long row shrinks the tiles on a narrow screen
      Given a level containing the answer A B C D E F
      And a screen of 360×800
      When the level opens
      Then the tiles are smaller than the normal size for this screen
      And every cell and every pool tile is on screen

    Scenario Outline: The pool has as many rows as its screen needs
      Given a screen of <size>
      When the level opens
      Then the pool area has room for <rows> rows of tiles

      Examples:
        | size    | rows |
        | 800×450 | 2    |
        | 450×800 | 4    |

    Scenario: The largest pool fits a narrow screen
      Given a level with 26 pool tiles
      And a screen of 450×800
      When the level opens
      Then every cell and every pool tile is on screen

    Scenario: The top of the screen fits a portrait screen
      Given a screen of 450×800
      When the level opens
      Then the top of the screen fits with nothing overlapping

    Scenario: On a portrait screen, the top is bigger, with the theme on its own line
      Given a screen of 450×800
      When the level opens
      Then the top of the screen uses the tile size
      And the theme has its own centred line

  Rule: The column and handles stay hidden

    Scenario: Phase one shows neither
      When the level opens
      Then there's no highlighted column
      And there are no row handles

  Rule: The buttons are visible but do nothing

    Scenario Outline: Pressing a button leaves the level as it was
      Given the level is open
      When the player presses the <button> button
      Then the level stays exactly as it was

      Examples:
        | button   |
        | home     |
        | settings |

  Rule: The layout comes from the screen size

    Scenario Outline: A level can be laid out for any orientation
      Given a screen of <size>
      When the level opens
      Then every cell and every pool tile is on screen
      And the level's data hasn't changed

      Examples:
        | size    |
        | 800×450 |
        | 360×800 |

    Scenario: Rotating the device redraws the level
      Given the level is open on a screen of 800×450
      When the device rotates to 450×800
      Then the level is redrawn for 450×800
      And every cell and every pool tile is on screen
