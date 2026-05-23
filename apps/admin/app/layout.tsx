import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ReviewNatin Admin",
  description: "Content management for ReviewNatin",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
