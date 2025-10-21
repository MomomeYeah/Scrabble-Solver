import { Tile } from "./tile.js"
import { TilePlacement } from "./tileplacement.js";
import type { PlayDirection } from "./board.js";

export class Move {

	placements: Array<TilePlacement>;
	direction: PlayDirection;
	score: number;
	
	constructor(placements: Array<TilePlacement>, direction: PlayDirection, score: number) {
		this.placements = placements;
		this.direction = direction;
		this.score = score;
	}

	getPlacementAt(row: number, column: number): TilePlacement | null {
		// old-fashioned for-loop here instead of forEach, as forEach does not allow early termination
		for (let i = 0; i < this.placements.length; i++) {
			const placement = this.placements[i];
			if (placement.row === row && placement.column === column) {
				return placement;
			};
		}

		return null;
	}

	getTileAt(row: number, column: number): Tile | null {
		// old-fashioned for-loop here instead of forEach, as forEach does not allow early termination
		for (let i = 0; i < this.placements.length; i++) {
			const placement = this.placements[i];
			if (placement.row === row && placement.column === column) {
				return placement.tile;
			};
		}

		return null;
	}

	toString(): string {
		let word: string = "";
		this.placements.forEach((placement) => {
			word += placement.tile.letter;
		});
		
		return word;
	}
}