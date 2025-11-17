import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Test, { type Question } from "@/components/Test";
import { createClient } from "@supabase/supabase-js";

// Server Component with guards and data loading
export default async function TestStartPage() {
  const cookieStore = await cookies();
  const participantId = cookieStore.get("participant_id")?.value;
  if (!participantId) {
    redirect("/");
  }

  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Check participant state
  const { data: participant, error: participantError } = await supabase
    .from("participants")
    .select("has_started, current_step, answers")
    .eq("id", participantId)
    .single();

  if (participantError || !participant) {
    redirect("/");
  }

  // Completed
  if (participant.current_step === 3) {
    redirect("/result");
  }

  // Fetch questions sorted by id
  const { data: questions, error: qErr } = await supabase
    .from("questions")
    .select(
      "id, type, question_audio_url, question_image_url, options, question_text"
    )
    .order("id", { ascending: true });

  if (qErr || !questions) {
    redirect("/");
  }

  // Compute initial index = first unanswered question in ordered list
  const answeredIds = new Set<number>(
    Array.isArray(participant.answers)
      ? (participant.answers as Array<{ question_id: number }>).map(
          (a) => a.question_id
        )
      : []
  );
  const ordered = questions as Question[];
  const totalQuestions = ordered.length;
  const answeredCount = answeredIds.size;

  // If all questions are answered, redirect to result (even if current_step not yet updated)
  if (answeredCount >= totalQuestions) {
    redirect("/result");
  }

  const firstUnansweredIdx = ordered.findIndex((q) => !answeredIds.has(q.id));

  // Safety check: if no unanswered question found but we're here, go to result
  if (firstUnansweredIdx === -1) {
    redirect("/result");
  }

  // Render client component with questions and initial index
  return <Test questions={ordered} initialIndex={firstUnansweredIdx} />;
}
