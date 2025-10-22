import { Node } from './node';

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

    /** Calculate the set of valid letters that can be played between a given prefix and suffix.
     * 
     * In order for a letter to be valid, the concatenated prefix, letter, and suffix must form a complete word.
     */
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