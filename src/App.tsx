import { useState } from 'react'
import './App.css'

import { Board } from './game/board';
import { Cell } from './game/cell';
import { DoubleLetterCellType } from './game/celltype';
import { TripleLetterCellType } from './game/celltype';
import { DoubleWordCellType } from './game/celltype';
import { TripleWordCellType } from './game/celltype';
import { Move } from './game/move';
import { BLANK, TILES, Tile } from './game/tile';
import { Solver } from './solver/solver';

let board = new Board();
let solver = new Solver();

// a tile already on the board, or in the rack

// a tile shown in a suggested move

function ScrabbleLetter({letter}: {letter: string}) {
    const points: number = TILES[letter]?.points || 0;

    return (
        <>
            <div className="bg-orange-300 text-gray-800 rounded w-12 h-12 flex items-center justify-center text-2xl font-bold relative">
                {letter}
                { letter !== BLANK ? <sub className="text-sm absolute bottom-0 right-1">{points}</sub> : null }
            </div>
        </>
    );
}

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

function RackTile({updateRackTile}: {updateRackTile: (letter: string) => void}) {
    const [editing, setEditing] = useState(false);
    const [letter, setLetter] = useState('');

    function handleUpdateLetter(newLetter: string) {
        setEditing(false);
        updateRackTile(newLetter);
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
                    value={letter}
                    onChange={(e) => setLetter(e.target.value.toUpperCase())}
                    onFocus={(e) => e.target.select()}
                    onBlur={(e) => handleUpdateLetter(e.target.value.toUpperCase())}
                    autoFocus
                />
                : letter ? <ScrabbleLetter letter={letter} /> : '?'
            }
        </div>
    )
}

function Rack({updateRackTile}: {updateRackTile: (index: number, letter: string) => void}) {
    let tiles = [];
    for (let i = 0; i < 7; i++) {
        tiles.push(
            <RackTile 
                key={i}
                updateRackTile={(letter: string) => updateRackTile(i, letter)}/>
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

function ScrabbleCell({cell}: {cell: Cell}) {
    const [editing, setEditing] = useState(false);
    const [letter, setLetter] = useState('');

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

    return (
        <div 
            className={`${cellColor} size-12 flex items-center justify-center font-bold text-gray-800`}
            onClick={() => setEditing(!editing)}>
            { editing ?
                <input
                    type="text"
                    maxLength={1}
                    className={`w-full h-full text-center text-2xl ${populatedCellColor}`}
                    value={letter}
                    onChange={(e) => setLetter(e.target.value.toUpperCase())}
                    onFocus={(e) => e.target.select()}
                    onBlur={() => setEditing(false)}
                    autoFocus
                />
                : letter ? <ScrabbleLetter letter={letter} /> : cell.cellType.toString()
            }
        </div>
    )
}

// TODO is this right way to handle showing a ScrabbleTile in the case where a move is selected?
// There is duplication in the Cell component when a letter is pre-entered
function ScrabbleBoard({boardSize, showingMove}: {boardSize: number, showingMove: Move | null}) {
    let cells = [];
    for (let rowIndex = 0; rowIndex < boardSize; rowIndex++) {
        for (let colIndex = 0; colIndex < boardSize; colIndex++) {
            const boardCell = board.cells[rowIndex][colIndex];
            const key = `${rowIndex}-${colIndex}`;
            const tileAt = showingMove && showingMove.getTileAt(rowIndex, colIndex);
            if (tileAt) {
                cells.push(<ScrabbleTile key={key} tile={tileAt} />);
            } else {
                cells.push(<ScrabbleCell key={key} cell={boardCell} />);
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
    const [rackTiles, setRackTiles] = useState<Array<string>>(Array(7).fill(''));
    const [moves, setMoves] = useState<Array<Move>>([]);
    const [showingMove, setShowingMove] = useState<Move | null>(null);

    function updateRackTile(index: number, letter: string) {
        let newTiles: Array<string> = rackTiles.slice();
        newTiles[index] = letter;
        setRackTiles(newTiles);
    }

    function handleClickSolve() {
        let foundMoves = solver.getFirstMove(board, rackTiles.filter(l => l));
        setMoves(foundMoves);
    }

    function handleShowMove(move: Move) {
        setShowingMove(move);
    }

    return (
        <>
            <ScrabbleBoard boardSize={boardSize} showingMove={showingMove} />
            <Rack updateRackTile={updateRackTile} />
            <div className="flex justify-center mt-8">
                <button onClick={handleClickSolve} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-16">
                    Find Words
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
