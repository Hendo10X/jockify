import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/app/components/SessionProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });
const instrument = Instrument_Serif({ 
  subsets: ["latin"], 
  weight: "400",
  variable: "--font-instrument" 
});

export const metadata: Metadata = {
  title: "AI DJ - Remix Your Playlists",
  description: "Remix your Spotify playlists with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable} ${instrument.variable}`}>
      <body className={`${inter.className} bg-gradient-to-b from-background to-muted min-h-screen`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
