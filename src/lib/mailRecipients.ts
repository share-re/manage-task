/**
 * 共有先 (summary mail recipients).
 *
 * Types and the address-resolution rule. Deliberately imports nothing: the
 * send route reads the table with the service role and the admin screen goes
 * through /api/admin/mail-recipients, so this file stays a pure unit that can
 * be tested without a database.
 */

export type SendAs = "to" | "bcc";

export type MailRecipientRow = {
  id: string;
  // A member — their address comes from profiles, never stored here.
  user_id: string | null;
  // An address with no account behind it (a mailing list, an outside person).
  email: string | null;
  label: string | null;
  send_as: SendAs;
  enabled: boolean;
};

export type ResolvedRecipients = { to: string[]; bcc: string[] };

function normalize(address: string): string {
  return address.trim();
}

/**
 * Turn the master rows into the two address lists the mailer needs.
 *
 * Returns `fallback` when the master yields nothing — an empty table, or every
 * row disabled. That is what keeps the feature additive: until someone adds a
 * recipient, the hand-typed strings in email_settings still drive the send.
 *
 * A member whose profile has no address is skipped rather than sent an empty
 * string, which the mail server would reject for the whole batch.
 */
export function resolveSummaryRecipients(
  rows: MailRecipientRow[],
  emailByUserId: Map<string, string | null>,
  fallback: ResolvedRecipients,
): ResolvedRecipients {
  const to: string[] = [];
  const bcc: string[] = [];
  // Case-insensitive: the same person must not be mailed twice because one row
  // spelled their address differently.
  const seen = new Set<string>();

  for (const row of rows) {
    if (!row.enabled) continue;
    const raw = row.user_id
      ? (emailByUserId.get(row.user_id) ?? null)
      : row.email;
    if (!raw) continue;
    const address = normalize(raw);
    if (!address) continue;
    const key = address.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    (row.send_as === "to" ? to : bcc).push(address);
  }

  if (to.length === 0 && bcc.length === 0) return fallback;
  return { to, bcc };
}
