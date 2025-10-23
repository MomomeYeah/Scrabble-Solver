import { createContext, useContext, useState } from 'react'
import './App.css'

import { Board } from './game/board';
import { Cell } from './game/cell';
import { DoubleLetterCellType } from './game/celltype';
import { TripleLetterCellType } from './game/celltype';
import { DoubleWordCellType } from './game/celltype';
import { TripleWordCellType } from './game/celltype';
import { Move } from './game/move';
import { BLANK, BlankTile, Tile } from './game/tile';
import type { TilePlacement } from './game/tileplacement';

type BoardContextProps = {
    board: Board,
    showingMove: Move | null
}
const BoardContext = createContext({} as BoardContextProps);

function ScrabbleTile({tile}: {tile: Tile}) {
    return (
        <>
            <div className="bg-orange-300 text-gray-800 rounded w-12 h-12 flex items-center justify-center text-2xl font-bold relative">
                {tile.letter}
                { tile.points ? <sub className="text-sm absolute bottom-0 right-1">{tile.points}</sub> : null }
            </div>
        </>
    );
}

function PlacementTile({placement}: {placement: TilePlacement}) {
    return (
        <>
            <div className="bg-red-300 ring-1 ring-pink-500 text-gray-800 rounded w-12 h-12 flex items-center justify-center text-2xl font-bold relative">
                {placement.tile.letter}
                { placement.tile.points ? <sub className="text-sm absolute bottom-0 right-1">{placement.tile.points}</sub> : null }
            </div>
        </>
    );
}

type RackTileProps = {
    tile: Tile | null,
    updateRackTile: (tile: Tile | null) => void
}
function RackTile({tile, updateRackTile}: RackTileProps) {
    const [editing, setEditing] = useState(false);

    function handleChangeLetter(newLetter: string) {
        let newTile: Tile | null = null;
        if (newLetter) {
            newTile = newLetter === BLANK ? new BlankTile() : new Tile(newLetter);
        }

        updateRackTile(newTile);
        setEditing(false);
    }
    
    return (
        <div
            className="bg-orange-300 text-gray-800 rounded w-12 h-12 flex items-center justify-center text-2xl font-bold"
            onClick={() => setEditing(!editing)}>
            { editing ?
                <input
                    type="text"
                    maxLength={1}
                    className="w-full h-full text-center text-2xl font-bold"
                    value={tile ? tile.letter : ''}
                    onChange={(e) => handleChangeLetter(e.target.value.toUpperCase())}
                    onFocus={(e) => e.target.select()}
                    onBlur={() => setEditing(false)}
                    autoFocus
                />
                : tile ? <ScrabbleTile tile={tile} /> : '?'
            }
        </div>
    )
}

type RackProps = {
    rackTiles: Array<Tile | null>,
    updateRackTile: (index: number, tile: Tile | null) => void
}
function Rack({rackTiles, updateRackTile}: RackProps) {
    const tiles = [];
    for (let i = 0; i < 7; i++) {
        tiles.push(
            <RackTile 
                key={i}
                tile={rackTiles[i]}
                updateRackTile={(tile: Tile | null) => updateRackTile(i, tile)}/>
        );
    }


    return (
        <div className="flex justify-center">
            <div className="bg-green-800 rounded-sm p-3 flex space-x-2 text-green-800">
                { tiles }
            </div>
        </div>
    )
}

type ScrabbleCellProps = {
    cell: Cell,
    tile: Tile | null
    updateBoardTile: (tile: Tile | null) => void
}
function ScrabbleCell({cell, tile, updateBoardTile}: ScrabbleCellProps) {
    const context = useContext(BoardContext);

    const [editing, setEditing] = useState(false);
    const placement = context.showingMove && context.showingMove?.getPlacementAt(cell.row, cell.column);

    const populatedCellColor = "bg-orange-300";
    let cellColor = "bg-green-400";
    if (cell.cellType instanceof DoubleLetterCellType) {
        cellColor = "bg-blue-300";
    } else if (cell.cellType instanceof TripleLetterCellType) {
        cellColor = "bg-blue-500";
    } else if (cell.cellType instanceof DoubleWordCellType) {
        cellColor = "bg-orange-500";
    } else if (cell.cellType instanceof TripleWordCellType) {
        cellColor = "bg-red-500";
    }

    function handleChangeLetter(newLetter: string) {
        let newTile: Tile | null = null;
        if (newLetter) {
            newTile = newLetter === BLANK ? new BlankTile() : new Tile(newLetter);
        }

        updateBoardTile(newTile);
        setEditing(false);
    }

    return (
        <div 
            className={`${cellColor} size-12 rounded flex items-center justify-center font-bold text-gray-800`}
            onClick={() => setEditing(!editing)}>
            { editing ?
                <input
                    type="text"
                    maxLength={1}
                    className={`w-full h-full text-center text-2xl ${populatedCellColor}`}
                    value={tile ? tile.letter : ''}
                    onChange={(e) => handleChangeLetter(e.target.value.toUpperCase())}
                    onFocus={(e) => e.target.select()}
                    onBlur={() => setEditing(false)}
                    autoFocus
                />
                : placement && placement.isNew ? <PlacementTile placement={placement} />
                : tile ? <ScrabbleTile tile={tile} /> : cell.cellType.toString()
            }
        </div>
    )
}

