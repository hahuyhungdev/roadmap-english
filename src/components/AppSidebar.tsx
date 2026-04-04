"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ActionIcon, NavLink, Stack, Text, Tooltip } from "@mantine/core";
import {
  BookOpen,
  Video,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useEffect, useState } from "react";
import clsx from "clsx";

export default function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("sidebar-collapsed");
      setCollapsed(saved === "1");
    } catch {
      // ignore
    }
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      window.localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
      window.dispatchEvent(
        new CustomEvent("sidebar:collapsed-changed", { detail: next }),
      );
    } catch {
      // ignore
    }
  }

  return (
    <aside
      className={clsx(
        "h-screen fixed left-0 top-0 z-40 border-r border-gray-200/70 bg-white/90 backdrop-blur-sm py-5 transition-all shadow-xs",
        collapsed ? "w-14" : "w-50",
      )}
    >
      <div className="px-2 mb-4 flex items-start justify-between gap-2">
        {!collapsed && (
          <div>
            <Text fw={700} size="sm" c="indigo">
              English System
            </Text>
            <Text size="xs" c="dimmed">
              Learning Dashboard
            </Text>
          </div>
        )}
        <Tooltip
          label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          withArrow
        >
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={toggleCollapsed}
            size="sm"
            className="mt-0.5"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen size={16} />
            ) : (
              <PanelLeftClose size={16} />
            )}
          </ActionIcon>
        </Tooltip>
      </div>

      <Stack gap={4}>
        <NavLink
          component={Link}
          href="/"
          label={collapsed ? "" : "English Center"}
          description={collapsed ? undefined : "Phases and lessons"}
          leftSection={<BookOpen size={16} />}
          active={pathname === "/" || pathname.startsWith("/phase")}
          variant="filled"
        />
        <NavLink
          component={Link}
          href="/shadowing/youtube"
          label={collapsed ? "" : "YouTube Shadowing"}
          description={collapsed ? undefined : "Auto transcript workflow"}
          leftSection={<Video size={16} />}
          active={pathname.startsWith("/shadowing/youtube")}
          variant="filled"
        />
        <NavLink
          component={Link}
          href="/shadowing/script"
          label={collapsed ? "" : "Script Shadowing"}
          description={collapsed ? undefined : "Text-first speaking practice"}
          leftSection={<FileText size={16} />}
          active={pathname.startsWith("/shadowing/script")}
          variant="filled"
        />
      </Stack>
    </aside>
  );
}
