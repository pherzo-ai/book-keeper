"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/api";
import { FinishBookModal } from "@/components/FinishBookModal";
import { BookDetailModal } from "@/components/BookDetailModal";

interface ShelfBook {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  rating: number | null;
  thoughts: string | null;
  genre: string | null;
  format: string | null;
  tags: string | null;
  is_rated: number;
  finished_at: string;
}

const GENRES = [
  "Literary Fiction",
  "Sci-Fi",
  "Fantasy",
  "Mystery",
  "Non-Fiction",
  "Horror",
  "Romance",
  "Other",
];

const FORMATS = ["Novel", "Novella", "Short Story Collection", "Graphic Novel"];

export default function ShelfPage() {
  const [books, setBooks] = useState<ShelfBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [genre, setGenre] = useState("");
  const [format, setFormat] = useState("");
  const [year, setYear] = useState("");
  const [unrated, setUnrated] = useState(false);
  const [sort, setSort] = useState("finished_at");
  const [rateBook, setRateBook] = useState<ShelfBook | null>(null);
  const [detailBook, setDetailBook] = useState<ShelfBook | null>(null);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ sort });
    if (genre) params.set("genre", genre);
    if (format) params.set("format", format);
    if (year) params.set("year", year);
    if (unrated) params.set("unrated", "true");

    const res = await fetch(apiUrl(`/api/shelf?${params}`));
    const data = await res.json();
    setBooks(data.books ?? []);
    setLoading(false);
  }, [genre, format, year, unrated, sort]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Get all unique years from books for filter
  const years = Array.from(
    new Set(books.map((b) => new Date(b.finished_at).getFullYear().toString()))
  ).sort((a, b) => Number(b) - Number(a));

  function handleRated(bookId: string) {
    fetchBooks();
    setRateBook(null);
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground p-1 -ml-1"
              aria-label="Back"
            >
              ←
            </Link>
            <h1 className="text-lg font-semibold">My Shelf</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {books.length} {books.length === 1 ? "book" : "books"}
          </p>
        </div>

        {/* Sticky filter bar */}
        <div className="border-t border-border bg-background/95 backdrop-blur overflow-x-auto">
          <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-2 min-w-max">
            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-8 px-2 rounded-lg border border-input bg-background text-xs"
            >
              <option value="finished_at">Newest first</option>
              <option value="rating">By rating</option>
              <option value="title">By title</option>
            </select>

            <div className="w-px h-5 bg-border" />

            {/* Genre filter */}
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="h-8 px-2 rounded-lg border border-input bg-background text-xs"
            >
              <option value="">All genres</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            {/* Format filter */}
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="h-8 px-2 rounded-lg border border-input bg-background text-xs"
            >
              <option value="">All formats</option>
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>

            {/* Year filter */}
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="h-8 px-2 rounded-lg border border-input bg-background text-xs"
            >
              <option value="">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            {/* Unrated toggle */}
            <button
              onClick={() => setUnrated((v) => !v)}
              className={`h-8 px-3 rounded-lg border text-xs transition-colors ${
                unrated
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-input bg-background text-muted-foreground"
              }`}
            >
              Unrated
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">📚</div>
            <p className="font-medium">No books here yet</p>
            <p className="text-sm mt-1">
              {genre || format || year || unrated
                ? "Try clearing some filters"
                : "Finish a book to add it to your shelf"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {books.map((book) => (
              <button
                key={book.id}
                onClick={() => setDetailBook(book)}
                className="text-left group"
              >
                {/* Cover */}
                <div
                  className="relative w-full rounded-xl overflow-hidden bg-muted mb-2 shadow-sm group-hover:shadow-md transition-shadow"
                  style={{ aspectRatio: "2/3" }}
                >
                  {book.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl bg-secondary">
                      📗
                    </div>
                  )}

                  {/* Rating badge */}
                  {book.is_rated && book.rating ? (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-semibold rounded-full px-2 py-0.5">
                      {book.rating}/10
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRateBook(book);
                      }}
                      className="absolute bottom-2 right-2 bg-amber-500 text-white text-xs font-semibold rounded-full px-2 py-0.5 hover:bg-amber-600 transition-colors"
                    >
                      Unrated
                    </button>
                  )}
                </div>

                {/* Title + author */}
                <p className="text-xs font-medium leading-snug line-clamp-2">
                  {book.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {book.author}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Rate modal (from unrated badge) */}
      <FinishBookModal
        book={rateBook}
        open={!!rateBook}
        onClose={() => setRateBook(null)}
        onSaved={handleRated}
        mode="rate"
      />

      {/* Detail modal */}
      {detailBook && (
        <BookDetailModal
          book={detailBook}
          onClose={() => setDetailBook(null)}
          onRate={(book) => {
            setDetailBook(null);
            setRateBook(book);
          }}
        />
      )}
    </div>
  );
}
