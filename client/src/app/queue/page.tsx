"use client";

import { useState, useEffect, useCallback } from "react";
import TopicInput from "@/components/TopicInput";
import TweetCard from "@/components/TweetCard";
import type { Tweet } from "@/types/database";

export default function QueuePage() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "Draft" | "Approved" | "Posted">("all");

  const fetchTweets = useCallback(async () => {
    try {
      const res = await fetch("/api/tweets");
      if (res.ok) {
        const data = await res.json();
        setTweets(data.tweets || []);
      }
    } catch (err) {
      console.error("Failed to fetch tweets:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTweets();
  }, [fetchTweets]);

  async function handleGenerate(topic: string) {
    const res = await fetch("/api/draft-tweet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    });
    if (res.ok) {
      await fetchTweets();
    } else {
      const err = await res.json();
      alert(err.error || "Generation failed");
    }
  }

  async function handleApprove(id: string) {
    const res = await fetch("/api/tweets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "Approved" }),
    });
    if (res.ok) await fetchTweets();
  }

  async function handlePost(id: string) {
    const res = await fetch("/api/post-tweet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      await fetchTweets();
    } else {
      const err = await res.json();
      alert(`Post failed: ${err.error}\n\nDetails: ${JSON.stringify(err.details || "None")}`);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch("/api/tweets", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) await fetchTweets();
  }

  async function handleImprove(id: string, suggestion: string) {
    const res = await fetch("/api/improve-tweet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, suggestion }),
    });
    if (res.ok) {
      await fetchTweets();
    } else {
      const err = await res.json();
      alert(err.error || "Improve failed");
    }
  }

  const filtered =
    filter === "all" ? tweets : tweets.filter((t) => t.status === filter);

  const filters = ["all", "Draft", "Approved", "Posted"] as const;

  const counts = {
    all: tweets.length,
    Draft: tweets.filter((t) => t.status === "Draft").length,
    Approved: tweets.filter((t) => t.status === "Approved").length,
    Posted: tweets.filter((t) => t.status === "Posted").length,
  };

  return (
    <div className="animate-fade-in p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Queue</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Generate → Review → Approve → Post
        </p>
      </div>

      {/* Topic Input */}
      <div className="mb-8">
        <TopicInput onGenerate={handleGenerate} />
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1 w-fit">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-all ${
              filter === f
                ? "bg-white/[0.08] text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {f === "all" ? "All" : f}
            <span className="ml-1.5 text-[10px] text-zinc-600">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Tweet List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="h-6 w-6 animate-spin text-zinc-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-full bg-white/[0.03] p-4">
            <svg className="h-8 w-8 text-zinc-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <p className="text-sm text-zinc-500">No tweets found</p>
          <p className="mt-1 text-xs text-zinc-600">
            Enter a topic above to generate your first tweet
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((tweet) => (
            <TweetCard
              key={tweet.id}
              id={tweet.id}
              topic={tweet.topic}
              text={tweet.generated_text}
              status={tweet.status}
              mediaRequired={tweet.media_instructions?.required || false}
              mediaDescription={tweet.media_instructions?.description}
              postedAt={tweet.posted_at ?? undefined}
              metrics={{
                impressions: tweet.impressions,
                likes: tweet.likes,
                retweets: tweet.retweets,
                replies: tweet.replies,
              }}
              engagementScore={tweet.engagement_score ?? undefined}
              onApprove={handleApprove}
              onPost={handlePost}
              onDelete={handleDelete}
              onImprove={handleImprove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
