/** Runs a data loader; returns a flag instead of throwing so pages can show an error state, not a blank screen. */
export async function safe<T>(fn: () => Promise<T>): Promise<{ data: T; failed: false } | { data: null; failed: true }> {
  try {
    return { data: await fn(), failed: false };
  } catch (e) {
    console.error("[data]", e);
    return { data: null, failed: true };
  }
}
