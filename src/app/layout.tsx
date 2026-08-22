import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ItemsProvider } from "@/lib/items-context";
import { Navbar } from "@/components/layout/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Campus Lost & Found Matcher | Automated Reconciler",
  description:
    "An intelligent multi-factor matching engine and interface designed to identify potential matches between campus lost and found item reports.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased light`}
    >
      <body className="min-h-full flex flex-col bg-slate-50/80 font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
        <ItemsProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          {/* <Footer /> */}
        </ItemsProvider>
      </body>
    </html>
  );
}
