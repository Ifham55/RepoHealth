import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RepoHealth - AI-Powered GitHub Repository Health Analyzer",
  description: "Analyze GitHub repositories with AI agents. Get health scores, insights on popularity, maintenance, community, and documentation quality.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
