import type { Metadata } from "next";
import { Hind_Siliguri, Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const bangla = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bn",
});

export const metadata: Metadata = {
  title: "HerRise Health",
  description: "Trusted health education, a private wellness log, and a path to professional care for women in Bangladesh.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={`${display.variable} ${body.variable} ${bangla.variable} h-full antialiased`}>
      <body className="min-h-full text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
