import { useState, type ReactNode } from 'react'
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

type BoardHistoryItem = {
    board: Array<Array<Cell>>,
    rack: Array<Tile | null>,
    showingMove: Move | null
}

function ScrabbleTile({tile}: {tile: Tile}) {
    return (
        <div className="bg-orange-300 text-gray-800 rounded w-12 h-12 flex items-center justify-center text-2xl font-bold relative">
            {tile.letter}
            { tile.points ? <sub className="text-sm absolute bottom-0 right-1">{tile.points}</sub> : null }
        </div>
    );
}

function PlacementTile({placement}: {placement: TilePlacement}) {
    return (
        <div className="bg-red-300 ring-1 ring-pink-500 text-gray-800 rounded w-12 h-12 flex items-center justify-center text-2xl font-bold relative">
            {placement.tile.letter}
            { placement.tile.points ? <sub className="text-sm absolute bottom-0 right-1">{placement.tile.points}</sub> : null }
        </div>
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

function ScrabbleCell({cell, showingMove}: {cell: Cell, showingMove: Move | null}) {
    const [editing, setEditing] = useState(false);
    const placement = showingMove && showingMove?.getPlacementAt(cell.row, cell.column);

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
        const existingTile = cell.tile;
        if (newLetter) {
            if (existingTile && existingTile instanceof BlankTile) {
                existingTile.setLetter(newLetter);
            } else {
                const tile = newLetter === BLANK ? new BlankTile() : new Tile(newLetter);
                cell.placeTile(tile);
            }
        } else {
            cell.reset();
        }
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
                    value={cell.isEmpty() ? "" : cell.tile!.letter}
                    onChange={(e) => handleChangeLetter(e.target.value.toUpperCase())}
                    onFocus={(e) => e.target.select()}
                    onBlur={() => setEditing(false)}
                    autoFocus
                />
                : placement && placement.isNew ? <PlacementTile placement={placement} />
                : cell.isEmpty() ? cell.cellType.toString() : <ScrabbleTile tile={cell.tile!} />
            }
        </div>
    )
}

function ScrabbleBoard({historyItem}: {historyItem: BoardHistoryItem}) {
    const scrabbleCells = [];
    for (let rowIndex = 0; rowIndex < historyItem.board.length; rowIndex++) {
        for (let columnIndex = 0; columnIndex < historyItem.board.length; columnIndex++) {
            const key = `${rowIndex}-${columnIndex}`;
            scrabbleCells.push(
                <ScrabbleCell
                    key={key}
                    cell={historyItem.board[rowIndex][columnIndex]}
                    showingMove={historyItem.showingMove} />
            );
        }
    }

    // It would be nice to use grid-cols-${boardSize} but tailwind will prune any styles it can't statically find
    return (
        <div className="grid grid-cols-15 gap-1 aspect-square my-4 mx-4 p-1 border-4 rounded border-pink-800">
            { scrabbleCells }
        </div>
    )
}

type MoveHistoryProps = {
    history: Array<BoardHistoryItem>,
    handleGotoHistory: (index: number) => void
}
function MoveHistory({history, handleGotoHistory}: MoveHistoryProps) {
    // only show history if at least one move has been made
    if (history.length < 2) {
        return null;
    }

    const historyItems: Array<ReactNode> = [];

    // show preview for all history items except the most recent, which would just be a copy of the main board
    history.forEach((historyItem, index) => {
        historyItems.push(
            // Capture clicks here to prevent interaction with historical boards when selecting them
            <div key={index} style={{zoom: "25%"}} onClickCapture={(e) => {handleGotoHistory(index); e.stopPropagation(); e.preventDefault();}}>
                <ScrabbleBoard historyItem={historyItem} />
            </div>
        );
    });

    return (
        <div className="grid grid-cols-4 mt-6">
            {historyItems}
        </div>
    );
}

