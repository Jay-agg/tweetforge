"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";

interface UploadResult {
  summary: {
    total: number;
    matched: number;
    evaluated: number;
  };
  results: Array<{ text: string; matched: boolean; score?: number }>;
  evaluations: Array<{ text: string; evaluation: unknown }>;
}

export default function CsvUpload() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setResult(null);
    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (parsed) => {
        try {
          // Map CSV columns → expected format
          // Expected columns: "Tweet text", "impressions", "likes", "retweets", "replies"
          const rows = (parsed.data as Record<string, string>[])
            .map((row) => {
              const tweetText =
                row["Tweet text"] || row["tweet_text"] || row["text"] || "";
              if (!tweetText.trim()) return null;

              return {
                tweetText: tweetText.trim(),
                impressions: parseInt(row["impressions"] || row["Impressions"] || "0", 10),
                likes: parseInt(row["likes"] || row["Likes"] || "0", 10),
                retweets: parseInt(row["retweets"] || row["Retweets"] || "0", 10),
                replies: parseInt(row["replies"] || row["Replies"] || "0", 10),
              };
            })
            .filter(Boolean);

          if (rows.length === 0) {
            setError(
              'No valid rows found. Make sure your CSV has a "Tweet text" column.'
            );
            setLoading(false);
            return;
          }

          const res = await fetch("/api/upload-metrics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows }),
          });

          if (!res.ok) {
            const body = await res.json();
            setError(body.error || "Upload failed");
          } else {
            const data = await res.json();
            setResult(data);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Parse error");
        } finally {
          setLoading(false);
        }
      },
      error: (err: Error) => {
        setError(`CSV parse error: ${err.message}`);
        setLoading(false);
      },
    });
  }

  function reset() {
    setResult(null);
    setError(null);
    setFileName(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="mb-1 text-sm font-semibold text-zinc-200">
        Import Metrics (CSV)
      </h2>
      <p className="mb-4 text-xs text-zinc-500">
        Upload a CSV with columns: <code className="text-zinc-400">Tweet text</code>,{" "}
        <code className="text-zinc-400">impressions</code>,{" "}
        <code className="text-zinc-400">likes</code>,{" "}
        <code className="text-zinc-400">retweets</code>,{" "}
        <code className="text-zinc-400">replies</code>
      </p>

      {/* Upload area */}
      {!result && (
        <label
          className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 px-6 py-8 ${
            loading
              ? "border-blue-500/30 bg-blue-500/5"
              : "border-white/[0.08] bg-white/[0.01] hover:border-white/[0.15] hover:bg-white/[0.03]"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            disabled={loading}
          />
          {loading ? (
            <>
              <svg
                className="mb-3 h-6 w-6 animate-spin text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <p className="text-sm text-blue-300">
                Processing {fileName}…
              </p>
            </>
          ) : (
            <>
              <svg
                className="mb-3 h-6 w-6 text-zinc-500 transition-colors group-hover:text-zinc-300"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                />
              </svg>
              <p className="text-sm text-zinc-400">
                Click to upload CSV file
              </p>
              <p className="mt-1 text-[10px] text-zinc-600">
                Twitter Analytics export or custom CSV
              </p>
            </>
          )}
        </label>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-4 space-y-4">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-3 text-center">
              <p className="text-lg font-bold text-white">
                {result.summary.total}
              </p>
              <p className="text-[10px] text-zinc-500">CSV Rows</p>
            </div>
            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3 text-center">
              <p className="text-lg font-bold text-emerald-400">
                {result.summary.matched}
              </p>
              <p className="text-[10px] text-zinc-500">Matched</p>
            </div>
            <div className="rounded-xl bg-violet-500/5 border border-violet-500/10 p-3 text-center">
              <p className="text-lg font-bold text-violet-400">
                {result.summary.evaluated}
              </p>
              <p className="text-[10px] text-zinc-500">Evaluated</p>
            </div>
          </div>

          {/* Matched tweets */}
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-400">
              Match Results
            </p>
            <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg bg-white/[0.01] p-2">
              {result.results.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs"
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      r.matched ? "bg-emerald-400" : "bg-zinc-600"
                    }`}
                  />
                  <span className="flex-1 truncate text-zinc-400">
                    {r.text}…
                  </span>
                  {r.matched && r.score !== undefined && (
                    <span className="font-mono text-zinc-500">
                      {r.score.toFixed(1)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Upload another */}
          <button
            onClick={reset}
            className="w-full rounded-lg bg-white/[0.05] py-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-zinc-200"
          >
            Upload Another CSV
          </button>
        </div>
      )}
    </div>
  );
}
