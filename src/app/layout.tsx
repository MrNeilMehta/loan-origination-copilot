import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Loan Origination Copilot",
  description: "AI-assisted intake and underwriting for small business loans",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-black/10 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-block h-5 w-5 rounded-sm bg-accent" />
              <span className="font-semibold tracking-tight">Origination Copilot</span>
            </Link>
            <Link
              href="/applications/new"
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accentdark"
            >
              New application
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
