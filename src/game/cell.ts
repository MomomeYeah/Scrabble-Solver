import type { CellType } from './celltype';
import type { PlayDirection } from './board';
import { Tile } from './tile';

export class Cell {
	
	row: number;
	column: number;
	cellType: CellType;
	tile: Tile | null;
	isAnchor!: boolean;
	// The set of tiles directly attached to the left and right of this cell, if any
	prefixForAcross!: Array<Tile>;
	suffixForAcross!: Array<Tile>;
	// The set of tiles directly attached to the top and bottom of this cell, if any
	prefixForDown!: Array<Tile>;
	suffixForDown!: Array<Tile>;
	// The set of valid letters that could be played in this cell for DOWN words based on the ACROSS prefix and suffix
	playableLettersAcross!: Array<string>;
	// The set of valid letters that could be played in this cell for ACROSS words based on the DOWN prefix and suffix
	playableLettersDown!: Array<string>;
	
	constructor(row: number, column: number, celltype: CellType) {
		this.row = row;
		this.column = column;
		this.cellType = celltype;
		this.tile = null;
		this.reset();
	}
	
	/** Utility function to re-initalise derived fields */
	reset(): void {
		this.tile = null;
		this.isAnchor = false;
		this.prefixForAcross = new Array<Tile>();
		this.suffixForAcross = new Array<Tile>();
		this.prefixForDown = new Array<Tile>();
		this.suffixForDown = new Array<Tile>();
		this.playableLettersAcross = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
		this.playableLettersDown = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
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

	/** Get the sum of the points of all tiles in the directional prefix and suffix in a given direction */
	getPrefixAndSuffixSum(direction: PlayDirection): number {
		if (direction === "ACROSS") {
			let prefixSum: number = this.prefixForAcross.reduce((accum, current_value) => accum + current_value.points, 0);
			let suffixSum: number = this.suffixForAcross.reduce((accum, current_value) => accum + current_value.points, 0);

			return prefixSum + suffixSum;
		} else {
			let prefixSum: number = this.prefixForDown.reduce((accum, current_value) => accum + current_value.points, 0);
			let suffixSum: number = this.suffixForDown.reduce((accum, current_value) => accum + current_value.points, 0);

			return prefixSum + suffixSum;
		}
	}
}