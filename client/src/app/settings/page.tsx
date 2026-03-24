export default function SettingsPage() {
  return (
    <div className="animate-fade-in p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Configure your Twitter agent pipeline
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Engine Connection */}
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="mb-1 text-sm font-semibold text-zinc-200">
            Engine Connection
          </h2>
          <p className="mb-4 text-xs text-zinc-500">
            The Python FastAPI engine that powers tweet generation
          </p>
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <code className="text-sm text-zinc-400">
              {process.env.NEXT_PUBLIC_ENGINE_URL || "http://localhost:8000"}
            </code>
          </div>
        </section>

        {/* Cron Schedule */}
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="mb-1 text-sm font-semibold text-zinc-200">
            Auto-Post Schedule
          </h2>
          <p className="mb-4 text-xs text-zinc-500">
            Approved tweets are automatically posted at these times
          </p>
          <div className="grid grid-cols-3 gap-3">
            {["9:00 AM", "12:00 PM", "5:00 PM"].map((time) => (
              <div
                key={time}
                className="rounded-xl bg-white/[0.03] border border-white/[0.04] px-4 py-3 text-center"
              >
                <p className="text-sm font-medium text-zinc-300">{time}</p>
                <p className="mt-0.5 text-[10px] text-zinc-600">Daily</p>
              </div>
            ))}
          </div>
        </section>

        {/* Twitter Auth Status */}
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="mb-1 text-sm font-semibold text-zinc-200">
            Twitter API
          </h2>
          <p className="mb-4 text-xs text-zinc-500">
            OAuth credentials for posting to X
          </p>
          <div className="space-y-2">
            {[
              "TWITTER_API_KEY",
              "TWITTER_API_SECRET",
              "TWITTER_ACCESS_TOKEN",
              "TWITTER_ACCESS_SECRET",
            ].map((key) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg bg-white/[0.03] px-4 py-2.5"
              >
                <code className="text-xs text-zinc-500">{key}</code>
                <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                  Set in .env.local
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
