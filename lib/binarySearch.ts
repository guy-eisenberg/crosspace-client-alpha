export function binarySearch(arr: number[], target: number): boolean {
  let low = 0;
  let high = arr.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midVal = arr[mid];

    if (midVal === target) return true;
    else if (midVal < target) low = mid + 1;
    else high = mid - 1;
  }

  return false;
}
