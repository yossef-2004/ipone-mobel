/** Smaller variant for cards/lists. External URLs are returned untouched. Safe for client & server. */
export function thumbUrl(url: string): string {
  return url.startsWith("/api/media/") ? `${url}?size=thumb` : url;
}
