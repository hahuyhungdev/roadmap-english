import { redirect } from "next/navigation";
import { getShadowingSession } from "@/lib/cache";

export default async function ShadowingSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sessionId = parseInt(id, 10);
  if (Number.isNaN(sessionId)) {
    redirect("/shadowing");
  }

  const session = await getShadowingSession(sessionId);
  if (!session) {
    redirect("/shadowing");
  }

  redirect(
    session.mode === "youtube"
      ? `/shadowing/youtube/${sessionId}`
      : `/shadowing/script/${sessionId}`,
  );
}
