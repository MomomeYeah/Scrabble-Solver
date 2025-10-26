# UI Enhancements
- Smoother experience when entering tiles on board / rack
    - Automatically highlight next square?
    - Arrow keys to change direction?
- Enhance getMove() to allow showing "top N" moves, where N is specified via UI
- Debug via UI
    - Show anchor tiles, prefixes and suffixes, playable letters, etc.
    - For each move, show cross-words formed, score for each, multipliers, etc.

# Tests
- Investigate somewhat-slow board tests (~500ms per test)
- All cross-words form valid words

# Possible Bugs
Bugs listed here are uncertain and require further testing to determine if they are real or simply a figment of my imagination

- Move generation currently will use a lettered Tile OR a blank, but it can't try both possibilities
- May be possible that first move can generate words not containing the centre square

# Functionality Enhancements
- Fully solve final moves once bag is empty
- Add validation at various points to make sure that e.g. moves place tiles in valid positions