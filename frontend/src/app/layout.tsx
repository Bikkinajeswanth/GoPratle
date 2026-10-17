import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GoPratle · Find the right people for your event",
    template: "%s · GoPratle",
  },
  description:
    "Post a structured event requirement for event planners, performers and crew on GoPratle.",
};

export const viewport: Viewport = {
  themeColor: "#5e2ee0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: browser extensions (e.g. grammar checkers) add attributes to <html>/<body>.
    // It only affects these two elements' own attributes, not their children.
    // scroll-pt-24: anchor jumps and focus-scrolling (e.g. to the first invalid field) clear the sticky header.
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-pt-24 scroll-smooth antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans" suppressHydrationWarning>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
