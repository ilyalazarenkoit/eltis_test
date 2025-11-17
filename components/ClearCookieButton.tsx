"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function ClearCookieButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = async () => {
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

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full sm:w-auto px-5 py-3 rounded-lg font-semibold transition-colors bg-brand-green hover:bg-brand-green-hover text-white cursor-pointer"
      disabled={isPending}
    >
      Got it
    </button>
  );
}
