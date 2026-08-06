import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawCode = searchParams.get("batchCode") || searchParams.get("code");

    if (!rawCode) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const cleanCode = rawCode.trim();

    // 1. Search BatchTraceability
    const batchRecord = await prisma.batchTraceability.findFirst({
      where: {
        batchCode: { equals: cleanCode, mode: "insensitive" },
      },
      include: { product: true },
    });

    if (batchRecord) {
      return NextResponse.json(batchRecord, { status: 200 });
    }

    // 2. Search B2BInquiry flexibly
    const b2bInquiry = await prisma.b2BInquiry.findFirst({
      where: {
        OR: [
          { inquiryNumber: { equals: cleanCode, mode: "insensitive" } },
          { inquiryNumber: { contains: cleanCode, mode: "insensitive" } },
          { id: { equals: cleanCode, mode: "insensitive" } },
        ],
      },
    });

    if (b2bInquiry) {
      return NextResponse.json(
        {
          id: b2bInquiry.id,
          batchCode: b2bInquiry.inquiryNumber,
          type: "B2B_INQUIRY",
          status: "INQUIRY_SUBMITTED",
          details: {
            companyName: b2bInquiry.companyName,
            contactName: b2bInquiry.contactName,
            varieties: b2bInquiry.varieties,
            annualVolumeKg: b2bInquiry.annualVolumeKg,
          },
          harvestDate: b2bInquiry.createdAt,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: `No record found with code "${cleanCode}".` },
      { status: 404 }
    );
  } catch (error) {
    console.error("Traceability API Error:", error);
    return NextResponse.json({ error: "Server error checking code" }, { status: 500 });
  }
}