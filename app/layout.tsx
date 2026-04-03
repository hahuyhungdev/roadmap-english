import type { Metadata } from "next";
import LayoutNav from "@/components/LayoutNav";
import AppSidebar from "@/components/AppSidebar";
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
    <html lang="en">
      <body>
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
            <div className="relative z-10 lg:flex">
              <div className="hidden lg:block">
                <AppSidebar />
              </div>

              <div className="min-h-screen flex flex-col flex-1 min-w-0">
                <div className="lg:hidden">
                  <LayoutNav />
                </div>
                <main className="flex-1 w-full px-4 sm:px-6 py-8 max-w-6xl mx-auto">
                  {children}
                </main>
              </div>
            </div>
          </div>
        </MantineProviderClient>
      </body>
    </html>
  );
}
