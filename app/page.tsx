import { loadPhraseGroups } from "@/lib/sessions.server";
import SessionHubClient from "@/features/learning/components/SessionHubClient";

export default function HomePage() {
  const phrases = loadPhraseGroups();
  return <SessionHubClient phrases={phrases} />;
}
