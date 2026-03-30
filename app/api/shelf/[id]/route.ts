import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const body = await request.json();
  const { rating, thoughts, genre, format, tags } = body;

  await db.execute({
    sql: `UPDATE shelf SET rating = ?, thoughts = ?, genre = ?, format = ?, tags = ?, is_rated = 1
          WHERE id = ?`,
    args: [
      rating ?? null,
      thoughts ?? null,
      genre ?? null,
      format ?? null,
      tags ?? null,
      id,
    ],
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  await db.execute({ sql: "DELETE FROM shelf WHERE id = ?", args: [id] });
  return NextResponse.json({ success: true });
}
