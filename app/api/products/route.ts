import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "asc",
      },

      select: {
        id: true,
        slug: true,
        name: true,
        variety: true,

        tagline: true,
        description: true,
        shortDesc: true,

        pricePerKg: true,
        comparePrice: true,
        stockKg: true,

        isAvailable: true,
        isPreOrder: true,

        preOrderOpens: true,
        preOrderCloses: true,

        harvestStart: true,
        harvestEnd: true,

        sweetness: true,
        crispness: true,
        acidity: true,

        images: true,
        videoUrl: true,

        originStory: true,
        altitudeMeters: true,
        treeAgeYears: true,

        certifications: true,

        seoTitle: true,
        seoDescription: true,

        createdAt: true,
        updatedAt: true,
      },
    });

    // Convert Prisma Decimal values and Dates
    // into JSON-safe values for the browser.
    const safeProducts = products.map(
      (product) => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        variety: product.variety,

        tagline: product.tagline,
        description: product.description,
        shortDesc: product.shortDesc,

        pricePerKg:
          Number(product.pricePerKg),

        comparePrice:
          product.comparePrice !== null
            ? Number(product.comparePrice)
            : null,

        stockKg:
          Number(product.stockKg),

        isAvailable:
          product.isAvailable,

        isPreOrder:
          product.isPreOrder,

        preOrderOpens:
          product.preOrderOpens
            ? product.preOrderOpens.toISOString()
            : null,

        preOrderCloses:
          product.preOrderCloses
            ? product.preOrderCloses.toISOString()
            : null,

        harvestStart:
          product.harvestStart
            ? product.harvestStart.toISOString()
            : null,

        harvestEnd:
          product.harvestEnd
            ? product.harvestEnd.toISOString()
            : null,

        sweetness:
          product.sweetness,

        crispness:
          product.crispness,

        acidity:
          product.acidity,

        images:
          Array.isArray(product.images)
            ? product.images
            : [],

        videoUrl:
          product.videoUrl,

        originStory:
          product.originStory,

        altitudeMeters:
          product.altitudeMeters,

        treeAgeYears:
          product.treeAgeYears,

        certifications:
          Array.isArray(
            product.certifications
          )
            ? product.certifications
            : [],

        seoTitle:
          product.seoTitle,

        seoDescription:
          product.seoDescription,

        createdAt:
          product.createdAt.toISOString(),

        updatedAt:
          product.updatedAt.toISOString(),
      })
    );

    return NextResponse.json(
      safeProducts,
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "[PRODUCTS_API_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to fetch products",
      },
      {
        status: 500,
      }
    );
  }
}