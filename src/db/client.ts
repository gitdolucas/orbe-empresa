import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
let database: ReturnType<typeof drizzle<typeof schema>> | undefined;
export function getDatabase() {
  if (!process.env.DATABASE_URL) return null;
  database ??= drizzle(
    postgres(process.env.DATABASE_URL, {
      max: 3,
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 10,
    }),
    { schema },
  );
  return database;
}
