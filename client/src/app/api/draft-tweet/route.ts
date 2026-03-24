import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getProjectContext } from "@/lib/context";

const ENGINE_URL = process.env.ENGINE_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();
    if (!topic || typeof topic !== "string") {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    const context = getProjectContext();

    // Call the Python engine
    const engineRes = await fetch(`${ENGINE_URL}/generate-tweet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, context }),
    });

    if (!engineRes.ok) {
      const errBody = await engineRes.text();
      return NextResponse.json(
        { error: `Engine error: ${errBody}` },
        { status: 502 }
      );
    }

    const generated = await engineRes.json();

    // Save to Supabase — includes the embedding vector from OpenAI
    const { data: tweet, error } = await supabase
      .from("tweets")
      .insert({
        topic,
        generated_text: generated.tweet_text,
        media_instructions: generated.media_instructions ?? null,
        embedding: generated.embedding ?? null,
        status: "Draft",
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to save tweet" },
        { status: 500 }
      );
    }

    // Log the action
    await supabase.from("system_logs").insert({
      action: "TWEET_GENERATED",
      details: { tweetId: tweet.id, topic },
    });

    return NextResponse.json({ tweet }, { status: 201 });
  } catch (error) {
    console.error("draft-tweet error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
