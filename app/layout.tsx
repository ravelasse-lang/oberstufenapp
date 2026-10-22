import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/komponenten/theme-provider";
import { Navigation } from "@/komponenten/navigation";
import { GastKontextProvider } from "@/komponenten/gast-kontext";
import { ladeAktuellenNutzer } from "@/lib/auth/aktueller-nutzer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OberstufenApp",
  description: "Persönliche Lern-App für die Oberstufe",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { istGast } = await ladeAktuellenNutzer();
  return (
    <html
      lang="de"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <GastKontextProvider istGast={istGast}>
            <Navigation />
            <main className="flex flex-1 flex-col">{children}</main>
          </GastKontextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
