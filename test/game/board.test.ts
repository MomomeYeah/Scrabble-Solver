import { expect, test, describe } from 'vitest'
import { Board } from '../../src/game/board.js'
import { Tile, BlankTile } from '../../src/game/tile.js'
import { TilePlacement } from '../../src/game/tileplacement.js'
import { BaseCellType } from '../../src/game/celltype.js'

// Helper to create an empty board
function emptyTilesGrid() {
    const grid: Array<Array<Tile | null>> = new Array(15);
    for (let r = 0; r < 15; r++) {
        grid[r] = new Array(15).fill(null);
    }
    return grid;
}

// Helper to place a word horizontally (ACROSS) starting at row,col
function placeAcross(tiles: Array<Array<Tile | null>>, row: number, col: number, word: string) {
    for (let i = 0; i < word.length; i++) {
        tiles[row][col + i] = new Tile(word[i]);
    }
}

// Helper to place a word vertically (DOWN) starting at row,col
function placeDown(tiles: Array<Array<Tile | null>>, row: number, col: number, word: string) {
    for (let i = 0; i < word.length; i++) {
        tiles[row + i][col] = new Tile(word[i]);
    }
}

describe('Board basic behaviours', () => {
    test('populate places tiles and sets wordsPlayed', () => {
        const board = new Board();
        const tiles = emptyTilesGrid();
        tiles[7][7] = new Tile('H');

        board.populate(tiles);

        expect(board.wordsPlayed).toBe(true);
        expect(board.cells[7][7].tile).not.toBeNull();
        expect(board.cells[7][7].tile!.letter).toEqual('H');
    });

    test('calculateAnchorsAndPlayableLetters marks neighbours as anchors', () => {
        const board = new Board();
        const tiles = emptyTilesGrid();
        
        // place a single tile in the centre so several anchors appear
        tiles[7][7] = new Tile('H');
        board.populate(tiles);

        // neighbouring cells should be anchors
        expect(board.cells[7][6].isAnchor).toBe(true);
        expect(board.cells[7][8].isAnchor).toBe(true);
        expect(board.cells[6][7].isAnchor).toBe(true);
        expect(board.cells[8][7].isAnchor).toBe(true);
    });

    test('getScore calculates simple centre word with DW correctly', () => {
        const board = new Board();

        const placement = new TilePlacement(new Tile('A'), 7, 7, true);
        const score = board.getScore([placement], "ACROSS");

        // centre square is a double-word in the initial layout; A = 1 point -> 1 * 2 = 2
        expect(score).toEqual(2);
    });

    test('getScore gives +50 bingo when using 7 new tiles', () => {
        const board = new Board();
        // force the 7 target cells to be base (no multipliers) for deterministic scoring
        for (let i = 0; i < 7; i++) {
            board.cells[7][i].cellType = new BaseCellType();
        }

        const placementsAllNew: Array<TilePlacement> = [];
        for (let i = 0; i < 7; i++) {
            placementsAllNew.push(new TilePlacement(new Tile('A'), 7, i, true));
        }

        const scoreAllNew = board.getScore(placementsAllNew, "ACROSS");
        expect(scoreAllNew).toEqual(57) // 7 * 1 + 50
    });

    test('getScore does not give +50 bingo when creating a 7 letter word with only 6 new tiles', () => {
        // Simulate a 7-letter word but with one tile already on the board (no bingo)
        const board = new Board();
        // force the 7 target cells to be base (no multipliers) for deterministic scoring
        for (let i = 0; i < 7; i++) {
            board.cells[7][i].cellType = new BaseCellType();
        }
        
        // place first tile as existing
        board.cells[7][0].placeTile(new Tile('A'));
        const placementsOneExisting: Array<TilePlacement> = [];
        // first placement is existing (isNew = false)
        placementsOneExisting.push(new TilePlacement(new Tile('A'), 7, 0, false));
        for (let i = 1; i < 7; i++) {
            placementsOneExisting.push(new TilePlacement(new Tile('A'), 7, i, true));
        }

        const scoreOneExisting = board.getScore(placementsOneExisting, "ACROSS");

        // scoreAllNew should be exactly scoreOneExisting + 50 (bingo bonus) because we used base cells
        expect(scoreOneExisting).toEqual(7); // 7 * 1
    });

    test('getScore single word with no intersections', () => {
        const board = new Board();
        // ensure base cell types to avoid center double-word affecting score
        board.cells[7][7].cellType = new BaseCellType();
        board.cells[7][8].cellType = new BaseCellType();
        board.cells[7][9].cellType = new BaseCellType();

        const placements = [
            new TilePlacement(new Tile('D'), 7, 7, true),
            new TilePlacement(new Tile('O'), 7, 8, true),
            new TilePlacement(new Tile('G'), 7, 9, true),
        ];
        const score = board.getScore(placements, "ACROSS");
        // D(2)+O(1)+G(2) = 5
        expect(score).toEqual(5);
    });

    test('getScore with intersection counts intersecting words', () => {
        const board = new Board();
        // ensure base cell types to avoid DL cells affecting score
        board.cells[6][6].cellType = new BaseCellType();
        board.cells[6][8].cellType = new BaseCellType();

        const tiles = emptyTilesGrid();
        // create vertical word 'AT' so that (7,7) = 'A' exists and (8,7) = 'T' below it
        placeDown(tiles, 7, 7, 'AT');
        board.populate(tiles);

        // now create placements including the existing middle tile (isNew = false)
        const placements = [
            new TilePlacement(new Tile('T'), 6, 6, true),
            new TilePlacement(new Tile('E'), 6, 7, true),
            new TilePlacement(new Tile('A'), 6, 8, true),
        ];

        const score = board.getScore(placements, "ACROSS");
        // total score should take into account all intersecting words
        expect(score).toEqual(6); // T(1)+E(1)+A(1) + E(1)+A(1)+T(1)
    });

    test('getScore applies double letter multiplier correctly for new word', () => {
        const board = new Board();
        const tiles = emptyTilesGrid();

        // place new tiles to form 'KAK' across
        const placements = [
            new TilePlacement(new Tile('K'), 0, 3, true),
            new TilePlacement(new Tile('A'), 0, 4, true),
            new TilePlacement(new Tile('K'), 0, 5, true),
        ];

        const score = board.getScore(placements, "ACROSS");
        expect(score).toEqual(16) // K(5*2)+A(1)+K(5)
    });

    test('getScore ignore double letter multiplier for existing tile', () => {
        const board = new Board();
        const tiles = emptyTilesGrid();

        // place a tile on a double-letter cell from the initial layout: (0,3) is DL in initialBoard
        tiles[0][3] = new Tile('K');
        board.populate(tiles);

        // place new tiles on (0,4) and (0,5) to form 'KAK' across
        const placements = [
            new TilePlacement(new Tile('K'), 0, 3, false),
            new TilePlacement(new Tile('A'), 0, 4, true),
            new TilePlacement(new Tile('K'), 0, 5, true),
        ];

        const score = board.getScore(placements, "ACROSS");
        expect(score).toEqual(11) // K(5)+A(1)+K(5)
    });

    test('getScore applies triple word multiplier correctly for new word', () => {
        const board = new Board();
        const tiles = emptyTilesGrid();

        // place new tiles to form 'KAK' across
        const placements = [
            new TilePlacement(new Tile('K'), 0, 7, true),
            new TilePlacement(new Tile('A'), 0, 8, true),
            new TilePlacement(new Tile('K'), 0, 9, true),
        ];

        const score = board.getScore(placements, "ACROSS");
        expect(score).toEqual(33) // ( K(5)+A(1)+K(5) ) * 3
    });

    test('getScore ignore triple word multiplier for existing tile', () => {
        const board = new Board();
        const tiles = emptyTilesGrid();

        // place a tile on a triple-word cell from the initial layout: (0,7) is TW in initialBoard
        tiles[0][7] = new Tile('K');
        board.populate(tiles);

        // place new tiles on (0,8) and (0,9) to form 'KAK' across
        const placements = [
            new TilePlacement(new Tile('K'), 0, 7, false),
            new TilePlacement(new Tile('A'), 0, 8, true),
            new TilePlacement(new Tile('K'), 0, 9, true),
        ];

        const score = board.getScore(placements, "ACROSS");
        expect(score).toEqual(11) // K(5)+A(1)+K(5)
    });
});

