import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

let pool: postgres.Sql | null = null;

/**
 * Satu pool koneksi untuk seluruh proses. `prepare: false` karena Supabase
 * memakai PgBouncer dan parameterized statement yang di-prepare tidak
 * selalu aman di sana.
 */
export function getPool(): postgres.Sql {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL belum diisi. Isi .env.local dengan connection string Supabase.",
      );
    }
    pool = postgres(url, {
      max: 5,
      prepare: false,
      connect_timeout: 15,
      idle_timeout: 20,
    });
  }
  return pool;
}

export function getDb(): Db {
  return drizzle(getPool(), { schema });
}

export { schema };