import { Inter, JetBrains_Mono, Newsreader, Amiri, Cairo } from "next/font/google";
import { ThemeScript } from "@/components/theme/ThemeScript";
import { getDeskLocale } from "@/server/desk-copy";
import { dirOf, htmlLangOf } from "@/lib/locales";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const newsreader = Newsreader({ subsets: ["latin"], display: "swap", variable: "--font-newsreader" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-jetbrains" });
const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-amiri",
});
const cairo = Cairo({ subsets: ["arabic", "latin"], display: "swap", variable: "--font-cairo" });

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getDeskLocale();
  const dir = dirOf(locale);
  const latin = locale === "en";
  const display = latin ? newsreader.style.fontFamily : amiri.style.fontFamily;
  const body = latin ? inter.style.fontFamily : cairo.style.fontFamily;
  const ui = latin ? inter.style.fontFamily : cairo.style.fontFamily;

  return (
    <html
      lang={htmlLangOf(locale)}
      dir={dir}
      className={`${inter.variable} ${newsreader.variable} ${jetbrains.variable} ${amiri.variable} ${cairo.variable}`}
      suppressHydrationWarning
      style={
        {
          "--font-ui": ui,
          "--font-display": display,
          "--font-body": body,
          "--font-mono": jetbrains.style.fontFamily,
        } as React.CSSProperties
      }
    >
      <head>
        <ThemeScript />
      </head>
      <body className="admin-shell min-h-screen bg-surface text-on-surface antialiased">{children}</body>
    </html>
  );
}
