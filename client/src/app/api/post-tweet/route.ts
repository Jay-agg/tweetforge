import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { postTweetWithRetry } from "@/lib/twitter";

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Tweet id required" }, { status: 400 });
    }

    const { data: tweet, error: fetchError } = await supabase
      .from("tweets")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !tweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    if (tweet.status === "Posted") {
      return NextResponse.json(
        { error: "Tweet already posted" },
        { status: 400 }
      );
    }

    const result = await postTweetWithRetry(tweet.generated_text);

    const { data: updated, error: updateError } = await supabase
      .from("tweets")
      .update({
        status: "Posted",
        posted_at: new Date().toISOString(),
        tweet_id_x: result.data.id,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Supabase update error:", updateError);
    }

    // Log the action
    await supabase.from("system_logs").insert({
      action: "TWEET_POSTED",
      details: {
        tweetId: id,
        xTweetId: result.data.id,
        text: tweet.generated_text,
      },
    });

    return NextResponse.json({ tweet: updated });
  } catch (error: any) {
    console.error("post-tweet error:", error?.data || error);
    return NextResponse.json(
      { 
        error: "Failed to post tweet",
        details: error?.data || error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
