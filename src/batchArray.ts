export function batchArray<T>(array: T[], batchSize: number): T[][] {
  return array.reduce((acc, item, index) => {
    const batchIndex = Math.floor(index / batchSize);
    acc[batchIndex] = [...(acc[batchIndex] || []), item];
    return acc;
  }, [] as T[][]);
}
