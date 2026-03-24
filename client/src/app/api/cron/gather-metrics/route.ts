import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getProjectContext } from "@/lib/context";
import { ApifyClient } from "apify-client";
import type { Tweet } from "@/types/database";

const ENGINE_URL = process.env.ENGINE_URL || "http://localhost:8000";
const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const EVAL_THRESHOLD = 15; // tweets below this score get evaluated

export async function GET() {
  try {
    if (!APIFY_TOKEN) {
      return NextResponse.json(
        { error: "APIFY_API_TOKEN not configured" },
        { status: 500 }
      );
    }

    // Find Posted tweets with posted_at between 24-48 hours ago
    const now = new Date();
    const h24ago = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const h48ago = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("tweets")
      .select("*")
      .eq("status", "Posted")
      .not("tweet_id_x", "is", null)
      .gte("posted_at", h48ago)
      .lte("posted_at", h24ago);

    const tweets = (data as Tweet[] | null) ?? [];
    if (error || tweets.length === 0) {
      return NextResponse.json({
        message: "No eligible tweets for metrics gathering",
        checked: 0,
      });
    }

    // Build tweet URLs for Apify
    const tweetUrls = tweets
      .filter((t) => t.tweet_id_x)
      .map((t) => `https://x.com/i/status/${t.tweet_id_x}`);

    if (tweetUrls.length === 0) {
      return NextResponse.json({
        message: "No tweets with X IDs found",
        checked: 0,
      });
    }

    // Call Apify Twitter scraper
    const apify = new ApifyClient({ token: APIFY_TOKEN });
    const run = await apify.actor("apify/twitter-scraper").call({
      tweetIDs: tweets
        .filter((t) => t.tweet_id_x)
        .map((t) => t.tweet_id_x),
      maxTweets: tweets.length,
      addUserInfo: false,
    });

    // Wait for and fetch results
    const { items } = await apify
      .dataset(run.defaultDatasetId)
      .listItems();

    // Map Apify results by tweet ID
    const metricsMap = new Map<
      string,
      { impressions: number; likes: number; retweets: number; replies: number }
    >();

    for (const item of items) {
      const record = item as Record<string, unknown>;
      const tweetId =
        (record.id as string) || (record.id_str as string) || "";
      if (!tweetId) continue;

      metricsMap.set(tweetId, {
        impressions: (record.views as number) ?? (record.viewCount as number) ?? 0,
        likes: (record.likeCount as number) ?? (record.likes as number) ?? 0,
        retweets:
          (record.retweetCount as number) ?? (record.retweets as number) ?? 0,
        replies:
          (record.replyCount as number) ?? (record.replies as number) ?? 0,
      });
    }

    // Update Supabase + identify low performers
    const context = getProjectContext();
    let updated = 0;
    let evaluated = 0;

    for (const tweet of tweets) {
      if (!tweet.tweet_id_x) continue;
      const metrics = metricsMap.get(tweet.tweet_id_x);
      if (!metrics) continue;

      // Calculate engagement score
      const { likes, retweets, replies, impressions } = metrics;
      const engagementScore =
        ((likes * 2 + retweets * 3 + replies * 4) /
          Math.max(impressions, 1)) *
        1000;

      // Update Supabase
      await supabase
        .from("tweets")
        .update({
          impressions: metrics.impressions,
          likes: metrics.likes,
          retweets: metrics.retweets,
          replies: metrics.replies,
          engagement_score: engagementScore,
        })
        .eq("id", tweet.id);

      updated++;

      // Trigger evaluation for low-scoring tweets
      if (engagementScore < EVAL_THRESHOLD) {
        try {
          await fetch(`${ENGINE_URL}/evaluate-performance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tweet_text: tweet.generated_text,
              metrics,
              engagement_score: engagementScore,
              context,
            }),
          });
          evaluated++;
        } catch (err) {
          console.error(`Evaluation failed for tweet ${tweet.id}:`, err);
        }
      }
    }

    // Log the action
    await supabase.from("system_logs").insert({
      action: "APIFY_METRICS_GATHERED",
      details: {
        eligible: tweets.length,
        scraped: metricsMap.size,
        updated,
        evaluated,
      },
    });

    return NextResponse.json({
      message: "Metrics gathered successfully",
      eligible: tweets.length,
      scraped: metricsMap.size,
      updated,
      evaluated,
    });
  } catch (error) {
    console.error("gather-metrics error:", error);
    return NextResponse.json(
      { error: "Metrics gathering failed" },
      { status: 500 }
    );
  }
}
