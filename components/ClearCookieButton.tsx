"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";

export default function ClearCookieButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/participant", { method: "DELETE" });
    } catch {
      // ignore
    } finally {
      startTransition(() => {
        router.push("/");
      });
    }
  };

  const isDisabled = isPending || isLoading;

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full sm:w-auto px-5 py-3 rounded-lg font-semibold transition-colors bg-brand-green hover:bg-brand-green-hover text-white cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={isDisabled}
    >
      {isLoading && <Spinner />}
      Got it
    </button>
  );
}
