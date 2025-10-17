import type { CellType } from './celltype';
import { Tile } from './tile';

export class Cell {
	
	row: number;
	column: number;
	cellType: CellType;
	tile: Tile | null;
	isAnchor: boolean;
	validCrossChecksAcross: Array<string>;
	validCrossChecksDown: Array<string>;
	
	constructor(row: number, column: number, celltype: CellType) {
		this.row = row;
		this.column = column;
		this.cellType = celltype;
		this.tile = null;
		this.isAnchor = false;
		this.validCrossChecksAcross = new Array<string>();
		this.validCrossChecksDown = new Array<string>();
	}
	
	clearCrossChecks(): void {
		this.validCrossChecksAcross = new Array<string>();
		this.validCrossChecksDown = new Array<string>();
	}
	
	reset(): void {
		this.tile = null;
		this.isAnchor = false;
        this.clearCrossChecks();
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
	
	setIsAnchor(isAnchor: boolean): void {
		this.isAnchor = isAnchor;
	}
	
	// when playing DOWN - letters that will form valid ACROSS words
	setAcrossCrossCheck(validCrossChecksAcross: Array<string>): void {
		this.validCrossChecksAcross = validCrossChecksAcross;
	}
	
	// when playing ACROSS - letters that will form valid DOWN words
	setDownCrossCheck(validCrossChecksDown: Array<string>): void {
		this.validCrossChecksDown = validCrossChecksDown;
	}
}