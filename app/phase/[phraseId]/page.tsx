import { notFound } from "next/navigation";
import { getPhraseGroup } from "@/lib/sessions.server";
import PhraseDetailClient from "@/features/learning/components/PhraseDetailClient";

export default async function PhraseDetailPage({
  params,
}: {
  params: Promise<{ phraseId: string }>;
}) {
  const { phraseId } = await params;
  const phase = getPhraseGroup(phraseId);
  if (!phase) notFound();
  return <PhraseDetailClient phase={phase} />;
}
