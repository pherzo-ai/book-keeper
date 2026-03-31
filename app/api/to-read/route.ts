import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { initDb } from "@/lib/db-init";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  try {
    await initDb();
    const db = getDb();
    const result = await db.execute(
      "SELECT * FROM to_read ORDER BY added_at DESC"
    );
    return NextResponse.json({ books: result.rows });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const db = getDb();
    const body = await request.json();
    const { title, author, cover_url, open_library_id, google_books_id } = body;

    if (!title || !author) {
      return NextResponse.json(
        { error: "title and author required" },
        { status: 400 }
      );
    }

    const id = uuidv4();
    await db.execute({
      sql: `INSERT INTO to_read (id, title, author, cover_url, open_library_id, google_books_id)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, title, author, cover_url ?? null, open_library_id ?? null, google_books_id ?? null],
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
