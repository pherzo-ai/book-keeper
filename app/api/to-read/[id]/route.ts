import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  await db.execute({ sql: "DELETE FROM to_read WHERE id = ?", args: [id] });
  return NextResponse.json({ success: true });
}

// PUT: mark book as finished, move to shelf
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const body = await request.json();

  // Get book from to_read
  const result = await db.execute({
    sql: "SELECT * FROM to_read WHERE id = ?",
    args: [id],
  });

  if (!result.rows.length) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const book = result.rows[0];
  const {
    rating = null,
    thoughts = null,
    genre = null,
    format = null,
    tags = null,
    skip = false,
  } = body;

  const shelfId = uuidv4();
  const isRated = !skip && rating !== null ? 1 : 0;

  await db.batch([
    {
      sql: `INSERT INTO shelf (id, title, author, cover_url, open_library_id, google_books_id, rating, thoughts, genre, format, tags, is_rated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        shelfId,
        book.title,
        book.author,
        book.cover_url,
        book.open_library_id,
        book.google_books_id,
        isRated ? rating : null,
        isRated && thoughts ? thoughts : null,
        genre ?? null,
        format ?? null,
        tags ?? null,
        isRated,
      ],
    },
    {
      sql: "DELETE FROM to_read WHERE id = ?",
      args: [id],
    },
  ]);

  return NextResponse.json({ shelfId });
}
