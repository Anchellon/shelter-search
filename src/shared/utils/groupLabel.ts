/** Converts a 1-based group_id to a letter label: 1 → "A", 2 → "B", etc. */
export function groupLabel(groupId: number): string {
  if (groupId < 1 || groupId > 26) {
    console.warn(`groupLabel: id ${groupId} out of supported range 1–26`);
  }
  return String.fromCharCode(64 + groupId);
}
