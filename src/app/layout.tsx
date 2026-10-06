import type { Metadata, Viewport } from "next";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { AppProviders } from "@/components/providers/AppProviders";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DeoVR · Find your next window",
  description:
    "Discover immersive VR video by where you want to go, how you want to feel, and what you want to see.",
  applicationName: "DeoVR",
};

export const viewport: Viewport = {
  themeColor: "#191818",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${archivo.variable}`}>
      <body>
        <AppProviders>{children}</AppProviders>
        <Analytics />
      </body>
    </html>
  );
}
