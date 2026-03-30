import { NextRequest, NextResponse } from "next/server";

export interface BookResult {
  title: string;
  author: string;
  cover_url: string | null;
  open_library_id: string | null;
  google_books_id: string | null;
}

async function searchOpenLibrary(query: string): Promise<BookResult[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10&fields=key,title,author_name,cover_i`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error("Open Library failed");

  const data = await res.json();
  if (!data.docs?.length) return [];

  return data.docs.map((doc: Record<string, unknown>) => ({
    title: doc.title as string,
    author: Array.isArray(doc.author_name)
      ? (doc.author_name[0] as string)
      : "Unknown Author",
    cover_url: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : null,
    open_library_id: doc.key as string | null,
    google_books_id: null,
  }));
}

async function searchGoogleBooks(query: string): Promise<BookResult[]> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&key=${apiKey}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error("Google Books failed");

  const data = await res.json();
  if (!data.items?.length) return [];

  return data.items.map((item: Record<string, unknown>) => {
    const info = item.volumeInfo as Record<string, unknown>;
    const imageLinks = info.imageLinks as Record<string, string> | undefined;
    return {
      title: info.title as string,
      author: Array.isArray(info.authors)
        ? (info.authors[0] as string)
        : "Unknown Author",
      cover_url: imageLinks?.thumbnail?.replace("http://", "https://") ?? null,
      open_library_id: null,
      google_books_id: item.id as string,
    };
  });
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query?.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchOpenLibrary(query);
    if (results.length > 0) {
      return NextResponse.json({ results });
    }
  } catch {
    // fall through to Google Books
  }

  try {
    const results = await searchGoogleBooks(query);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
