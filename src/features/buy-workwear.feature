@workwear
Feature: Shop for Work Wear
  I can search for and buy work Wear
  
  Scenario: View product detail
    Given I am on the Mammoth Workwear home page
    When I click navigation item "Safety Boots"
    And I click product item "Timberland Pro Euro Hiker 2G Safety Boots"
    Then I should see product detail with title "Timberland Pro Euro Hiker 2G Safety Boots"