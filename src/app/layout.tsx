import type { Metadata } from "next";
import { Rubik, Assistant } from "next/font/google";
import { cookies } from "next/headers";
import { LocaleProvider, type Locale } from "@/i18n/LocaleProvider";
import "./globals.css";

// Display / headings — bold geometric grotesk (Ticketmaster-style), Hebrew + Latin
const rubik = Rubik({
  variable: "--font-display",
  subsets: ["latin", "hebrew"],
  weight: ["500", "600", "700", "800"],
});

// Body / UI
const assistant = Assistant({
  variable: "--font-sans",
  subsets: ["latin", "hebrew"],
});

export const metadata: Metadata = {
  title: "SafeTicket",
  description: "Buy and sell second-hand tickets with full escrow protection.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale")?.value;
  const locale: Locale = localeCookie === "en" ? "en" : "he";
  const dir = locale === "he" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={`${rubik.variable} ${assistant.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-[var(--background)] font-[family-name:var(--font-sans)] text-[var(--foreground)]">
        <LocaleProvider initialLocale={locale}>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
