import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { AppProviders } from "@/components/providers/AppProviders";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-instrument",
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
    <html lang="en" className={`${inter.variable} ${instrument.variable}`}>
      <body>
        <AppProviders>{children}</AppProviders>
        <Analytics />
      </body>
    </html>
  );
}
