"use client";

import { useState, useEffect } from "react";
import { apiUrl } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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

const FORMATS = [
  "Novel",
  "Novella",
  "Short Story Collection",
  "Graphic Novel",
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 15 }, (_, i) => String(CURRENT_YEAR - i));

interface InitialValues {
  rating?: number | null;
  thoughts?: string | null;
  genre?: string | null;
  format?: string | null;
  tags?: string | null;
  finishedMonth?: string;
  finishedYear?: string;
}

interface FinishBookModalProps {
  book: { id: string; title: string; author: string } | null;
  open: boolean;
  onClose: () => void;
  onSaved: (bookId: string) => void;
  mode?: "finish" | "rate" | "edit";
  initialValues?: InitialValues;
}

export function FinishBookModal({
  book,
  open,
  onClose,
  onSaved,
  mode = "finish",
  initialValues,
}: FinishBookModalProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [thoughts, setThoughts] = useState("");
  const [genre, setGenre] = useState("");
  const [format, setFormat] = useState("");
  const [tags, setTags] = useState("");
  const [finishedMonth, setFinishedMonth] = useState(String(new Date().getMonth() + 1));
  const [finishedYear, setFinishedYear] = useState(String(CURRENT_YEAR));
  const [saving, setSaving] = useState(false);

  // Re-populate fields when modal opens (edit mode)
  useEffect(() => {
    if (open && initialValues) {
      setRating(initialValues.rating ?? null);
      setThoughts(initialValues.thoughts ?? "");
      setGenre(initialValues.genre ?? "");
      setFormat(initialValues.format ?? "");
      setTags(initialValues.tags ?? "");
      setFinishedMonth(initialValues.finishedMonth ?? String(new Date().getMonth() + 1));
      setFinishedYear(initialValues.finishedYear ?? String(CURRENT_YEAR));
    } else if (open && !initialValues) {
      setRating(null);
      setThoughts("");
      setGenre("");
      setFormat("");
      setTags("");
      setFinishedMonth(String(new Date().getMonth() + 1));
      setFinishedYear(String(CURRENT_YEAR));
    }
  }, [open, initialValues]);

  function handleClose() {
    setRating(null);
    setHoveredRating(null);
    setThoughts("");
    setGenre("");
    setFormat("");
    setTags("");
    onClose();
  }

  function buildFinishedAt() {
    const m = finishedMonth.padStart(2, "0");
    return `${finishedYear}-${m}-01`;
  }

  async function handleSave(skip = false) {
    if (!book) return;
    setSaving(true);

    try {
      if (mode === "rate" || mode === "edit") {
        // PATCH shelf book
        await fetch(apiUrl(`/api/shelf/${book.id}`), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating: skip ? null : rating,
            thoughts: skip ? null : thoughts || null,
            genre: genre || null,
            format: format || null,
            tags: tags || null,
            finished_at: buildFinishedAt(),
          }),
        });
      } else {
        // PUT to-read book (move to shelf)
        await fetch(apiUrl(`/api/to-read/${book.id}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating: skip ? null : rating,
            thoughts: skip ? null : thoughts || null,
            genre: genre || null,
            format: format || null,
            tags: tags || null,
            finished_at: buildFinishedAt(),
            skip,
          }),
        });
      }

      onSaved(book.id);
      handleClose();
    } finally {
      setSaving(false);
    }
  }

  const displayRating = hoveredRating ?? rating;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit review" : mode === "rate" ? "Rate this book" : "Finished reading?"}
          </DialogTitle>
          {book && (
            <p className="text-sm text-muted-foreground">
              {book.title} — {book.author}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-5">
          {/* Star Rating Row */}
          <div>
            <p className="text-sm font-medium mb-2">Rating</p>
            <div className="flex gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  className={`flex-1 py-3 rounded text-xl transition-colors select-none touch-manipulation
                    ${(displayRating ?? 0) >= n ? "text-amber-400" : "text-muted-foreground/30"}
                    hover:text-amber-400 active:scale-90`}
                  onMouseEnter={() => setHoveredRating(n)}
                  onMouseLeave={() => setHoveredRating(null)}
                  onTouchStart={() => setRating(n)}
                  onClick={() => setRating(n)}
                  aria-label={`Rate ${n}`}
                >
                  ★
                </button>
              ))}
            </div>
            {rating && (
              <p className="text-center text-sm text-muted-foreground mt-1">
                {rating}/10
              </p>
            )}
          </div>

          {/* Thoughts */}
          <div>
            <label className="text-sm font-medium block mb-1">
              Thoughts{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
              maxLength={500}
              placeholder="A few thoughts..."
              value={thoughts}
              onChange={(e) => setThoughts(e.target.value)}
            />
            <p className="text-xs text-muted-foreground text-right">
              {thoughts.length}/500
            </p>
          </div>

          {/* Genre */}
          <div>
            <label className="text-sm font-medium block mb-1">Genre</label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger>
                <SelectValue placeholder="Select genre..." />
              </SelectTrigger>
              <SelectContent>
                {GENRES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Format */}
          <div>
            <label className="text-sm font-medium block mb-1">Format</label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Select format..." />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium block mb-1">
              Tags{" "}
              <span className="text-muted-foreground font-normal">
                (comma-separated)
              </span>
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. melancholy, russian, classic"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          {/* Date Finished */}
          <div>
            <label className="text-sm font-medium block mb-1">Date finished</label>
            <div className="flex gap-2">
              <Select value={finishedMonth} onValueChange={setFinishedMonth}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((name, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={finishedYear} onValueChange={setFinishedYear}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-1">
            <Button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="w-full h-12 text-base"
            >
              {saving ? "Saving..." : mode === "edit" ? "Save changes" : "Save to Shelf"}
            </Button>
            {mode !== "edit" && (
              <button
                onClick={() => handleSave(true)}
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 py-1"
                disabled={saving}
              >
                Skip — add later
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
