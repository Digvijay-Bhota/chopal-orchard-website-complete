import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bookingSchema = z.object({
  guestName: z.string().min(2, "Name is required"),
  guestEmail: z.string().email("Invalid email address"),
  guestPhone: z.string().min(10, "Valid phone number is required"),
  visitDate: z.string().transform((str) => new Date(str)),
  guestsCount: z.number().int().min(1, "At least 1 guest is required").max(20, "Maximum 20 guests per slot"),
  specialNotes: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = bookingSchema.parse(body);

    // Collision-resistant booking reference generator
    let bookingNumber = "";
    let isUnique = false;

    while (!isUnique) {
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      bookingNumber = `CHP-TOUR-${randomSuffix}`;

      // @ts-ignore
      const bookingModel = prisma.tourBooking || prisma.tour_bookings || prisma.ecoTourismBooking;

      const existing = await bookingModel.findFirst({
        where: { bookingNumber },
      });

      if (!existing) {
        isUnique = true;
      }
    }

    // @ts-ignore
    const bookingModel = prisma.tourBooking || prisma.tour_bookings || prisma.ecoTourismBooking;

    const newBooking = await bookingModel.create({
      data: {
        bookingNumber,
        guestName: validatedData.guestName,
        guestEmail: validatedData.guestEmail,
        guestPhone: validatedData.guestPhone,
        visitDate: validatedData.visitDate,
        guestCount: validatedData.guestsCount, // Mapped to guestCount (singular) to match Prisma schema
        specialNotes: validatedData.specialNotes || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Eco-tourism booking created successfully",
        bookingNumber: newBooking.bookingNumber,
        booking: newBooking,
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
    console.error("Booking API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process booking reservation" },
      { status: 500 }
    );
  }
}