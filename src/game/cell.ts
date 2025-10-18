import type { CellType } from './celltype';
import { Tile } from './tile';

export class Cell {
	
	row: number;
	column: number;
	cellType: CellType;
	tile: Tile | null;
	isAnchor: boolean;
	// The set of valid letters that could be played in this cell based on the tiles around it, both north-south and east-west
	playableLetters: Array<string>;
	
	constructor(row: number, column: number, celltype: CellType) {
		this.row = row;
		this.column = column;
		this.cellType = celltype;
		this.tile = null;
		this.isAnchor = false;
		this.playableLetters = new Array<string>();
	}
	
	reset(): void {
		this.tile = null;
		this.isAnchor = false;
		this.playableLetters = new Array<string>();
	}
	
	isEmpty(): boolean {
		return ! this.tile;
	}
	
	placeTile(tile: Tile): number {
        if (this.tile ) {
            throw new Error("Cell already has a tile");
        }

        this.tile = tile;
        return tile.points * this.cellType.getTileMultiplier();
	}
}