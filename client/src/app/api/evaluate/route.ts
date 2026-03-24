import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getProjectContext } from "@/lib/context";

const ENGINE_URL = process.env.ENGINE_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Tweet id required" }, { status: 400 });
    }

    const { data: tweet, error } = await supabase
      .from("tweets")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !tweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    // Call the Python engine's evaluate endpoint
    const context = getProjectContext();
    const engineRes = await fetch(`${ENGINE_URL}/evaluate-performance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tweet_text: tweet.generated_text,
        metrics: {
          impressions: tweet.impressions,
          likes: tweet.likes,
          retweets: tweet.retweets,
          replies: tweet.replies,
        },
        engagement_score: tweet.engagement_score ?? 0,
        context,
      }),
    });

    if (!engineRes.ok) {
      const errBody = await engineRes.text();
      return NextResponse.json(
        { error: `Engine evaluate error: ${errBody}` },
        { status: 502 }
      );
    }

    const evaluation = await engineRes.json();

    await supabase.from("system_logs").insert({
      action: "TWEET_EVALUATED",
      details: {
        tweetId: tweet.id,
        engagementScore: tweet.engagement_score,
        evaluation,
      },
    });

    return NextResponse.json({ evaluation });
  } catch (error) {
    console.error("evaluate error:", error);
    return NextResponse.json(
      { error: "Evaluation failed" },
      { status: 500 }
    );
  }
}
