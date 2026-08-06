import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("[WEBHOOK_ERROR] RAZORPAY_WEBHOOK_SECRET is not configured");
      return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ error: "Missing x-razorpay-signature header" }, { status: 400 });
    }

    // 1. Validate Webhook HMAC Signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(bodyText)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("[WEBHOOK_ERROR] Invalid webhook signature mismatch");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // 2. Parse Event Payload
    const eventData = JSON.parse(bodyText);
    const event = eventData.event;

    console.log(`[WEBHOOK_RECEIVED] Event: ${event}`);

    // 3. Handle Payment Completion
    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = eventData.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;

      await prisma.$transaction(async (tx) => {
        const pendingOrders = await tx.order.findMany({
          where: {
            paymentId: razorpayOrderId,
            paymentStatus: { not: PaymentStatus.COMPLETED },
          },
          include: {
            items: true,
          },
        });

        if (pendingOrders.length === 0) return;

        // Update Order status
        await tx.order.updateMany({
          where: { paymentId: razorpayOrderId },
          data: {
            status: OrderStatus.PROCESSING,
            paymentStatus: PaymentStatus.COMPLETED,
          },
        });

        // Decrement Product Stock
        for (const order of pendingOrders) {
          if (order.items && order.items.length > 0) {
            for (const item of order.items) {
              await tx.product.update({
                where: { id: item.productId },
                data: {
                  stockKg: {
                    decrement: item.quantityKg || 1,
                  },
                },
              });
            }
          }
        }
      });

      console.log(`[WEBHOOK_SUCCESS] Updated order and stock for Razorpay Order ID: ${razorpayOrderId}`);
    }

    return NextResponse.json({ success: true, message: "Webhook processed successfully" });
  } catch (error) {
    console.error("[WEBHOOK_CRASH]", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}