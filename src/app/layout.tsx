import type { Metadata } from "next";
import { Inter, Newsreader, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Prospector — Mine the internet for your next SaaS idea",
  description:
    "Prospector analyzes thousands of conversations to find the problems people will pay you to solve. AI-powered frustration mining across Reddit, HN, and more.",
  keywords: [
    "SaaS ideas",
    "startup ideas",
    "market research",
    "Reddit analysis",
    "frustration mining",
    "opportunity scoring",
  ],
  openGraph: {
    title: "Prospector — Mine the internet for your next SaaS idea",
    description:
      "AI-powered frustration mining. Find problems people will pay you to solve.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${newsreader.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
