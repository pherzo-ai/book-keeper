import { NextRequest, NextResponse } from "next/server";

export interface BookResult {
  title: string;
  author: string;
  cover_url: string | null;
  open_library_id: string | null;
  google_books_id: string | null;
}

// Server-side fallback: keeps the API key out of the browser
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query?.trim()) return NextResponse.json({ results: [] });

  try {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json({ results: [] });

    const data = await res.json();
    if (!data.items?.length) return NextResponse.json({ results: [] });

    const results: BookResult[] = data.items.map(
      (item: Record<string, unknown>) => {
        const info = item.volumeInfo as Record<string, unknown>;
        const imageLinks = info.imageLinks as
          | Record<string, string>
          | undefined;
        return {
          title: info.title as string,
          author: Array.isArray(info.authors)
            ? (info.authors[0] as string)
            : "Unknown Author",
          cover_url:
            imageLinks?.thumbnail?.replace("http://", "https://") ?? null,
          open_library_id: null,
          google_books_id: item.id as string,
        };
      }
    );

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
