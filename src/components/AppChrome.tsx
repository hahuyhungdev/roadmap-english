"use client";

import { useEffect, useState } from "react";
import LayoutNav from "@/components/LayoutNav";
import AppSidebar from "@/components/AppSidebar";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      setCollapsed(saved === "1");
    } catch {
      // ignore
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === SIDEBAR_COLLAPSED_KEY) {
        setCollapsed(e.newValue === "1");
      }
    };

    const onSidebarChanged = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      setCollapsed(Boolean(customEvent.detail));
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(
      "sidebar:collapsed-changed",
      onSidebarChanged as EventListener,
    );
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(
        "sidebar:collapsed-changed",
        onSidebarChanged as EventListener,
      );
    };
  }, []);

  return (
    <div className="relative z-10">
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      <div
        className={[
          "min-h-screen flex flex-col min-w-0 transition-[margin-left] duration-200 ease-out",
          collapsed ? "lg:ml-20" : "lg:ml-64",
        ].join(" ")}
      >
        <div className="lg:hidden">
          <LayoutNav />
        </div>
        <main className="flex-1 w-full px-4 sm:px-6 py-8 max-w-6xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
