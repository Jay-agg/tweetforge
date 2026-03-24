import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

// GET: List all tweets
export async function GET() {
  try {
    const { data: tweets, error } = await supabase
      .from("tweets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("tweets GET error:", error);
      return NextResponse.json(
        { error: "Failed to fetch tweets" },
        { status: 500 }
      );
    }

    return NextResponse.json({ tweets });
  } catch (error) {
    console.error("tweets GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update tweet status
export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json(
        { error: "id and status required" },
        { status: 400 }
      );
    }

    const { data: tweet, error } = await supabase
      .from("tweets")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("tweets PATCH error:", error);
      return NextResponse.json(
        { error: "Tweet not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ tweet });
  } catch (error) {
    console.error("tweets PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a tweet
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const { error } = await supabase.from("tweets").delete().eq("id", id);

    if (error) {
      console.error("tweets DELETE error:", error);
      return NextResponse.json(
        { error: "Failed to delete" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("tweets DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
