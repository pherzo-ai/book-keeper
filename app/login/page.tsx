"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passphrase }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Wrong passphrase. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📚</div>
          <h1 className="text-2xl font-semibold">My Reading List</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Enter your passphrase to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Passphrase"
            autoFocus
            className="w-full h-12 px-4 rounded-xl border border-input bg-card text-base focus:outline-none focus:ring-2 focus:ring-ring"
            autoCapitalize="none"
            autoCorrect="off"
          />
          {error && (
            <p className="text-destructive text-sm text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !passphrase}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-base font-medium disabled:opacity-50 transition-opacity"
          >
            {loading ? "..." : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
