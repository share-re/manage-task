import { redirect } from "next/navigation";

// The top screen is retired. The virtual office (/office) is now the entry
// point, so opening the root sends visitors straight there. AuthGate still
// guards /office, so sign-in is enforced downstream.
export default function Home() {
  redirect("/office");
}
