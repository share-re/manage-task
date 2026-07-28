"use client";

import { useState, useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import {
  describePasskeyError,
  isPasskeySupported,
  passkeyRegisteredKey,
} from "@/lib/passkey";

// WebAuthn support can't change while the page is open, so there is nothing to
// subscribe to. The server has no WebAuthn API, so it renders "unsupported".
const subscribeNever = () => () => {};
const getFalse = () => false;

// localStorage is an external store: read it through useSyncExternalStore so the
// value is picked up without an effect and stays SSR-safe. "storage" only fires
// in *other* tabs, so registering in this tab dispatches its own event.
const PASSKEY_CHANGED = "passkey-registered-changed";

function subscribePasskeyStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(PASSKEY_CHANGED, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(PASSKEY_CHANGED, onChange);
  };
}

/** Lets the logged-in user create a passkey for their account. */
export default function PasskeyRegisterButton() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  // Feature detection + "already registered on this device" hint. Both read
  // browser-only APIs, so they go through useSyncExternalStore (no effect, no
  // hydration mismatch, and the flag re-reads when the user changes).
  const supported = useSyncExternalStore(
    subscribeNever,
    isPasskeySupported,
    getFalse,
  );
  const registered = useSyncExternalStore(
    subscribePasskeyStorage,
    () =>
      !!userId &&
      localStorage.getItem(passkeyRegisteredKey(userId)) === "1",
    getFalse,
  );

  async function onRegister() {
    setLoading(true);
    setMessage(undefined);
    setError(undefined);
    try {
      const { error } = await supabase.auth.registerPasskey();
      if (error) throw error;
      if (userId) {
        localStorage.setItem(passkeyRegisteredKey(userId), "1");
        // Same-tab writes don't fire "storage", so nudge the store ourselves.
        window.dispatchEvent(new Event(PASSKEY_CHANGED));
      }
      setMessage("パスキーを登録しました。次回からパスキーでログインできます。");
    } catch (err) {
      console.error(err);
      const { canceled, message } = describePasskeyError(err);
      // Stay silent if the user simply cancelled the OS dialog.
      if (!canceled) setError(message || "パスキーの登録に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  // Don't offer passkeys on browsers that can't do WebAuthn.
  if (!supported) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      {registered && (
        <p className="text-xs text-zinc-500">✓ このデバイスで登録済み</p>
      )}
      <button
        type="button"
        onClick={onRegister}
        disabled={loading}
        className="rounded-full border border-[#15803d] px-4 py-1.5 text-sm font-medium text-[#15803d] transition hover:bg-[#15803d] hover:text-white disabled:opacity-50"
      >
        {loading
          ? "登録中…"
          : registered
            ? "🔑 パスキーを再登録"
            : "🔑 パスキーを登録"}
      </button>
      {message && <p className="text-xs text-green-700">{message}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
