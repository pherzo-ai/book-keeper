"use client";

import { useState, useEffect, useRef } from "react";

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

// Called directly from the browser — no Cloudflare Workers in the path
async function searchOpenLibrary(query: string): Promise<BookResult[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10&fields=key,title,author_name,cover_i`;
  const res = await fetch(url);
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

// Falls back to server route which holds the Google Books API key
async function searchGoogleBooksFallback(query: string): Promise<BookResult[]> {
  const res = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

export function BookSearch({ onClose, onAdded }: BookSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const olResults = await searchOpenLibrary(query);
        if (olResults.length > 0) {
          setResults(olResults);
          return;
        }
      } catch {
        // fall through
      }
      try {
        const gbResults = await searchGoogleBooksFallback(query);
        setResults(gbResults);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [query]);

  async function handleAdd(book: BookResult) {
    const key = book.open_library_id ?? book.google_books_id ?? book.title;
    setAdding(key);
    await fetch("/api/to-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(book),
    });
    setAdding(null);
    onAdded();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Search bar */}
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
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or author..."
          className="flex-1 h-10 bg-secondary rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {searching && (
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
        )}
      </div>

      {/* Results */}
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
