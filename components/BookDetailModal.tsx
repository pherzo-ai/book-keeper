"use client";

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

interface BookDetailModalProps {
  book: ShelfBook;
  onClose: () => void;
  onRate: (book: ShelfBook) => void;
}

export function BookDetailModal({ book, onClose, onRate }: BookDetailModalProps) {
  const finishedDate = new Date(book.finished_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const tags = book.tags
    ? book.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Sheet */}
      <div
        className="relative z-10 w-full sm:max-w-lg bg-background rounded-t-2xl sm:rounded-2xl px-4 pt-4 pb-10 sm:pb-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted sm:hidden" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground text-xl"
        >
          ✕
        </button>

        <div className="flex gap-4">
          {/* Cover */}
          <div
            className="flex-shrink-0 w-20 rounded-lg overflow-hidden bg-muted shadow-md"
            style={{ height: "120px" }}
          >
            {book.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={book.cover_url}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl bg-secondary">
                📗
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-base leading-snug">{book.title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{book.author}</p>

            {/* Rating */}
            {book.is_rated && book.rating ? (
              <div className="flex items-center gap-1 mt-2">
                <span className="text-amber-400 text-sm">
                  {"★".repeat(Math.round(book.rating / 2))}
                  {"☆".repeat(5 - Math.round(book.rating / 2))}
                </span>
                <span className="text-xs text-muted-foreground">{book.rating}/10</span>
              </div>
            ) : (
              <button
                onClick={() => onRate(book)}
                className="mt-2 text-xs text-amber-600 hover:text-amber-700 underline underline-offset-2"
              >
                Add rating
              </button>
            )}

            {/* Meta */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {book.genre && (
                <span className="text-xs bg-secondary text-secondary-foreground rounded-full px-2 py-0.5">
                  {book.genre}
                </span>
              )}
              {book.format && (
                <span className="text-xs bg-secondary text-secondary-foreground rounded-full px-2 py-0.5">
                  {book.format}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Thoughts */}
        {book.thoughts && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Thoughts
            </p>
            <p className="text-sm leading-relaxed">{book.thoughts}</p>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-muted rounded-full px-2.5 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Finished date */}
        <p className="text-xs text-muted-foreground mt-4">
          Finished {finishedDate}
        </p>
      </div>
    </div>
  );
}
