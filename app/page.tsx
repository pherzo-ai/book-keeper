"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { FinishBookModal } from "@/components/FinishBookModal";
import { BookSearch } from "@/components/BookSearch";
import { apiUrl } from "@/lib/api";

interface Book {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  added_at: string;
}

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [finishBook, setFinishBook] = useState<Book | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const fetchBooks = useCallback(async () => {
    const res = await fetch(apiUrl("/api/to-read"));
    const data = await res.json();
    setBooks(data.books ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  async function handleRemove(id: string) {
    await fetch(apiUrl(`/api/to-read/${id}`), { method: "DELETE" });
    setBooks((prev) => prev.filter((b) => b.id !== id));
  }

  function handleFinished(bookId: string) {
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Reading List</h1>
          <Link
            href="/shelf"
            className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            Shelf
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Add book button */}
        <button
          onClick={() => setShowSearch(true)}
          className="w-full h-12 rounded-xl border-2 border-dashed border-border text-muted-foreground text-sm hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 mb-6"
        >
          <span className="text-lg">+</span> Add a book
        </button>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">📖</div>
            <p className="font-medium">Your reading list is empty</p>
            <p className="text-sm mt-1">Search for a book to get started</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {books.map((book) => (
              <li
                key={book.id}
                className="bg-card rounded-xl border border-border p-3 flex gap-3 items-start"
              >
                {/* Cover */}
                <div className="flex-shrink-0 w-12 rounded-md overflow-hidden bg-muted" style={{ height: "72px" }}>
                  {book.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      📗
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm leading-snug line-clamp-2">
                    {book.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {book.author}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setFinishBook(book)}
                    className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium min-w-[72px]"
                  >
                    Finished
                  </button>
                  <button
                    onClick={() => handleRemove(book.id)}
                    className="h-9 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:text-destructive hover:border-destructive transition-colors min-w-[72px]"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Search overlay */}
      {showSearch && (
        <BookSearch
          onClose={() => setShowSearch(false)}
          onAdded={() => {
            fetchBooks();
            setShowSearch(false);
          }}
        />
      )}

      {/* Finish modal */}
      <FinishBookModal
        book={finishBook}
        open={!!finishBook}
        onClose={() => setFinishBook(null)}
        onSaved={handleFinished}
        mode="finish"
      />
    </div>
  );
}
