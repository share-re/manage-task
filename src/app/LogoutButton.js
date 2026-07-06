// "use client" = ボタンのクリックを扱うので、ブラウザ側で動く部品にする宣言。
"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";

// ログアウトボタン。押すと「ログアウト処理 → ログイン画面へ移動」。
export default function LogoutButton({ className }) {
  const router = useRouter();

  async function handleLogout() {
    await signOut(); // 今は仮。あとで Supabase のログアウトになる。
    router.push("/login"); // ログアウト後はログイン画面へ
  }

  return (
    <button type="button" className={className} onClick={handleLogout}>
      ログアウト
    </button>
  );
}
