import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

const ENGINE_URL = process.env.ENGINE_URL || "http://localhost:8000";

interface CsvRow {
  tweetText: string;
  impressions: number;
  likes: number;
  retweets: number;
  replies: number;
}

export async function POST(req: NextRequest) {
  try {
    const { rows } = (await req.json()) as { rows: CsvRow[] };
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "No valid rows provided" },
        { status: 400 }
      );
    }

    const results: Array<{
      text: string;
      matched: boolean;
      score?: number;
    }> = [];

    const updatedTweets: Array<{
      text: string;
      metrics: CsvRow;
      score: number;
    }> = [];

    for (const row of rows) {
      // Match by tweet text (case-insensitive partial match)
      const searchTerm = row.tweetText.trim().substring(0, 100);
      const { data: tweets } = await supabase
        .from("tweets")
        .select("*")
        .eq("status", "Posted")
        .ilike("generated_text", `%${searchTerm}%`)
        .limit(1);

      const tweet = tweets?.[0];
      if (!tweet) {
        results.push({ text: row.tweetText.substring(0, 80), matched: false });
        continue;
      }

      // Calculate engagement score
      const { impressions, likes, retweets, replies } = row;
      const engagementScore =
        ((likes * 3 + retweets * 5 + replies * 4) /
          Math.max(impressions, 1)) *
        1000;

      // Update in Supabase
      await supabase
        .from("tweets")
        .update({
          impressions: row.impressions,
          likes: row.likes,
          retweets: row.retweets,
          replies: row.replies,
          engagement_score: engagementScore,
        })
        .eq("id", tweet.id);

      results.push({
        text: row.tweetText.substring(0, 80),
        matched: true,
        score: engagementScore,
      });

      updatedTweets.push({
        text: tweet.generated_text,
        metrics: row,
        score: engagementScore,
      });
    }

    // Auto-evaluate lowest-performing tweets
    const evaluationResults: Array<{ text: string; evaluation: unknown }> = [];
    if (updatedTweets.length > 0) {
      const sorted = [...updatedTweets].sort((a, b) => a.score - b.score);
      const lowestCount = Math.min(3, sorted.length);

      for (let i = 0; i < lowestCount; i++) {
        const t = sorted[i];
        if (!t) continue;
        try {
          const evalRes = await fetch(`${ENGINE_URL}/evaluate-performance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tweet_text: t.text,
              metrics: t.metrics,
              engagement_score: t.score,
            }),
          });

          if (evalRes.ok) {
            const evaluation = await evalRes.json();
            evaluationResults.push({ text: t.text.substring(0, 80), evaluation });
          }
        } catch (err) {
          console.error("Evaluation failed for tweet:", err);
        }
      }
    }

    await supabase.from("system_logs").insert({
      action: "CSV_METRICS_UPLOADED",
      details: {
        totalRows: rows.length,
        matched: results.filter((r) => r.matched).length,
        evaluated: evaluationResults.length,
      },
    });

    return NextResponse.json({
      results,
      evaluations: evaluationResults,
      summary: {
        total: rows.length,
        matched: results.filter((r) => r.matched).length,
        evaluated: evaluationResults.length,
      },
    });
  } catch (error) {
    console.error("upload-metrics error:", error);
    return NextResponse.json(
      { error: "Failed to process CSV data" },
      { status: 500 }
    );
  }
}
