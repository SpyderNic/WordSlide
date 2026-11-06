# Status: approved by the designer on 2026-10-30.
# Map: docs/milestones/2-levels-and-screen/m02-01-level-data-and-validator.md
# Unless a scenario says otherwise, a level is valid in every way but the one being tested.

Feature: Level data and validator
  As the game's designer
  I want every level described in a fixed format and checked automatically
  So that no broken level ever reaches a player

  Rule: A level has a theme, answers and a final word

    Scenario: A complete level passes
      Given a level with the theme "Animals"
      And the answers ZEBRA, LEMUR and KANGAROO
      And the final word ELK
      When the validator checks the level
      Then the level passes

    Scenario: A level with no theme is rejected
      Given a level with no theme
      When the validator checks the level
      Then the level is rejected because the theme is missing

    Scenario: A level with no final word is rejected
      Given a level with no final word
      When the validator checks the level
      Then the level is rejected because the final word is missing

  Rule: The final word has one letter or digit per row, and no special characters

    Scenario: A final word with one letter per row passes
      Given the answers ZEBRA, LEMUR and KANGAROO
      And the final word ELK
      When the validator checks the level
      Then the level passes

    Scenario: A final word can contain a digit
      Given the answers R2D2, CAT and DOG
      And the final word 2AD
      When the validator checks the level
      Then the level passes

    Scenario: A final word of the wrong length is rejected
      Given the answers ZEBRA, LEMUR and KANGAROO
      And the final word ELKS
      When the validator checks the level
      Then the level is rejected because the final word doesn't have one character per row

    Scenario: A final word with a special character is rejected
      Given the answers ZEBRA, LEMUR and KANGAROO
      And the final word E-K
      When the validator checks the level
      Then the level is rejected because the final word contains a special character

  Rule: Each final-word letter must come from a different answer

    Scenario: The validator proves a solution exists
      Given the answers ZEBRA, LEMUR and KANGAROO
      And the final word ELK
      When the validator checks the level
      Then the level passes
      And the validator reports one solution for the level

    Scenario: A final word the rows can't spell is rejected
      Given the answers ZEBRA, LEMUR and KANGAROO
      And the final word ZOO
      When the validator checks the level
      Then the level is rejected because no solution exists

    Scenario: An accented letter can spell an accented letter in the final word
      Given the answers CAFÉ, OX and BEE
      And the final word ÉXE
      When the validator checks the level
      Then the level passes

    Scenario: Those answers can spell other final words too
      Given the answers CAFÉ, OX and BEE
      And the final word BOA
      When the validator checks the level
      Then the level passes

    Scenario: An accented letter can't stand in for its base letter
      Given the answers CAFÉ, OX and BEE
      And the final word EXE
      When the validator checks the level
      Then the level is rejected because no solution exists

  Rule: One working solution is enough

    Scenario Outline: A level passes however its letters can be matched to rows
      Given the answers ZEBRA, LEMUR and KANGAROO
      And the final word <final word>
      When the validator checks the level
      Then the level passes

      Examples:
        | final word | why it's interesting                      |
        | ERA        | E and R can each come from different rows |
        | EEK        | The two E's can come in either order      |

  Rule: A revealed letter must match its answer at that position

    Scenario: A correct revealed letter passes
      Given the answer LEMUR with L revealed at position 1
      When the validator checks the level
      Then the level passes

    Scenario: An incorrect revealed letter is rejected
      Given the answer LEMUR with X revealed at position 1
      When the validator checks the level
      Then the level is rejected because a revealed letter doesn't match its answer

  Rule: The pool is worked out automatically

    Scenario: The pool holds all answer characters when nothing is revealed
      Given the answers ZEBRA, LEMUR and KANGAROO
      And no revealed letters
      When the pool is worked out
      Then the pool has 18 letters

    Scenario: Revealed copies stay out of the pool
      Given the answers ZEBRA, LEMUR and KANGAROO
      And L revealed at position 1 of LEMUR
      When the pool is worked out
      Then the pool has 17 letters
      And the pool has no L

    Scenario: Digits go in the pool
      Given the answers R2D2, CAT and DOG
      When the pool is worked out
      Then the pool has two copies of 2

    Scenario: Accented letters go in the pool as their own tiles
      Given the answers CAFÉ and FEE
      When the pool is worked out
      Then the pool order is A, C, E, É, F

    Scenario Outline: Special characters are revealed and stay out of the pool
      Given the answer <answer>
      When the level starts
      Then its row starts as <row>
      And the pool gets <letters> from that answer

      Examples:
        | answer  | row           | letters          |
        | HOT DOG | _ _ _ ␣ _ _ _ | H, O, T, D, O, G |
        | T-REX   | _ - _ _ _     | T, R, E, X       |
        | DON'T   | _ _ _ ' _     | D, O, N, T       |
        | 'TIS    | ' _ _ _       | T, I, S          |
        | ROCKIN' | _ _ _ _ _ _ ' | R, O, C, K, I, N |

  Rule: Row order and centring are worked out automatically

    Scenario: Rows are ordered by length, then alphabetically
      Given the answers ZEBRA, LEMUR and KANGAROO
      When the row order is worked out
      Then the rows are LEMUR, ZEBRA, KANGAROO

    Scenario: Special characters don't count towards the row order
      Given the answers KANGAROO, ICE CREAM and LEMUR
      When the row order is worked out
      Then the rows are LEMUR, ICE CREAM, KANGAROO

    Scenario Outline: Alphabetical order puts special characters first, accented letters after their base letter, and digits last
      Given the answers <first> and <second>
      When the row order is worked out
      Then <first> comes before <second>

      Examples:
        | first | second |
        | T-REX | TREE   |
        | TREE  | TRE1   |
        | CAFE  | CAFÉ   |
        | CAFÉ  | CAFF   |

    Scenario Outline: Rows are centred by their cells
      Given the answer <answer>
      When its position is worked out
      Then the screen's centre line falls <position>

      Examples:
        | answer    | position                                   |
        | ZEBRA     | on the middle of cell 3                    |
        | KANGAROO  | between cells 4 and 5                      |
        | ICE CREAM | on the middle of cell 5                    |

  Rule: A level has 2 to 5 rows, and each answer has a length of 2 to 8

    Scenario Outline: The number of rows is limited
      Given a level with <rows> rows
      When the validator checks the level
      Then the level <result>

      Examples:
        | rows | result                                    |
        | 1    | is rejected because it has too few rows   |
        | 2    | passes                                    |
        | 5    | passes                                    |
        | 6    | is rejected because it has too many rows  |

    Scenario Outline: The length of an answer is limited
      Given a level containing the answer <answer>
      When the validator checks the level
      Then the level <result>

      Examples:
        | answer    | result                                   |
        | X         | is rejected because X is too short       |
        | OX        | passes                                   |
        | E.T.      | passes                                   |
        | CAT       | passes                                   |
        | R2D2      | passes                                   |
        | KANGAROO  | passes                                   |
        | ICE CREAM | passes                                   |
        | CHAMELEON | is rejected because CHAMELEON is too long |

  Rule: A level can't contain the same answer twice

    Scenario: A repeated answer is rejected
      Given the answers ZEBRA, ZEBRA and LEMUR
      When the validator checks the level
      Then the level is rejected because ZEBRA appears twice

  Rule: Answers aren't rejected for their characters

    Scenario Outline: Legitimate answers pass with whatever they need
      Given a level containing the answer <answer>
      When the validator checks the level
      Then the level passes

      Examples:
        | answer  |
        | HOT DOG |
        | T-REX   |
        | DON'T   |
        | ROCKIN' |
        | 'TIS    |
        | R&B     |
        | MR. T   |
        | CAFÉ    |

  Rule: The validator warns if phase two would start already solved

    Scenario: A level that starts solved gets a warning but stays allowed
      Given the answers EMU, LION and KOALA
      And the final word ELK
      When the validator checks the level
      Then the level passes
      And the validator warns that the level starts already solved

    Scenario: The check reads each row's first letter, not its first cell
      Given the answers 'TIS, LION and KOALA
      And the final word TLK
      When the validator checks the level
      Then the level passes
      And the validator warns that the level starts already solved

    Scenario: A level that doesn't start solved gets no warning
      Given the answers ZEBRA, LEMUR and KANGAROO
      And the final word ELK
      When the validator checks the level
      Then the level passes
      And the validator gives no warning
