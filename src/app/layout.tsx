import type { Metadata } from "next";
import {
  EB_Garamond,
  Cormorant_SC,
  Inter,
  Inter_Tight,
  JetBrains_Mono,
} from "next/font/google";
import { ManorOrnaments } from "@/components/ManorOrnaments";
import "./globals.css";

const ebGaramond = EB_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const cormorantSC = Cormorant_SC({
  variable: "--font-sc",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const interTight = Inter_Tight({
  variable: "--font-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "WESLAMIC HALL · SEO Intelligence",
  description: "WESLAMIC HALL · Anno MMXXVI · SEO Intelligence Workbench",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={[
        ebGaramond.variable,
        cormorantSC.variable,
        inter.variable,
        interTight.variable,
        jetbrainsMono.variable,
        "h-full antialiased",
      ].join(" ")}
    >
      <body className="min-h-full flex flex-col bg-manor-void text-manor-ink">
        <ManorOrnaments />
        {children}
      </body>
    </html>
  );
}
