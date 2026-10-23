import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "DocuMind \u2014 AI PDF Workspace",
    template: "%s | DocuMind",
  },
  description:
    "Upload PDFs, generate AI summaries, and chat with your documents. Private, fast, and grounded in your content.",
  metadataBase: new URL("https://documind.app"),
  openGraph: {
    title: "DocuMind \u2014 AI PDF Workspace",
    description:
      "Upload PDFs, generate AI summaries, and chat with your documents.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("dark h-full antialiased", geistSans.variable, geistMono.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
