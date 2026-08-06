import type { ReactNode } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import { metadata, viewport, generateStructuredData } from "./metadata";
import "./globals.css";
import Script from "next/script";

/**
 * layout.tsx
 * ───────────────────────────────────────────────
 * Root layout for Chopal Apple Orchard website.
 * Features:
 *   • Google Fonts (Inter + Playfair Display)
 *   • JSON-LD structured data injection
 *   • Global CSS variables for theming
 *   • Razorpay script preloading
 */

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export { metadata, viewport };

export default function RootLayout({ children }: { children: ReactNode }) {
  const structuredData = generateStructuredData();

  return (
    <html lang="en-IN" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://api.mapbox.com" />
        <link rel="dns-prefetch" href="https://checkout.razorpay.com" />

        {/* Razorpay Checkout script */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />

        {/* JSON-LD Structured Data */}
        {structuredData.map((data, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
          />
        ))}

        {/* Performance: Preload critical hero image */}
        <link
          rel="preload"
          as="image"
          href="https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?q=80&w=1920&auto=format&fit=crop"
          type="image/jpeg"
          fetchPriority="high"
        />
      </head>
      <body className="font-sans antialiased bg-mist-50 text-mist-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}