"use client";

import CsvUpload from "@/components/CsvUpload";

export default function DashboardPage() {
  return (
    <div className="animate-fade-in p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Overview of your tweet generation pipeline
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Drafts",
            value: "—",
            sub: "Awaiting review",
            color: "from-amber-500/20 to-amber-600/5",
          },
          {
            label: "Approved",
            value: "—",
            sub: "Ready to post",
            color: "from-blue-500/20 to-blue-600/5",
          },
          {
            label: "Posted",
            value: "—",
            sub: "On your timeline",
            color: "from-emerald-500/20 to-emerald-600/5",
          },
          {
            label: "Avg. Score",
            value: "—",
            sub: "Engagement rating",
            color: "from-violet-500/20 to-violet-600/5",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/[0.1]"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
            />
            <div className="relative">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                {stat.label}
              </p>
              <p className="mt-2 text-3xl font-bold text-white">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-zinc-600">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CSV Metrics Upload */}
      <div className="mb-8">
        <CsvUpload />
      </div>
    </div>
  );
}

