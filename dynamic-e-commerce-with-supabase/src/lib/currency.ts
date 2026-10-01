/** All prices in the app are whole Iraqi dinars. Example: 1,250,000 د.ع */

const formatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function formatIqd(value: number | bigint | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n === "number" && !Number.isFinite(n)) return "—";
  return `${formatter.format(n)} د.ع`;
}

export function formatNumber(value: number): string {
  return formatter.format(value);
}

/** Converts Arabic-Indic digits and strips separators: "٢٥٬٠٠٠٬٠٠٠" -> 25000000 */
export function parsePriceInput(raw: string): number | null {
  const western = raw
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[,\s٬،.]/g, "");
  if (!/^\d+$/.test(western)) return null;
  const n = Number(western);
  return Number.isSafeInteger(n) ? n : null;
}
