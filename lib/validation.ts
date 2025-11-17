// Validation and sanitization utilities

// Field length limits
export const FIELD_LIMITS = {
  name: { min: 2, max: 100 },
  email: { min: 5, max: 255 },
  phone: { min: 10, max: 50 },
} as const;

// Sanitize string - remove dangerous characters but keep valid ones
export function sanitizeString(input: string): string {
  if (typeof input !== "string") {
    return "";
  }
  // Remove null bytes and control characters except newlines and tabs
  return input
    .replace(/\0/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();
}

// Validate and sanitize name
export function validateAndSanitizeName(name: string): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} {
  if (!name || typeof name !== "string") {
    return { isValid: false, sanitized: "", error: "Name is required" };
  }

  const sanitized = sanitizeString(name);

  if (sanitized.length < FIELD_LIMITS.name.min) {
    return {
      isValid: false,
      sanitized,
      error: `Name must be at least ${FIELD_LIMITS.name.min} characters`,
    };
  }

  if (sanitized.length > FIELD_LIMITS.name.max) {
    return {
      isValid: false,
      sanitized,
      error: `Name must not exceed ${FIELD_LIMITS.name.max} characters`,
    };
  }

  // Allow letters, spaces, hyphens, apostrophes, and common international characters
  const nameRegex = /^[\p{L}\s\-'\.]+$/u;
  if (!nameRegex.test(sanitized)) {
    return {
      isValid: false,
      sanitized,
      error: "Name contains invalid characters",
    };
  }

  return { isValid: true, sanitized };
}

// Validate and sanitize email
export function validateAndSanitizeEmail(email: string): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} {
  if (!email || typeof email !== "string") {
    return { isValid: false, sanitized: "", error: "Email is required" };
  }

  const sanitized = sanitizeString(email.toLowerCase());

  if (sanitized.length < FIELD_LIMITS.email.min) {
    return {
      isValid: false,
      sanitized,
      error: `Email must be at least ${FIELD_LIMITS.email.min} characters`,
    };
  }

  if (sanitized.length > FIELD_LIMITS.email.max) {
    return {
      isValid: false,
      sanitized,
      error: `Email must not exceed ${FIELD_LIMITS.email.max} characters`,
    };
  }

  // RFC 5322 compliant email regex (simplified but secure)
  const emailRegex =
    /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

  if (!emailRegex.test(sanitized)) {
    return {
      isValid: false,
      sanitized,
      error: "Invalid email format",
    };
  }

  // Additional check: domain must have at least one dot
  const parts = sanitized.split("@");
  if (parts.length !== 2 || !parts[1].includes(".")) {
    return {
      isValid: false,
      sanitized,
      error: "Invalid email format",
    };
  }

  return { isValid: true, sanitized };
}

// Validate and sanitize phone
export function validateAndSanitizePhone(phone: string): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} {
  if (!phone || typeof phone !== "string") {
    return { isValid: false, sanitized: "", error: "Phone is required" };
  }

  const sanitized = sanitizeString(phone);

  // Remove all non-digit characters for length check
  const digitsOnly = sanitized.replace(/\D/g, "");

  if (digitsOnly.length < 10) {
    return {
      isValid: false,
      sanitized,
      error: "Phone number must contain at least 10 digits",
    };
  }

  if (digitsOnly.length > 15) {
    return {
      isValid: false,
      sanitized,
      error: "Phone number must not exceed 15 digits",
    };
  }

  if (sanitized.length > FIELD_LIMITS.phone.max) {
    return {
      isValid: false,
      sanitized,
      error: `Phone number must not exceed ${FIELD_LIMITS.phone.max} characters`,
    };
  }

  // Allow digits, spaces, hyphens, plus, parentheses
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  if (!phoneRegex.test(sanitized)) {
    return {
      isValid: false,
      sanitized,
      error: "Phone number contains invalid characters",
    };
  }

  return { isValid: true, sanitized };
}
