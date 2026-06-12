"use client";

import Sidebar from "@/components/sidebar/page";
import StartupModal from "@/components/StartupModal/page";
import "./globals.css";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideSidebar =
    pathname.toLowerCase().startsWith("/login") ||
    pathname.toLowerCase().startsWith("/signup");

  return (
    <html lang="en">
      <head>
        <title>Makkah Metals</title>
        <link rel="icon" href="/favicon.png" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-BgColor font-poppins">
        <StartupModal />

        <div className="flex">
          {!hideSidebar && <Sidebar />}
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
