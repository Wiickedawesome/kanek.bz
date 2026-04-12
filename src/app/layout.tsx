import type { Metadata } from "next";
import { Work_Sans, Manrope } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const workSans = Work_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "kanek — Community Mobility for Belize",
    template: "%s | kanek",
  },
  description:
    "A community mobility board for Belize. Post rides, routes, errands, package deliveries, and jobs. People helping people move.",
  metadataBase: new URL("https://kanek.bz"),
  openGraph: {
    title: "kanek — Community Mobility for Belize",
    description: "Post rides, routes, errands, deliveries, and jobs. People helping people move.",
    url: "https://kanek.bz",
    siteName: "kanek",
    locale: "en_BZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "kanek — Community Mobility for Belize",
    description: "Post rides, routes, errands, deliveries, and jobs. People helping people move.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${workSans.variable} ${manrope.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
