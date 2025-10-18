export class Node {

    public static root: string = '_';
    public static EOW: string = '$';

    public letter: string;
    public childrenMap: Map<string, Node>;
    public childrenList: Array<Node>;

    constructor(letter: string) {
        this.letter = letter;
		this.childrenMap = new Map<string, Node>();
        this.childrenList = new Array<Node>();
   }
	
	toString(): string {
		let ret: string = this.letter + " ";
        this.childrenList.forEach((n) => {
            ret += "(" + n.toString() + ")";
        });

        return ret;
	}
	
	hasChild(child: string): boolean {
        return this.childrenMap.has(child);
	}
	
	getChild(child: string): Node | null {
        if (this.hasChild(child) == false) return null;

        return this.childrenMap.get(child)!;
	}
	
	addChild(child: string): Node {
		if (! this.hasChild(child)) {
			let n: Node = new Node(child);
			this.childrenMap.set(child, n);
			this.childrenList.push(n);
			return n;
		}
		
		return this.childrenMap.get(child)!;
	}
	
    containsSuffix(suffix: Array<string>): boolean {
		let n: Node = this;
        for (const char of suffix) {
            if (! n.hasChild(char)) return false;
            n = n.getChild(char)!;
        }

        return n.hasChild(Node.EOW);
    }

    /** Get all suffixes from this node */
    getSuffixes(): Array<string> {
        let suffixes: Array<string> = new Array<string>();

        // for each child of the current node
        this.childrenList.forEach((childNode) => {
            // if the child is the end-of-word marker, add an empty suffix
            if (childNode.letter == Node.EOW) {
                suffixes.push("");
            // otherwise, prepend this node's letter with all child suffixes
            } else {
                let recSuffixes: Array<string> = childNode.getSuffixes();
                recSuffixes.forEach((s) => {
                    suffixes.push(childNode.letter + s);
                });
            }
        });

        return suffixes;
    }
}