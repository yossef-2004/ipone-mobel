const fmt = new Intl.DateTimeFormat("ar-IQ-u-nu-latn", {
  timeZone: "Asia/Baghdad",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(iso: string): string {
  return fmt.format(new Date(iso));
}
