import nodemailer, { type Transporter, type SentMessageInfo } from "nodemailer";

// Returns a transporter. If real SMTP creds are configured via env, uses them.
// Otherwise falls back to an Ethereal test account (messages are captured and
// viewable via a preview URL — nothing is delivered to real inboxes).
export async function getTransport(): Promise<{
  transporter: Transporter;
  from: string;
  isTest: boolean;
}> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return {
      transporter: nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user, pass },
      }),
      from: process.env.SMTP_FROM || user,
      isTest: false,
    };
  }

  const testAccount = await nodemailer.createTestAccount();
  return {
    transporter: nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    }),
    from: process.env.SMTP_FROM || "GenTech <no-reply@gentech.local>",
    isTest: true,
  };
}

export function getPreviewUrl(info: SentMessageInfo): string | null {
  const url = nodemailer.getTestMessageUrl(info);
  return url ? String(url) : null;
}
