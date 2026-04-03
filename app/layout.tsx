import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <MantineProviderClient>
          <div className="min-h-screen relative">
            <div
              className="absolute inset-0 z-0"
              style={{
                backgroundImage: `
        radial-gradient(125% 125% at 50% 10%, #ffffff 40%, #f59e0b 100%)
      `,
                backgroundSize: "100% 100%",
              }}
            />
            <AppChrome>{children}</AppChrome>
          </div>
        </MantineProviderClient>
      </body>
    </html>
  );
}
