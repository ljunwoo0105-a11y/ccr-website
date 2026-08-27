export const AUTH_TOKEN_ISSUER = "ccr-website";
export const AUTH_TOKEN_AUDIENCE = "ccr-staff";

const KNOWN_PLACEHOLDERS = new Set([
  "change-me-to-a-long-random-string",
  "replace-with-a-random-secret",
]);

export function authSecretBytes(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (
    !secret ||
    secret.length < 32 ||
    KNOWN_PLACEHOLDERS.has(secret.trim().toLowerCase())
  ) {
    throw new Error(
      "AUTH_SECRET must be a unique random string of at least 32 characters."
    );
  }
  return new TextEncoder().encode(secret);
}
