"use client";

import { useState } from "react";

interface TweetCardProps {
  id: string;
  topic: string;
  text: string;
  status: "Draft" | "Approved" | "Posted";
  mediaRequired: boolean;
  mediaDescription?: string;
  postedAt?: string;
  metrics?: {
    impressions: number;
    likes: number;
    retweets: number;
    replies: number;
  };
  engagementScore?: number;
  onApprove?: (id: string) => void;
  onPost?: (id: string) => void;
  onDelete?: (id: string) => void;
  onImprove?: (id: string, suggestion: string) => Promise<void>;
}

export default function TweetCard({
  id,
  topic,
  text,
  status,
  mediaRequired,
  mediaDescription,
  postedAt,
  metrics,
  engagementScore,
  onApprove,
  onPost,
  onDelete,
  onImprove,
}: TweetCardProps) {
  const [loading, setLoading] = useState(false);
  const [showImprove, setShowImprove] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [improving, setImproving] = useState(false);

  const statusColors = {
    Draft: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Approved: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Posted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };

  async function handleAction(action: "approve" | "post" | "delete") {
    setLoading(true);
    try {
      if (action === "approve" && onApprove) await onApprove(id);
      if (action === "post" && onPost) await onPost(id);
      if (action === "delete" && onDelete) await onDelete(id);
    } finally {
      setLoading(false);
    }
  }

  async function handleImprove() {
    if (!suggestion.trim() || !onImprove) return;
    setImproving(true);
    try {
      await onImprove(id, suggestion.trim());
      setSuggestion("");
      setShowImprove(false);
    } finally {
      setImproving(false);
    }
  }

  return (
    <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.04]">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[status]}`}
          >
            {status}
          </span>
          <span className="rounded-md bg-white/[0.05] px-2 py-0.5 text-xs text-zinc-500">
            {topic}
          </span>
        </div>
        {engagementScore !== undefined && engagementScore > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-500">Score</span>
            <span
              className={`font-mono font-semibold ${engagementScore > 50
                  ? "text-emerald-400"
                  : engagementScore > 20
                    ? "text-amber-400"
                    : "text-red-400"
                }`}
            >
              {engagementScore.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Tweet Text */}
      <p className="mb-4 text-sm leading-relaxed text-zinc-200">{text}</p>

      {/* Media indicator */}
      {mediaRequired && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-violet-500/10 bg-violet-500/5 px-3 py-2">
          <svg
            className="h-3.5 w-3.5 text-violet-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
            />
          </svg>
          <span className="text-xs text-violet-300">
            {mediaDescription || "Media required"}
          </span>
        </div>
      )}

      {/* Metrics (for posted tweets) */}
      {status === "Posted" && metrics && (
        <div className="mb-4 grid grid-cols-4 gap-3">
          {[
            { label: "Impressions", value: metrics.impressions },
            { label: "Likes", value: metrics.likes },
            { label: "Retweets", value: metrics.retweets },
            { label: "Replies", value: metrics.replies },
          ].map((m) => (
            <div key={m.label} className="text-center">
              <p className="text-sm font-semibold text-zinc-200">
                {m.value.toLocaleString()}
              </p>
              <p className="text-[10px] text-zinc-500">{m.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Posted timestamp */}
      {postedAt && (
        <p className="mb-3 text-xs text-zinc-600">
          Posted {new Date(postedAt).toLocaleString()}
        </p>
      )}

      {/* Improve panel */}
      {showImprove && status === "Draft" && (
        <div className="mb-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="mb-2 text-xs font-medium text-zinc-400">
            What should be improved?
          </p>
          <textarea
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            placeholder="e.g. Make it more conversational, add a stat about…"
            className="mb-2 w-full resize-none rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-white/[0.12]"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={handleImprove}
              disabled={improving || !suggestion.trim()}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:shadow-lg hover:shadow-violet-500/20 disabled:opacity-50"
            >
              {improving ? "Improving…" : "Regenerate"}
            </button>
            <button
              onClick={() => {
                setShowImprove(false);
                setSuggestion("");
              }}
              className="rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/[0.08]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {status === "Draft" && (
          <>
            <button
              onClick={() => handleAction("approve")}
              disabled={loading}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-1.5 text-xs font-medium text-white transition-all hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50"
            >
              {loading ? "…" : "Approve"}
            </button>
            <button
              onClick={() => setShowImprove(!showImprove)}
              className="rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-violet-400 transition-colors hover:bg-violet-500/10"
            >
              Improve
            </button>
            <button
              onClick={() => handleAction("delete")}
              disabled={loading}
              className="rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
            >
              Discard
            </button>
          </>
        )}
        {status === "Approved" && (
          <>
            <button
              onClick={() => handleAction("post")}
              disabled={loading}
              className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-1.5 text-xs font-medium text-white transition-all hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading ? "Posting…" : "Post Now"}
            </button>
            <span className="text-[10px] text-zinc-600">
              or wait for auto-post
            </span>
          </>
        )}
      </div>
    </div>
  );
}
