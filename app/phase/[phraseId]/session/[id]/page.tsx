import { notFound } from "next/navigation";
import { getSession, getPhraseGroup } from "@/lib/sessions.server";
import SessionDetailClient from "@/features/learning/components/SessionDetailClient";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ phraseId: string; id: string }>;
}) {
  const { phraseId, id } = await params;
  const session = getSession(id);
  const phase = getPhraseGroup(phraseId);
  if (!session || !phase) notFound();
  return <SessionDetailClient session={session} phase={phase} />;
}
