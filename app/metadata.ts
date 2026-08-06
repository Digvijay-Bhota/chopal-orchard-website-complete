import type { Metadata, Viewport } from "next";

/**
 * metadata.ts
 * ───────────────────────────────────────────────
 * Next.js 14 App Router metadata configuration with
 * comprehensive SEO, OpenGraph, Twitter Cards,
 * modern mobile web app metadata, and JSON-LD structured data.
 */

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://chopalorchard.com"),

  // ── Core Meta ──
  title: {
    default: "Chopal Apple Orchard | Premium Himalayan Apples from Shimla",
    template: "%s | Chopal Apple Orchard",
  },
  description:
    "Premium organic apples grown at 2,300m in Chopal, Shimla, Himachal Pradesh. Royal Delicious, Red Delicious, Golden Delicious & Dark Baron single-origin varieties. Farm-fresh delivery across India.",
  keywords: [
    "Himachal apples",
    "Shimla apples",
    "Chopal orchard",
    "premium apples India",
    "organic apples",
    "Royal Delicious",
    "Himalayan apples",
    "apple farm stay Himachal",
    "wholesale apples India",
    "apple export India",
    "farm fresh apples",
    "apple orchard tour",
  ],

  // ── Authors & Robots ──
  authors: [{ name: "Chopal Apple Orchard", url: "https://chopalorchard.com" }],
  creator: "Chopal Apple Orchard",
  publisher: "Chopal Apple Orchard",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Open Graph ──
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://chopalorchard.com",
    siteName: "Chopal Apple Orchard",
    title: "Chopal Apple Orchard | Premium Himalayan Apples",
    description:
      "Hand-picked organic apples from 2,300m altitude in Chopal, Shimla. Experience the taste of the Himalayas.",
    images: [
      {
        url: "https://res.cloudinary.com/chopal-orchard/image/upload/og-banner.jpg",
        width: 1200,
        height: 630,
        alt: "Chopal Apple Orchard — Himalayan Apple Harvest",
      },
    ],
  },

  // ── Twitter Cards ──
  twitter: {
    card: "summary_large_image",
    site: "@chopalorchard",
    creator: "@chopalorchard",
    title: "Chopal Apple Orchard | Premium Himalayan Apples",
    description:
      "Hand-picked organic apples from 2,300m altitude in Chopal, Shimla.",
    images: [
      "https://res.cloudinary.com/chopal-orchard/image/upload/og-banner.jpg",
    ],
  },

  // ── Verification ──
  verification: {
    google: "YOUR_GOOGLE_SEARCH_CONSOLE_VERIFICATION",
  },

  // ── Alternate Languages ──
  alternates: {
    canonical: "https://chopalorchard.com",
    languages: {
      "en-IN": "https://chopalorchard.com",
      "hi-IN": "https://chopalorchard.com/hi",
    },
  },

  // ── Icons ──
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: "/favicon-16x16.png",
  },

  // ── Manifest ──
  manifest: "/manifest.json",

  // ── Modern Apple Web App (Fixes Chrome/Safari Deprecation Warnings) ──
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Chopal Orchard",
  },

  // ── Category ──
  category: "agriculture",
  classification: "Food & Agriculture",
};

// ── JSON-LD Structured Data ───────────────────
export function generateStructuredData() {
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://chopalorchard.com/#business",
    name: "Chopal Apple Orchard",
    alternateName: "Chopal Orchard",
    description:
      "Premium organic apple orchard located in Chopal, Shimla, Himachal Pradesh. Growing Royal Delicious, Red Delicious, Golden Delicious and Dark Baron single-origin apples at 2,300m altitude.",
    url: "https://chopalorchard.com",
    logo: "https://chopalorchard.com/logo.png",
    image: "https://res.cloudinary.com/chopal-orchard/image/upload/orchard-aerial.jpg",
    telephone: "+91-98765-43210",
    email: "hello@chopalorchard.com",
    priceRange: "₹₹",
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, Credit Card, UPI, NetBanking",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "10:00",
        closes: "16:00",
      },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "Chopal Tehsil, Near Main Market",
      addressLocality: "Chopal",
      addressRegion: "Himachal Pradesh",
      postalCode: "171211",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "30.9833",
      longitude: "77.5833",
      elevation: "2300 meters",
    },
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Apple Products",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Product",
            name: "Royal Delicious Apples",
            description: "Premium Royal Delicious apples from Chopal, Shimla",
            brand: {
              "@type": "Brand",
              name: "Chopal Orchard",
            },
            offers: {
              "@type": "Offer",
              price: "280.00",
              priceCurrency: "INR",
              availability: "https://schema.org/InStock",
              url: "https://chopalorchard.com/apples/royal-delicious",
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.8",
              reviewCount: "156",
            },
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Product",
            name: "Dark Baron Single-Origin Apples",
            description: "Limited edition single-origin apples from highest elevation blocks",
            brand: {
              "@type": "Brand",
              name: "Chopal Orchard",
            },
            offers: {
              "@type": "Offer",
              price: "450.00",
              priceCurrency: "INR",
              availability: "https://schema.org/PreOrder",
              url: "https://chopalorchard.com/apples/dark-baron",
            },
          },
        },
      ],
    },
    sameAs: [
      "https://instagram.com/chopalorchard",
      "https://facebook.com/chopalorchard",
      "https://youtube.com/@chopalorchard",
      "https://linkedin.com/company/chopal-orchard",
    ],
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://chopalorchard.com/#organization",
    name: "Chopal Apple Orchard",
    url: "https://chopalorchard.com",
    logo: "https://chopalorchard.com/logo.png",
    sameAs: [
      "https://instagram.com/chopalorchard",
      "https://facebook.com/chopalorchard",
      "https://youtube.com/@chopalorchard",
      "https://linkedin.com/company/chopal-orchard",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+91-98765-43210",
        contactType: "customer service",
        availableLanguage: ["English", "Hindi"],
        areaServed: "IN",
      },
      {
        "@type": "ContactPoint",
        telephone: "+91-98765-43210",
        contactType: "sales",
        availableLanguage: ["English", "Hindi"],
        areaServed: "IN",
      },
    ],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://chopalorchard.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Our Apples",
        item: "https://chopalorchard.com/apples",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Traceability",
        item: "https://chopalorchard.com/traceability",
      },
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://chopalorchard.com/#website",
    url: "https://chopalorchard.com",
    name: "Chopal Apple Orchard",
    description: "Premium Himalayan apples from Chopal, Shimla",
    publisher: {
      "@id": "https://chopalorchard.com/#organization",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://chopalorchard.com/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return [
    localBusinessSchema,
    organizationSchema,
    breadcrumbSchema,
    websiteSchema,
  ];
}