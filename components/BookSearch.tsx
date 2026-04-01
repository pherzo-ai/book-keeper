"use client";

import { useState, useEffect, useRef } from "react";
import { apiUrl } from "@/lib/api";

const GOOGLE_BOOKS_API_KEY = "AIzaSyDMfZJQMo8cEZPsoALKGD9hTlkuJE1CYRg";

interface BookResult {
  title: string;
  author: string;
  cover_url: string | null;
  open_library_id: string | null;
  google_books_id: string | null;
}

interface BookSearchProps {
  onClose: () => void;
  onAdded: () => void;
}

async function searchOpenLibrary(
  query: string,
  signal: AbortSignal
): Promise<BookResult[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&fields=key,title,author_name,cover_i`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error("OL failed");
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

async function searchGoogleBooks(
  query: string,
  signal: AbortSignal
): Promise<BookResult[]> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8&key=${GOOGLE_BOOKS_API_KEY}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error("GB failed");
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

export function BookSearch({ onClose, onAdded }: BookSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      // Fire both in parallel — show whichever returns first with results
      const [olResult, gbResult] = await Promise.allSettled([
        searchOpenLibrary(query, controller.signal),
        searchGoogleBooks(query, controller.signal),
      ]);

      if (controller.signal.aborted) return;

      const olResults =
        olResult.status === "fulfilled" ? olResult.value : [];
      const gbResults =
        gbResult.status === "fulfilled" ? gbResult.value : [];

      setResults(olResults.length > 0 ? olResults : gbResults);
      setSearching(false);
    }, 200);
  }, [query]);

  async function handleAdd(book: BookResult) {
    const key = book.open_library_id ?? book.google_books_id ?? book.title;
    setAdding(key);
    try {
      const res = await fetch(apiUrl("/api/to-read"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(book),
      });
      if (res.ok) {
        onAdded();
      } else {
        const text = await res.text().catch(() => "");
        const msg = (() => { try { return JSON.parse(text).error; } catch { return text; } })();
        alert(`Failed to add book (${res.status}): ${msg || "(no message)"}`);
      }
    } finally {
      setAdding(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-x-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button
          onClick={onClose}
          className="text-muted-foreground p-1 -ml-1"
          aria-label="Close search"
        >
          ←
        </button>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or author..."
          className="flex-1 h-10 bg-secondary rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {searching && (
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {!query.trim() && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Start typing to search
          </div>
        )}
        {query.trim() && !searching && results.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No results found
          </div>
        )}
        <ul className="divide-y divide-border">
          {results.map((book, i) => {
            const key =
              book.open_library_id ??
              book.google_books_id ??
              `${book.title}-${i}`;
            const isAdding = adding === key;
            return (
              <li key={key} className="flex items-center gap-3 px-4 py-3">
                <div
                  className="flex-shrink-0 w-10 rounded overflow-hidden bg-muted"
                  style={{ height: "60px" }}
                >
                  {book.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">
                      📗
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug line-clamp-2">
                    {book.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {book.author}
                  </p>
                </div>
                <button
                  onClick={() => handleAdd(book)}
                  disabled={isAdding}
                  className="flex-shrink-0 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50 transition-opacity"
                >
                  {isAdding ? "Adding..." : "Add"}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
