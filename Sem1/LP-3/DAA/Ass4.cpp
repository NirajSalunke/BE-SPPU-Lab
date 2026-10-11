#include <iostream>
#include <vector>
using namespace std;

void solve(int row, int n, vector<int> &placement, vector<bool> &columns,
           vector<bool> &diag1, vector<bool> &diag2,
           vector<vector<int>> &solutions)
{
    if (row == n)
    {
        solutions.push_back(placement);
        return;
    }

    for (int col = 0; col < n; ++col)
    {
        int d1 = row - col + n - 1;
        int d2 = row + col;
        if (columns[col] || diag1[d1] || diag2[d2])
            continue;

        placement[row] = col + 1; // Column number for this row (1-based).
        columns[col] = diag1[d1] = diag2[d2] = true;
        solve(row + 1, n, placement, columns, diag1, diag2, solutions);
        columns[col] = diag1[d1] = diag2[d2] = false;
    }
}

vector<vector<int>> solveNQueens(int n)
{
    vector<vector<int>> solutions;
    if (n <= 0)
        return solutions;

    vector<int> placement(n);
    vector<bool> columns(n, false);
    vector<bool> diag1(2 * n - 1, false);
    vector<bool> diag2(2 * n - 1, false);
    solve(0, n, placement, columns, diag1, diag2, solutions);
    return solutions;
}

int main()
{
    int n;
    cin >> n;

    vector<vector<int>> solutions = solveNQueens(n);
    for (const vector<int> &solution : solutions)
    {
        cout << '[';
        for (int i = 0; i < static_cast<int>(solution.size()); ++i)
        {
            if (i > 0)
                cout << ", ";
            cout << solution[i];
        }
        cout << "]\n";
    }
    return 0;
}
