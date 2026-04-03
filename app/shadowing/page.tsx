import Link from "next/link";
import { Card, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { FileText, Video } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ShadowingPage() {
  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-gray-900">Shadowing Features</h1>
      <p className="text-sm text-gray-500 mt-1">
        Choose a dedicated workspace. YouTube and Script are fully separated.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Card
          withBorder
          radius="lg"
          padding="lg"
          component={Link}
          href="/shadowing/youtube"
        >
          <Stack gap="xs">
            <Group>
              <ThemeIcon color="red" variant="light" radius="md">
                <Video size={16} />
              </ThemeIcon>
              <Text fw={700}>YouTube Shadowing</Text>
            </Group>
            <Text size="sm" c="dimmed">
              Create from YouTube URL, auto-fetch transcript, and practice
              sentence by sentence.
            </Text>
          </Stack>
        </Card>

        <Card
          withBorder
          radius="lg"
          padding="lg"
          component={Link}
          href="/shadowing/script"
        >
          <Stack gap="xs">
            <Group>
              <ThemeIcon color="indigo" variant="light" radius="md">
                <FileText size={16} />
              </ThemeIcon>
              <Text fw={700}>Script Shadowing</Text>
            </Group>
            <Text size="sm" c="dimmed">
              Paste your own text and train speaking with full script controls.
            </Text>
          </Stack>
        </Card>
      </div>
    </div>
  );
}
