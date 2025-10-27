import { Cell } from './cell';
import type { CellType } from './celltype';
import { BaseCellType, DoubleLetterCellType, TripleLetterCellType, DoubleWordCellType, TripleWordCellType } from './celltype';
import { Move } from './move';
import { BlankTile, Tile } from './tile';
import { TilePlacement } from './tileplacement';

import { dictionary } from '../data/dictionary'
import { Node } from '../solver/node';
import { Trie } from '../solver/trie';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    boardSize: number = 15;
	cells: Array<Array<Cell>>;
	anchors: Array<Cell>;
    dictionary: Set<string>;
	trie: Trie;
	
	constructor() {
        this.cells = new Array<Array<Cell>>();
		this.anchors = new Array<Cell>();
	
        // initialise board
        const initialBoardLines = initialBoard.trim().split('\n');
        initialBoardLines.forEach((line, row) => {
            const boardCells = line.split(',');
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
        const dictionaryLines: Array<string> = dictionary.split('\n');
        this.dictionary = new Set<string>(dictionaryLines);
        this.trie = new Trie();
        this.trie.load(dictionaryLines);
	}

    /** Fully reset the board, returning it to a pristine state. */
    reset(): void {
        // reset each cell
        this.cells.forEach((rowCells) => {
            rowCells.forEach((cell) => {
                cell.reset();
            });
        });
	}

    toString(): string {
		let ret: string = "";
        this.cells.forEach((row) => {
            row.forEach((c) => {
                if (c.isAnchor) {
                    ret += "* ";
                } else if (c.isEmpty()) {
                    ret += c.cellType.toString();
                } else {
                    ret += c.tile!.letter + " ";
                }
            });
            ret += "\n";
        });
		
		return ret;
	}

    /** Return a copy of the cell data for this board */
    copy() {
        const cellsCopy = new Array<Array<Cell>>();
        this.cells.forEach((row, rowIndex) => {
            cellsCopy[rowIndex] = new Array<Cell>();
            row.forEach((cell, columnIndex) => {
                cellsCopy[rowIndex][columnIndex] = cell.copy();
            });
        });

        return cellsCopy;
    }
	
    /** Return true if the given row and column indexes represent a valid cell on the board */
    inBounds(row: number, column: number): boolean {
		if (row < 0 || row >= this.boardSize || column < 0 || column >= this.boardSize) {
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
        if (direction === "ACROSS" && cell.column < this.boardSize - 1) {
            return this.cells[cell.row][cell.column + 1];
        } else if (direction === "DOWN" && cell.row < this.boardSize - 1) {
            return this.cells[cell.row + 1][cell.column];
        }

        return null;
    }

    /** Calculate the set of preceding empty non-anchor prefix cells for a given cell in a given direction.
     * 
     * This is the set of empty cells, if any, including and to the left of the given cell (for ACROSS words)
     * or above the given cell (for DOWN words). This does not include other anchor cells, as these cells
     * will have their own valid moves calculated as part of the getMoves word generation
     */
    getPrecedingEmptyCellsForDirection(cell: Cell, direction: PlayDirection): Array<Cell> {
        // make sure to include the cell itself
        const prefixCells: Array<Cell> = [cell];
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
    getPrefixForDirection(cell: Cell, direction: PlayDirection): Array<TilePlacement> {
        const prefixes: Array<TilePlacement> = new Array<TilePlacement>();
        let precedingNeighbour: Cell | null = this.getPrecedingNeighbour(cell, direction);
        
        while (precedingNeighbour !== null && ! precedingNeighbour.isEmpty()) {
            prefixes.push(new TilePlacement(precedingNeighbour.tile!, precedingNeighbour.row, precedingNeighbour.column, false));
            precedingNeighbour = this.getPrecedingNeighbour(precedingNeighbour, direction);
        }

        // Tiles were picked up in backwards order, so reverse before returning
        return prefixes.reverse();
	}
	
	/** Calculate the suffix for a given cell.
     * 
     * The suffix is the continuous set of tiles, if any, that have been played to the right of the 
     * given cell (for ACROSS words), or below the given cell (for DOWN words)
     */
    getSuffixForDirection(cell: Cell, direction: PlayDirection): Array<TilePlacement> {
        const suffixes: Array<TilePlacement> = new Array<TilePlacement>();
        let followingNeighbour: Cell | null = this.getFollowingNeighbour(cell, direction);
        
        while (followingNeighbour !== null && ! followingNeighbour.isEmpty()) {
            suffixes.push(new TilePlacement(followingNeighbour.tile!, cell.row, cell.column, false));
            followingNeighbour = this.getFollowingNeighbour(followingNeighbour, direction);
        }

        return suffixes;
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
        // first, clear the set of anchors
        this.anchors = new Array<Cell>();

        // for each empty cell with non-empty neighbours, mark it as an anchor and calculate playable letters
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
                    cell.playableLettersDown = this.trie.getValidLettersFromPrefixandSuffix(TilePlacement.toLetterList(cell.prefixForAcross), TilePlacement.toLetterList(cell.suffixForAcross));

                    cell.prefixForDown = this.getPrefixForDirection(cell, "DOWN");
                    cell.suffixForDown = this.getSuffixForDirection(cell, "DOWN");
                    cell.playableLettersAcross = this.trie.getValidLettersFromPrefixandSuffix(TilePlacement.toLetterList(cell.prefixForDown), TilePlacement.toLetterList(cell.suffixForDown));

//                     console.log(`Cell ${rowIndex}, ${columnIndex}:
// Prefix for Across: ${cell.prefixForAcross}
// Suffix for Across: ${cell.suffixForAcross}
// Points for Across: ${cell.getPrefixAndSuffixSum("ACROSS")}
// Prefix for Down: ${cell.prefixForDown}
// Suffix for Down: ${cell.suffixForDown}
// Points for Down: ${cell.getPrefixAndSuffixSum("DOWN")}
// Playable letters across: ${cell.playableLettersAcross}
// Playable letters down: ${cell.playableLettersDown}`);

//                     console.log(this.getPrecedingEmptyCellsForDirection(cell, "ACROSS"));
//                     console.log(this.getPrecedingEmptyCellsForDirection(cell, "DOWN"));
                }
            });
        });

        // if no anchors have been set, the board must be empty, so the only anchor is the middle square
        if (this.anchors.length === 0) {
            const centreSquareIndex = Math.floor(this.boardSize / 2);
            this.anchors.push(this.cells[centreSquareIndex][centreSquareIndex]);
            return;
        }

        // console.log(`${this}`);
    }
	
    /** Calculate the score represented by a set of tile placements, including all intersecting words */
	getScore(placements: Array<TilePlacement>, direction: PlayDirection): number {
        const playedWords: Array<string> = new Array<string>();
        playedWords.push(placements.reduce((accum, current_value) => accum + current_value.tile.letter, ""));

		let score: number = 0;
        let newPlacementCount: number = 0;
		let wordMultiplier: number = 1;
        let intersectingWordSum: number = 0;
		placements.forEach((placement) => {
            // calculate the number of points earned from placing this tile on this cell
			const placementCell = this.cells[placement.row][placement.column];

            if (! placement.isNew) {
                // if this is not a new placement, then this tile was already on the board
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
                let intersectingWord: Array<TilePlacement> = new Array<TilePlacement>();
                if (direction === "ACROSS") {
                    const scoreOfIntersectingTiles = placementCell.getPrefixAndSuffixSum("DOWN");
                    if (scoreOfIntersectingTiles) {
                        const intersectingWordScore = (placementScore + scoreOfIntersectingTiles) * placementCell.cellType.getWordMultiplier();
                        intersectingWordSum += intersectingWordScore;
                        intersectingWord = placementCell.prefixForDown.concat([placement], placementCell.suffixForDown);
                        playedWords.push(intersectingWord.reduce((accum, current_value) => accum + current_value.tile.letter, ""));
                    }
                } else {
                    const scoreOfIntersectingTiles = placementCell.getPrefixAndSuffixSum("ACROSS");
                    if (scoreOfIntersectingTiles) {
                        const intersectingWordScore = (placementScore + scoreOfIntersectingTiles) * placementCell.cellType.getWordMultiplier();
                        intersectingWordSum += intersectingWordScore;
                        intersectingWord = placementCell.prefixForDown.concat([placement], placementCell.suffixForDown);
                        playedWords.push(intersectingWord.reduce((accum, current_value) => accum + current_value.tile.letter, ""));
                    }
                }
            }
		});

		score *= wordMultiplier;
        score += intersectingWordSum;
		if (newPlacementCount == 7) score += 50;

        // console.log(`Played word ${placements.reduce((accum, current_value) => accum + current_value.tile.letter, "")}`);
        // playedWords.forEach((word) => {
        //     console.log(`    ${word}`);
        // });

		return score;
	}

    /** Calculate the set of valid suffixes from a given cell, given a Trie node representing a (possibly empty) prefix */
    getSuffixesFromCell(cell: Cell, hand: Array<Tile>, direction: PlayDirection, fromNode: Node, includeEOW: boolean): Array<Array<TilePlacement>> {
        const suffixes: Array<Array<TilePlacement>> = new Array<Array<TilePlacement>>();

        const nextCell = this.getFollowingNeighbour(cell, direction);
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
                    const remainingSuffixes = this.getSuffixesFromCell(nextCell, hand, direction, child, true);
                    remainingSuffixes.forEach((remainingSuffix) => {
                        remainingSuffix.unshift(new TilePlacement(cell.tile!, cell.row, cell.column, false));
                        suffixes.push(remainingSuffix);
                    });
                } else if (child.hasChild(Node.EOW)) {
                    suffixes.push([new TilePlacement(cell.tile!, cell.row, cell.column, false)]);
                }
            // for empty cells, pick an appropriate tile from the hand
            } else if (cell.isEmpty() && cell.getPlayableLettersForDirection(direction).includes(child.letter)) {
                if (nextCell) {
                    if (Tile.contains(hand, child.letter)) {
                        const remainingTiles = Tile.remove(hand, child.letter);
                        const remainingSuffixes = this.getSuffixesFromCell(nextCell, remainingTiles, direction, child, true);
                        remainingSuffixes.forEach((remainingSuffix) => {
                            remainingSuffix.unshift(new TilePlacement(new Tile(child.letter), cell.row, cell.column, true));
                            suffixes.push(remainingSuffix);
                        });
                    } else if (Tile.containsBlank(hand)) {
                        const remainingTiles = Tile.removeBlank(hand);
                        const tile: BlankTile = new BlankTile();
                        tile.setLetter(child.letter);
                        const remainingSuffixes = this.getSuffixesFromCell(nextCell, remainingTiles, direction, child, true);
                        remainingSuffixes.forEach((remainingSuffix) => {
                            remainingSuffix.unshift(new TilePlacement(tile, cell.row, cell.column, true));
                            suffixes.push(remainingSuffix);
                        });
                    }
                } else {
                    // we're at the edge of the board, so just return the current letter, if it exists in the given hand, and 
                    // would form a complete word
                    if (Tile.contains(hand, child.letter) && child.hasChild(Node.EOW)) {
                        suffixes.push([new TilePlacement(new Tile(child.letter), cell.row, cell.column, true)]);
                    } else if (Tile.containsBlank(hand) && child.hasChild(Node.EOW)) {
                        const tile: BlankTile = new BlankTile();
                        tile.setLetter(child.letter);
                        suffixes.push([new TilePlacement(tile, cell.row, cell.column, true)]);
                    }
                }
            }
		});


        return suffixes;
    }

    /** Calculate the full set of valid words that can be played starting from a given cell. */
	getWordsPlayableAtCell(cell: Cell, hand: Array<Tile>, direction: PlayDirection): Array<Array<TilePlacement>> {
        const words: Array<Array<TilePlacement>> = new Array<Array<TilePlacement>>();

        const cellPrefix = cell.getPrefixForDirection(direction);
        // if the cell has an already-placed prefix, find all words starting with that prefix
        if (cellPrefix.length) {
            const cellPrefixNode = this.trie.getNodeFromPrefix(TilePlacement.toLetterList(cellPrefix));
            if (cellPrefixNode) {
                const suffixes = this.getSuffixesFromCell(cell, hand, direction, cellPrefixNode, false);
                suffixes.forEach((suffix) => {
                    words.push(cellPrefix.concat(suffix));
                });
            }
        // if the anchor cell does not have a prefix, then from each empty non-anchor cell preceding it, find all 
        // valid words. For each word, make sure it crosses the given cell
        } else {
            this.getPrecedingEmptyCellsForDirection(cell, direction).forEach((prefixCell) => {
                const suffixes = this.getSuffixesFromCell(prefixCell, hand, direction, this.trie.root, false);
                suffixes.forEach((suffix) => {
                    if (TilePlacement.coversCell(suffix, cell)) {
                        words.push(suffix);
                    }
                });
            });
        }

        return words;
	}

    /** Calculate the best moves playable by the given hand. Move representations include tiles already on the board */
    getMoves(hand: Array<Tile>): Array<Move> {
        const startTime = performance.now();

        const moves: Array<Move> = new Array<Move>();

        this.calculateAnchorsAndPlayableLetters();
        this.anchors.forEach((anchorCell) => {
            ["ACROSS", "DOWN"].forEach((direction) => {
                this.getWordsPlayableAtCell(anchorCell, hand, direction).forEach((word) => {
                    moves.push(new Move(word, direction, this.getScore(word, direction)));
                });
            });
        });

        const endTime = performance.now();
        const searchTimeMS = (endTime - startTime).toFixed(2);
        console.log(`Found ${moves.length} moves in ${searchTimeMS}ms`);

        const sortedMoves: Array<Move> = moves.slice().sort((a: Move, b: Move) => {return b.score - a.score;}).slice(0, 10);
        return sortedMoves;
    }
}