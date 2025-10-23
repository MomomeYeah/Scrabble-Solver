import { expect, test } from 'vitest'
import { Trie } from '../../src/solver/trie.js'

test('can add and retrieve word', () => {
    const testTrie = new Trie();
    testTrie.addWord("HELLO");
    testTrie.addWord("WORLD");

    const testTrieWords = testTrie.getAllWords();
    expect(testTrieWords).toContain("HELLO");
    expect(testTrieWords).toContain("WORLD");
});

test.each([
    // prefix, no suffix, exclude words with matching prefix but different suffix
    ["HEAV", "", "Y"],
    // prefix, suffix, exclude words with matching prefix but different suffix
    ["HE", "LO", "L"],
    // no prefix, suffix, exclude words with matching prefix but different suffix
    ["", "EN", "H"],
    // multiple matches
    ["VAL", "E", "UV"]
])("can correctly calculate valid letters from prefix '%s' and suffix '%s'", (prefix, suffix, expected) => {
    const testTrie = new Trie();
    testTrie.addWord("HEAVY");  // test case 1
    testTrie.addWord("HEAVEN"); // test case 1
    testTrie.addWord("HELLO");  // test case 2
    testTrie.addWord("HELP");   // test case 2
    testTrie.addWord("HEN");    // test case 3
    testTrie.addWord("GIVEN");  // test case 3
    testTrie.addWord("VALUE");  // test case 4
    testTrie.addWord("VALVE");  // test case 4

    expect(testTrie.getValidLettersFromPrefixandSuffix(prefix.split(""), suffix.split(""))).toEqual(expected.split(""));
});