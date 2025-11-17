import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { isValidUUID } from "@/lib/validateUUID";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const participantId = cookieStore.get("participant_id")?.value;
    if (!participantId || !isValidUUID(participantId)) {
      return NextResponse.json(
        { error: "Invalid participant_id" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.has_started === "boolean") {
      updates.has_started = body.has_started;
    }
    if (typeof body.current_step === "number") {
      updates.current_step = body.current_step;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("participants")
      .update(updates)
      .eq("id", participantId)
      .select("id, has_started, current_step")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to update participant" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, participant: data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const participantId = cookieStore.get("participant_id")?.value;
    if (!participantId || !isValidUUID(participantId)) {
      return NextResponse.json({ participant: null }, { status: 200 });
    }

    const { data, error } = await supabase
      .from("participants")
      .select("id, has_started, current_step")
      .eq("id", participantId)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch participant" },
        { status: 500 }
      );
    }

    return NextResponse.json({ participant: data }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const res = NextResponse.json({ success: true });
    // Clear participant_id cookie
    res.cookies.set("participant_id", "", {
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      maxAge: 0,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
