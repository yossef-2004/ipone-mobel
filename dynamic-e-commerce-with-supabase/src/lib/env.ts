export function getDatabaseUrl(): string {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.SUPABASE_DATABASE_URL,
  ];

  const value = candidates.find((candidate): candidate is string => Boolean(candidate && candidate.trim()));
  if (!value) {
    throw new Error(
      "Missing database connection string. Add DATABASE_URL in Vercel / local .env and point it to your Supabase Postgres URL.",
    );
  }

  return value.trim();
}
