import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { AppClientLayout } from '@/components/AppClientLayout';
import React from 'react';

const fontInter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const APP_NAME = "CrediNica";
const APP_DESCRIPTION = "Gestión de Créditos y Cobranza";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s - ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
    startupImage: "/CrediNica inicial.png",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/CrediNica inicial.png", sizes: "192x192", type: "image/png" },
      { url: "/CrediNica.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/CrediNica inicial.png", sizes: "180x180", type: "image/png" }
    ]
  },
  keywords: ["créditos", "cobranza", "microfinanzas", "nicaragua", "gestión financiera"],
  authors: [{ name: "CrediNica Team" }],
  creator: "CrediNica",
  publisher: "CrediNica",
  robots: "noindex, nofollow", // Para producción cambiar a "index, follow"
};

export const viewport: Viewport = {
  themeColor: "#1f2937",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

/**
 * Este es el ROOT layout. Es un COMPONENTE DE SERVIDOR.
 * Su única responsabilidad es definir la estructura base y renderizar el AppClientLayout.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
       <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/CrediNica inicial.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CrediNica" />
        <meta name="msapplication-TileColor" content="#1f2937" />
        <meta name="msapplication-TileImage" content="/CrediNica inicial.png" />
       </head>
      <body className={cn("font-sans antialiased", fontInter.variable)}>
        {/* AppClientLayout ahora envuelve UserProvider internamente */}
        <AppClientLayout>{children}</AppClientLayout>
        <Toaster />
      </body>
    </html>
  );
}
