import { Cell } from './cell';
import type { CellType } from './celltype';
import { BaseCellType, DoubleLetterCellType, TripleLetterCellType, DoubleWordCellType, TripleWordCellType } from './celltype';
import { Move } from './move';
import { BlankTile, Tile } from './tile';
import { TilePlacement } from './tileplacement';

import { dictionary } from '../data/dictionary'
import { Node } from '../solver/node';
import { Trie } from '../solver/trie';
import { Solver } from '../solver/solver';

const PlayDirections = ["ACROSS", "DOWN"];
export type PlayDirection = typeof PlayDirections[number];

const initialBoard = `
TW,  ,  ,DL,  ,  ,  ,TW,  ,  ,  ,DL,  ,  ,TW
  ,DW,  ,  ,  ,TL,  ,  ,  ,TL,  ,  ,  ,DW,  
  ,  ,DW,  ,  ,  ,DL,  ,DL,  ,  ,  ,DW,  ,  
DL,  ,  ,DW,  ,  ,  ,DL,  ,  ,  ,DW,  ,  ,DL
  ,  ,  ,  ,DW,  ,  ,  ,  ,  ,DW,  ,  ,  ,  
  ,TL,  ,  ,  ,TL,  ,  ,  ,TL,  ,  ,  ,TL,  
  ,  ,DL,  ,  ,  ,DL,  ,DL,  ,  ,  ,DL,  ,  
TW,  ,  ,DL,  ,  ,  ,DW,  ,  ,  ,DL,  ,  ,TW
  ,  ,DL,  ,  ,  ,DL,  ,DL,  ,  ,  ,DL,  ,  
  ,TL,  ,  ,  ,TL,  ,  ,  ,TL,  ,  ,  ,TL,  
  ,  ,  ,  ,DW,  ,  ,  ,  ,  ,DW,  ,  ,  ,  
DL,  ,  ,DW,  ,  ,  ,DL,  ,  ,  ,DW,  ,  ,DL
  ,  ,DW,  ,  ,  ,DL,  ,DL,  ,  ,  ,DW,  ,  
  ,DW,  ,  ,  ,TL,  ,  ,  ,TL,  ,  ,  ,DW,  
TW,  ,  ,DL,  ,  ,  ,TW,  ,  ,  ,DL,  ,  ,TW`;

export class Board {
	
	boardsize: number = 15;
	wordsPlayed: boolean;
	cells: Array<Array<Cell>>;
	anchors: Array<Cell>;
    dictionary: Set<string>;
	trie: Trie;
    solver: Solver;
	
	constructor() {
		this.wordsPlayed = false;
		this.cells = new Array<Array<Cell>>();
		this.anchors = new Array<Cell>();
	
        // initialise board
        let initialBoardLines = initialBoard.trim().split('\n');
        initialBoardLines.forEach((line, row) => {
            let boardCells = line.split(',');
            this.cells[row] = new Array<Cell>();
            boardCells.forEach((cellTypeString, column) => {
                let cellType: CellType;
                switch (cellTypeString.trim()) {
                    case 'DL':
                        cellType = new DoubleLetterCellType();
                        break;
                    case 'TL':
                        cellType = new TripleLetterCellType();
                        break;
                    case 'DW':
                        cellType = new DoubleWordCellType();
                        break;
                    case 'TW':
                        cellType = new TripleWordCellType();
                        break;
                    default:
                        cellType = new BaseCellType();
                }

                this.cells[row][column] = new Cell(row, column, cellType);
            });
        });

        // initialise Trie
        let dictionaryLines: Array<string> = dictionary.split('\n');
        this.dictionary = new Set<string>(dictionaryLines);
        this.trie = new Trie();
        this.trie.load(dictionaryLines);

        // initialise Solver
        this.solver = new Solver();
	}

    /** Fully reset the board, returning it to a pristine state. */
    reset(): void {
        // reset the wordsPlayed flag
        this.wordsPlayed = false;

        // clear the list of anchors
        this.anchors = new Array<Cell>();

        // reset each cell
        this.cells.forEach((rowCells) => {
            rowCells.forEach((cell) => {
                cell.reset();
            });
        });
    }

    /** Populate the board with the given set of tiles.
     * 
     * Any cells without a corresponding tile are reset, meaning this function is safe to
     * call on an already-populated board.
     */
    populate(tiles: Array<Array<Tile | null>>): void {
        this.wordsPlayed = false;
        tiles.forEach((rowTiles: Array<Tile | null>, rowIndex: number) => {
            rowTiles.forEach((tile: Tile | null, columnIndex: number) => {
                this.cells[rowIndex][columnIndex].reset();
                if (tile) {
                    this.cells[rowIndex][columnIndex].placeTile(tile);
                    this.wordsPlayed = true;
                }
            });
        });
    }

