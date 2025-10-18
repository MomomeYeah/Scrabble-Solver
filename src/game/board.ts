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
	// TODO: this could just be a function checking if any tiles have been played
	wordsPlayed: boolean;
	cells: Array<Array<Cell>>;
	anchors: Array<Cell>;
	// TODO: can probably lose this now
	dictionaryLines: Array<string>;
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
        this.dictionaryLines = dictionary.split('\n');
        this.dictionary = new Set<string>(this.dictionaryLines);
        this.trie = new Trie();
        this.trie.load(this.dictionaryLines);
        
        // this.calculateAnchorsAndCrossChecks();
	}

    reset(): void {
        this.cells.forEach((rowCells) => {
            rowCells.forEach((cell) => {
                cell.reset();
            });
        });
    }

    populate(tiles: Array<Array<Tile | null>>): void {
        tiles.forEach((rowTiles: Array<Tile | null>, rowIndex: number) => {
            rowTiles.forEach((tile: Tile | null, columnIndex: number) => {
                this.cells[rowIndex][columnIndex].reset();
                tile && this.cells[rowIndex][columnIndex].placeTile(tile);
            });
        });
        
        console.log(`${this}`);
    }
	
	toString(): string {
		let ret: string = "";
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
	
	// TODO: this will need to be expanded for the case where words already existed on the board
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