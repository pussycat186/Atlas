import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';

const sqlite = new Database(':memory:');
export const db = drizzle(sqlite);

export async function healthCheck(): Promise<{ status: 'ok' | 'error'; timestamp: number }> {
  try {
    await db.execute(sql`SELECT 1`);
    return { status: 'ok', timestamp: Date.now() };
  } catch {
    return { status: 'error', timestamp: Date.now() };
  }
}