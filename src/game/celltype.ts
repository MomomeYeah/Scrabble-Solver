interface ICellType {
    toString(): string;
    getTileMultiplier(): number;
    getWordMultiplier(): number;
}

export class DoubleLetterCellType implements ICellType {
    toString(): string {
        return "DL";
    }

    getTileMultiplier(): number {
        return 2;
    }

    getWordMultiplier(): number {
        return 1;
    }
}

export class TripleLetterCellType implements ICellType {
    toString(): string {
        return "TL";
    }

    getTileMultiplier(): number {
        return 3;
    }

    getWordMultiplier(): number {
        return 1;
    }
}

export class DoubleWordCellType implements ICellType {
    toString(): string {
        return "DW";
    }

    getTileMultiplier(): number {
        return 1;
    }

    getWordMultiplier(): number {
        return 2;
    }
}

export class TripleWordCellType implements ICellType {
    toString(): string {
        return "TW";
    }

    getTileMultiplier(): number {
        return 1;
    }

    getWordMultiplier(): number {
        return 3;
    }
}

export class BaseCellType implements ICellType {
    toString(): string {
        return " ";
    }

    getTileMultiplier(): number {
        return 1;
    }

    getWordMultiplier(): number {
        return 1;
    }
}

export type CellType = DoubleLetterCellType | TripleLetterCellType | DoubleWordCellType | TripleWordCellType | BaseCellType;