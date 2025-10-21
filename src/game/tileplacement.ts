import { Cell } from "./cell.js";
import { Tile } from "./tile.js";

export class TilePlacement {
	
	tile: Tile;
	row: number;
	column: number;
	isNew: boolean;
	
	constructor(tile: Tile, row: number, column: number, isNew: boolean) {
		this.tile = tile;
		this.row = row;
		this.column = column;
		this.isNew = isNew;
	}

	static toLetterList(tiles: Array<TilePlacement>): Array<string> {
        return tiles.map((tile) => tile.tile.letter);
    }

    static coversCell(placements: Array<TilePlacement>, cell: Cell) {
		for (const placement of placements ) {
			if (placement.row === cell.row && placement.column === cell.column) {
				return true;
			}
		}

		return false;
    }
}