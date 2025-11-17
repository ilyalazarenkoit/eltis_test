import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  validateAndSanitizeName,
  validateAndSanitizeEmail,
  validateAndSanitizePhone,
} from "@/lib/validation";

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

    // Validate and sanitize name
    const nameValidation = validateAndSanitizeName(name);
    if (!nameValidation.isValid) {
      return NextResponse.json(
        { error: nameValidation.error || "Invalid name" },
        { status: 400 }
      );
    }

    // Validate and sanitize email
    const emailValidation = validateAndSanitizeEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.error || "Invalid email" },
        { status: 400 }
      );
    }

    // Validate and sanitize phone
    const phoneValidation = validateAndSanitizePhone(phone);
    if (!phoneValidation.isValid) {
      return NextResponse.json(
        { error: phoneValidation.error || "Invalid phone" },
        { status: 400 }
      );
    }

    const { data: participantData, error: participantError } = await supabase
      .from("participants")
      .insert([
        {
          name: nameValidation.sanitized,
          email: emailValidation.sanitized,
          phone: phoneValidation.sanitized,
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
        },
        { status: 500 }
      );
    }

    // Create response after all Supabase operations are successful
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
        secure: true,
        // 1 day in seconds
        maxAge: 60 * 60 * 24,
        path: "/",
      });
    } catch (e) {
      console.warn("Failed to set participant_id cookie", e);
    }

    // Send participant data to Google Sheets only after successful Supabase operations
    // This runs after response is prepared but doesn't block the response
    const googleUrl = process.env.GOOGLE_URL;
    const googleSecret = process.env.GOOGLE_SECRET;

    if (googleUrl && googleSecret && participantData) {
      // Execute asynchronously after response is ready
      Promise.resolve().then(() => {
        try {
          const googleData = {
            secret: googleSecret,
            id: participantData.id,
            name: participantData.name,
            email: participantData.email,
            phone: participantData.phone || "",
            score_percent: participantData.score_percent || 0,
            reading_score: participantData.reading_score || 0,
            listening_score: participantData.listening_score || 0,
            correct_answers: participantData.correct_answers || [],
            answers: participantData.answers || [],
            created_at: participantData.created_at || new Date().toISOString(),
            completed_at: participantData.completed_at || null,
          };

          fetch(googleUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(googleData),
          }).catch(() => {
            // Silently fail - don't block user registration
          });
        } catch {
          // Silently fail - don't block user registration
        }
      });
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
