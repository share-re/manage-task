import "server-only";
import nodemailer from "nodemailer";

// SMTP config from server-only env vars. Never expose these to the browser.
const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT ?? 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASSWORD;
const from = process.env.SMTP_FROM ?? user;

function getTransport() {
  if (!host || !user || !pass) {
    throw new Error("Missing SMTP env vars (SMTP_HOST / SMTP_USER / SMTP_PASSWORD).");
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
    auth: { user, pass },
  });
}

export async function sendMail(opts: {
  to: string[];
  bcc?: string[];
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const transport = getTransport();
  const bcc = opts.bcc ?? [];
  // If there are no visible "To" addresses (a Bcc-only send), address the mail
  // to the sender so it still has a valid To header.
  const toList = opts.to.length > 0 ? opts.to.join(", ") : from;
  await transport.sendMail({
    from,
    to: toList,
    bcc: bcc.length > 0 ? bcc.join(", ") : undefined,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}
