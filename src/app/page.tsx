import { redirect } from "next/navigation";

// The top screen is retired: the virtual office (/office) is the app entry
// point now, so opening the root sends visitors straight there. Sign-out and
// passkey registration moved into the office HUD, so nothing is lost here.
// AuthGate still guards /office, so sign-in stays enforced downstream.
export default function Home() {
  redirect("/office");
}
