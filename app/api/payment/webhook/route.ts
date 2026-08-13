import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import {
  OrderStatus,
  PaymentStatus,
} from "@prisma/client";
import { sendOrderConfirmationEmail } from "@/lib/email";

// ==================================================
// POST — Razorpay Webhook
// ==================================================

export async function POST(
  req: Request
) {
  try {
    // --------------------------------------------------
    // 1. Read RAW webhook body
    //
    // IMPORTANT:
    // Never use req.json() before signature verification.
    // Razorpay signs the exact raw request body.
    // --------------------------------------------------

    const bodyText =
      await req.text();

    const signature =
      req.headers.get(
        "x-razorpay-signature"
      );

    const eventId =
      req.headers.get(
        "x-razorpay-event-id"
      );

    const webhookSecret =
      process.env
        .RAZORPAY_WEBHOOK_SECRET;

    // --------------------------------------------------
    // 2. Validate webhook configuration
    // --------------------------------------------------

    if (!webhookSecret) {
      console.error(
        "[WEBHOOK_CONFIG_ERROR] RAZORPAY_WEBHOOK_SECRET is not configured"
      );

      return NextResponse.json(
        {
          error:
            "Webhook secret missing",
        },
        { status: 500 }
      );
    }

    if (!signature) {
      return NextResponse.json(
        {
          error:
            "Missing x-razorpay-signature header",
        },
        { status: 400 }
      );
    }

    if (!bodyText) {
      return NextResponse.json(
        {
          error:
            "Empty webhook body",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 3. Verify webhook signature
    // --------------------------------------------------

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          webhookSecret
        )
        .update(bodyText)
        .digest("hex");

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
          signature.trim(),
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
        "[WEBHOOK_ERROR] Invalid webhook signature"
      );

      return NextResponse.json(
        {
          error:
            "Invalid signature",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 4. Parse webhook AFTER signature verification
    // --------------------------------------------------

    let eventData: any;

    try {
      eventData =
        JSON.parse(bodyText);
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid webhook JSON",
        },
        { status: 400 }
      );
    }

    const event =
      eventData?.event;

    // --------------------------------------------------
    // 5. Validate webhook timestamp
    //
    // Razorpay recommends rejecting stale events as a
    // replay-attack guard.
    //
    // created_at is Unix time in seconds.
    // --------------------------------------------------

    const createdAt =
      Number(
        eventData?.created_at
      );

    if (
      !Number.isFinite(
        createdAt
      )
    ) {
      console.error(
        "[WEBHOOK_ERROR] Missing or invalid created_at"
      );

      return NextResponse.json(
        {
          error:
            "Invalid webhook timestamp",
        },
        { status: 400 }
      );
    }

    const nowSeconds =
      Math.floor(
        Date.now() / 1000
      );

    const webhookAge =
      nowSeconds -
      createdAt;

    // Reject events more than 5 minutes old.
    // Also reject timestamps from the future by more
    // than 60 seconds.
    if (
      webhookAge > 5 * 60 ||
      webhookAge < -60
    ) {
      console.warn(
        "[WEBHOOK_REPLAY_GUARD] Rejecting stale/future webhook",
        {
          event,
          eventId,
          createdAt,
          webhookAge,
        }
      );

      return NextResponse.json(
        {
          error:
            "Webhook event is too old or has an invalid timestamp",
        },
        { status: 400 }
      );
    }

    console.log(
      "[WEBHOOK_RECEIVED]",
      {
        event,
        eventId,
      }
    );

    // --------------------------------------------------
    // 6. Ignore unrelated events safely
    //
    // We only process successful payment events here.
    // --------------------------------------------------

    if (
      event !==
        "payment.captured" &&
      event !==
        "order.paid"
    ) {
      console.log(
        `[WEBHOOK_IGNORED] Event: ${event}`
      );

      return NextResponse.json({
        success: true,
        message:
          "Event ignored",
      });
    }

    // --------------------------------------------------
    // 7. Read payment entity
    // --------------------------------------------------

    const paymentEntity =
      eventData?.payload
        ?.payment?.entity;

    if (!paymentEntity) {
      console.error(
        "[WEBHOOK_ERROR] Payment entity missing"
      );

      return NextResponse.json(
        {
          error:
            "Payment entity missing from webhook",
        },
        { status: 400 }
      );
    }

    const razorpayOrderId =
      paymentEntity.order_id;

    const razorpayPaymentId =
      paymentEntity.id;

    const paymentStatus =
      paymentEntity.status;

    const paymentAmount =
      Number(
        paymentEntity.amount
      );

    const paymentCurrency =
      paymentEntity.currency;

    // --------------------------------------------------
    // 8. Validate payment fields
    // --------------------------------------------------

    if (
      typeof razorpayOrderId !==
        "string" ||
      !razorpayOrderId
    ) {
      console.error(
        "[WEBHOOK_ERROR] Razorpay Order ID missing"
      );

      return NextResponse.json(
        {
          error:
            "Razorpay Order ID missing",
        },
        { status: 400 }
      );
    }

    if (
      typeof razorpayPaymentId !==
        "string" ||
      !razorpayPaymentId
    ) {
      console.error(
        "[WEBHOOK_ERROR] Razorpay Payment ID missing"
      );

      return NextResponse.json(
        {
          error:
            "Razorpay Payment ID missing",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 9. Payment must be captured
    // --------------------------------------------------

    if (
      paymentStatus !==
      "captured"
    ) {
      console.warn(
        "[WEBHOOK_PAYMENT_NOT_CAPTURED]",
        {
          event,
          razorpayOrderId,
          razorpayPaymentId,
          paymentStatus,
        }
      );

      return NextResponse.json({
        success: true,
        message:
          "Payment is not captured; event ignored",
      });
    }

    // --------------------------------------------------
    // 10. Find our database order
    // --------------------------------------------------

    const order =
      await prisma.order.findFirst({
        where: {
          razorpayOrderId:
            razorpayOrderId,
        },

        include: {
          items: true,
        },
      });

    if (!order) {
      console.error(
        "[WEBHOOK_ORDER_NOT_FOUND]",
        {
          razorpayOrderId,
          razorpayPaymentId,
        }
      );

      // Return 200 so Razorpay doesn't repeatedly retry
      // an event for an order that doesn't exist in our DB.
      return NextResponse.json({
        success: true,
        message:
          "Order not found; event ignored",
      });
    }

    // --------------------------------------------------
    // 11. Verify Razorpay order association
    // --------------------------------------------------

    if (
      order.razorpayOrderId !==
      razorpayOrderId
    ) {
      console.error(
        "[WEBHOOK_ORDER_MISMATCH]",
        {
          databaseOrderId:
            order.id,
          databaseRazorpayOrderId:
            order.razorpayOrderId,
          webhookRazorpayOrderId:
            razorpayOrderId,
        }
      );

      return NextResponse.json(
        {
          error:
            "Payment order mismatch",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 12. Verify amount
    //
    // Database total is stored in INR.
    // Razorpay amount is stored in paise.
    // --------------------------------------------------

    const expectedAmount =
      Math.round(
        Number(order.total) *
          100
      );

    if (
      !Number.isSafeInteger(
        expectedAmount
      ) ||
      !Number.isFinite(
        paymentAmount
      ) ||
      paymentAmount !==
        expectedAmount
    ) {
      console.error(
        "[WEBHOOK_AMOUNT_MISMATCH]",
        {
          orderId:
            order.id,
          orderNumber:
            order.orderNumber,
          expectedAmount,
          paymentAmount,
        }
      );

      return NextResponse.json(
        {
          error:
            "Payment amount does not match the order",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 13. Verify currency
    // --------------------------------------------------

    if (
      paymentCurrency !==
      order.currency
    ) {
      console.error(
        "[WEBHOOK_CURRENCY_MISMATCH]",
        {
          orderId:
            order.id,
          expectedCurrency:
            order.currency,
          paymentCurrency,
        }
      );

      return NextResponse.json(
        {
          error:
            "Payment currency does not match the order",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 14. Prevent payment reuse
    //
    // The same Razorpay payment must never be attached
    // to another database order.
    // --------------------------------------------------

    const existingPayment =
      await prisma.order.findFirst({
        where: {
          razorpayPaymentId:
            razorpayPaymentId,

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
        "[WEBHOOK_PAYMENT_REUSED]",
        {
          razorpayPaymentId,
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
          error:
            "Payment has already been used for another order",
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // 15. Atomically process payment
    // --------------------------------------------------

    const result =
      await prisma.$transaction(
        async (tx) => {
          // ------------------------------------------------
          // Re-read order inside transaction.
          // ------------------------------------------------

          const currentOrder =
            await tx.order.findUnique({
              where: {
                id:
                  order.id,
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
          //
          // This is a safe duplicate webhook / verify call
          // when the same payment ID was already recorded.
          // ------------------------------------------------

          if (
            currentOrder.paymentStatus ===
            PaymentStatus.COMPLETED
          ) {
            if (
              currentOrder.razorpayPaymentId ===
              razorpayPaymentId
            ) {
              return {
                alreadyProcessed:
                  true,

                order:
                  currentOrder,
              };
            }

            throw new Error(
              "Order has already been paid with a different payment"
            );
          }

          // ------------------------------------------------
          // Never process an already cancelled/refunded
          // order as a normal successful payment.
          // ------------------------------------------------

          if (
            currentOrder.status ===
              OrderStatus.CANCELLED ||
            currentOrder.status ===
              OrderStatus.REFUNDED
          ) {
            console.error(
              "[WEBHOOK_CANCELLED_ORDER_PAYMENT]",
              {
                orderId:
                  currentOrder.id,
                orderNumber:
                  currentOrder.orderNumber,
                status:
                  currentOrder.status,
                razorpayPaymentId,
              }
            );

            // Throwing rolls back the transaction.
            // The outer handler will return an error.
            throw new Error(
              "A captured payment was received for a cancelled or refunded order"
            );
          }

          // ------------------------------------------------
          // Only PENDING payment orders may become paid.
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
          // Check payment reuse again inside transaction.
          // ------------------------------------------------

          const duplicatePayment =
            await tx.order.findFirst({
              where: {
                razorpayPaymentId:
                  razorpayPaymentId,

                NOT: {
                  id:
                    currentOrder.id,
                },
              },

              select: {
                id: true,
                orderNumber:
                  true,
              },
            });

          if (
            duplicatePayment
          ) {
            throw new Error(
              "Payment has already been used for another order"
            );
          }

          // ------------------------------------------------
          // Atomically mark payment completed
          // ------------------------------------------------

          const updateResult =
            await tx.order.updateMany({
              where: {
                id:
                  currentOrder.id,

                razorpayOrderId:
                  razorpayOrderId,

                paymentStatus:
                  PaymentStatus.PENDING,
              },

              data: {
                status:
                  OrderStatus.PROCESSING,

                paymentStatus:
                  PaymentStatus.COMPLETED,

                paymentId:
                  razorpayPaymentId,

                razorpayPaymentId:
                  razorpayPaymentId,

                paymentMethod:
                  "RAZORPAY",
              },
            });

          if (
            updateResult.count !==
            1
          ) {
            throw new Error(
              "Order payment state changed while webhook was processing"
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
                      gte:
                        quantity,
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
          // Load final order
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
    // 16. Send confirmation email only once
    //
    // This is important because webhook and /verify can
    // race with each other.
    // --------------------------------------------------

    if (
      !result.alreadyProcessed
    ) {
      const completedOrder =
        result.order;

      if (
        completedOrder.guestEmail
      ) {
        try {
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
        } catch (emailError) {
          // Payment is already successfully processed.
          // Do not make Razorpay retry the webhook merely
          // because email delivery failed.
          console.error(
            "[WEBHOOK_CONFIRMATION_EMAIL_FAILED]",
            emailError
          );
        }
      } else {
        console.warn(
          `[WEBHOOK_EMAIL_SKIPPED] No customer email for order ${completedOrder.orderNumber}`
        );
      }
    }

    // --------------------------------------------------
    // 17. Successful webhook response
    // --------------------------------------------------

    if (
      result.alreadyProcessed
    ) {
      console.log(
        `[WEBHOOK_SUCCESS] Already processed: ${result.order.orderNumber}`,
        {
          event,
          eventId,
          razorpayPaymentId,
        }
      );
    } else {
      console.log(
        `[WEBHOOK_SUCCESS] Payment completed: ${result.order.orderNumber}`,
        {
          event,
          eventId,
          razorpayPaymentId,
        }
      );
    }

    return NextResponse.json({
      success: true,

      alreadyProcessed:
        result.alreadyProcessed,

      message:
        result.alreadyProcessed
          ? "Payment was already processed"
          : "Webhook processed successfully",
    });
  } catch (error) {
    console.error(
      "[WEBHOOK_CRASH]",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Webhook handler failed",
      },
      { status: 500 }
    );
  }
}