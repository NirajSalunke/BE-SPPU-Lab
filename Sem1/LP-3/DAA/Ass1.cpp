#include <iostream>

using namespace std;

long long fibonacciIterative(int n)
{
    long long previous = 0;
    long long current = 1;

    for (int i = 0; i < n; i++)
    {
        long long next = previous + current;
        previous = current;
        current = next;
    }
    return previous;
}

long long fibonacciRecursive(int n)
{
    if (n <= 1)
        return static_cast<long long>(n);
    return fibonacciRecursive(n - 1) + fibonacciRecursive(n - 2);
}

int main()
{
    int n;
    cout << "Enter n (0-35): ";
    cin >> n;

    long long iterativeResult = fibonacciIterative(n);

    long long recursiveResult = fibonacciRecursive(n);

    cout << "Fibonacci(" << n << ") non-recursive: " << iterativeResult << endl;

    cout << "Fibonacci(" << n << ") recursive:     " << recursiveResult << endl;

    cout << "\nComplexity analysis:\n"
         << "Non-recursive: time O(n), auxiliary space O(1)\n"
         << "Recursive:     time O(2^n), auxiliary space O(n)" << endl;

    return 0;
}
