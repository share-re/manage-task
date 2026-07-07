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
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const transport = getTransport();
  await transport.sendMail({
    from,
    to: opts.to.join(", "),
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}
