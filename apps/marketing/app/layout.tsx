import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

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
    <html lang="en" className={`${jakarta.variable} antialiased`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
