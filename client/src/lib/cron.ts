import cron from "node-cron";

let initialized = false;

export function initCronJobs() {
  if (initialized) return;
  initialized = true;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  // Auto-post at 9:00 AM, 12:00 PM, 5:00 PM daily
  cron.schedule("0 9 * * *", () => triggerCron(`${baseUrl}/api/cron/auto-post`));
  cron.schedule("0 12 * * *", () => triggerCron(`${baseUrl}/api/cron/auto-post`));
  cron.schedule("0 17 * * *", () => triggerCron(`${baseUrl}/api/cron/auto-post`));

  // Gather metrics daily at midnight via Apify
  cron.schedule("0 0 * * *", () => triggerCron(`${baseUrl}/api/cron/gather-metrics`));

  console.log("[CRON] Scheduled: auto-post (9AM, 12PM, 5PM), metrics via Apify (midnight)");
}

async function triggerCron(url: string) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(`[CRON] ${url}:`, data);
  } catch (err) {
    console.error(`[CRON] Failed: ${url}`, err);
  }
}
