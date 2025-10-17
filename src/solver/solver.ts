import { Board } from "../game/board.js";
import { TilePlacement } from "../game/tileplacement.js";
import { Move } from "../game/move.js";
import { Tile } from "../game/tile.js";

export class Solver {

	getFirstMove(b: Board, hand: Array<string>): Array<Move> {
		const startTime = performance.now();
		const handTiles = Tile.toTileList(hand);

		// First, get every word that can be built from the tiles in our hand
		let words: Array<Array<Tile>> = b.trie.getWordsFromTiles(handTiles);

		// now, for each word, place it in every possible starting position, i.e. all positions
		// that would allow the word to cover the center square
		// since there is no possible score difference between ACROSS and DOWN words on the first move,
		// we will always place ACROSS for simplicity
		let moves: Array<Move> = new Array<Move>();
		const centreSquareIndex = Math.floor(b.boardsize / 2);
		words.forEach((word) => {
			// as far left as possible, i.e. with the rightmost letter on the center square
			let startLoc: number = centreSquareIndex - (word.length - 1);
			// as far right as possible, i.e. with the leftmost letter on the center square
			let endLoc: number = centreSquareIndex;
			for (let incrementer = startLoc; incrementer <= endLoc; incrementer++) {
				// Place the word at this position
				let testPlacements = TilePlacement.getPlacements(word, centreSquareIndex, incrementer, "ACROSS");	

				// Find out the score this placement would yield
				let testScore = b.getScore(testPlacements);

				// Create a Move by combining the set of placements, the direction of play, and the score
				moves.push(new Move(testPlacements, "ACROSS", testScore));
			}
		});

		const endTime = performance.now()
		let searchTimeMS = (endTime - startTime).toFixed(2);
        console.log(`Found ${moves.length} moves in ${searchTimeMS}ms`);
        
		let sortedMoves: Array<Move> = moves.slice().sort((a: Move, b: Move) => {return b.score - a.score;}).slice(0, 10);

		return sortedMoves;
	}
}