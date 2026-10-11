#include <iostream>
#include <unordered_map>
#include <queue>
#include <map>
#include <string>
using namespace std;

struct Node
{
    char ch;
    int freq;
    Node *left, *right;

    Node(char c = '\0', int f = 0, Node *l = nullptr, Node *r = nullptr)
        : ch(c), freq(f), left(l), right(r) {}
};

struct Compare
{
    bool operator()(Node *a, Node *b) const
    {
        return a->freq > b->freq;
    }
};

void buildCodes(Node *node, string code, unordered_map<char, string> &codes)
{
    if (node == nullptr)
        return;

    if (node->left == nullptr && node->right == nullptr)
    {
        codes[node->ch] = code;
        return;
    }

    buildCodes(node->left, code + '0', codes);
    buildCodes(node->right, code + '1', codes);
}

int main()
{
    string text;
    cout << "Enter text: ";
    getline(cin, text);

    unordered_map<char, int> freqMap;
    for (char c : text)
    {
        freqMap[c]++;
    }

    priority_queue<Node *, vector<Node *>, Compare> pq;
    for (auto &entry : freqMap)
    {
        pq.push(new Node(entry.first, entry.second));
    }

    if (pq.empty())
    {
        cout << "No characters to encode.\n";
        return 0;
    }

    if (pq.size() == 1)
    {
        Node *single = pq.top();
        unordered_map<char, string> codes;
        codes[single->ch] = "0";

        cout << "\nCharacter frequencies:\n";
        cout << single->ch << " -> " << single->freq << "\n";
        cout << "\nHuffman codes:\n";
        cout << single->ch << " -> 0\n";
        cout << "\nEncoded text: " << string(text.size(), '0') << "\n";
        return 0;
    }

    while (pq.size() > 1)
    {
        Node *left = pq.top();
        pq.pop();

        Node *right = pq.top();
        pq.pop();

        Node *parent = new Node('\0', left->freq + right->freq, left, right);
        pq.push(parent);
    }

    Node *root = pq.top();
    unordered_map<char, string> codes;
    buildCodes(root, "", codes);

    cout << "\nCharacter frequencies:\n";
    map<char, int> orderedFreq(freqMap.begin(), freqMap.end());
    for (auto &entry : orderedFreq)
    {
        cout << entry.first << " -> " << entry.second << "\n";
    }

    cout << "\nHuffman codes:\n";
    for (auto &entry : orderedFreq)
    {
        cout << entry.first << " -> " << codes[entry.first] << "\n";
    }

    cout << "\nEncoded text: ";
    string encoded = "";
    for (char c : text)
    {
        encoded += codes[c];
    }
    cout << encoded << "\n";

    return 0;
}
