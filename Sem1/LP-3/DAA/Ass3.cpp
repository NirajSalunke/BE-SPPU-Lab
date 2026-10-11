#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

// 0/1 knapsack: each item is either selected in full or not selected.
int knapsackRecursive(const vector<int> &weights, const vector<int> &values,
                      int itemCount, int capacity)
{
    if (itemCount == 0 || capacity == 0)
        return 0;

    if (weights[itemCount - 1] > capacity)
        return knapsackRecursive(weights, values, itemCount - 1, capacity);

    return max(
        knapsackRecursive(weights, values, itemCount - 1, capacity),
        values[itemCount - 1] +
            knapsackRecursive(weights, values, itemCount - 1,
                              capacity - weights[itemCount - 1]));
}

int knapsackMemo(const vector<int> &weights, const vector<int> &values,
                 int itemCount, int capacity,
                 vector<vector<int>> &memo)
{
    if (itemCount == 0 || capacity == 0)
        return 0;

    int &answer = memo[itemCount][capacity];
    if (answer != -1)
        return answer;

    if (weights[itemCount - 1] > capacity)
    {
        answer = knapsackMemo(weights, values, itemCount - 1, capacity, memo);
    }
    else
    {
        answer = max(
            knapsackMemo(weights, values, itemCount - 1, capacity, memo),
            values[itemCount - 1] +
                knapsackMemo(weights, values, itemCount - 1,
                             capacity - weights[itemCount - 1], memo));
    }
    return answer;
}

int knapsackBottomUp(const vector<int> &weights, const vector<int> &values,
                     int capacity)
{
    const int n = static_cast<int>(weights.size());
    vector<vector<int>> dp(n + 1, vector<int>(capacity + 1, 0));

    for (int i = 1; i <= n; ++i)
    {
        for (int currentCapacity = 0; currentCapacity <= capacity;
             ++currentCapacity)
        {
            dp[i][currentCapacity] = dp[i - 1][currentCapacity];
            if (weights[i - 1] <= currentCapacity)
            {
                dp[i][currentCapacity] = max(
                    dp[i][currentCapacity],
                    values[i - 1] + dp[i - 1][currentCapacity - weights[i - 1]]);
            }
        }
    }
    return dp[n][capacity];
}

int knapsackSpaceOptimized(const vector<int> &weights,
                           const vector<int> &values, int capacity)
{
    vector<int> dp(capacity + 1, 0);

    for (size_t i = 0; i < weights.size(); ++i)
    {
        // Descending capacity prevents using the same item more than once.
        for (int currentCapacity = capacity; currentCapacity >= weights[i];
             --currentCapacity)
        {
            dp[currentCapacity] = max(
                dp[currentCapacity],
                values[i] + dp[currentCapacity - weights[i]]);
        }
    }
    return dp[capacity];
}

int main()
{
    // Tent, Sleeping Bag, Water Filter, First Aid Kit, Camp Stove
    const vector<int> weights = {8, 6, 3, 2, 5};
    const vector<int> values = {40, 30, 25, 20, 15};
    const int capacity = 15;
    const int n = static_cast<int>(weights.size());

    cout << "0/1 Knapsack (capacity = " << capacity << " kg)\n";

    cout << "\n1. Recursion (brute force)\n";
    cout << "Maximum usefulness: "
         << knapsackRecursive(weights, values, n, capacity) << '\n';
    cout << "TC: O(2^n)\nSC: O(n)\n";

    vector<vector<int>> memo(n + 1, vector<int>(capacity + 1, -1));
    cout << "\n2. Recursion + memoization\n";
    cout << "Maximum usefulness: "
         << knapsackMemo(weights, values, n, capacity, memo) << '\n';
    cout << "TC: O(n * W)\nSC: O(n * W)\n";

    cout << "\n3. Bottom-up tabulation\n";
    cout << "Maximum usefulness: "
         << knapsackBottomUp(weights, values, capacity) << '\n';
    cout << "TC: O(n * W)\nSC: O(n * W)\n";

    cout << "\n4. Space-optimized bottom-up\n";
    cout << "Maximum usefulness: "
         << knapsackSpaceOptimized(weights, values, capacity) << '\n';
    cout << "TC: O(n * W)\nSC: O(W)\n";

    return 0;
}
