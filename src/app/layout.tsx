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
      { url: '/favicon.ico?v=10', sizes: 'any', type: 'image/x-icon' },
      { url: '/favicon-16.png?v=10', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png?v=10', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-64.png?v=10', sizes: '64x64', type: 'image/png' },
      { url: '/favicon-96.png?v=10', sizes: '96x96', type: 'image/png' },
      { url: '/favicon-128.png?v=10', sizes: '128x128', type: 'image/png' },
      { url: '/favicon.png?v=10', sizes: 'any', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png?v=10', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico?v=10',
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
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=10" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png?v=10" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png?v=10" />
        <link rel="icon" type="image/png" sizes="64x64" href="/favicon-64.png?v=10" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png?v=10" />
        <link rel="icon" type="image/png" sizes="128x128" href="/favicon-128.png?v=10" />
        <link rel="icon" type="image/png" sizes="any" href="/favicon.png?v=10" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=10" />
        <link rel="shortcut icon" href="/favicon.ico?v=10" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
