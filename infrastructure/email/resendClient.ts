/**
 * Resend Transactional Email Dispatcher (Zero AWS SDK)
 * Directly calls Resend REST API via standard fetch.
 */

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
    console.log(`[Resend Email Mock] Sent to: ${to} | Subject: "${subject}"`);
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
      return { success: false, error: json.message || "Resend API error" };
    }

    return { success: true, id: json.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to dispatch email" };
  }
}

/**
 * Formats responsive HTML email template for notification events.
 */
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
    <h2 style="font-size: 16px; margin-top: 0;">${title}</h2>
    <div class="content">${message}</div>
    ${
      actionUrl
        ? `<a href="${actionUrl}" class="btn" style="color: #ffffff;">${actionText}</a>`
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
