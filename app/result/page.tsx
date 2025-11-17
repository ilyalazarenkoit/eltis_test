import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import ClearCookieButton from "@/components/ClearCookieButton";

export default async function ResultPage() {
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

  const { data: participant, error } = await supabase
    .from("participants")
    .select(
      "id, current_step, reading_score, listening_score, score_percent, name, email"
    )
    .eq("id", participantId)
    .single();

  if (error || !participant) {
    redirect("/");
  }

  // Guard: if test not completed, send user to the correct step
  const step = participant.current_step ?? 0;
  if (step !== 3) {
    if (step === 0) redirect("/");
    redirect("/test/start");
  }

  // Fetch totals by type
  const { count: totalListening } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("type", "listening");

  const { count: totalReading } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("type", "reading");

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="w-full border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center">
            <Image
              src="/logo.svg"
              alt="Eltis Logo"
              width={120}
              height={40}
              className="h-8 w-auto sm:h-10"
              priority
            />
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="w-full max-w-xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-black text-center mb-6">
            Your Test Results
          </h1>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-black mb-2">
                Thank you{participant.name ? `, ${participant.name}` : ""}!
              </h2>
              <p className="text-gray-700">
                Our manager will contact you soon
                {participant.email ? ` at ${participant.email}` : ""}.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-sm text-gray-500 mb-1">
                  Reading correct
                </div>
                <div className="text-2xl font-bold text-black">
                  {participant.reading_score}
                  {typeof totalReading === "number" ? ` / ${totalReading}` : ""}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-sm text-gray-500 mb-1">
                  Listening correct
                </div>
                <div className="text-2xl font-bold text-black">
                  {participant.listening_score}
                  {typeof totalListening === "number"
                    ? ` / ${totalListening}`
                    : ""}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-sm text-gray-500 mb-1">Score percent</div>
                <div className="text-2xl font-bold text-black">
                  {participant.score_percent}%
                </div>
              </div>
            </div>

            <div className="text-center text-gray-600 mt-2">
              If you have any questions, just reply to the email you used to
              register.
            </div>

            <div className="flex justify-center pt-4">
              <ClearCookieButton />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
