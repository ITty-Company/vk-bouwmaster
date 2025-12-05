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
      { url: '/favicon.ico?v=6', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon-16.png?v=6', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png?v=6', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48.png?v=6', sizes: '48x48', type: 'image/png' },
      { url: '/vk-logo.png?v=6', sizes: 'any', type: 'image/png' },
    ],
    apple: [
      { url: '/vk-logo.png?v=6', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico?v=6',
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
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=6" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png?v=6" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png?v=6" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png?v=6" />
        <link rel="icon" type="image/png" sizes="any" href="/vk-logo.png?v=6" />
        <link rel="apple-touch-icon" sizes="180x180" href="/vk-logo.png?v=6" />
        <link rel="shortcut icon" href="/favicon.ico?v=6" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