    toString(): string {
		let ret: string = `Words played: ${this.wordsPlayed}\n\n`;
        this.cells.forEach((row) => {
            row.forEach((c) => {
                if (c.isAnchor) {
                    ret += "* ";
                } else if (c.tile != null) {
                    ret += c.tile.letter + " ";
                } else {
                    ret += c.cellType.toString();
                }
            });
            ret += "\n";
        });
		
		return ret;
	}
	
    inBounds(row: number, column: number): boolean {
		if (row < 0 || row >= this.boardsize || column < 0 || column >= this.boardsize) {
			return false;
		}
		return true;
	}

    /** Return true if the given cell has any neighbours, either in the north-south or east-west direction */
    hasNeighbour(row: number, column: number): boolean {
        // check north-south direction
        if (this.inBounds(row - 1, column) && ! this.cells[row - 1][column].isEmpty()) {
            return true;
        }
        if (this.inBounds(row + 1, column) && ! this.cells[row + 1][column].isEmpty()) {
            return true;
        }

        // check east-west direction
        if (this.inBounds(row, column - 1) && ! this.cells[row][column - 1].isEmpty()) {
            return true;
        }
        if (this.inBounds(row, column + 1) && ! this.cells[row][column + 1].isEmpty()) {
            return true;
        }
        
        return false;
    }

    /** Get the left or top neighbour of the given cell, if any, depending on the given direction */
    getPrecedingNeighbour(cell: Cell, direction: PlayDirection): Cell | null {
        if (direction === "ACROSS" && cell.column > 0) {
            return this.cells[cell.row][cell.column - 1];
        } else if (direction === "DOWN" && cell.row > 0) {
            return this.cells[cell.row - 1][cell.column];
        }

        return null;
    }

    /** Get the right or bottom neighbour of the given cell, if any, depending on the given direction */
    getFollowingNeighbour(cell: Cell, direction: PlayDirection): Cell | null {
        if (direction === "ACROSS" && cell.column < this.boardsize - 1) {
            return this.cells[cell.row][cell.column + 1];
        } else if (direction === "DOWN" && cell.row < this.boardsize - 1) {
            return this.cells[cell.row + 1][cell.column];
        }

        return null;
    }

    /** Calculate the empty prefix for a given cell.
     * 
     * The empty prefix is the continuous set of empty cells, if any, to the left of the given cell
     * (for ACROSS words) or above the given cell (for DOWN words)
     * 
     * Anchor cells do not form part of the empty prefix, as any words including preceding anchor cells
     * will be calculated as part of the word generation algorithm involving those cells.
     */
    /** For a given cell, calculate the set of preceding empty non-anchor cells for a given direction */
    getEmptyPrefixForDirection(cell: Cell, direction: PlayDirection): Array<Cell> {
        let prefixCells: Array<Cell> = new Array<Cell>();
        let precedingNeighbour: Cell | null = this.getPrecedingNeighbour(cell, direction);
        
        while (precedingNeighbour !== null && precedingNeighbour.isEmpty() && ! precedingNeighbour.isAnchor) {
            prefixCells.push(precedingNeighbour);
            precedingNeighbour = this.getPrecedingNeighbour(precedingNeighbour, direction);
        }

        return prefixCells;
    }

    /** Calculate the prefix for a given cell.
     * 
     * The prefix is the continuous set of tiles, if any, that have been played to the left of the 
     * given cell (for ACROSS words), or above the given cell (for DOWN words)
     */
    getPrefixForDirection(cell: Cell, direction: PlayDirection): Array<Tile> {
        let prefixTiles: Array<Tile> = new Array<Tile>();
        let precedingNeighbour: Cell | null = this.getPrecedingNeighbour(cell, direction);
        
        while (precedingNeighbour !== null && ! precedingNeighbour.isEmpty()) {
            prefixTiles.push(precedingNeighbour.tile!);
            precedingNeighbour = this.getPrecedingNeighbour(precedingNeighbour, direction);
        }

        // Tiles were picked up in backwards order, so reverse before returning
        return prefixTiles.reverse();
	}
	
