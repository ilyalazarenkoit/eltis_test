"use client";

import Image from "next/image";
import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import {
  validateAndSanitizeName,
  validateAndSanitizeEmail,
  validateAndSanitizePhone,
  FIELD_LIMITS,
} from "@/lib/validation";

export default function Home() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [rateLimitResetTime, setRateLimitResetTime] = useState<number | null>(
    null
  );
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Guard: if participant exists and has_started, redirect to test start (or result if completed)
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/participant", {
          method: "GET",
          cache: "no-store",
        });
        const json = await res.json();
        if (json?.participant) {
          const step = json.participant.current_step;
          if (step === 3) {
            router.push("/result");
            return;
          }
          if (json.participant.has_started || step > 0) {
            router.push("/test/start");
          }
        }
      } catch {
        // ignore
      }
    };
    checkStatus();
  }, [router]);

  // Timer for rate limit countdown
  useEffect(() => {
    if (!rateLimitResetTime) {
      setTimeRemaining(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(
        0,
        Math.ceil((rateLimitResetTime - now) / 1000)
      );
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        setRateLimitResetTime(null);
        setTimeRemaining(0);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [rateLimitResetTime]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    const newErrors: typeof errors = {};

    // Validate name
    const nameValidation = validateAndSanitizeName(formData.name);
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.error || "Invalid name";
    }

    // Validate email
    const emailValidation = validateAndSanitizeEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error || "Invalid email";
    }

    // Validate phone
    const phoneValidation = validateAndSanitizePhone(formData.phone);
    if (!phoneValidation.isValid) {
      newErrors.phone = phoneValidation.error || "Invalid phone number";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: validateAndSanitizeName(formData.name).sanitized,
          email: validateAndSanitizeEmail(formData.email).sanitized,
          phone: validateAndSanitizePhone(formData.phone).sanitized,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle rate limit error with timer
        if (response.status === 429 && data.rateLimit) {
          setRateLimitResetTime(data.rateLimit.resetTime);
          throw new Error(
            "We've received too many registration requests. Please wait a moment before trying again."
          );
        }
        throw new Error(data.error || "Failed to submit form");
      }

      // Clear rate limit timer on success
      setRateLimitResetTime(null);

      try {
        if (Array.isArray(data.questions)) {
          localStorage.setItem(
            "eltis_questions",
            JSON.stringify(data.questions)
          );
        } else {
          console.warn("Questions payload is not an array:", data.questions);
        }
      } catch (e) {
        console.warn("Unable to persist questions to localStorage", e);
      }

      // Send participant data to Google Sheets (fire and forget - don't block navigation)
      // This approach is more reliable than server-side fetch in Vercel serverless functions
      // The API endpoint will verify participant_id from cookie and add the secret server-side
      if (data.participant) {
        fetch("/api/google-sheets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: data.participant.id,
            name: data.participant.name,
            email: data.participant.email,
            phone: data.participant.phone || "",
            score_percent: data.participant.score_percent || 0,
            reading_score: data.participant.reading_score || 0,
            listening_score: data.participant.listening_score || 0,
            correct_answers: data.participant.correct_answers || [],
            answers: data.participant.answers || [],
            created_at: data.participant.created_at || new Date().toISOString(),
            completed_at: data.participant.completed_at || null,
          }),
        }).catch(() => {
          // Silently fail - don't block user navigation
        });
      }

      router.push("/test/start");
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "An error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-hidden">
          <div className="flex items-center justify-center overflow-hidden">
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

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-black mb-3">
              Welcome to Eltis Test
            </h1>
            <p className="text-gray-600 text-base sm:text-lg">
              Please fill in your information to begin the assessment
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 space-y-6"
          >
            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-black mb-2"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                maxLength={FIELD_LIMITS.name.max}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.name
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-brand-green focus:ring-brand-green"
                } focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all duration-200 text-text-dark placeholder-gray-400`}
                placeholder="Enter your full name"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {errors.name && (
                <p
                  id="name-error"
                  className="mt-1 text-sm text-red-600"
                  role="alert"
                >
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-black mb-2"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                maxLength={FIELD_LIMITS.email.max}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.email
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-brand-green focus:ring-brand-green"
                } focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all duration-200 text-text-dark placeholder-gray-400`}
                placeholder="your.email@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p
                  id="email-error"
                  className="mt-1 text-sm text-red-600"
                  role="alert"
                >
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-black mb-2"
              >
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                maxLength={FIELD_LIMITS.phone.max}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.phone
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-brand-green focus:ring-brand-green"
                } focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all duration-200 text-black placeholder-gray-400`}
                placeholder="+1 (555) 123-4567"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone-error" : undefined}
              />
              {errors.phone && (
                <p
                  id="phone-error"
                  className="mt-1 text-sm text-red-600"
                  role="alert"
                >
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Submit Error */}
            {submitError && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    <svg
                      className="w-5 h-5 text-amber-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    {submitError}
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || timeRemaining > 0}
              className="w-full cursor-pointer bg-brand-green text-white font-semibold py-3 px-6 rounded-lg hover:bg-brand-green-hover focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isSubmitting && <Spinner />}
              {timeRemaining > 0 ? (
                <span>
                  You can try again in:{" "}
                  <span className="font-mono">
                    {Math.floor(timeRemaining / 60)}:
                    {String(timeRemaining % 60).padStart(2, "0")}
                  </span>
                </span>
              ) : isSubmitting ? (
                "Submitting..."
              ) : (
                "Start Test"
              )}
            </button>
          </form>

          {/* Footer Note */}
          <p className="text-center text-sm text-gray-500 mt-6">
            All fields are required to proceed
          </p>
        </div>
      </main>
    </div>
  );
}
