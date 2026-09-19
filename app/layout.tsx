import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import CustomCursor from "@/components/3d/CustomCursor";

export const metadata: Metadata = {
  title: "DocMind | Offline Intelligent Document Question Answering Framework",
  description:
    "An Offline Retrieval-Augmented Generation Framework with NLI-based Conflict Detection and Calibrated Confidence Scoring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased bg-[#050814] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" disableTransitionOnChange>
          <CustomCursor />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}