	/** Calculate the suffix for a given cell.
     * 
     * The suffix is the continuous set of tiles, if any, that have been played to the right of the 
     * given cell (for ACROSS words), or below the given cell (for DOWN words)
     */
    getSuffixForDirection(cell: Cell, direction: PlayDirection): Array<Tile> {
        let suffixiles: Array<Tile> = new Array<Tile>();
        let followingNeighbour: Cell | null = this.getFollowingNeighbour(cell, direction);
        
        while (followingNeighbour !== null && ! followingNeighbour.isEmpty()) {
            suffixiles.push(followingNeighbour.tile!);
            followingNeighbour = this.getFollowingNeighbour(followingNeighbour, direction);
        }

        return suffixiles;
	}

    /** For each cell, calculate whether it is an anchor cell, and if so, calculate all playable letters.
     * 
     * An anchor cell is one that is empty, but that is adjacent to a non-empty cell.
     * 
     * The set of playable letters for a cell is determined from the prefix and suffix.
     * 
     * This function assumes either that the board is empty, or that it has been populated via this.populate()
     */
    calculateAnchorsAndPlayableLetters(): void {
        // If the board is empty, there are no anchors
        if (! this.wordsPlayed) {
            return;
        }

        // first, clear the set of anchors
        this.anchors = new Array<Cell>();

        // for each empty cell with non-empty neighbours, mark is as an anchor and calculate playable letters
        this.cells.forEach((row, rowIndex) => {
            row.forEach((cell, columnIndex) => {
                if (cell.isEmpty() && this.hasNeighbour(rowIndex, columnIndex)) {
                    // mark the cell as an anchor
                    cell.isAnchor = true;
                    this.anchors.push(cell);

                    // calculate playable letters in both ACROSS and DOWN directions
                    // note that the set of playable letters does need to be stored separately for ACROSS and DOWN directions, as 
                    // when playing ACROSS, for example, the word being played may include several prefixes connected by newly-
                    // placed tiles, which would obviously affect the set of valid letters
                    cell.prefixForAcross = this.getPrefixForDirection(cell, "ACROSS");
                    cell.suffixForAcross = this.getSuffixForDirection(cell, "ACROSS");
                    cell.playableLettersDown = this.trie.getValidLettersFromPrefixandSuffix(cell.prefixForAcross, cell.suffixForAcross);

                    cell.prefixForDown = this.getPrefixForDirection(cell, "DOWN");
                    cell.suffixForDown = this.getSuffixForDirection(cell, "DOWN");
                    cell.playableLettersAcross = this.trie.getValidLettersFromPrefixandSuffix(cell.prefixForDown, cell.suffixForDown);

                    // // the overall set of playable letters is the intersection of playableLettersAcross and playableLettersDown
                    // cell.playableLetters = playableLettersAcross.filter((letter) => playableLettersDown.includes(letter));

                    console.log(`Cell ${rowIndex}, ${columnIndex}:
Prefix for Across: ${cell.prefixForAcross}
Suffix for Across: ${cell.suffixForAcross}
Points for Across: ${cell.getPrefixAndSuffixSum("ACROSS")}
Prefix for Down: ${cell.prefixForDown}
Suffix for Down: ${cell.suffixForDown}
Points for Down: ${cell.getPrefixAndSuffixSum("DOWN")}
Playable letters across: ${cell.playableLettersAcross}
Playable letters down: ${cell.playableLettersDown}`);

                    console.log(this.getEmptyPrefixForDirection(cell, "ACROSS"));
                    console.log(this.getEmptyPrefixForDirection(cell, "DOWN"));
                }
            });
        });
    }
	
