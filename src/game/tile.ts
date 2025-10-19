export const BLANK = " ";
export const TILES: { [key: string]: { count: number; points: number } } = {
    [BLANK]: { "count": 2, "points": 0 },
    "A": { "count": 9, "points": 1 },
    "B": { "count": 2, "points": 3 },
    "C": { "count": 2, "points": 3 },
    "D": { "count": 4, "points": 2 },
    "E": { "count": 12, "points": 1 },
    "F": { "count": 2, "points": 4 },
    "G": { "count": 3, "points": 2 },
    "H": { "count": 2, "points": 4 },
    "I": { "count": 9, "points": 1 },
    "J": { "count": 1, "points": 8 },
    "K": { "count": 1, "points": 5 },
    "L": { "count": 4, "points": 1 },
    "M": { "count": 2, "points": 3 },
    "N": { "count": 6, "points": 1 },
    "O": { "count": 8, "points": 1 },
    "P": { "count": 2, "points": 3 },
    "Q": { "count": 1, "points": 10 },
    "R": { "count": 6, "points": 1 },
    "S": { "count": 4, "points": 1 },
    "T": { "count": 6, "points": 1 },
    "U": { "count": 4, "points": 1 },
    "V": { "count": 2, "points": 4 },
    "W": { "count": 2, "points": 4 },
    "X": { "count": 1, "points": 8 },
    "Y": { "count": 2, "points": 4 },
    "Z": { "count": 1, "points": 10 }
}

export class Tile {
    
    letter: string;
    points: number;
    
    constructor(letter: string) {
        this.letter = letter;
        this.points = TILES[letter].points;
    }

    static toLetterList(tiles: Array<Tile>): Array<string> {
        return tiles.map((tile) => tile.letter);
    }

    static contains(tiles: Array<Tile>, letter: string): boolean {
        for (let i = 0; i < tiles.length; i++) {
            if (tiles[i].letter === letter) return true;
        }
        
        return false;
    }

    static containsBlank(tiles: Array<Tile>): boolean {
        for (let i = 0; i < tiles.length; i++) {
            if (tiles[i] instanceof BlankTile) return true;
        }
        
        return false;
    }
    
    /** Remove at most one instance of the given letter from the set of tiles */
    static remove(tiles: Array<Tile>, letter: string): Array<Tile> {
        let found: boolean = false;
        let newTiles = new Array<Tile>();

        tiles.forEach((tile) => {
            if (tile.letter !== letter || found) newTiles.push(tile);
            else found = true;
        });
        
        return newTiles;
    }
    
    /** Remove at most one blank from the set of tiles */
    static removeBlank(tiles: Array<Tile>): Array<Tile> {
        let found: boolean = false;
        let newTiles = new Array<Tile>();

        tiles.forEach((tile) => {
            if (! (tile instanceof BlankTile) || found) newTiles.push(tile);
            else found = true;
        });
        
        return newTiles;
    }

    toString(): string {
        return this.letter + " - " + this.points;
    }    
}

export class BlankTile extends Tile {
    
    constructor() {
        super(BLANK);
    }
    
    setLetter(letter: string): void {
        if (this.letter != BLANK) {
            throw new Error("Blank tile has already been set to " + this.letter);
        }

        this.letter = letter;
    }
}