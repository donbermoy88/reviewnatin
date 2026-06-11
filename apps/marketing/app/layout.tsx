import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReviewNatin — Filipino Exam Reviewer | CSE, LET, PNLE",
  description:
    "Review together. Pass together. PasaPath daily study, Taglish explanations, and verified reviewers for Civil Service, LET, and Nursing board exams.",
  metadataBase: new URL("https://reviewnatinph.com"),
  openGraph: {
    title: "ReviewNatin",
    description: "All-in-one Filipino exam reviewer app",
    url: "https://reviewnatinph.com",
    siteName: "ReviewNatin",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReviewNatin — Filipino Exam Reviewer | CSE, LET, PNLE",
    description: "Review together. Pass together. PasaPath daily study for Civil Service, LET, and Nursing board exams.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
