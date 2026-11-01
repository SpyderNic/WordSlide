# D42: development builds have a level picker. The address is that picker, so a
# released game always opens at its first level for now.

Feature: Choosing a level from the address

  Scenario: A development build opens the level asked for
    Given a development build with 3 levels
    When the address asks for level 2
    Then level 2 opens

  Scenario: A development build ignores a level that doesn't exist
    Given a development build with 3 levels
    When the address asks for level 9
    Then level 1 opens

  Scenario: A released build ignores the address
    Given a released build with 3 levels
    When the address asks for level 2
    Then level 1 opens
