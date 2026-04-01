import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const genre = searchParams.get("genre");
  const format = searchParams.get("format");
  const year = searchParams.get("year");
  const unrated = searchParams.get("unrated");
  const tag = searchParams.get("tag");
  const sort = searchParams.get("sort") ?? "finished_at";

  let sql = "SELECT * FROM shelf WHERE 1=1";
  const args: (string | number)[] = [];

  if (genre) {
    sql += " AND genre = ?";
    args.push(genre);
  }
  if (format) {
    sql += " AND format = ?";
    args.push(format);
  }
  if (year) {
    sql += " AND strftime('%Y', finished_at) = ?";
    args.push(year);
  }
  if (unrated === "true") {
    sql += " AND is_rated = 0";
  }
  if (tag) {
    sql += " AND (',' || tags || ',') LIKE ?";
    args.push(`%,${tag},%`);
  }

  const sortMap: Record<string, string> = {
    finished_at: "finished_at DESC",
    rating: "rating DESC NULLS LAST",
    title: "title ASC",
  };
  sql += ` ORDER BY ${sortMap[sort] ?? "finished_at DESC"}`;

  const result = await query(sql, args);
  return NextResponse.json({ books: result.rows });
}
