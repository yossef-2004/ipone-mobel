/** Unicode-friendly slug (keeps Arabic letters). */
export function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "") // Arabic diacritics
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return base || "item";
}

export function randomSuffix(len = 5): string {
  return Math.random().toString(36).slice(2, 2 + len);
}
