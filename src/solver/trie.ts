import { Node } from './node';
import { Tile, BlankTile } from '../game/tile';

export class Trie {

	public root: Node;
	
	constructor() {
		this.root = new Node(Node.root);
	}
	
	toString(): string {
		return this.root.toString();
	}
	
	addWord(word: string): void {
		word = word + Node.EOW;
		
		let n: Node = this.root;
        word.split('').forEach((char) => {
            n = n.addChild(char);
        });
	}
	
	load(dictionary: Array<string>): void {
        dictionary.forEach((word) => {
            this.addWord(word);
        });
	}
	
	getAllWords(): Array<string> {
        return this.root.getSuffixes();
	}

	getWordsFromTiles(hand: Array<Tile>, fromNode: Node = this.root): Array<Array<Tile>> {
		let words: Array<Array<Tile>> = new Array<Array<Tile>>();

		fromNode.childrenList.forEach((child) => {
			if (child.letter == Node.EOW) {
				words.push(new Array<Tile>());
			} else {
				if (Tile.contains(hand, child.letter)) {
					let remainingTiles = Tile.remove(hand, child.letter);
					let suffixes = this.getWordsFromTiles(remainingTiles, child);
					suffixes.forEach((suffix) => {
						suffix.unshift(new Tile(child.letter));
						words.push(suffix);
					});
				} else if (Tile.containsBlank(hand)) {
					let remainingTiles = Tile.removeBlank(hand);
					let tile: BlankTile = new BlankTile();
					tile.setLetter(child.letter);
					let suffixes = this.getWordsFromTiles(remainingTiles, child);
					suffixes.forEach((suffix) => {
						suffix.unshift(tile);
						words.push(suffix);
					});
				}
			}
		});

		return words;
	}
	
	/** Calculate the set of valid letters that can be played between a given prefix and suffix */
	getValidLettersFromPrefixandSuffix(prefix: Array<string>, suffix: Array<string>): Array<string> {
		let validLetters: Array<string> = new Array<string>();
		let n: Node | null = this.root;
		
		// if there is no prefix or suffix, any letter is valid
		if (prefix.length == 0 && suffix.length == 0) {
			n.childrenList.forEach((child: Node) => {
				validLetters.push(child.letter);
			});
			return validLetters;
		}
		
		let prefixLetters: Array<string> = prefix.slice();
		while (prefixLetters.length > 0 && n != null) {
			n = n.getChild(prefixLetters.shift()!);
		}
		
		// if we get through part or all of the prefix and there are no nodes left
		// there must be no valid letters we can return
		if (n == null) {
			return new Array<string>();
		}
		
		// if there's no suffix, just return all children of the prefix that have EOW as a child
		if (suffix.length == 0) {
			n.childrenList.forEach((child: Node) => {
				if (child.letter != Node.EOW && child.hasChild(Node.EOW)) {
					validLetters.push(child.letter);
				}
			});
		// if there is a suffix, return all children that have the given suffix as a suffix
		} else {
			// for each child of the current node
			n.childrenList.forEach((childNode) => {
				// if the child is not the end-of-word marker, and it contains the suffix, add it
				if (childNode.letter != Node.EOW && childNode.containsSuffix(suffix)) {
					validLetters.push(childNode.letter);
				}
			});
		}
		
		return validLetters;
	}
}