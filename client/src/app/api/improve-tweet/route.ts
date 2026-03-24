import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getProjectContext } from "@/lib/context";

const ENGINE_URL = process.env.ENGINE_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const { id, suggestion } = await req.json();
    if (!id || !suggestion) {
      return NextResponse.json(
        { error: "Tweet id and suggestion are required" },
        { status: 400 }
      );
    }

    // Fetch the existing tweet
    const { data: tweet, error } = await supabase
      .from("tweets")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !tweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    const context = getProjectContext();

    // Call the Python engine's improve endpoint
    const engineRes = await fetch(`${ENGINE_URL}/improve-tweet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        original_text: tweet.generated_text,
        topic: tweet.topic,
        suggestion,
        context,
      }),
    });

    if (!engineRes.ok) {
      const errBody = await engineRes.text();
      return NextResponse.json(
        { error: `Engine error: ${errBody}` },
        { status: 502 }
      );
    }

    const improved = await engineRes.json();

    // Update the tweet with the improved text and new embedding
    const { data: updated, error: updateError } = await supabase
      .from("tweets")
      .update({
        generated_text: improved.tweet_text,
        media_instructions: improved.media_instructions ?? tweet.media_instructions,
        embedding: improved.embedding ?? tweet.embedding,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Supabase update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update tweet" },
        { status: 500 }
      );
    }

    // Log the action
    await supabase.from("system_logs").insert({
      action: "TWEET_IMPROVED",
      details: {
        tweetId: id,
        suggestion,
        originalText: tweet.generated_text,
        improvedText: improved.tweet_text,
      },
    });

    return NextResponse.json({ tweet: updated });
  } catch (error) {
    console.error("improve-tweet error:", error);
    return NextResponse.json(
      { error: "Failed to improve tweet" },
      { status: 500 }
    );
  }
}