type ScrabbleBoardProps = {
    boardTiles: Array<Array<Tile | null>>,
    updateBoardTile: (rowIndex: number, columnIndex: number, tile: Tile | null) => void
}
function ScrabbleBoard({boardTiles, updateBoardTile}: ScrabbleBoardProps) {
    const context = useContext(BoardContext);

    const cells = [];
    for (let rowIndex = 0; rowIndex < context.board.boardSize; rowIndex++) {
        for (let columnIndex = 0; columnIndex < context.board.boardSize; columnIndex++) {
            const key = `${rowIndex}-${columnIndex}`;
            cells.push(
                <ScrabbleCell
                    key={key}
                    cell={context.board.cells[rowIndex][columnIndex]}
                    tile={boardTiles[rowIndex][columnIndex]}
                    updateBoardTile={(tile: Tile | null) => updateBoardTile(rowIndex, columnIndex, tile)} />
            );
        }
    }

    // It would be nice to use grid-cols-${boardSize} but tailwind will prune any styles it can't statically find
    return (
        <div className="grid grid-cols-15 gap-1 aspect-square my-16 p-1 border-4 rounded border-pink-800">
            { cells }
        </div>
    )
}

function App() {
    const [board] = useState<Board>(() => new Board());
    const [boardSize] = useState<number>(board.boardSize);

    const [boardTiles, setBoardTiles] = useState<Array<Array<Tile | null>>>(Array(boardSize).fill(Array(boardSize).fill(null)));
    const [rackTiles, setRackTiles] = useState<Array<Tile | null>>(Array(7).fill(null));
    const [moves, setMoves] = useState<Array<Move>>(new Array<Move>());
    const [showingMove, setShowingMove] = useState<Move | null>(null);

    function updateBoardTile(rowIndex: number, columnIndex: number, tile: Tile | null) {
        const newTiles: Array<Array<Tile | null>> = [];
        boardTiles.forEach((row) => {
            newTiles.push(row.slice());
        })
        newTiles[rowIndex][columnIndex] = tile;
        setBoardTiles(newTiles);
    }

    function updateRackTile(index: number, tile: Tile | null) {
        const newTiles: Array<Tile | null> = rackTiles.slice();
        newTiles[index] = tile;
        setRackTiles(newTiles);
    }

    function handleClickReset() {
        setBoardTiles(Array(boardSize).fill(Array(boardSize).fill(null)));
        setRackTiles(Array(7).fill(null));
        setMoves([]);
        setShowingMove(null);
    }

    function handleClickHide() {
        setShowingMove(null);
    }

    function handleClickSolve() {
        setShowingMove(null);
        board.populate(boardTiles);

        const hand: Array<Tile> = rackTiles.filter(l => l !== null);
        const foundMoves = board.getMove(hand);
        setMoves(foundMoves);
    }

    function handleShowMove(move: Move) {
        setShowingMove(move);
    }

    function handleAcceptMove(move: Move) {
        // set the currently-showing move to null, and clear the set of suggested moves
        setShowingMove(null);
        setMoves(new Array<Move>());
        
        // place the move, and update the board
        const newTiles: Array<Array<Tile | null>> = [];
        boardTiles.forEach((row) => {
            newTiles.push(row.slice());
        })
        move.placements.forEach((placement) => {
            newTiles[placement.row][placement.column] = placement.tile;
        });
        setBoardTiles(newTiles);
    }

    return (
        <>
            <BoardContext.Provider value={{ board, showingMove }}>
                <ScrabbleBoard boardTiles={boardTiles} updateBoardTile={updateBoardTile} />
            </BoardContext.Provider>
            <Rack rackTiles={rackTiles} updateRackTile={updateRackTile} />
            <div className="flex justify-center mt-8">
                <button onClick={handleClickSolve} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-16 mr-2">
                    Find Words
                </button>
                <button onClick={handleClickReset} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-16 ml-2 mr-2">
                    Reset
                </button>
                <button onClick={handleClickHide} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-16 ml-2">
                    Hide Solution
                </button>
            </div>
            <div className="flex justify-center mb-16">
                { moves.length > 0 ? 
                    <div>
                        <h2 className="text-xl font-bold mb-4">Top 10 Moves</h2>
                        <ul className="list-disc list-inside">
                            { moves.map((move, index) => (
                                <li key={index}>
                                    {move.toString()}
                                    , starting from 
                                    ({move.placements[0].row}, {move.placements[0].column})
                                    ({move.score} points)
                                    <button onClick={() => handleShowMove(move)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-4 rounded mb-2 ml-2">
                                        Show
                                    </button>
                                    <button onClick={() => handleAcceptMove(move)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-4 rounded mb-2 ml-2">
                                        Accept
                                    </button>
                                </li>
                            )) }
                        </ul>
                    </div>
                    : null
                }
            </div>
        </>
    )
}

export default App
