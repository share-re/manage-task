-- Mail recipient master (共有先マスタ).
-- Run this once in the Supabase SQL Editor. Safe to re-run.
--
-- Today the summary recipients live in email_settings as two comma-separated
-- strings, typed by hand. That is the same shape of problem the assignee field
-- had: a typo means the mail silently never arrives, and nobody can see who is
-- on the list without opening the settings screen.
--
-- Additive: the send route only uses this table when it holds at least one
-- enabled row, and otherwise keeps reading the strings. So creating the table
-- changes nothing until someone adds a recipient.

create table if not exists public.mail_recipients (
  id uuid primary key default gen_random_uuid(),
  -- A member (profiles.id). Their address comes from profiles, so it cannot
  -- drift out of date here. Null for an outside address.
  user_id uuid references public.profiles(id) on delete cascade,
  -- An address that belongs to no account — a mailing list, or someone who
  -- does not use the app. Null for a member.
  email text,
  -- Display name for an outside address. Members use their profile name.
  label text,
  -- To は宛先が互いに見える、Bcc は見えない。既定は Bcc。
  send_as text not null default 'bcc' check (send_as in ('to', 'bcc')),
  -- One flag, not two. The mock had 状態 and 定期サマリ separately, but the
  -- only thing this app sends is the summary, so "registered but not
  -- receiving" and "disabled" would mean exactly the same thing.
  enabled boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now(),
  -- Exactly one of the two: a row is either a member or an outside address.
  constraint mail_recipients_target check ((user_id is null) <> (email is null))
);

-- A member appears at most once.
create unique index if not exists mail_recipients_user_idx
  on public.mail_recipients (user_id) where user_id is not null;
-- Case-insensitive: MEMBER@example.com and member@example.com are one address.
create unique index if not exists mail_recipients_email_idx
  on public.mail_recipients (lower(email)) where email is not null;

alter table public.mail_recipients enable row level security;

-- NO policy at all — not even for reading.
--
-- The other masters (priority / status / type / template) are readable by any
-- logged-in user because the task list needs their labels. This table is
-- different: it holds outside people's email addresses, which nothing in the
-- app needs to render. Both readers are server-side and use the service role
-- (which bypasses RLS): /api/admin/mail-recipients for the settings screen,
-- and /api/send-summary when it builds the recipient list. So an empty policy
-- set means "admins only", enforced by the server rather than by hiding a
-- button. Drop the earlier permissive policy if this file was run before.
drop policy if exists "authenticated_read_mail_recipients" on public.mail_recipients;
