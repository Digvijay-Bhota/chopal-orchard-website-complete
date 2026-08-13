import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";
import {
  PaymentStatus,
  OrderStatus,
} from "@prisma/client";
import { sendOrderConfirmationEmail } from "@/lib/email";

// ==================================================
// RAZORPAY CLIENT
// ==================================================

const razorpay = new Razorpay({
  key_id:
    process.env.RAZORPAY_KEY_ID || "",

  key_secret:
    process.env.RAZORPAY_KEY_SECRET || "",
});

// Prevents Next.js from evaluating this route statically during `next build`
export const dynamic = "force-dynamic";

// ==================================================
// HELPERS
// ==================================================

function isValidRazorpayId(
  value: unknown
) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= 100
  );
}

// ==================================================
// POST — Verify Razorpay payment
// ==================================================

export async function POST(
  req: Request
) {
  try {
    // --------------------------------------------------
    // 1. Validate Razorpay configuration
    // --------------------------------------------------

    const razorpayKeyId =
      process.env.RAZORPAY_KEY_ID;

    const razorpaySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (
      !razorpayKeyId ||
      !razorpaySecret
    ) {
      console.error(
        "[VERIFY_CONFIG_ERROR] Razorpay credentials are missing"
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Payment verification is not configured",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 2. Read request body
    // --------------------------------------------------

    let body: unknown;

    try {
      body =
        await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid request body",
        },
        { status: 400 }
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid request body",
        },
        { status: 400 }
      );
    }

    const data =
      body as Record<
        string,
        unknown
      >;

    const razorpayOrderId =
      data.razorpay_order_id;

    const razorpayPaymentId =
      data.razorpay_payment_id;

    const razorpaySignature =
      data.razorpay_signature;

    // --------------------------------------------------
    // 3. Validate Razorpay fields
    // --------------------------------------------------

    if (
      !isValidRazorpayId(
        razorpayOrderId
      ) ||
      !isValidRazorpayId(
        razorpayPaymentId
      ) ||
      !isValidRazorpayId(
        razorpaySignature
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing or invalid payment verification fields",
        },
        { status: 400 }
      );
    }

    const browserOrderId =
      String(
        razorpayOrderId
      ).trim();

    const paymentId =
      String(
        razorpayPaymentId
      ).trim();

    const receivedSignature =
      String(
        razorpaySignature
      ).trim();

    // --------------------------------------------------
    // 4. Find our database order
    //
    // We use the Razorpay Order ID only to locate
    // the order that our server previously created.
    // --------------------------------------------------

    const order =
      await prisma.order.findFirst({
        where: {
          razorpayOrderId:
            browserOrderId,
        },

        include: {
          items: true,
        },
      });

    if (!order) {
      console.error(
        "[VERIFY_ORDER_NOT_FOUND]",
        browserOrderId
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Payment order not found",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 5. Verify the SERVER-STORED Razorpay Order ID
    // --------------------------------------------------

    const serverOrderId =
      order.razorpayOrderId;

    if (!serverOrderId) {
      console.error(
        "[VERIFY_ORDER_ID_MISSING]",
        order.id
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Payment order configuration is invalid",
        },
        { status: 500 }
      );
    }

    if (
      serverOrderId !==
      browserOrderId
    ) {
      console.error(
        "[VERIFY_ORDER_ID_MISMATCH]",
        {
          orderId:
            order.id,

          serverOrderId,

          browserOrderId,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Payment order mismatch",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 6. Verify Razorpay signature
    // --------------------------------------------------

    const signatureBody =
      `${serverOrderId}|${paymentId}`;

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          razorpaySecret
        )
        .update(signatureBody)
        .digest("hex");

    // --------------------------------------------------
    // Timing-safe comparison
    // --------------------------------------------------

    let signatureValid =
      false;

    try {
      const expectedBuffer =
        Buffer.from(
          expectedSignature,
          "hex"
        );

      const receivedBuffer =
        Buffer.from(
          receivedSignature,
          "hex"
        );

      if (
        expectedBuffer.length ===
        receivedBuffer.length
      ) {
        signatureValid =
          crypto.timingSafeEqual(
            expectedBuffer,
            receivedBuffer
          );
      }
    } catch {
      signatureValid = false;
    }

    if (!signatureValid) {
      console.error(
        "[VERIFY_ERROR] Invalid Razorpay signature"
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid payment signature",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 7. Fetch payment directly from Razorpay
    //
    // Signature proves authenticity of the callback.
    //
    // The API fetch verifies the actual payment status,
    // amount, currency, and order association.
    // --------------------------------------------------

    const razorpayPayment =
      await razorpay.payments.fetch(
        paymentId
      );

    // --------------------------------------------------
    // 8. Verify payment belongs to this Razorpay order
    // --------------------------------------------------

    if (
      razorpayPayment.order_id !==
      serverOrderId
    ) {
      console.error(
        "[VERIFY_PAYMENT_ORDER_MISMATCH]",
        {
          paymentId,

          expectedOrderId:
            serverOrderId,

          actualOrderId:
            razorpayPayment.order_id,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Payment does not belong to this order",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 9. Verify payment amount
    // --------------------------------------------------

    const expectedAmount =
      Math.round(
        Number(order.total) * 100
      );

    const actualAmount =
      Number(
        razorpayPayment.amount
      );

    if (
      !Number.isSafeInteger(
        expectedAmount
      ) ||
      actualAmount !==
        expectedAmount
    ) {
      console.error(
        "[VERIFY_AMOUNT_MISMATCH]",
        {
          orderId:
            order.id,

          expectedAmount,

          actualAmount,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Payment amount does not match the order",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 10. Verify currency
    // --------------------------------------------------

    if (
      razorpayPayment.currency !==
      order.currency
    ) {
      console.error(
        "[VERIFY_CURRENCY_MISMATCH]",
        {
          orderId:
            order.id,

          expectedCurrency:
            order.currency,

          actualCurrency:
            razorpayPayment.currency,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Payment currency does not match the order",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 11. Payment must be captured
    //
    // Do not fulfil an order merely because the payment
    // was authorised.
    // --------------------------------------------------

    if (
      razorpayPayment.status !==
      "captured"
    ) {
      console.warn(
        "[VERIFY_PAYMENT_NOT_CAPTURED]",
        {
          orderId:
            order.id,

          paymentId,

          status:
            razorpayPayment.status,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Payment has not been captured yet",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 12. Prevent the same payment from being attached
    // to another database order
    // --------------------------------------------------

    const existingPayment =
      await prisma.order.findFirst({
        where: {
          razorpayPaymentId:
            paymentId,

          NOT: {
            id: order.id,
          },
        },

        select: {
          id: true,
          orderNumber: true,
        },
      });

    if (existingPayment) {
      console.error(
        "[VERIFY_PAYMENT_REUSED]",
        {
          paymentId,

          existingOrderId:
            existingPayment.id,

          existingOrderNumber:
            existingPayment.orderNumber,

          attemptedOrderId:
            order.id,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "This payment has already been used for another order",
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // 13. Process payment atomically
    // --------------------------------------------------

    const result =
      await prisma.$transaction(
        async (tx) => {
          // ------------------------------------------------
          // Re-read the order inside the transaction.
          //
          // This protects the final state transition from
          // races between simultaneous verification requests.
          // ------------------------------------------------

          const currentOrder =
            await tx.order.findUnique({
              where: {
                id: order.id,
              },

              include: {
                items: true,
              },
            });

          if (!currentOrder) {
            throw new Error(
              "Order no longer exists"
            );
          }

          // ------------------------------------------------
          // Already completed
          // ------------------------------------------------

          if (
            currentOrder.paymentStatus ===
            PaymentStatus.COMPLETED
          ) {
            // If this exact payment was already recorded,
            // this is a safe idempotent retry.

            if (
              currentOrder.razorpayPaymentId ===
              paymentId
            ) {
              return {
                alreadyProcessed:
                  true,

                order:
                  currentOrder,
              };
            }

            // A different payment must never overwrite
            // the payment already attached to this order.

            throw new Error(
              "Order has already been paid with a different payment"
            );
          }

          // ------------------------------------------------
          // Only pending payment orders may become paid.
          // ------------------------------------------------

          if (
            currentOrder.paymentStatus !==
            PaymentStatus.PENDING
          ) {
            throw new Error(
              `Order payment status is ${currentOrder.paymentStatus}`
            );
          }

          // ------------------------------------------------
          // Ensure payment ID isn't already attached
          // inside the transaction.
          // ------------------------------------------------

          const duplicatePayment =
            await tx.order.findFirst({
              where: {
                razorpayPaymentId:
                  paymentId,

                NOT: {
                  id: currentOrder.id,
                },
              },

              select: {
                id: true,
                orderNumber: true,
              },
            });

          if (duplicatePayment) {
            throw new Error(
              "Payment has already been used for another order"
            );
          }

          // ------------------------------------------------
          // Mark payment completed
          // ------------------------------------------------

          const updateResult =
            await tx.order.updateMany({
              where: {
                id:
                  currentOrder.id,

                paymentStatus:
                  PaymentStatus.PENDING,

                razorpayOrderId:
                  serverOrderId,
              },

              data: {
                status:
                  OrderStatus.PROCESSING,

                paymentStatus:
                  PaymentStatus.COMPLETED,

                paymentId:
                  paymentId,

                razorpayPaymentId:
                  paymentId,

                paymentMethod:
                  "RAZORPAY",
              },
            });

          if (
            updateResult.count !==
            1
          ) {
            throw new Error(
              "Order payment state changed while verification was processing"
            );
          }

          // ------------------------------------------------
          // Deduct stock exactly once
          // ------------------------------------------------

          for (
            const item of
              currentOrder.items
          ) {
            const quantity =
              Number(
                item.quantityKg
              );

            if (
              !Number.isFinite(
                quantity
              ) ||
              quantity <= 0
            ) {
              throw new Error(
                `Invalid quantity for order item ${item.id}`
              );
            }

            const stockUpdate =
              await tx.product.updateMany(
                {
                  where: {
                    id:
                      item.productId,

                    stockKg: {
                      gte: quantity,
                    },
                  },

                  data: {
                    stockKg: {
                      decrement:
                        quantity,
                    },
                  },
                }
              );

            if (
              stockUpdate.count !==
              1
            ) {
              throw new Error(
                `Insufficient stock for product ${item.productId}`
              );
            }
          }

          // ------------------------------------------------
          // Return the updated order
          // ------------------------------------------------

          const finalOrder =
            await tx.order.findUnique({
              where: {
                id:
                  currentOrder.id,
              },

              include: {
                items: true,
              },
            });

          if (!finalOrder) {
            throw new Error(
              "Failed to load updated order"
            );
          }

          return {
            alreadyProcessed:
              false,

            order:
              finalOrder,
          };
        }
      );

    // --------------------------------------------------
    // 14. Send confirmation email only once
    // --------------------------------------------------

    if (
      !result.alreadyProcessed
    ) {
      const completedOrder =
        result.order;

      if (
        completedOrder.guestEmail
      ) {
        await sendOrderConfirmationEmail(
          {
            toEmail:
              completedOrder.guestEmail,

            customerName:
              completedOrder.guestName ||
              "Valued Customer",

            orderNumber:
              completedOrder.orderNumber,

            amountPaid:
              Number(
                completedOrder.total
              ),
          }
        );
      } else {
        console.warn(
          `[EMAIL_WARN] No customer email for order ${completedOrder.orderNumber}`
        );
      }
    }

    // --------------------------------------------------
    // 15. Success response
    // --------------------------------------------------

    return NextResponse.json({
      success: true,

      alreadyProcessed:
        result.alreadyProcessed,

      message:
        result.alreadyProcessed
          ? "Payment was already verified"
          : "Payment verified successfully",

      orderId:
        result.order.id,

      orderNumber:
        result.order.orderNumber,

      razorpayOrderId:
        serverOrderId,

      razorpayPaymentId:
        paymentId,
    });
  } catch (error) {
    console.error(
      "[VERIFY_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Verification failed",
      },
      { status: 500 }
    );
  }
}