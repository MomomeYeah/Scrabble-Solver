import type { PlayDirection } from "./board.ts";
import { Tile } from "./tile.js";

export class TilePlacement {
	
	tile: Tile;
	row: number;
	column: number;
	
	constructor(tile: Tile, row: number, column: number) {
		this.tile = tile;
		this.row = row;
		this.column = column;
	}
	
	static getPlacements(tiles: Array<Tile>, startingRow: number, startingColumn: number, direction: PlayDirection): Array<TilePlacement> {
		let placements: Array<TilePlacement> = new Array<TilePlacement>();

		let row: number = startingRow;
		let column: number = startingColumn;
        tiles.forEach((tile) => {
            placements.push(new TilePlacement(tile, row, column));

            if (direction == "ACROSS") {
                column++;
            } else {
                row++;
            }
        });

        return placements;
	}
}