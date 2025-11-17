import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { isValidUUID } from "@/lib/validateUUID";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function POST(request: NextRequest) {
  try {
    type AnswerEntry = {
      question_id: number;
      answer: string;
      is_correct: boolean;
      type: "listening" | "reading";
      answered_at: string;
    };

    type ParticipantUpdates = {
      answers: AnswerEntry[];
      correct_answers: number[];
      reading_score: number;
      listening_score: number;
      score_percent: number;
      has_started: boolean;
      current_step: number;
      completed_at?: string;
    };

    const cookieStore = await cookies();
    const participantId = cookieStore.get("participant_id")?.value;
    if (!participantId || !isValidUUID(participantId)) {
      return NextResponse.json(
        { error: "Invalid participant_id" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const questionId: number = body?.questionId;
    const answer: string = body?.answer;

    if (!questionId || typeof answer !== "string") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Fetch question
    const { data: question, error: qErr } = await supabase
      .from("questions")
      .select("id, type, options, correct_option")
      .eq("id", questionId)
      .single();

    if (qErr || !question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Determine selected index (0-based) and compare directly to correct_option
    const selectedIndex = (question.options || []).indexOf(answer);
    const isCorrect =
      selectedIndex >= 0 && selectedIndex === question.correct_option;

    // Fetch participant to read current progress
    const { data: participant, error: pErr } = await supabase
      .from("participants")
      .select(
        "answers, correct_answers, reading_score, listening_score, has_started, current_step"
      )
      .eq("id", participantId)
      .single();

    if (pErr || !participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    const prevAnswers: AnswerEntry[] = Array.isArray(participant.answers)
      ? (participant.answers as AnswerEntry[])
      : [];
    const prevCorrect: number[] = Array.isArray(participant.correct_answers)
      ? (participant.correct_answers as number[])
      : [];

    // Prevent duplicate answer for the same question (idempotency)
    const alreadyAnswered = prevAnswers.some(
      (a) => a.question_id === questionId
    );
    if (alreadyAnswered) {
      return NextResponse.json(
        { success: true, message: "Already answered", isCorrect },
        { status: 200 }
      );
    }

    const newAnswerEntry = {
      question_id: questionId,
      answer,
      is_correct: isCorrect,
      type: question.type,
      answered_at: new Date().toISOString(),
    };

    const nextAnswers = [...prevAnswers, newAnswerEntry];
    const nextCorrect = isCorrect ? [...prevCorrect, questionId] : prevCorrect;

    const incReading = isCorrect && question.type === "reading" ? 1 : 0;
    const incListening = isCorrect && question.type === "listening" ? 1 : 0;
    const nextReading = (participant.reading_score || 0) + incReading;
    const nextListening = (participant.listening_score || 0) + incListening;

    // Count total questions for percentage
    const { count: totalCount } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true });

    const correctCount = nextCorrect.length;
    const scorePercent =
      typeof totalCount === "number" && totalCount > 0
        ? Math.round((correctCount / totalCount) * 100)
        : 0;

    // Determine step
    let nextHasStarted = participant.has_started || true;
    let nextStep = participant.current_step || 0;
    if (!participant.has_started) {
      nextHasStarted = true;
      nextStep = question.type === "listening" ? 1 : 2;
    } else if (question.type === "reading") {
      nextStep = Math.max(nextStep, 2);
    }

    // If answered last question → mark completed
    const completed =
      typeof totalCount === "number" && nextAnswers.length >= totalCount;

    const updates: ParticipantUpdates = {
      answers: nextAnswers,
      correct_answers: nextCorrect,
      reading_score: nextReading,
      listening_score: nextListening,
      score_percent: scorePercent,
      has_started: nextHasStarted,
      current_step: completed ? 3 : nextStep,
    };

    if (completed) {
      updates.completed_at = new Date().toISOString();
    }

    const { error: uErr } = await supabase
      .from("participants")
      .update(updates)
      .eq("id", participantId);

    if (uErr) {
      console.error("Supabase update error:", uErr);
      return NextResponse.json(
        { error: "Failed to update participant" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      isCorrect,
      current_step: updates.current_step,
      has_started: updates.has_started,
      score_percent: updates.score_percent,
      reading_score: updates.reading_score,
      listening_score: updates.listening_score,
      answers_count: nextAnswers.length,
      completed,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
