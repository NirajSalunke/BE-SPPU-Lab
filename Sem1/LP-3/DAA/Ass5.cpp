#include <iostream>
#include <vector>
#include <random>
#include <algorithm>

using namespace std;

vector<int> createArray()
{
    int n;
    cout << "Enter number of elements: ";
    cin >> n;

    vector<int> values(n);
    cout << "Enter elements: ";
    for (int &value : values)
        cin >> value;
    return values;
}

int partitionArray(vector<int> &values, int low, int high)
{
    int pivot = values[high];
    int i = low - 1;
    for (int j = low; j < high; ++j)
    {
        if (values[j] <= pivot)
        {
            ++i;
            swap(values[i], values[j]);
        }
    }
    swap(values[i + 1], values[high]);
    return i + 1;
}

void deterministicQuickSort(vector<int> &values, int low, int high)
{
    if (low >= high)
        return;
    int pivot = partitionArray(values, low, high);
    deterministicQuickSort(values, low, pivot - 1);
    deterministicQuickSort(values, pivot + 1, high);
}

int randomizedPartition(vector<int> &values, int low, int high, mt19937 &rng)
{
    uniform_int_distribution<int> choosePivot(low, high);
    swap(values[choosePivot(rng)], values[high]);
    return partitionArray(values, low, high);
}

void randomizedQuickSort(vector<int> &values, int low, int high, mt19937 &rng)
{
    if (low >= high)
        return;
    int pivot = randomizedPartition(values, low, high, rng);
    randomizedQuickSort(values, low, pivot - 1, rng);
    randomizedQuickSort(values, pivot + 1, high, rng);
}

void printArray(const vector<int> &values)
{
    for (int value : values)
        cout << value << ' ';
    cout << '\n';
}

int main()
{
    vector<int> input = createArray();
    vector<int> deterministic = input;
    vector<int> randomized = input;

    deterministicQuickSort(deterministic, 0, static_cast<int>(deterministic.size()) - 1);
    mt19937 rng(random_device{}());
    randomizedQuickSort(randomized, 0, static_cast<int>(randomized.size()) - 1, rng);

    cout << "\nDeterministic Quick Sort: ";
    printArray(deterministic);
    cout << "Time Complexity: Best/Average O(n log n), Worst O(n^2)\n";
    cout << "Space Complexity: Average O(log n), Worst O(n)\n";

    cout << "\nRandomized Quick Sort: ";
    printArray(randomized);
    cout << "Time Complexity: Expected O(n log n), Worst O(n^2)\n";
    cout << "Space Complexity: Expected O(log n), Worst O(n)\n";
    return 0;
}
