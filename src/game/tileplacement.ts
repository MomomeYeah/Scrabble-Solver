import type { PlayDirection } from "./board.ts";
import { Board } from "./board.js";
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

	// TODO: always setting isNew to true here - can we get rid of this function?
	static getPlacements(tiles: Array<Tile>, startingRow: number, startingColumn: number, direction: PlayDirection): Array<TilePlacement> {
		let placements: Array<TilePlacement> = new Array<TilePlacement>();

		let row: number = startingRow;
		let column: number = startingColumn;
        tiles.forEach((tile) => {
            placements.push(new TilePlacement(tile, row, column, true));

            if (direction == "ACROSS") {
                column++;
            } else {
                row++;
            }
        });

        return placements;
	}
}