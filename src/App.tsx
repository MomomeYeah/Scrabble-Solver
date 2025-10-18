import { createContext, useState } from 'react'
import './App.css'

import { Board } from './game/board';
import { Cell } from './game/cell';
import { DoubleLetterCellType } from './game/celltype';
import { TripleLetterCellType } from './game/celltype';
import { DoubleWordCellType } from './game/celltype';
import { TripleWordCellType } from './game/celltype';
import { Move } from './game/move';
import { BLANK, BlankTile, TILES, Tile } from './game/tile';
import { Solver } from './solver/solver';

let board = new Board();
let solver = new Solver();

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

function RackTile({tile, updateRackTile}: {tile: Tile | null, updateRackTile: (tile: Tile | null) => void}) {
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
                    autoFocus
                />
                : tile ? <ScrabbleTile tile={tile} /> : '?'
            }
        </div>
    )
}

function Rack({rackTiles, updateRackTile}: {rackTiles: Array<Tile | null>, updateRackTile: (index: number, tile: Tile | null) => void}) {
    let tiles = [];
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

function ScrabbleCell({cell, boardTile, updateBoardTile}: {cell: Cell, boardTile: Tile | null, updateBoardTile: (tile: Tile | null) => void}) {
    const [editing, setEditing] = useState(false);

    let populatedCellColor = "bg-orange-300";
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
            className={`${cellColor} size-12 flex items-center justify-center font-bold text-gray-800`}
            onClick={() => setEditing(!editing)}>
            { editing ?
                <input
                    type="text"
                    maxLength={1}
                    className={`w-full h-full text-center text-2xl ${populatedCellColor}`}
                    value={boardTile ? boardTile.letter : ''}
                    onChange={(e) => handleChangeLetter(e.target.value.toUpperCase())}
                    onFocus={(e) => e.target.select()}
                    autoFocus
                />
                : boardTile ? <ScrabbleTile tile={boardTile} /> : cell.cellType.toString()
            }
        </div>
    )
}

// TODO is this right way to handle showing a ScrabbleTile in the case where a move is selected?
// There is duplication in the Cell component when a letter is pre-entered
function ScrabbleBoard({boardSize, boardTiles, updateBoardTile, showingMove}: {boardSize: number, boardTiles: Array<Array<Tile | null>>, updateBoardTile: (rowIndex: number, columnIndex: number, tile: Tile | null) => void, showingMove: Move | null}) {
    let cells = [];
    for (let rowIndex = 0; rowIndex < boardSize; rowIndex++) {
        for (let columnIndex = 0; columnIndex < boardSize; columnIndex++) {
            const boardCell = board.cells[rowIndex][columnIndex];
            const key = `${rowIndex}-${columnIndex}`;
            const tileAt = showingMove && showingMove.getTileAt(rowIndex, columnIndex);
            if (tileAt) {
                cells.push(<ScrabbleTile key={key} tile={tileAt} />);
            } else {
                cells.push(
                    <ScrabbleCell key={key} cell={boardCell} boardTile={boardTiles[rowIndex][columnIndex]} updateBoardTile={(tile: Tile | null) => updateBoardTile(rowIndex, columnIndex, tile)} />
                );
            }
        }
    }

    // It would be nice to use grid-cols-${boardSize} but tailwind will prune any styles it can't statically find
    return (
        <div className="grid grid-cols-15 gap-0.5 aspect-square my-16 border-4 rounded-sm border-amber-800">
            { cells }
        </div>
    )
}

function App() {
    const [boardSize] = useState(15);
    const [boardTiles, setBoardTiles] = useState<Array<Array<Tile | null>>>(Array(boardSize).fill(Array(boardSize).fill(null)));
    const [rackTiles, setRackTiles] = useState<Array<Tile | null>>(Array(7).fill(null));
    const [moves, setMoves] = useState<Array<Move>>([]);
    const [showingMove, setShowingMove] = useState<Move | null>(null);

    function updateBoardTile(rowIndex: number, columnIndex: number, tile: Tile | null) {
        let newTiles: Array<Array<Tile | null>> = [];
        boardTiles.forEach((row) => {
            newTiles.push(row.slice());
        })
        newTiles[rowIndex][columnIndex] = tile;
        setBoardTiles(newTiles);
    }

    function updateRackTile(index: number, tile: Tile | null) {
        let newTiles: Array<Tile | null> = rackTiles.slice();
        newTiles[index] = tile;
        setRackTiles(newTiles);
    }

    function handleClickReset() {
        setBoardTiles(Array(boardSize).fill(Array(boardSize).fill(null)));
        setRackTiles(Array(7).fill(null));
        setMoves([]);
        setShowingMove(null);
    }

    function handleClickSolve() {
        board.populate(boardTiles);

        let foundMoves = solver.getFirstMove(board, rackTiles.filter(l => l !== null));
        setMoves(foundMoves);
    }

    function handleShowMove(move: Move) {
        setShowingMove(move);
    }

    return (
        <>
            <ScrabbleBoard boardSize={boardSize} boardTiles={boardTiles} updateBoardTile={updateBoardTile} showingMove={showingMove} />
            <Rack rackTiles={rackTiles} updateRackTile={updateRackTile} />
            <div className="flex justify-center mt-8">
                <button onClick={handleClickSolve} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-16 mr-2">
                    Find Words
                </button>
                <button onClick={handleClickReset} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-16 ml-2">
                    Reset
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
                                    <button onClick={() => handleShowMove(move)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-4 rounded-sm mb-2 ml-2">
                                        Show
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
