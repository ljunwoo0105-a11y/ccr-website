export type EmailDeliveryMode = "smtp" | "preview";

type EmailEnvironment = {
  readonly NODE_ENV?: string;
  readonly SMTP_HOST?: string;
  readonly SMTP_USER?: string;
  readonly SMTP_PASS?: string;
};

export function emailDeliveryMode(env: EmailEnvironment): EmailDeliveryMode {
  const values = [env.SMTP_HOST, env.SMTP_USER, env.SMTP_PASS];
  const complete = values.every((value) => Boolean(value?.trim()));
  if (complete) return "smtp";

  const partial = values.some((value) => Boolean(value?.trim()));
  if (partial) throw new Error("SMTP configuration is incomplete.");
  if (env.NODE_ENV === "production") {
    throw new Error("SMTP must be configured in production.");
  }
  return "preview";
}
