import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // API ルートを直接 import してテストするため、Next と同じ "@/" を解決する。
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // 本物は Client Component から読まれると投げる。テストでは素通りさせる。
      "server-only": fileURLToPath(
        new URL("./tests/stubs/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Dummy Supabase env so importing src/lib modules (which construct the
    // client at load time) doesn't throw. The pure functions under test make
    // no network calls, so these values are never actually used.
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    },
    coverage: {
      provider: "v8",
      include: [
        "src/lib/tasks.ts",
        "src/lib/roles.ts",
        "src/lib/taskNotes.ts",
        "src/lib/notifications.ts",
      ],
    },
  },
});
