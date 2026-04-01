import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { rating, thoughts, genre, format, tags, finished_at } = body;

  await execute(
    `UPDATE shelf SET rating = ?, thoughts = ?, genre = ?, format = ?, tags = ?, is_rated = 1, finished_at = COALESCE(?, finished_at) WHERE id = ?`,
    [rating ?? null, thoughts ?? null, genre ?? null, format ?? null, tags ?? null, finished_at ?? null, id]
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await execute("DELETE FROM shelf WHERE id = ?", [id]);
  return NextResponse.json({ success: true });
}
