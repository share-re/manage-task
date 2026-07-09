import { defineConfig } from "vitest/config";

// Unit tests for pure logic (no DB/network). lib/supabase.ts throws at import
// when the Supabase env vars are missing, so we inject dummies here — the pure
// functions under test never actually call Supabase.
export default defineConfig({
  resolve: { tsconfigPaths: true }, // resolve "@/..." from tsconfig paths natively
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "json"],
      reportsDirectory: "evidence/unit/coverage",
      include: [
        "src/lib/summary.ts",
        "src/lib/tasks.ts",
        "src/app/office/officeWorld.ts",
      ],
    },
  },
});
