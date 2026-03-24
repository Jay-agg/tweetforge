import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TweetForge – Self-Improving Twitter Agent",
  description:
    "Generate, post, track, and autonomously improve Twitter content with AI-driven engagement feedback.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <body className="h-full bg-[#060609] font-sans text-zinc-100">
        <Sidebar />
        <main className="ml-64 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
