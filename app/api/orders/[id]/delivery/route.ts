import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json(
        {
          error: "Order ID is required",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      deliveryDate,
      trackingNumber,
      trackingUrl,
      notes,
    } = body;

    // --------------------------------------------------
    // 1. Find the order
    // --------------------------------------------------

    const existingOrder =
      await prisma.order.findUnique({
        where: {
          id: orderId,
        },
      });

    if (!existingOrder) {
      return NextResponse.json(
        {
          error: "Order not found",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 2. Validate delivery date
    // --------------------------------------------------

    let parsedDeliveryDate:
      | Date
      | null
      | undefined;

    if (deliveryDate !== undefined) {
      if (
        deliveryDate === null ||
        deliveryDate === ""
      ) {
        parsedDeliveryDate = null;
      } else {
        const date = new Date(
          deliveryDate
        );

        if (Number.isNaN(date.getTime())) {
          return NextResponse.json(
            {
              error:
                "Invalid delivery date",
            },
            { status: 400 }
          );
        }

        parsedDeliveryDate = date;
      }
    }

    // --------------------------------------------------
    // 3. Build update data
    // --------------------------------------------------

    const updateData: {
      deliveryDate?: Date | null;
      trackingNumber?: string | null;
      trackingUrl?: string | null;
      notes?: string | null;
    } = {};

    if (deliveryDate !== undefined) {
      updateData.deliveryDate =
        parsedDeliveryDate;
    }

    if (trackingNumber !== undefined) {
      updateData.trackingNumber =
        trackingNumber
          ? String(trackingNumber).trim()
          : null;
    }

    if (trackingUrl !== undefined) {
      updateData.trackingUrl =
        trackingUrl
          ? String(trackingUrl).trim()
          : null;
    }

    if (notes !== undefined) {
      updateData.notes =
        notes
          ? String(notes).trim()
          : null;
    }

    // --------------------------------------------------
    // 4. Update order
    // --------------------------------------------------

    // IMPORTANT:
    // Include items + product + user because the
    // Admin Orders page expects these relations.
    const updatedOrder =
      await prisma.order.update({
        where: {
          id: orderId,
        },
        data: updateData,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  variety: true,
                },
              },
            },
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

    // --------------------------------------------------
    // 5. Return complete updated order
    // --------------------------------------------------

    return NextResponse.json({
      success: true,
      message:
        "Delivery information updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error(
      "[DELIVERY_UPDATE_ERROR]",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update delivery information",
      },
      { status: 500 }
    );
  }
}