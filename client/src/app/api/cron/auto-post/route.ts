import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { postTweetWithRetry } from "@/lib/twitter";
import type { Tweet } from "@/types/database";

export async function GET() {
  try {
    // Find the oldest Approved tweet for auto-posting
    const { data: tweets, error } = await supabase
      .from("tweets")
      .select("*")
      .eq("status", "Approved")
      .order("created_at", { ascending: true })
      .limit(1);

    const tweet = (tweets as Tweet[] | null)?.[0];
    if (error || !tweet) {
      return NextResponse.json({ message: "No tweets to post" });
    }

    const result = await postTweetWithRetry(tweet.generated_text);

    await supabase
      .from("tweets")
      .update({
        status: "Posted",
        posted_at: new Date().toISOString(),
        tweet_id_x: result.data.id,
      })
      .eq("id", tweet.id);

    await supabase.from("system_logs").insert({
      action: "AUTO_POST",
      details: {
        tweetId: tweet.id,
        xTweetId: result.data.id,
        text: tweet.generated_text,
      },
    });

    return NextResponse.json({
      message: "Tweet posted successfully",
      tweetId: result.data.id,
    });
  } catch (error) {
    console.error("auto-post error:", error);
    return NextResponse.json(
      { error: "Auto-post failed" },
      { status: 500 }
    );
  }
}
