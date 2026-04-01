import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await execute("DELETE FROM to_read WHERE id = ?", [id]);
  return NextResponse.json({ success: true });
}

// PUT: mark book as finished, move to shelf
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // Get book from to_read
  const result = await query("SELECT * FROM to_read WHERE id = ?", [id]);

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
    finished_at = null,
    skip = false,
  } = body;

  const shelfId = uuidv4();
  const isRated = !skip && rating !== null ? 1 : 0;

  await execute(
    `INSERT INTO shelf (id, title, author, cover_url, open_library_id, google_books_id, rating, thoughts, genre, format, tags, is_rated, finished_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
    [
      shelfId,
      book.title as string,
      book.author as string,
      book.cover_url as string | null,
      book.open_library_id as string | null,
      book.google_books_id as string | null,
      isRated ? rating : null,
      isRated && thoughts ? thoughts : null,
      genre ?? null,
      format ?? null,
      tags ?? null,
      isRated,
      finished_at,
    ]
  );
  await execute("DELETE FROM to_read WHERE id = ?", [id]);

  return NextResponse.json({ shelfId });
}
