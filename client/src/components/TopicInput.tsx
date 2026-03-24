"use client";

import { useState } from "react";

interface TopicInputProps {
  onGenerate: (topic: string) => Promise<void>;
}

export default function TopicInput({ onGenerate }: TopicInputProps) {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || loading) return;

    setLoading(true);
    try {
      await onGenerate(topic.trim());
      setTopic("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2 transition-all duration-300 focus-within:border-blue-500/30 focus-within:bg-white/[0.04] focus-within:shadow-lg focus-within:shadow-blue-500/[0.03]">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a topic… e.g. React Server Components"
          className="flex-1 bg-transparent px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!topic.trim() || loading}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-40 disabled:hover:shadow-none"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating…
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
              </svg>
              Generate
            </>
          )}
        </button>
      </div>
    </form>
  );
}
