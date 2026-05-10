import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QR Saathi — Smart Vehicle Safety & Emergency Contact System",
  description: "QR Saathi helps you stay safe on the road. Generate secure vehicle QR codes for emergency contact, parking alerts, and owner identification. No app needed to scan.",
  keywords: "vehicle QR code, car safety QR, emergency contact QR, parking QR code, vehicle safety system, QR tag for car, QR Saathi",
  authors: [{ name: "SafeDrive" }],
  creator: "SafeDrive",
  publisher: "SafeDrive",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://qrsaathi.com",
    siteName: "QR Saathi",
    title: "QR Saathi — Smart Vehicle Safety & Emergency Contact System",
    description: "Generate secure QR codes for your vehicle. Allow emergency contact without revealing personal details. Fast, safe, and app-free.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "QR Saathi - Vehicle Safety System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QR Saathi — Smart Vehicle Safety System",
    description: "Generate secure vehicle QR codes for emergency contact & parking alerts. No app needed.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  metadataBase: new URL("https://qrsaathi.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="canonical" href="https://qrsaathi.com" />
        <meta name="theme-color" content="#2563EB" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "QR Saathi",
              "applicationCategory": "UtilitiesApplication",
              "operatingSystem": "Web",
              "description": "Generate secure vehicle QR codes for emergency contact, parking alerts, and owner identification.",
              "url": "https://qrsaathi.com",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "INR"
              }
            })
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-white`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
