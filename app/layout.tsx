import type { Metadata } from "next";
import Script from "next/script";
import AppChrome from "@/components/AppChrome";
import { MantineProviderClient } from "@/components/MantineProviderClient";
import "@mantine/core/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "English System",
  description: "English learning roadmap with AI-powered coaching",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

const THEME_BOOTSTRAP_SCRIPT = `
(() => {
  try {
    const key = "theme-mode";
    const saved = window.localStorage.getItem(key);
    const dark =
      saved === "dark" ||
      (saved !== "light" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("theme-dark", dark);
    document.documentElement.setAttribute(
      "data-mantine-color-scheme",
      dark ? "dark" : "light",
    );
  } catch {
    // ignore
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="theme-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
        />
      </head>
      <body suppressHydrationWarning>
        <MantineProviderClient>
          <div className="min-h-screen relative">
            <div className="app-backdrop absolute inset-0 z-0" />
            <AppChrome>{children}</AppChrome>
          </div>
        </MantineProviderClient>
      </body>
    </html>
  );
}
