import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
});

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = "INR", guestEmail, guestPhone, guestName } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid order amount" },
        { status: 400 }
      );
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // convert INR to paise
      currency,
      receipt: `receipt_${Date.now()}`,
    });

    const count = await prisma.order.count();
    const orderNumber = `CHP-ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        guestEmail,
        guestPhone,
        guestName,
        paymentId: razorpayOrder.id,
        subtotal: amount,
        shippingCost: 0,
        tax: 0,
        total: amount,
        currency,
        shippingName: guestName || "Customer",
        shippingAddress: "To be updated",
        shippingCity: "Chopal",
        shippingState: "Himachal Pradesh",
        shippingPincode: "171211",
        shippingPhone: guestPhone || "0000000000",
      },
    });

    return NextResponse.json({
      id: razorpayOrder.id,
      orderId: razorpayOrder.id,
      dbOrderId: order.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Payment Order Creation Error:", error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}