describe('Board move generation (getMove) scenarios', () => {
    test('words on an empty board: returns some moves and covers centre anchor', () => {
        const board = new Board();
        // empty populate (no tiles) — this will leave wordsPlayed false and anchor at centre
        board.populate(emptyTilesGrid());

        const hand = [new Tile('C'), new Tile('A'), new Tile('T'), new Tile('E'), new Tile('R'), new Tile('S'), new Tile('L')];
        const moves = board.getMove(hand);

        expect(moves.length).toBeGreaterThan(0);
        // ensure all returned move covers the centre anchor
        const centre = board.cells[7][7];
        const coversCentre = moves.every((m) => TilePlacement.coversCell(m.placements, centre));
        expect(coversCentre).toBe(true);
        // and each reported main word should be in the dictionary
        moves.forEach((m) => {
            expect(board.dictionary.has(m.toString())).toBe(true);
        });
    });

    test('words with a blank tile in hand: some returned moves use a BlankTile', () => {
        const board = new Board();
        board.populate(emptyTilesGrid());

        const hand = [new Tile('C'), new Tile('A'), new Tile('T'), new BlankTile(), new Tile('E'), new Tile('R'), new Tile('S')];
        const moves = board.getMove(hand);

        // expect there to be at least one move and at least one move that uses a blank
        expect(moves.length).toBeGreaterThan(0);
        const usesBlank = moves.some((m) => m.placements.some((p) => p.tile instanceof BlankTile));
        expect(usesBlank).toBe(true);
    });

    test('words that connect to an existing tile at the edge of the board produce moves including that cell', () => {
        const board = new Board();
        const tiles = emptyTilesGrid();
        // place a single letter at the right edge (column 14)
        tiles[7][14] = new Tile('S');
        board.populate(tiles);

        const hand = [new Tile('A'), new Tile('T'), new Tile('E'), new Tile('R'), new Tile('I'), new Tile('N'), new Tile('G')];
        const moves = board.getMove(hand);

        // at least one move should reference the existing edge cell (either as an existing placement or part of the word)
        const connectsToEdge = moves.some((m) => m.getPlacementAt(7, 14) !== null);
        expect(connectsToEdge).toBe(true);
    });

    test('words that include a new placement on the edge of the board produce moves including that cell', () => {
        const board = new Board();
        const tiles = emptyTilesGrid();
        // place a single letter in the centre (column 7)
        tiles[7][7] = new Tile('S');
        board.populate(tiles);

        const hand = [new Tile('T'), new Tile('E'), new Tile('A'), new Tile('M'), new Tile('I'), new Tile('N'), new Tile('G')];
        const moves = board.getMove(hand);

        // at least one move should include the cell 7,14
        const connectsToEdge = moves.some((m) => m.getPlacementAt(7, 14) !== null);
        expect(connectsToEdge).toBe(true);
    });

    test('able to place ACROSS words immediately above other ACROSS words (adjacent rows)', () => {
        const board = new Board();
        const tiles = emptyTilesGrid();
        // place the word "AT" on row 7 columns 7..8
        tiles[7][7] = new Tile('A');
        tiles[7][8] = new Tile('T');
        board.populate(tiles);

        // attempt to place a word immediately above (row 6) using similar letters
        const hand = [new Tile('C'), new Tile('A'), new Tile('T'), new Tile('S'), new Tile('E'), new Tile('R'), new Tile('L')];
        const moves = board.getMove(hand);

        // at least one move should place tiles on row 6 (i.e., be an ACROSS placed immediately above)
        const placesOnRow6 = moves.some((m) => m.placements.every((p) => p.row === 6));
        expect(placesOnRow6).toBe(true);
    });

    test('multiple fragments in one direction can be connected to form a valid word', () => {
        const board = new Board();
        const tiles = emptyTilesGrid();
        // two fragments in row 7 with a gap at column 9: "CA" at 7,[7..8] and "TER" at 7,[10..12]
        placeAcross(tiles, 7, 7, 'CA');
        placeAcross(tiles, 7, 10, 'TER');
        board.populate(tiles);

        // hand contains 'S', 'T', and 'S' to fill the gaps and form 'SCATTERS'
        const hand = [new Tile('T'), new Tile('S'), new Tile('S')];
        // check that SCATTERS is a candidate move
        const moves = board.getMove(hand);
        let candidateWords = moves.map((move) => TilePlacement.toLetterList(move.placements).join(''));
        expect(candidateWords).toContain('SCATTER');

        // check that SCATTER can be played from 7,6 but not 7,9 or 7,13
        const leftGapCell = board.cells[7][6];
        let candidates = board.getWordsPlayableAtPrefixedCell(leftGapCell, hand, "ACROSS");
        candidateWords = candidates.map((pList) => TilePlacement.toLetterList(pList).join(''));
        expect(candidateWords).toContain('SCATTER');
        const middleGapCell = board.cells[7][9];
        candidates = board.getWordsPlayableAtPrefixedCell(middleGapCell, hand, "ACROSS");
        candidateWords = candidates.map((pList) => TilePlacement.toLetterList(pList).join(''));
        expect(candidateWords).not.toContain('SCATTER');
        const rightGapCell = board.cells[7][13];
        candidates = board.getWordsPlayableAtPrefixedCell(rightGapCell, hand, "ACROSS");
        candidateWords = candidates.map((pList) => TilePlacement.toLetterList(pList).join(''));
        expect(candidateWords).not.toContain('SCATTER');
    });

    test('words with existing prefix are found', () => {
        const board = new Board();
        const tiles = emptyTilesGrid();
        // place 'HE' horizontally at cols 6..7
        placeAcross(tiles, 7, 6, 'HE');
        board.populate(tiles);

        const hand = [new Tile('A'), new Tile('T')];
        // anchor cell after the existing prefix is at column 8
        const moves = board.getMove(hand);
        let candidateWords = moves.map((move) => TilePlacement.toLetterList(move.placements).join(''));
        expect(candidateWords).toContain('HEAT');
    });

    test('words with no existing prefix are found', () => {
        const board = new Board();
        const tiles = emptyTilesGrid();
        // place 'EAT' horizontally starting from 7,7
        placeAcross(tiles, 7, 7, 'EAT');
        board.populate(tiles);

        const hand = [new Tile('C'), new Tile('H')];
        // anchor cell after the existing prefix is at column 6
        const moves = board.getMove(hand);
        let candidateWords = moves.map((move) => TilePlacement.toLetterList(move.placements).join(''));
        expect(candidateWords).toContain('CHEAT');
    });
});
