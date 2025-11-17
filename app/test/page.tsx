"use client";

import { useState } from "react";
import Test, { type Question } from "@/components/Test";

export default function TestPage() {
  const [questions] = useState<Question[]>(() => {
    try {
      const raw = localStorage.getItem("eltis_questions");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn("Failed to read questions from localStorage", e);
      return [];
    }
  });

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center text-gray-700">
          <p>
            Вопросы не найдены. Пожалуйста, начните тест со стартовой страницы.
          </p>
        </div>
      </div>
    );
  }

  return <Test questions={questions} />;
}
