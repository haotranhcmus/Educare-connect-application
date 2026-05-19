/**
 * Bucket a flat list into `SectionList`-shaped groups keyed by an ISO date
 * field, sorted descending so the most recent group renders first.
 *
 * @param items Source rows.
 * @param getDate Accessor returning a `YYYY-MM-DD` string for each row.
 */
export function groupByDate<T>(
  items: readonly T[],
  getDate: (item: T) => string,
): Array<{ title: string; data: T[] }> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = getDate(item);
    let bucket = map.get(key);
    if (!bucket) {
      bucket = [];
      map.set(key, bucket);
    }
    bucket.push(item);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, data]) => ({ title: date, data }));
}
