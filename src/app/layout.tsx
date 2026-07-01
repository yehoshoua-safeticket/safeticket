import type { Metadata } from "next";
import { Rubik, Assistant, Saira } from "next/font/google";
import { cookies } from "next/headers";
import { LocaleProvider, type Locale } from "@/i18n/LocaleProvider";
import "./globals.css";

// Site default — display / headings (geometric grotesk, Hebrew + Latin)
const rubik = Rubik({
  variable: "--font-display",
  subsets: ["latin", "hebrew"],
  weight: ["500", "600", "700", "800"],
});

// Site default — body / UI (Hebrew + Latin)
const assistant = Assistant({
  variable: "--font-sans",
  subsets: ["latin", "hebrew"],
});

// Trial font — applied only to the hero, header and search bar for now.
// Latin only → Hebrew glyphs fall back to Assistant (--font-sans).
const saira = Saira({
  variable: "--font-saira",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
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
    <html lang={locale} dir={dir} className={`${rubik.variable} ${assistant.variable} ${saira.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-[var(--background)] font-[family-name:var(--font-sans)] text-[var(--foreground)]">
        <LocaleProvider initialLocale={locale}>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
