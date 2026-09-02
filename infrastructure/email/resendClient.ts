/**
 * Resend Transactional Email Dispatcher (Zero AWS SDK)
 * Directly calls Resend REST API via standard fetch.
 */
import sanitizeHtml from "sanitize-html";
import { logger } from "@/infrastructure/logger/logger";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || apiKey.includes("placeholder") || !apiKey.startsWith("re_")) {
    logger.info({ event: "email_mock_sent", to, subject });
    return { success: true, id: `mock-email-${Date.now()}` };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TASQ-ONE <notifications@tasq-one.com>",
        to: [to],
        subject,
        html,
        text: text || subject,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      logger.error({ event: "resend_api_error", to, subject, error: json.message });
      return { success: false, error: json.message || "Resend API error" };
    }

    return { success: true, id: json.id };
  } catch (err: any) {
    logger.error({ event: "email_dispatch_failed", to, subject, error: err.message });
    return { success: false, error: err.message || "Failed to dispatch email" };
  }
}

/**
 * Formats responsive HTML email template for notification events.
 */
function escapeHtml(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeMessage(msg: string): string {
  if (!msg) return "";
  // If plain text (no HTML tags), escape entities and convert newlines
  if (!/<[a-z][\s\S]*>/i.test(msg)) {
    return escapeHtml(msg).replace(/\n/g, "<br/>");
  }
  // If rich HTML: use sanitize-html with explicit allowlist.
  // SECURITY: Only these tags/attributes are allowed — everything else (script,
  // iframe, object, event handlers, javascript: URLs) is stripped by default.
  return sanitizeHtml(msg, {
    allowedTags: ["b", "i", "em", "strong", "u", "s", "p", "br", "ul", "ol", "li", "a", "span"],
    allowedAttributes: {
      a: ["href", "title"],
      span: ["style"],
    },
    allowedStyles: {
      span: {
        // Allow only safe CSS color property
        color: [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(\d+,\s*\d+,\s*\d+\)$/],
      },
    },
    // Force all links to use https — strips javascript: links automatically
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          href: /^https?:\/\//i.test(attribs.href || "") ? attribs.href : "#",
        },
      }),
    },
  });
}

export function buildNotificationEmailHtml({
  title,
  message,
  actionUrl,
  actionText = "View in TASQ-ONE",
}: {
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}) {
  const safeTitle = escapeHtml(title);
  const safeMessage = sanitizeMessage(message);
  const safeActionText = escapeHtml(actionText);
  const safeActionUrl = actionUrl && /^https?:\/\//i.test(actionUrl) ? actionUrl : null;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Inter', -apple-system, sans-serif; background-color: #F9FAFB; margin: 0; padding: 24px; color: #0F172A; }
    .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #E2E8F0; }
    .header { font-size: 20px; font-weight: 700; color: #4F46E5; margin-bottom: 16px; }
    .content { font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px; }
    .btn { display: inline-block; background-color: #4F46E5; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 13px; }
    .footer { font-size: 11px; color: #94A3B8; margin-top: 24px; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">TASQ-ONE</div>
    <h2 style="font-size: 16px; margin-top: 0;">${safeTitle}</h2>
    <div class="content">${safeMessage}</div>
    ${
      safeActionUrl
        ? `<a href="${safeActionUrl}" class="btn" style="color: #ffffff;">${safeActionText}</a>`
        : ""
    }
    <div class="footer">
      This is an automated notification based on your TASQ-ONE notification preferences.
    </div>
  </div>
</body>
</html>
  `.trim();
}
