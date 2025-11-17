import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    "Supabase credentials are missing. Please check your .env file."
  );
}

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Name, email, and phone are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Создание участника
    const { data: participantData, error: participantError } = await supabase
      .from("participants")
      .insert([
        {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          answers: [],
          correct_answers: [],
          reading_score: 0,
          listening_score: 0,
        },
      ])
      .select()
      .single();

    if (participantError) {
      console.error("Supabase error:", participantError);
      return NextResponse.json(
        {
          error: "Failed to create participant",
          details: participantError.message,
        },
        { status: 500 }
      );
    }

    const { data: questionsData, error: questionsError } = await supabase
      .from("questions")
      .select(
        "id, type, question_audio_url, question_image_url, options, question_text"
      )
      .order("id", { ascending: true });

    if (questionsError) {
      console.error("Supabase error fetching questions:", questionsError);
      return NextResponse.json(
        {
          error: "Failed to fetch questions",
          details: questionsError.message,
        },
        { status: 500 }
      );
    }
    const res = NextResponse.json(
      {
        success: true,
        participant: participantData,
        questions: questionsData || [],
        message: "Participant created successfully",
      },
      { status: 201 }
    );
    // Set participant_id cookie for tracking
    try {
      res.cookies.set("participant_id", String(participantData.id), {
        httpOnly: true,
        sameSite: "strict",
        // 1 day in seconds
        maxAge: 60 * 60 * 24,
        path: "/",
      });
    } catch (e) {
      console.warn("Failed to set participant_id cookie", e);
    }
    return res;
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
