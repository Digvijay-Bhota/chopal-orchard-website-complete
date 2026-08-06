import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BusinessType, PackagingType, AppleVariety } from "@prisma/client";
import { z } from "zod";

const b2bInquirySchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  contactName: z.string().min(2, "Contact name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid phone number is required"),
  designation: z.string().optional().nullable(),
  businessType: z.nativeEnum(BusinessType),
  annualVolumeKg: z.number().positive("Volume must be greater than 0"),
  targetPrice: z.number().optional().nullable(),
  varieties: z.array(z.nativeEnum(AppleVariety)).min(1, "Select at least one variety"),
  deliveryCity: z.string().min(2, "City is required"),
  deliveryState: z.string().min(2, "State is required"),
  deliveryPincode: z.string().min(6, "Pincode is required"),
  packagingType: z.nativeEnum(PackagingType).default(PackagingType.CARTON_10KG),
  deliveryFrequency: z.string().default("MONTHLY"),
  startDate: z.string().optional().nullable().transform((val) => (val ? new Date(val) : new Date())),
  contractMonths: z.number().default(12),
  specialRequirements: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = b2bInquirySchema.parse(body);

    // Collision-resistant inquiry number generator
    let inquiryNumber = "";
    let isUnique = false;

    while (!isUnique) {
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      inquiryNumber = `CHP-B2B-${randomSuffix}`;

      const existing = await prisma.b2BInquiry.findFirst({
        where: { inquiryNumber },
      });

      if (!existing) {
        isUnique = true;
      }
    }

    const newInquiry = await prisma.b2BInquiry.create({
      data: {
        inquiryNumber,
        companyName: validatedData.companyName,
        contactName: validatedData.contactName,
        email: validatedData.email,
        phone: validatedData.phone,
        designation: validatedData.designation || null,
        businessType: validatedData.businessType,
        annualVolumeKg: validatedData.annualVolumeKg,
        targetPrice: validatedData.targetPrice || null,
        varieties: validatedData.varieties,
        deliveryCity: validatedData.deliveryCity,
        deliveryState: validatedData.deliveryState,
        deliveryPincode: validatedData.deliveryPincode,
        packagingType: validatedData.packagingType,
        deliveryFrequency: validatedData.deliveryFrequency,
        startDate: validatedData.startDate,
        contractMonths: validatedData.contractMonths,
        specialRequirements: validatedData.specialRequirements || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "B2B inquiry submitted successfully",
        inquiryNumber: newInquiry.inquiryNumber,
        inquiry: newInquiry,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("B2B API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process inquiry" },
      { status: 500 }
    );
  }
}