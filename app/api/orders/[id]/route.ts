import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import {
  OrderStatus,
  PaymentStatus,
} from "@prisma/client";
import {
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
} from "@/lib/email";

type RouteContext = {
  params: {
    id: string;
  };
};

// ==================================================
// ADMIN AUTH CHECK
// ==================================================

async function requireAdmin(
  request: NextRequest
) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.json(
      {
        error: "Authentication required",
      },
      { status: 401 }
    );
  }

  if (token.role !== "ADMIN") {
    return NextResponse.json(
      {
        error: "Admin access required",
      },
      { status: 403 }
    );
  }

  return null;
}

// ==================================================
// GET — Fetch one order for customer tracking
//
// PUBLIC CUSTOMER TRACKING ENDPOINT
//
// Only return fields required by the customer
// tracking page. Do not expose internal database,
// authentication, payment, or Razorpay identifiers.
// ==================================================

export async function GET(
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

    const order =
      await prisma.order.findUnique({
        where: {
          id: orderId,
        },

        select: {
          id: true,
          orderNumber: true,

          status: true,
          paymentStatus: true,

          total: true,
          currency: true,

          shippingName: true,
          shippingAddress: true,
          shippingCity: true,
          shippingState: true,
          shippingPincode: true,
          shippingPhone: true,

          deliveryDate: true,
          trackingNumber: true,
          trackingUrl: true,
          notes: true,

          createdAt: true,
          updatedAt: true,

          items: {
            select: {
              id: true,
              quantityKg: true,
              unitPrice: true,
              totalPrice: true,

              product: {
                select: {
                  id: true,
                  name: true,
                  variety: true,
                },
              },
            },
          },
        },
      });

    if (!order) {
      return NextResponse.json(
        {
          error: "Order not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(
      "[ORDER_FETCH_ERROR]",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to fetch order",
      },
      { status: 500 }
    );
  }
}

// ==================================================
// PATCH — Update order status
//
// ADMIN ONLY
// ==================================================

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // --------------------------------------------------
    // 0. Require ADMIN authentication
    // --------------------------------------------------

    const authError =
      await requireAdmin(request);

    if (authError) {
      return authError;
    }

    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json(
        {
          error: "Order ID is required",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 1. Read request body
    // --------------------------------------------------

    const body =
      await request.json();

    const requestedStatus =
      body.status;

    // --------------------------------------------------
    // 2. Validate requested status
    // --------------------------------------------------

    const validStatuses =
      Object.values(OrderStatus);

    if (
      typeof requestedStatus !==
        "string" ||
      !validStatuses.includes(
        requestedStatus as OrderStatus
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid order status",
        },
        { status: 400 }
      );
    }

    const newStatus =
      requestedStatus as OrderStatus;

    // --------------------------------------------------
    // 3. Find order
    // --------------------------------------------------

    const order =
      await prisma.order.findUnique({
        where: {
          id: orderId,
        },
      });

    if (!order) {
      return NextResponse.json(
        {
          error: "Order not found",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 4. Prevent unsafe cancellation
    // --------------------------------------------------

    if (
      newStatus ===
        OrderStatus.CANCELLED &&
      order.paymentStatus ===
        PaymentStatus.COMPLETED
    ) {
      return NextResponse.json(
        {
          error:
            "A completed-payment order cannot be cancelled from this screen. Process a refund first.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 5. Validate normal order progression
    // --------------------------------------------------

    const allowedTransitions: Record<
      OrderStatus,
      OrderStatus[]
    > = {
      PENDING: [
        OrderStatus.CANCELLED,
        OrderStatus.PROCESSING,
      ],

      CONFIRMED: [
        OrderStatus.PROCESSING,
        OrderStatus.CANCELLED,
      ],

      PROCESSING: [
        OrderStatus.PACKED,
        OrderStatus.CANCELLED,
      ],

      PACKED: [
        OrderStatus.SHIPPED,
        OrderStatus.CANCELLED,
      ],

      SHIPPED: [
        OrderStatus.OUT_FOR_DELIVERY,
      ],

      OUT_FOR_DELIVERY: [
        OrderStatus.DELIVERED,
      ],

      DELIVERED: [],

      CANCELLED: [],

      REFUNDED: [],
    };

    const currentStatus =
      order.status as OrderStatus;

    const allowedNextStatuses =
      allowedTransitions[
        currentStatus
      ] || [];

    if (
      newStatus !== currentStatus &&
      !allowedNextStatuses.includes(
        newStatus
      )
    ) {
      return NextResponse.json(
        {
          error:
            `Cannot change order from ${currentStatus} to ${newStatus}`,
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 6. Update order status
    // --------------------------------------------------

    const updatedOrder =
      await prisma.order.update({
        where: {
          id: orderId,
        },

        data: {
          status: newStatus,
        },

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
        },
      });

    // --------------------------------------------------
    // 7. Send status-based customer emails
    // --------------------------------------------------

    // --------------------------------------------------
    // SHIPPED → Send shipping email
    // --------------------------------------------------

    if (
      newStatus ===
        OrderStatus.SHIPPED &&
      currentStatus !==
        OrderStatus.SHIPPED
    ) {
      if (
        updatedOrder.guestEmail
      ) {
        await sendOrderShippedEmail({
          toEmail:
            updatedOrder.guestEmail,

          customerName:
            updatedOrder.guestName ||
            updatedOrder.shippingName ||
            "Valued Customer",

          orderNumber:
            updatedOrder.orderNumber,

          trackingNumber:
            updatedOrder.trackingNumber,

          trackingUrl:
            updatedOrder.trackingUrl,

          deliveryDate:
            updatedOrder.deliveryDate,
        });
      } else {
        console.warn(
          "[SHIPPING_EMAIL_SKIPPED] Order has no customer email:",
          updatedOrder.orderNumber
        );
      }
    }

    // --------------------------------------------------
    // DELIVERED → Send delivered email
    // --------------------------------------------------

    if (
      newStatus ===
        OrderStatus.DELIVERED &&
      currentStatus !==
        OrderStatus.DELIVERED
    ) {
      if (
        updatedOrder.guestEmail
      ) {
        await sendOrderDeliveredEmail({
          toEmail:
            updatedOrder.guestEmail,

          customerName:
            updatedOrder.guestName ||
            updatedOrder.shippingName ||
            "Valued Customer",

          orderNumber:
            updatedOrder.orderNumber,

          deliveryDate:
            updatedOrder.deliveryDate,

          trackingNumber:
            updatedOrder.trackingNumber,
        });
      } else {
        console.warn(
          "[DELIVERED_EMAIL_SKIPPED] Order has no customer email:",
          updatedOrder.orderNumber
        );
      }
    }

    // --------------------------------------------------
    // 8. Return updated order
    // --------------------------------------------------

    return NextResponse.json({
      success: true,

      message:
        `Order status updated to ${newStatus}`,

      order: updatedOrder,
    });
  } catch (error) {
    console.error(
      "[ORDER_STATUS_UPDATE_ERROR]",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update order status",
      },
      { status: 500 }
    );
  }
}