import { expect, test, describe } from 'vitest'
import { Node } from '../../src/solver/Node.js'

describe('Node basic operations', () => {
    test.each(
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ_".split("")
    )("can add and retrieve node using %s", (childLetter) => {
        const testNode = new Node(Node.root);

        const addChildResult = testNode.addChild(childLetter);
        expect(addChildResult).toBeInstanceOf(Node);
        expect(addChildResult.letter).toEqual(childLetter);

        const getChildResult = testNode.getChild(childLetter);
        expect(getChildResult).toBeInstanceOf(Node);
        expect(getChildResult?.letter).toEqual(childLetter);
    });
});

describe('Node suffixes and suffix-search', () => {
    test('getSuffixes returns expected suffixes', () => {
        const root = new Node(Node.root);

        const a = root.addChild('A');
        const t = a.addChild('T');
        t.addChild(Node.EOW);

        const n = a.addChild('N');
        n.addChild(Node.EOW);

        const b = root.addChild('B');
        b.addChild(Node.EOW);

        const suffixes = root.getSuffixes().slice().sort();
        expect(suffixes).toEqual(['AN', 'AT', 'B'].slice().sort());
    });

    test('getSuffixes with deeper nesting and sibling EOWs', () => {
        const root = new Node(Node.root);

        // Build words: ABC, ABD, A
        const a = root.addChild('A');
        const b = a.addChild('B');
        const c = b.addChild('C');
        c.addChild(Node.EOW);
        const d = b.addChild('D');
        d.addChild(Node.EOW);
        // Also add 'A' as a word (EOW under A)
        a.addChild(Node.EOW);

        const suffixes = root.getSuffixes().slice().sort();
        expect(suffixes).toEqual(['A', 'ABC', 'ABD'].slice().sort());
    });

    test('containsSuffix positive and negative cases', () => {
        const root = new Node(Node.root);
        const a = root.addChild('A');
        const b = a.addChild('B');
        const c = b.addChild('C');
        c.addChild(Node.EOW);

        // Positive: ['B','C'] exists under A
        expect(a.containsSuffix(['B','C'])).toBe(true);

        // Negative: ['B','D'] does not exist
        expect(a.containsSuffix(['B','D'])).toBe(false);

        // Negative: searching deeper than existing path
        expect(a.containsSuffix(['B','C','E'])).toBe(false);
    });
});