"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getPartForQuestion } from "@/constants/testParts";

export type Question = {
  id: number;
  type: "listening" | "reading";
  question_audio_url: string | null;
  question_image_url: string | null;
  options: string[];
  question_text: string | null;
};

type Props = {
  questions: Question[];
  initialIndex?: number;
  onComplete?: (answers: Record<number, string>) => void;
};

export default function Test({
  questions,
  initialIndex = 0,
  onComplete,
}: Props) {
  const router = useRouter();
  const total = questions.length;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const current = questions[currentIndex];
  const progress = ((currentIndex + 1) / total) * 100;

  // Calculate progress by type
  const {
    listeningCount,
    readingCount,
    currentListeningNumber,
    currentReadingNumber,
  } = useMemo(() => {
    let lCount = 0;
    let rCount = 0;
    let currentLNum = 0;
    let currentRNum = 0;

    questions.forEach((q, idx) => {
      if (q.type === "listening") {
        lCount++;
        if (idx <= currentIndex) currentLNum++;
      } else {
        rCount++;
        if (idx <= currentIndex) currentRNum++;
      }
    });

    return {
      listeningCount: lCount,
      readingCount: rCount,
      currentListeningNumber: currentLNum,
      currentReadingNumber: currentRNum,
    };
  }, [questions, currentIndex]);

  // Get current part
  const currentPart = current
    ? getPartForQuestion(current.id, current.type)
    : null;

  // Check if this is the first question in the part (for shared audio)
  const isFirstQuestionInPart = currentPart
    ? currentPart.questionIds[0] === current?.id
    : false;

  // Determine if we should show audio for this question
  // For PART 4 and PART 5, show audio only on first question of the part
  const shouldShowAudio =
    current?.question_audio_url &&
    (isFirstQuestionInPart ||
      !currentPart ||
      currentPart.questionIds.length === 1);

  //   const patchProgress = async (payload: {
  //     has_started?: boolean;
  //     current_step?: number;
  //   }) => {
  //     try {
  //       await fetch("/api/participant", {
  //         method: "PATCH",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify(payload),
  //       });
  //     } catch {
  //       // ignore
  //     }
  //   };

  const handleSubmitAnswer = async () => {
    if (!current || !selectedOption) return;

    // Send answer to server to validate and update participant progress
    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: current.id,
          answer: selectedOption,
        }),
      });
      const json = await res.json();
      // Update local state regardless of correctness
      const updated = { ...answers, [current.id]: selectedOption };
      setAnswers(updated);
      setSelectedOption(null);

      // Check if test is completed (from server response or last question)
      const isCompleted = json.completed || currentIndex === total - 1;
      if (isCompleted) {
        if (onComplete) onComplete(updated);
        // Redirect to results page
        router.push("/result");
        return;
      }

      setCurrentIndex((idx) => idx + 1);
    } catch {
      // If API fails, do not advance to keep consistency
    }
  };

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
      <div className="w-full bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                backgroundColor: "var(--e-global-color-6d7f425)",
              }}
            />
          </div>
          <div className="mt-2 text-center text-sm text-gray-600">
            Question {currentIndex + 1} of {total}
          </div>
        </div>
      </div>
      {/* Part info and progress */}
      {currentPart && (
        <div className="w-full bg-gray-50 border-b border-gray-200 py-4">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div>
              <h3 className="text-lg font-semibold text-text-dark mb-2 text-center">
                {currentPart.title}
              </h3>
              <p className="text-base text-gray-700">
                <span className="font-semibold">Description:</span>{" "}
                {currentPart.description}
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-dark mb-6">
              {current?.type === "listening"
                ? `Listening (${currentListeningNumber} / ${listeningCount})`
                : readingCount > 0
                ? `Reading (${currentReadingNumber} / ${readingCount})`
                : "Reading"}
            </h2>

            {current && (
              <div className="space-y-6">
                {/* Question stem */}
                <div className="space-y-4">
                  {current.type === "listening" && (
                    <div className="space-y-4">
                      {current.question_audio_url && (
                        <audio
                          controls
                          className="w-full"
                          src={current.question_audio_url}
                        />
                      )}
                      {current.question_image_url && (
                        <Image
                          width={100}
                          height={100}
                          src={current.question_image_url}
                          alt="question"
                          className="w-full rounded-lg border border-gray-200"
                        />
                      )}
                    </div>
                  )}

                  {current.type === "reading" && (
                    <div className="space-y-4">
                      {currentPart?.passageText && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6">
                          <p className="text-gray-800 text-sm sm:text-base whitespace-pre-line leading-relaxed">
                            {currentPart.passageText}
                          </p>
                        </div>
                      )}
                      {current.question_text && (
                        <p className="text-gray-800 text-base sm:text-lg font-medium">
                          {current.question_text}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Options selection */}
                <div className="space-y-3">
                  {current.options.map((option, idx) => {
                    const isSelected = selectedOption === option;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedOption(option)}
                        className={[
                          "w-full text-left px-4 py-3 rounded-lg border-2 transition-all duration-200 font-medium cursor-pointer",
                          isSelected
                            ? "border-brand-green bg-green-light/30 text-text-dark"
                            : "border-gray-300 hover:border-brand-green hover:bg-green-light/20 text-text-dark",
                        ].join(" ")}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {/* Submit answer button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSubmitAnswer}
                    disabled={!selectedOption}
                    className={[
                      "w-auto px-5 py-3 rounded-lg font-semibold transition-colors cursor-pointer",
                      selectedOption
                        ? "bg-brand-green hover:bg-brand-green-hover text-white"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed",
                    ].join(" ")}
                  >
                    Submit answer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
