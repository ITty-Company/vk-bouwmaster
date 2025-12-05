import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://vkbouwmaster.com'),
  title: "VK Bouwmaster - Professionele Renovatiediensten",
  description: "VK Bouwmaster biedt professionele renovatiediensten, waaronder tegelwerk, dakreparaties, loodgieterswerk, schilderwerk en tuinontwerp. Transformeer uw huis met ons team van experts.",
  keywords: "renovatie, huisverbetering, bouw, tegelwerk, dakreparaties, loodgieterswerk, schilderwerk, tuinontwerp, bouwmeester, verbouwing",
  icons: {
    icon: [
      { url: '/vk-logo.png?v=3', sizes: 'any' },
      { url: '/favicon.ico?v=3', sizes: '32x32', type: 'image/x-icon' },
    ],
    apple: [
      { url: '/vk-logo.png?v=3', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico?v=3',
  },
  openGraph: {
    url: "https://vkbouwmaster.com",
    title: "VK Bouwmaster - Professionele Renovatiediensten",
    description: "VK Bouwmaster biedt professionele renovatiediensten, waaronder tegelwerk, dakreparaties, loodgieterswerk, schilderwerk en tuinontwerp. Transformeer uw huis met ons team van experts.",
    type: "website",
    locale: "nl_NL",
    siteName: "VK Bouwmaster",
    alternateLocale: ["nl_NL"],
  },
  twitter: {
    card: "summary_large_image",
    title: "VK Bouwmaster - Professionele Renovatiediensten",
    description: "VK Bouwmaster biedt professionele renovatiediensten voor uw huis. Transformeer uw huis met ons team van experts.",
  },
  alternates: {
    canonical: "https://vkbouwmaster.com",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.ico?v=2" />
        <link rel="icon" type="image/png" sizes="any" href="/icon.png?v=2" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon.png?v=2" />
        <link rel="shortcut icon" href="/favicon.ico?v=2" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