function App() {
    const [board] = useState<Board>(() => new Board());
    const [history, setHistory] = useState<Array<BoardHistoryItem>>([{
        "board": board.copy(),
        "rack": Array(7).fill(null),
        "showingMove": null
    }]);
    const [currentMove, setCurrentMove] = useState<number>(0);
    const [moves, setMoves] = useState<Array<Move>>(new Array<Move>());

    function handleGoToHistory(moveIndex: number) {
        setMoves(new Array<Move>);
        setCurrentMove(moveIndex);
    }

    function viewingLatestHistoryItem() {
        return currentMove === history.length - 1;
    }

    function updateCurrentHistoryItem(historyItem: BoardHistoryItem) {
        const newHistory = history.slice(0, -1);
        setHistory([...newHistory, historyItem]);
    }

    function updateRackTile(index: number, tile: Tile | null) {
        const historyItem = history[currentMove];
        historyItem.rack[index] = tile;

        updateCurrentHistoryItem(historyItem);
    }

    function handleClickReset() {
        board.reset();
        setHistory([{
            "board": board.copy(),
            "rack": Array(7).fill(null),
            "showingMove": null
        }]);
        setCurrentMove(0);
        setMoves([]);
    }

    function handleClickHide() {
        const historyItem = history[currentMove];
        historyItem.showingMove = null;

        updateCurrentHistoryItem(historyItem);
    }

    function handleClickSolve() {
        const historyItem = history[currentMove];
        historyItem.showingMove = null;

        const hand = historyItem.rack.filter(l => l !== null);
        const foundMoves = board.getMoves(hand);
        setMoves(foundMoves);

        updateCurrentHistoryItem(historyItem);
    }

    function handleShowMove(move: Move) {
        const historyItem = history[currentMove];
        historyItem.showingMove = move;

        updateCurrentHistoryItem(historyItem);
    }

    function handleAcceptMove(move: Move) {
        // place the move on the board
        move.placements.forEach((placement) => {
            board.cells[placement.row][placement.column].placeTile(placement.tile);
        });

        // add new history item
        const newHistoryItem = {
            "board": board.copy(),
            "rack": history[currentMove].rack,
            "showingMove": null
        }
        setHistory([...history, newHistoryItem]);
        setCurrentMove(currentMove + 1);

        // clear the set of suggested moves
        setMoves(new Array<Move>());
    }

    return (
        <>
            <MoveHistory history={history} handleGotoHistory={handleGoToHistory} />
            {/* Prevent iteraction with board cells or rack unless we are viewing the latest history item */}
            <div onClickCapture={(e) => { if (! viewingLatestHistoryItem()) { e.stopPropagation(); e.preventDefault(); }}}>
                <ScrabbleBoard historyItem={history[currentMove]} />
                <Rack rackTiles={history[currentMove].rack} updateRackTile={updateRackTile} />
                {/* Hide actions unless we are viewing the latest history item */}
                { viewingLatestHistoryItem() ?
                    <div className="flex justify-center mt-8">
                        <button onClick={handleClickSolve} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-16">
                            Find Words
                        </button>
                        <button onClick={handleClickReset} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-16 ml-4">
                            Reset
                        </button>
                        <button onClick={handleClickHide} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-16 ml-4">
                            Hide Solution
                        </button>
                    </div> : null
                }
                <div className="flex justify-center mb-16">
                    { moves.length > 0 ? 
                        <div className="w-lg">
                            <h2 className="text-xl font-bold mb-4">Top 10 Moves</h2>
                            { moves.map((move, index) => (
                                <div key={index} className="flex justify-between">
                                    {move.toString()}
                                    , starting from 
                                    ({move.placements[0].row}, {move.placements[0].column})
                                    ({move.score} points)
                                    <div>
                                        <button onClick={() => handleShowMove(move)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-4 rounded mb-2 ml-2">
                                            Show
                                        </button>
                                        <button onClick={() => handleAcceptMove(move)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-4 rounded mb-2 ml-2">
                                            Accept
                                        </button>
                                    </div>
                                </div>
                            )) }
                        </div> : null
                    }
                </div>
            </div>
        </>
    )
}

export default App
