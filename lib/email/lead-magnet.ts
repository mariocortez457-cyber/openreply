import { createHash } from "crypto";

export interface LeadMagnetConfig {
  keyword: string;
  ebookUrl: string;
  from: string;
  subject: string;
  emailIntro: string;
  confirmationMessage: string;
  replyWindowHours: number;
  resendApiKey: string;
}

const EMAIL_PATTERN =
  /[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+/i;

function readReplyWindowHours(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return 168;
  return Math.min(720, Math.max(1, parsed));
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function extractEmailAddress(message: string): string | null {
  const match = message.match(EMAIL_PATTERN)?.[0]?.toLowerCase() ?? null;
  if (!match || match.length > 254) return null;

  const [localPart, domain, ...extra] = match.split("@");
  if (!localPart || !domain || extra.length > 0 || localPart.length > 64) {
    return null;
  }

  return match;
}

/**
 * The self-hosted funnel is intentionally configured at deployment level: one
 * ebook and keyword per OpenReply instance. Campaign copy remains editable in
 * the existing builder, while secrets and the destination URL stay out of the
 * client-side campaign payload.
 */
export function getLeadMagnetConfig(): LeadMagnetConfig | null {
  const keyword = process.env.LEAD_MAGNET_KEYWORD?.trim();
  const ebookUrl = process.env.LEAD_MAGNET_EBOOK_URL?.trim();
  const from =
    process.env.LEAD_MAGNET_EMAIL_FROM?.trim() || process.env.EMAIL_FROM?.trim();
  const resendApiKey = process.env.RESEND_API_KEY?.trim();

  if (!keyword || !ebookUrl || !from || !resendApiKey || !isHttpUrl(ebookUrl)) {
    return null;
  }

  return {
    keyword: keyword.toUpperCase(),
    ebookUrl,
    from,
    subject:
      process.env.LEAD_MAGNET_EMAIL_SUBJECT?.trim() || "Your Futures Ebook",
    emailIntro:
      process.env.LEAD_MAGNET_EMAIL_INTRO?.trim() ||
      "Thanks for requesting the Futures Ebook. Use the link below to access it.",
    confirmationMessage:
      process.env.LEAD_MAGNET_DM_CONFIRMATION?.trim() ||
      "Sent! Check your inbox (and spam or promotions) for your futures ebook.",
    replyWindowHours: readReplyWindowHours(
      process.env.LEAD_MAGNET_REPLY_WINDOW_HOURS
    ),
    resendApiKey,
  };
}

export async function sendLeadMagnetEmail(input: {
  config: LeadMagnetConfig;
  idempotencyScope: string;
  to: string;
}): Promise<void> {
  const { config, idempotencyScope, to } = input;
  const idempotencyKey = `openreply-lead-${createHash("sha256")
    .update(idempotencyScope)
    .digest("hex")}`;
  const escapedIntro = escapeHtml(config.emailIntro);
  const escapedUrl = escapeHtml(config.ebookUrl);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from: config.from,
      to: [to],
      subject: config.subject.replace(/[\r\n]+/g, " "),
      text: `${config.emailIntro}\n\nOpen the ebook: ${config.ebookUrl}`,
      html: `<p>${escapedIntro}</p><p><a href="${escapedUrl}">Open the Futures Ebook</a></p>`,
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(
      `Resend email failed (${response.status})${detail ? `: ${detail}` : ""}`
    );
  }
}
