import { getDb } from "./db";

export async function initDb() {
  const db = getDb();

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS to_read (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      cover_url TEXT,
      open_library_id TEXT,
      google_books_id TEXT,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shelf (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      cover_url TEXT,
      open_library_id TEXT,
      google_books_id TEXT,
      rating INTEGER CHECK(rating BETWEEN 1 AND 10),
      thoughts TEXT CHECK(length(thoughts) <= 500),
      finished_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      format TEXT CHECK(format IN ('Novel', 'Novella', 'Short Story Collection', 'Graphic Novel')),
      genre TEXT,
      tags TEXT,
      is_rated INTEGER DEFAULT 0
    );
  `);
}