    /** Calculate the score represented by a set of tile placements, including all intersecting words */
	getScore(placements: Array<TilePlacement>, direction: PlayDirection): number {
        let playedWords: Array<string> = new Array<string>();
        playedWords.push(placements.reduce((accum, current_value) => accum + current_value.tile.letter, ""));

		let score: number = 0;
        let newPlacementCount: number = 0;
		let wordMultiplier: number = 1;
        let intersectingWordSum: number = 0;
		placements.forEach((placement) => {
            // calculate the number of points earned from placing this tile on this cell
			const placementCell = this.cells[placement.row][placement.column];

            if (! placementCell.isEmpty()) {
                // if the cell is currently occupied, then this tile was already on the board
                // only count the points, ignoring any tile multiplier
                score += placement.tile.points;
            } else {
                // this is a newly-placed tile, so include the tile multiplier as well as any additional words formed
                // by words already on the board going in the opposite direction
                newPlacementCount += 1;
                const placementScore: number = placement.tile.points * placementCell.cellType.getTileMultiplier();

                score += placementScore;
                wordMultiplier *= placementCell.cellType.getWordMultiplier();

                // if the cell has a prefix or suffix in the opposite direction, get the number of points associated
                // with those tiles, multiply by this cell's word multiplier (if any), and add to the score
                let intersectingWord: Array<Tile> = new Array<Tile>();
                if (direction === "ACROSS") {
                    let scoreOfIntersectingTiles = placementCell.getPrefixAndSuffixSum("DOWN");
                    if (scoreOfIntersectingTiles) {
                        let intersectingWordScore = (placementScore + scoreOfIntersectingTiles) * placementCell.cellType.getWordMultiplier();
                        intersectingWordSum += intersectingWordScore;
                        intersectingWord = placementCell.prefixForDown.concat([placement.tile], placementCell.suffixForDown);
                        playedWords.push(intersectingWord.reduce((accum, current_value) => accum + current_value.letter, ""));
                    }
                } else {
                    let scoreOfIntersectingTiles = placementCell.getPrefixAndSuffixSum("ACROSS");
                    if (scoreOfIntersectingTiles) {
                        let intersectingWordScore = (placementScore + scoreOfIntersectingTiles) * placementCell.cellType.getWordMultiplier();
                        intersectingWordSum += intersectingWordScore;
                        intersectingWord = placementCell.prefixForDown.concat([placement.tile], placementCell.suffixForDown);
                        playedWords.push(intersectingWord.reduce((accum, current_value) => accum + current_value.letter, ""));
                    }
                }
            }
		});

		score *= wordMultiplier;
        score += intersectingWordSum;
		if (newPlacementCount == 7) score += 50;

        console.log(`Played word ${placements.reduce((accum, current_value) => accum + current_value.tile.letter, "")}`);
        playedWords.forEach((word) => {
            console.log(`    ${word}`);
        })

		return score;
	}

    /** Calculate the set of valid suffixes from a given cell, given a Trie node representing a (possibly empty) prefix */
    getSuffixesFromAnchor(cell: Cell, hand: Array<Tile>, direction: PlayDirection, fromNode: Node, includeEOW: boolean): Array<Array<TilePlacement>> {
        let suffixes: Array<Array<TilePlacement>> = new Array<Array<TilePlacement>>();

        let nextCell = this.getFollowingNeighbour(cell, direction);
        fromNode.childrenList.forEach((child) => {
            // for EOW markers, make sure we are at an empty cell (meaning there is no more suffix to calculate), or
            // that we're at the edge of the board
            if (child.letter == Node.EOW && includeEOW) {
                if (!nextCell || cell.isEmpty()) {
                    suffixes.push(new Array<TilePlacement>());
                }
            // for non-empty cells, use the Tile that is already there to continue generating the suffix
            } else if (! cell.isEmpty() && child.letter === cell.tile!.letter) {
                if (nextCell) {
                    let remainingSuffixes = this.getSuffixesFromAnchor(nextCell, hand, direction, child, true);
                    remainingSuffixes.forEach((remainingSuffix) => {
                        remainingSuffix.unshift(new TilePlacement(cell.tile!, cell.row, cell.column));
                        suffixes.push(remainingSuffix);
                    });
                } else {
                    suffixes.push([new TilePlacement(cell.tile!, cell.row, cell.column)]);
                }
            // for empty cells, pick an appropriate tile from the hand
            } else if (cell.isEmpty() && cell.getPlayableLettersForDirection(direction).includes(child.letter)) {
                if (nextCell) {
                    if (Tile.contains(hand, child.letter)) {
                        let remainingTiles = Tile.remove(hand, child.letter);
                        let remainingSuffixes = this.getSuffixesFromAnchor(nextCell, remainingTiles, direction, child, true);
                        remainingSuffixes.forEach((remainingSuffix) => {
                            remainingSuffix.unshift(new TilePlacement(new Tile(child.letter), cell.row, cell.column));
                            suffixes.push(remainingSuffix);
                        });
                    } else if (Tile.containsBlank(hand)) {
                        let remainingTiles = Tile.removeBlank(hand);
                        let tile: BlankTile = new BlankTile();
                        tile.setLetter(child.letter);
                        let remainingSuffixes = this.getSuffixesFromAnchor(nextCell, remainingTiles, direction, child, true);
                        remainingSuffixes.forEach((remainingSuffix) => {
                            remainingSuffix.unshift(new TilePlacement(tile, cell.row, cell.column));
                            suffixes.push(remainingSuffix);
                        });
                    }
                } else {
                    // we're at the edge of the board, so just return the current letter, if it exists
                    if (Tile.contains(hand, child.letter)) {
                        suffixes.push([new TilePlacement(new Tile(child.letter), cell.row, cell.column)]);
                    } else if (Tile.containsBlank(hand)) {
                        let tile: BlankTile = new BlankTile();
                        tile.setLetter(child.letter);
                        suffixes.push([new TilePlacement(tile, cell.row, cell.column)]);
                    }
                }
            }
		});


        return suffixes;
    }

