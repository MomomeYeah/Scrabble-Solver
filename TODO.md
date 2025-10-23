# UI Enhancements
- Smoother experience when entering tiles on board / rack
    - Automatically highlight next square?
    - Arrow keys to change direction?
- Use contexts + prop types and / or switch to Redux for state

# Tests
- Investigate somewhat-slow board tests (~500ms per test)
- All cross-words form valid words

# Code Tidy-Up
- Inconsistent use of cell.tile vs. cell.isEmpty
- Feels like it should be possible to condense solving functions somewhat
- Ensure naming is consistent and intuitive across the board
- Move generation currently will use a lettered Tile OR a blank, but it can't try both possibilities
    - This may not be true - need to test
- Is there a nicer way of building words with no existing prefix, to avoid having to check that it crosses anchor?

# Functionality Enhancements
- Fully solve final moves once bag is empty
- Add validation at various points to make sure that e.g. moves place tiles in valid positions