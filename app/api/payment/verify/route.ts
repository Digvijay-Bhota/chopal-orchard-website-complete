import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { PaymentStatus, OrderStatus } from "@prisma/client";
import { sendOrderConfirmationEmail } from "@/lib/email";

// Prevents Next.js from evaluating this route statically during `next build`
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, error: "Missing signature fields" }, { status: 400 });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "fallback_secret")
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false, error: "Invalid payment signature" }, { status: 400 });
    }

    // 1. Database Transaction
    const { updateResult, confirmedOrders } = await prisma.$transaction(async (tx) => {
      const pendingOrders = await tx.order.findMany({
        where: {
          paymentId: razorpay_order_id,
          paymentStatus: { not: PaymentStatus.COMPLETED },
        },
        include: { items: true },
      });

      if (pendingOrders.length === 0) {
        return { updateResult: { count: 0 }, confirmedOrders: [] };
      }

      const updateRes = await tx.order.updateMany({
        where: { paymentId: razorpay_order_id },
        data: {
          status: OrderStatus.PROCESSING,
          paymentStatus: PaymentStatus.COMPLETED,
        },
      });

      // Stock Decrement
      for (const order of pendingOrders) {
        if (order.items) {
          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stockKg: { decrement: item.quantityKg || 1 } },
            });
          }
        }
      }

      return { updateResult: updateRes, confirmedOrders: pendingOrders };
    });

    // 2. Trigger Confirmation Email if Order Updated Successfully
    if (updateResult.count > 0 && confirmedOrders.length > 0) {
      const order = confirmedOrders[0] as any;
      await sendOrderConfirmationEmail({
        toEmail: order.guestEmail || "customer@example.com",
        customerName: order.guestName || "Valued Customer",
        orderNumber: order.orderNumber || order.id,
        amountPaid: Number(order.totalPrice || order.amount || 0),
      });
    }

    return NextResponse.json({ success: true, message: "Payment verified and confirmation email sent" });
  } catch (error) {
    console.error("[VERIFY_ERROR]", error);
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}