    /** Calculate the list of valid words that can be played starting from an anchor cell.
     * 
     * This works for the following cases:
     * - when there is an existing prefix already on the board
     * - words with no existing prefix that start from the anchor cell
     */
	getWordsPlayableAtPrefixedCell(cell: Cell, hand: Array<Tile>, direction: PlayDirection): Array<Array<TilePlacement>> {
		let words: Array<Array<TilePlacement>> = new Array<Array<TilePlacement>>();

        // Move down the Trie according to the letters in the prefix
		let prefixLetters: Array<string> = Tile.toLetterList(cell.getPrefixForDirection(direction));
        let n: Node | null = this.trie.root;
		while (prefixLetters.length > 0 && n != null) {
			n = n.getChild(prefixLetters.shift()!);
		}

        // if we get through part or all of the prefix and there are no nodes left
		// there must be no valid letters we can return
		if (n == null) {
			return new Array<Array<TilePlacement>>();
		}

        // don't check for EOW marker on the first recursion, as we need to place a Tile in the 
        // anchor cell no matter what
        this.getSuffixesFromAnchor(cell, hand, direction, n, false).forEach((suffix) => {
            let cellPrefix: Array<Tile> = cell.getPrefixForDirection(direction);
            let prefixTiles: Array<TilePlacement> = direction === "ACROSS" ?
                TilePlacement.getPlacements(cell.getPrefixForDirection(direction), cell.row, cell.column - cellPrefix.length, direction) :
                TilePlacement.getPlacements(cell.getPrefixForDirection(direction), cell.row - cellPrefix.length, cell.column, direction);

            words.push(prefixTiles.concat(suffix));
        });

		return words;
	}

    /** Calculate the best moves playable by the given hand. Move representations include tiles already on the board */
    getMove(hand: Array<Tile>): Array<Move> {
        const startTime = performance.now();

        if (! this.wordsPlayed) {
            console.log("Getting first move");
            return this.solver.getFirstMove(this, hand);
        }

        console.log("Getting next move");
        let moves: Array<Move> = new Array<Move>();

        this.anchors.forEach((anchorCell) => {
            ["ACROSS", "DOWN"].forEach((direction) => {
                // if the anchor cell has an already-placed prefix, find all words starting with that prefix and crossing 
                // the anchor square
                if (anchorCell.getPrefixForDirection(direction).length) {
                    let words: Array<Array<TilePlacement>> = this.getWordsPlayableAtPrefixedCell(anchorCell, hand, direction);
                    words.forEach((word) => {
                        moves.push(new Move(word, direction, this.getScore(word, direction)));
                    });
                } else {
                    // if the anchor cell does not have a prefix, then for each empty non-anchor cell preceding it, build
                    // all possible words, taking into account tiles already on the board. For each word, make sure that it 
                    // crosses the anchor square
                    let emptyPrefix: Array<Cell> = this.getEmptyPrefixForDirection(anchorCell, direction);
                    
                    // we also want to generate words starting from the anchor itself, so add that to the empty prefix
                    emptyPrefix.unshift(anchorCell);

                    emptyPrefix.forEach((prefixCell) => {
                        let words: Array<Array<TilePlacement>> = this.getWordsPlayableAtPrefixedCell(prefixCell, hand, direction);
                        words.forEach((word) => {
                            if (TilePlacement.coversCell(word, anchorCell)) {
                                moves.push(new Move(word, direction, this.getScore(word, direction)));
                            }
                        }); 
                    })
                }
            });
        });

        const endTime = performance.now();
        let searchTimeMS = (endTime - startTime).toFixed(2);
        console.log(`Found ${moves.length} moves in ${searchTimeMS}ms`);

        let sortedMoves: Array<Move> = moves.slice().sort((a: Move, b: Move) => {return b.score - a.score;}).slice(0, 10);
        return sortedMoves;
    }
}