import type { Metadata, Viewport } from "next";
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import AuthProvider from "@/components/providers/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LifeLink — Smart Emergency Medical Response System",
  description: "Every second matters. LifeLink connects patients with hospitals and ambulances in real-time. Instant SOS, live tracking, digital medical QR cards, and AI-powered triage.",
  keywords: ["emergency", "medical", "ambulance", "hospital", "SOS", "healthtech", "LifeLink"],
  authors: [{ name: "LifeLink Team" }],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚑</text></svg>",
  },
  openGraph: {
    title: "LifeLink — Every Second Matters",
    description: "Smart Emergency Medical Response System connecting patients with hospitals and ambulances in real-time.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ThemeProvider>
            {children}
            <Toaster />
            <SonnerToaster position="top-right" />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
