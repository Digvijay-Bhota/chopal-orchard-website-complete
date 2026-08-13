import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";

// ==================================================
// HELPERS
// ==================================================

function cleanString(
  value: unknown,
  maxLength: number
) {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const cleaned =
    value.trim();

  if (!cleaned) {
    return null;
  }

  return cleaned.slice(
    0,
    maxLength
  );
}

// ==================================================
// POST — Create Razorpay payment order
// ==================================================

export async function POST(
  request: NextRequest
) {
  try {
    // --------------------------------------------------
    // 1. Validate Razorpay configuration
    // --------------------------------------------------

    const razorpayKeyId =
      process.env.RAZORPAY_KEY_ID;

    const razorpayKeySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (
      !razorpayKeyId ||
      !razorpayKeySecret
    ) {
      console.error(
        "[PAYMENT_CONFIG_ERROR] Razorpay credentials are missing"
      );

      return NextResponse.json(
        {
          error:
            "Payment service is not configured",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 2. Create Razorpay client at request time
    //
    // IMPORTANT:
    // Do NOT initialize Razorpay at module/build time.
    //
    // Netlify and Next.js may evaluate API route modules
    // during `next build`. Creating the client here means
    // Razorpay is initialized only when an actual request
    // reaches this route.
    // --------------------------------------------------

    const razorpay =
      new Razorpay({
        key_id:
          razorpayKeyId,

        key_secret:
          razorpayKeySecret,
      });

    // --------------------------------------------------
    // 3. Read request body
    // --------------------------------------------------

    let body: unknown;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
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

    // --------------------------------------------------
    // 4. Read customer/order fields
    // --------------------------------------------------

    const guestEmail =
      cleanString(
        data.guestEmail,
        254
      );

    const guestPhone =
      cleanString(
        data.guestPhone,
        30
      );

    const guestName =
      cleanString(
        data.guestName,
        100
      );

    const shippingAddress =
      cleanString(
        data.shippingAddress,
        300
      );

    const shippingCity =
      cleanString(
        data.shippingCity,
        100
      );

    const shippingState =
      cleanString(
        data.shippingState,
        100
      );

    const shippingPincode =
      cleanString(
        data.shippingPincode,
        20
      );

    const productSlug =
      cleanString(
        data.productSlug,
        200
      );

    // --------------------------------------------------
    // 5. Validate product
    //
    // IMPORTANT:
    // Product slug is the only client-supplied product
    // identifier we trust.
    //
    // We deliberately do NOT accept productName as a
    // fallback because names are not guaranteed to be
    // unique.
    // --------------------------------------------------

    if (!productSlug) {
      return NextResponse.json(
        {
          error:
            "Product is required",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 6. Validate quantity
    // --------------------------------------------------

    const rawQuantity =
      data.quantityKg;

    const quantity =
      Number(rawQuantity);

    if (
      rawQuantity === null ||
      rawQuantity === undefined ||
      rawQuantity === "" ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Quantity must be greater than 0",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Quantity precision
    //
    // Prevent absurd precision such as:
    // 0.123456789123 kg
    //
    // Keep maximum 3 decimal places.
    // --------------------------------------------------

    const roundedQuantity =
      Math.round(
        quantity * 1000
      ) / 1000;

    if (
      roundedQuantity !==
      quantity
    ) {
      return NextResponse.json(
        {
          error:
            "Quantity can have a maximum of 3 decimal places",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 7. Find product by slug only
    // --------------------------------------------------

    const product =
      await prisma.product.findUnique(
        {
          where: {
            slug: productSlug,
          },
        }
      );

    if (!product) {
      return NextResponse.json(
        {
          error:
            "Product not found",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 8. Check product availability
    // --------------------------------------------------

    if (
      !product.isAvailable &&
      !product.isPreOrder
    ) {
      return NextResponse.json(
        {
          error:
            "Product is currently unavailable",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 9. Check stock
    // --------------------------------------------------

    const availableStock =
      Number(
        product.stockKg
      );

    if (
      !product.isPreOrder &&
      (
        !Number.isFinite(
          availableStock
        ) ||
        availableStock <
          roundedQuantity
      )
    ) {
      return NextResponse.json(
        {
          error:
            `Only ${availableStock} kg is available`,
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 10. Calculate price FROM DATABASE
    //
    // NEVER trust a price sent by the browser.
    // --------------------------------------------------

    const unitPrice =
      Number(
        product.pricePerKg
      );

    if (
      !Number.isFinite(
        unitPrice
      ) ||
      unitPrice <= 0
    ) {
      console.error(
        "[INVALID_PRODUCT_PRICE]",
        {
          productId:
            product.id,

          productSlug:
            product.slug,
        }
      );

      return NextResponse.json(
        {
          error:
            "Product price is invalid",
        },
        { status: 400 }
      );
    }

    const subtotal =
      unitPrice *
      roundedQuantity;

    const shippingCost = 0;

    const tax = 0;

    const total =
      subtotal +
      shippingCost +
      tax;

    // --------------------------------------------------
    // 11. Convert INR to paise
    //
    // Razorpay expects integer currency subunits.
    // --------------------------------------------------

    const amountInPaise =
      Math.round(
        total * 100
      );

    if (
      !Number.isSafeInteger(
        amountInPaise
      ) ||
      amountInPaise < 100
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid payment amount",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 12. Generate internal order number
    // --------------------------------------------------

    const orderNumber =
      `CHP-ORD-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`;

    // --------------------------------------------------
    // 13. Create unique Razorpay receipt
    //
    // Razorpay receipt:
    // - maximum 40 characters
    // - should be unique
    // --------------------------------------------------

    const receipt =
      `chp_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`;

    // --------------------------------------------------
    // 14. Create Razorpay order
    // --------------------------------------------------

    const razorpayOrder =
      await razorpay.orders.create(
        {
          amount:
            amountInPaise,

          currency:
            "INR",

          receipt,

          partial_payment:
            false,
        }
      );

    // --------------------------------------------------
    // 15. Create database order
    //
    // IMPORTANT:
    // Payment is still PENDING.
    //
    // We do NOT mark the order as paid here.
    // --------------------------------------------------

    const order =
      await prisma.order.create({
        data: {
          orderNumber,

          guestEmail,

          guestPhone,

          guestName,

          status:
            "PENDING",

          paymentStatus:
            "PENDING",

          paymentId:
            null,

          razorpayOrderId:
            razorpayOrder.id,

          razorpayPaymentId:
            null,

          paymentMethod:
            "RAZORPAY",

          subtotal,

          shippingCost,

          tax,

          total,

          currency:
            "INR",

          shippingName:
            guestName ||
            "Customer",

          shippingAddress:
            shippingAddress ||
            "To be updated",

          shippingCity:
            shippingCity ||
            "Chopal",

          shippingState:
            shippingState ||
            "Himachal Pradesh",

          shippingPincode:
            shippingPincode ||
            "171211",

          shippingPhone:
            guestPhone ||
            "0000000000",

          items: {
            create: {
              productId:
                product.id,

              quantityKg:
                roundedQuantity,

              unitPrice,

              totalPrice:
                subtotal,
            },
          },
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
    // 16. Return only what the checkout needs
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        id:
          razorpayOrder.id,

        orderId:
          razorpayOrder.id,

        razorpayOrderId:
          razorpayOrder.id,

        dbOrderId:
          order.id,

        orderNumber:
          order.orderNumber,

        amount:
          razorpayOrder.amount,

        currency:
          razorpayOrder.currency,

        keyId:
          razorpayKeyId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "[PAYMENT_ORDER_CREATION_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "Failed to create payment order",
      },
      { status: 500 }
    );
  }
}
