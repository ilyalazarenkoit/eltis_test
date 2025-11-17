import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIdentifier } from "./lib/rateLimit";

// Rate limit configuration
const RATE_LIMITS = {
  "/api/user": {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 5, // 5 registrations per 5 minutes
  },
  "/api/answer": {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 answers per minute
  },
  "/api/participant": {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
} as const;

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if this path needs rate limiting
  const rateLimitConfig = Object.entries(RATE_LIMITS).find(([path]) =>
    pathname.startsWith(path)
  );

  if (rateLimitConfig) {
    const [, config] = rateLimitConfig;
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;
    const identifier = getClientIdentifier(
      ip,
      request.headers.get("user-agent")
    );

    const result = rateLimit(identifier, config);

    if (!result.success) {
      const retryAfterSeconds = Math.ceil(
        (result.resetTime - Date.now()) / 1000
      );
      const resetDate = new Date(result.resetTime);

      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          rateLimit: {
            retryAfter: retryAfterSeconds,
            resetTime: result.resetTime,
            resetDate: resetDate.toISOString(),
            limit: config.maxRequests,
            remaining: result.remaining,
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSeconds),
            "X-RateLimit-Limit": String(config.maxRequests),
            "X-RateLimit-Remaining": String(result.remaining),
            "X-RateLimit-Reset": String(result.resetTime),
          },
        }
      );
    }

    // Add rate limit headers to successful responses
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", String(config.maxRequests));
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    response.headers.set("X-RateLimit-Reset", String(result.resetTime));
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
