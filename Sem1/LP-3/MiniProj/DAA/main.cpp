#include <iostream>
#include <string>
#include <vector>
#include <chrono>
#include <iomanip>
#include <cstdint>
#include <fstream>
#include <limits>

using namespace std;
using namespace chrono;

struct Result
{
    vector<int> positions;
    long long comparisons = 0;
    double timeMs = 0;
};

Result naiveSearch(const string &text, const string &pattern)
{
    Result result;
    auto start = high_resolution_clock::now();

    int n = text.size();
    int m = pattern.size();

    if (m == 0 || m > n)
    {
        result.timeMs = duration<double, milli>(
                            high_resolution_clock::now() - start)
                            .count();
        return result;
    }

    for (int i = 0; i <= n - m; i++)
    {
        int j = 0;

        while (j < m)
        {
            result.comparisons++;

            if (text[i + j] != pattern[j])
                break;

            j++;
        }

        if (j == m)
            result.positions.push_back(i);
    }

    auto end = high_resolution_clock::now();
    result.timeMs = duration<double, milli>(end - start).count();

    return result;
}

Result rabinKarp(const string &text, const string &pattern)
{
    Result result;
    auto start = high_resolution_clock::now();

    int n = text.size();
    int m = pattern.size();

    if (m == 0 || m > n)
    {
        result.timeMs = duration<double, milli>(
                            high_resolution_clock::now() - start)
                            .count();
        return result;
    }

    const long long base = 256;
    const long long mod = 1000000007;

    long long patternHash = 0;
    long long windowHash = 0;
    long long highestPower = 1;

    for (int i = 0; i < m - 1; i++)
        highestPower = (highestPower * base) % mod;

    for (int i = 0; i < m; i++)
    {
        patternHash = (patternHash * base +
                       static_cast<unsigned char>(pattern[i])) %
                      mod;

        windowHash = (windowHash * base +
                      static_cast<unsigned char>(text[i])) %
                     mod;
    }

    for (int i = 0; i <= n - m; i++)
    {
        if (patternHash == windowHash)
        {
            int j = 0;

            while (j < m)
            {
                result.comparisons++;

                if (text[i + j] != pattern[j])
                    break;

                j++;
            }

            if (j == m)
                result.positions.push_back(i);
        }

        if (i < n - m)
        {
            long long outgoing =
                (static_cast<unsigned char>(text[i]) * highestPower) % mod;

            windowHash = (windowHash - outgoing + mod) % mod;
            windowHash = (windowHash * base +
                          static_cast<unsigned char>(text[i + m])) %
                         mod;
        }
    }

    auto end = high_resolution_clock::now();
    result.timeMs = duration<double, milli>(end - start).count();

    return result;
}

void displayResult(const string &name, const Result &result)
{
    cout << "\n"
         << name << "\n";
    cout << "-----------------------------\n";

    cout << "Matching indices: ";

    if (result.positions.empty())
    {
        cout << "No matches";
    }
    else
    {
        for (int position : result.positions)
            cout << position << " ";
    }

    cout << "\nTotal matches: " << result.positions.size();
    cout << "\nCharacter comparisons: " << result.comparisons;
    cout << "\nExecution time: " << fixed << setprecision(6)
         << result.timeMs << " ms\n";
}

int main()
{
    while (true)
    {
        cout << "\n====================================\n";
        cout << "       STRING MATCHING PROJECT\n";
        cout << "====================================\n";
        cout << "1. Enter input in terminal\n";
        cout << "2. Read input from input.txt\n";
        cout << "3. Exit\n";
        cout << "Choose an option: ";

        int choice;
        cin >> choice;
        cin.ignore(numeric_limits<streamsize>::max(), '\n');

        if (choice == 3)
        {
            cout << "Exiting program...\n";
            break;
        }

        string text, pattern;

        if (choice == 1)
        {
            cout << "Enter the text: ";
            getline(cin, text);

            cout << "Enter the pattern to search: ";
            getline(cin, pattern);
        }
        else if (choice == 2)
        {
            ifstream file("input_1.txt");

            if (!file.is_open())
            {
                cout << "Error: Could not open input.txt\n";
                continue;
            }

            getline(file, text);
            getline(file, pattern);
            file.close();

            cout << "\nText: " << text << '\n';
            cout << "Pattern: " << pattern << '\n';
        }
        else
        {
            cout << "Invalid choice. Try again.\n";
            continue;
        }

        if (pattern.empty())
        {
            cout << "Error: Pattern cannot be empty.\n";
            continue;
        }

        if (pattern.size() > text.size())
        {
            cout << "Pattern is longer than the text. No matches possible.\n";
            continue;
        }

        Result naive = naiveSearch(text, pattern);
        Result rk = rabinKarp(text, pattern);

        displayResult("1. Naive String Matching", naive);
        displayResult("2. Rabin-Karp String Matching", rk);

        cout << "\n====================================\n";
        cout << "          PERFORMANCE COMPARISON\n";
        cout << "====================================\n";

        cout << left << setw(22) << "Algorithm"
             << setw(18) << "Comparisons"
             << "Time (ms)\n";

        cout << left << setw(22) << "Naive"
             << setw(18) << naive.comparisons
             << naive.timeMs << '\n';

        cout << left << setw(22) << "Rabin-Karp"
             << setw(18) << rk.comparisons
             << rk.timeMs << '\n';

        cout << "\nExecution times depend on your machine and input.\n";
    }

    return 0;
}