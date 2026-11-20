import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";

export const metadata: Metadata = {
  title: "Digital Heroes | Web-to-Print Platform",
  description: "A custom web-to-print platform for six print divisions with real production pipeline.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-[#F5F4EE] text-[#13171C]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}


