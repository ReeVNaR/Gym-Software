import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "IRON PULSE | Premium Fitness",
  description: "Experience the next level of fitness at Iron Pulse.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <body className={`${inter.variable} antialiased bg-[#0a0a0a] text-white selection:bg-[#cff532] selection:text-black`}>
        {children}
      </body>
    </html>
  );
}
