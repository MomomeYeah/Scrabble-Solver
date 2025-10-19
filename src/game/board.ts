import { Cell } from './cell';
import type { CellType } from './celltype';
import { BaseCellType, DoubleLetterCellType, TripleLetterCellType, DoubleWordCellType, TripleWordCellType } from './celltype';
import { Tile } from './tile';
import { TilePlacement } from './tileplacement';

import { dictionary } from '../data/dictionary'
import { Trie } from '../solver/trie';

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

    /** Calculate the prefix for a given cell.
     * 
     * The prefix is the continuous set of tiles, if any, that have been played to the left of the 
     * given cell (for ACROSS words), or above the given cell (for DOWN words)
     */
    getPrefixForDirection(row: number, column: number, direction: PlayDirection): Array<Tile> {
        let prefix: Array<Tile> = new Array<Tile>();
		
		let prefixRow: number = row;
		let prefixColumn: number = column;
	
        function decrementIfInBounds(num: number): number {
            return num > 0 ? num - 1 : num;
        }

		// move back until we find an empty square
        // note the use of dowhile here - cross checks are only calculated for empty squares, so 
        // the while condition would always fail if run on the initial square
		do {
            if (direction == "ACROSS") {
				prefixColumn = decrementIfInBounds(prefixColumn);
				if (prefixColumn == 0) {
					break;
				}
			} else {
				prefixRow = decrementIfInBounds(prefixRow);
				if (prefixRow == 0) {
					break;
				}
			}
		} while (! this.cells[prefixRow][prefixColumn].isEmpty());
		
		// if we haven't moved, there's no prefix
		if (prefixRow == row && prefixColumn == column) {
			return new Array<Tile>();
		}
		
		// we have moved, so if the square we are on is empty, we've moved one too far. The prefix 
        // might start on the edge of the board, in which case the current square will not be empty
		if (this.cells[prefixRow][prefixColumn].isEmpty()) {
			if (direction == "ACROSS") {
				prefixColumn++;
			} else {
				prefixRow++;
			}
		}
		
        // move back to the initial square, adding tiles along the way to the prefix
		while (prefixRow != row || prefixColumn != column) {
			prefix.push(this.cells[prefixRow][prefixColumn].tile!);
			if (direction == "ACROSS") {
				prefixColumn++;
			} else {
				prefixRow++;
			}
		}
		
        return prefix;
	}
	
	/** Calculate the suffix for a given cell.
     * 
     * The suffix is the continuous set of tiles, if any, that have been played to the right of the 
     * given cell (for ACROSS words), or below the given cell (for DOWN words)
     */
    getSuffixForDirection(row: number, column: number, direction: PlayDirection): Array<Tile> {
		let suffix: Array<Tile> = new Array<Tile>();
		
		let suffixRow: number = row;
		let suffixColumn: number = column;

        function incrementIfInBounds(num: number, boardSize: number): number {
            return num === boardSize - 1 ? num : num + 1;
        }
		
		if (direction == "ACROSS") {
			suffixColumn = incrementIfInBounds(suffixColumn, this.boardsize);
		} else {
			suffixRow = incrementIfInBounds(suffixRow, this.boardsize);
		}
		
		// if we haven't moved, there's no suffix
		if (suffixRow == row && suffixColumn == column) {
			return new Array<Tile>();
		}
		
		while (! this.cells[suffixRow][suffixColumn].isEmpty()) {
			suffix.push(this.cells[suffixRow][suffixColumn].tile!);
			if (direction == "ACROSS") {
				suffixColumn++;
				if (suffixColumn == this.boardsize) {
					break;
				}
			} else {
				suffixRow++;
				if (suffixRow == this.boardsize) {
					break;
				}
			}
		}
		
		return suffix;
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
                    cell.prefixForAcross = this.getPrefixForDirection(rowIndex, columnIndex, "ACROSS");
                    cell.suffixForAcross = this.getSuffixForDirection(rowIndex, columnIndex, "ACROSS");
                    let playableLettersAcross: Array<string> = this.trie.getValidLettersFromPrefixandSuffix(cell.prefixForAcross, cell.suffixForAcross);

                    cell.prefixForDown = this.getPrefixForDirection(rowIndex, columnIndex, "DOWN");
                    cell.suffixForDown = this.getSuffixForDirection(rowIndex, columnIndex, "DOWN");
                    let playableLettersDown: Array<string> = this.trie.getValidLettersFromPrefixandSuffix(cell.prefixForDown, cell.suffixForDown);

                    // the overall set of playable letters is the intersection of playableLettersAcross and playableLettersDown
                    cell.playableLetters = playableLettersAcross.filter((letter) => playableLettersDown.includes(letter));

                    console.log(`Cell ${rowIndex}, ${columnIndex}:
Prefix for Across: ${cell.prefixForAcross}
Suffix for Across: ${cell.suffixForAcross}
Points for Across: ${cell.getPrefixAndSuffixSum("ACROSS")}
Prefix for Down: ${cell.prefixForDown}
Suffix for Down: ${cell.suffixForDown}
Points for Down: ${cell.getPrefixAndSuffixSum("DOWN")}
Playable letters across: ${playableLettersAcross}
Playable letters down: ${playableLettersDown}
Playable letters: ${cell.playableLetters}`);
                }
            });
        });
    }
	
	getScore(placements: Array<TilePlacement>): number {
		let score = 0;
		let wordMultiplier = 1;
		placements.forEach((placement) => {
			const placementCell = this.cells[placement.row][placement.column];
			const placementScore: number = placement.tile.points * placementCell.cellType.getTileMultiplier();

			score += placementScore;
			wordMultiplier *= placementCell.cellType.getWordMultiplier();
		});

		score *= wordMultiplier;
		if (placements.length == 7) score += 50;

		return score;
	}
}