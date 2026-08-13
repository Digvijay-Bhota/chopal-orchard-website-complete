import { Resend } from "resend";

// ==================================================
// RESEND CLIENT
// ==================================================
//
// Create the client only when an email function is
// actually called. This prevents build-time/static
// evaluation problems when RESEND_API_KEY is not
// available during `next build`.
//

function getResendClient() {
  const apiKey =
    process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

// ==================================================
// ORDER CONFIRMATION EMAIL
// ==================================================

interface OrderEmailProps {
  toEmail: string;
  customerName: string;
  orderNumber: string;
  amountPaid: number;
}

export async function sendOrderConfirmationEmail({
  toEmail,
  customerName,
  orderNumber,
  amountPaid,
}: OrderEmailProps) {
  try {
    const resend =
      getResendClient();

    if (!resend) {
      console.warn(
        "[EMAIL_WARN] RESEND_API_KEY missing. Skipping email dispatch."
      );

      return;
    }

    const emailResponse =
      await resend.emails.send({
        from:
          "Chopal Orchard <onboarding@resend.dev>",

        to: [toEmail],

        subject:
          `Order Confirmed! ${orderNumber} - Chopal Apple Orchard`,

        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8" />

              <style>
                body {
                  font-family:
                    -apple-system,
                    BlinkMacSystemFont,
                    "Segoe UI",
                    Roboto,
                    sans-serif;

                  background-color: #f8fafc;
                  padding: 20px;
                  margin: 0;
                }

                .card {
                  max-width: 500px;
                  margin: 0 auto;
                  background: #ffffff;
                  border-radius: 16px;
                  padding: 32px;
                  border: 1px solid #e2e8f0;
                }

                .header {
                  text-align: center;
                  border-bottom:
                    1px solid #f1f5f9;
                  padding-bottom: 20px;
                }

                .title {
                  color: #16a34a;
                  font-size: 24px;
                  font-weight: bold;
                  margin: 0;
                }

                .content {
                  margin-top: 24px;
                  color: #334155;
                  line-height: 1.6;
                }

                .order-box {
                  background: #f8fafc;
                  border-radius: 12px;
                  padding: 16px;
                  margin: 20px 0;
                  border: 1px solid #e2e8f0;
                }

                .total {
                  font-size: 20px;
                  font-weight: bold;
                  color: #0f172a;
                }

                .footer {
                  text-align: center;
                  margin-top: 32px;
                  font-size: 12px;
                  color: #94a3b8;
                }
              </style>
            </head>

            <body>
              <div class="card">

                <div class="header">
                  <h1 class="title">
                    Order Confirmed! 🍎
                  </h1>
                </div>

                <div class="content">

                  <p>
                    Hi
                    <strong>
                      ${customerName}
                    </strong>,
                  </p>

                  <p>
                    Thank you for buying directly
                    from Chopal Apple Orchard!
                    Your order has been placed
                    and is now being prepared
                    for shipping.
                  </p>

                  <div class="order-box">

                    <p
                      style="
                        margin:0 0 8px 0;
                        font-size:14px;
                        color:#64748b;
                      "
                    >
                      Order Number:
                    </p>

                    <p
                      style="
                        margin:0;
                        font-weight:bold;
                        font-family:monospace;
                      "
                    >
                      ${orderNumber}
                    </p>

                    <hr
                      style="
                        border:none;
                        border-top:
                          1px solid #e2e8f0;
                        margin:12px 0;
                      "
                    />

                    <p
                      style="
                        margin:0;
                        font-size:14px;
                        color:#64748b;
                      "
                    >
                      Amount Paid:
                    </p>

                    <p
                      class="total"
                      style="margin:4px 0 0 0;"
                    >
                      ₹${amountPaid}
                    </p>

                  </div>

                  <p>
                    We will notify you with
                    the shipment tracking details
                    as soon as your fresh
                    Himalayan apples leave
                    our farm.
                  </p>

                </div>

                <div class="footer">
                  <p>
                    Chopal Apple Orchard,
                    Shimla, Himachal Pradesh
                  </p>
                </div>

              </div>
            </body>
          </html>
        `,
      });

    console.log(
      "[EMAIL_SENT_SUCCESS]",
      emailResponse
    );
  } catch (error) {
    console.error(
      "[EMAIL_DISPATCH_FAILED]",
      error
    );
  }
}

// ==================================================
// SHIPPING EMAIL
// ==================================================

interface ShippingEmailProps {
  toEmail: string;
  customerName: string;
  orderNumber: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  deliveryDate?: Date | string | null;
}

export async function sendOrderShippedEmail({
  toEmail,
  customerName,
  orderNumber,
  trackingNumber,
  trackingUrl,
  deliveryDate,
}: ShippingEmailProps) {
  try {
    const resend =
      getResendClient();

    if (!resend) {
      console.warn(
        "[EMAIL_WARN] RESEND_API_KEY missing. Skipping shipping email."
      );

      return;
    }

    const formattedDeliveryDate =
      deliveryDate
        ? new Date(
            deliveryDate
          ).toLocaleDateString(
            "en-IN",
            {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }
          )
        : null;

    const trackingSection =
      trackingNumber
        ? `
          <div class="info-box">

            <p class="label">
              Tracking Number
            </p>

            <p class="tracking-number">
              ${trackingNumber}
            </p>

          </div>
        `
        : "";

    const trackingButton =
      trackingUrl
        ? `
          <div
            style="
              text-align:center;
              margin:28px 0;
            "
          >

            <a
              href="${trackingUrl}"
              class="button"
            >
              Track Shipment
            </a>

          </div>
        `
        : "";

    const deliveryDateSection =
      formattedDeliveryDate
        ? `
          <div class="info-box">

            <p class="label">
              Expected / Delivery Date
            </p>

            <p class="value">
              ${formattedDeliveryDate}
            </p>

          </div>
        `
        : "";

    await resend.emails.send({
      from:
        "Chopal Orchard <onboarding@resend.dev>",

      to: [toEmail],

      subject:
        `Your Order Has Shipped! ${orderNumber} - Chopal Apple Orchard`,

      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />

            <style>
              body {
                font-family:
                  -apple-system,
                  BlinkMacSystemFont,
                  "Segoe UI",
                  Roboto,
                  sans-serif;

                background-color: #f8fafc;
                padding: 20px;
                margin: 0;
              }

              .card {
                max-width: 500px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 16px;
                padding: 32px;
                border: 1px solid #e2e8f0;
              }

              .header {
                text-align: center;
                border-bottom:
                  1px solid #f1f5f9;
                padding-bottom: 20px;
              }

              .title {
                color: #16a34a;
                font-size: 24px;
                font-weight: bold;
                margin: 0;
              }

              .content {
                margin-top: 24px;
                color: #334155;
                line-height: 1.6;
              }

              .order-box {
                background: #f8fafc;
                border-radius: 12px;
                padding: 16px;
                margin: 20px 0;
                border: 1px solid #e2e8f0;
              }

              .info-box {
                background: #f8fafc;
                border-radius: 12px;
                padding: 14px 16px;
                margin: 12px 0;
                border: 1px solid #e2e8f0;
              }

              .label {
                margin: 0 0 4px 0;
                font-size: 13px;
                color: #64748b;
              }

              .value {
                margin: 0;
                font-weight: 600;
                color: #0f172a;
              }

              .tracking-number {
                margin: 0;
                font-weight: bold;
                font-family: monospace;
                color: #0f172a;
              }

              .button {
                display: inline-block;
                background-color: #16a34a;
                color: #ffffff !important;
                text-decoration: none;
                font-weight: 600;
                padding: 12px 24px;
                border-radius: 10px;
              }

              .footer {
                text-align: center;
                margin-top: 32px;
                font-size: 12px;
                color: #94a3b8;
              }
            </style>
          </head>

          <body>
            <div class="card">

              <div class="header">
                <h1 class="title">
                  Your Order Has Shipped! 🍎
                </h1>
              </div>

              <div class="content">

                <p>
                  Hi
                  <strong>
                    ${customerName}
                  </strong>,
                </p>

                <p>
                  Great news! Your fresh
                  Himalayan apples from
                  Chopal Apple Orchard
                  have been shipped.
                </p>

                <div class="order-box">

                  <p
                    style="
                      margin:0 0 8px 0;
                      font-size:14px;
                      color:#64748b;
                    "
                  >
                    Order Number:
                  </p>

                  <p
                    style="
                      margin:0;
                      font-weight:bold;
                      font-family:monospace;
                    "
                  >
                    ${orderNumber}
                  </p>

                </div>

                ${deliveryDateSection}

                ${trackingSection}

                ${trackingButton}

                <p>
                  You can use the tracking
                  information above to
                  follow your shipment.
                </p>

                <p>
                  Thank you for supporting
                  Chopal Apple Orchard.
                </p>

              </div>

              <div class="footer">
                <p>
                  Chopal Apple Orchard,
                  Shimla, Himachal Pradesh
                </p>
              </div>

            </div>
          </body>
        </html>
      `,
    });

    console.log(
      "[SHIPPING_EMAIL_SENT]",
      orderNumber
    );
  } catch (error) {
    console.error(
      "[SHIPPING_EMAIL_FAILED]",
      error
    );
  }
}

// ==================================================
// DELIVERED EMAIL
// ==================================================

interface DeliveredEmailProps {
  toEmail: string;
  customerName: string;
  orderNumber: string;
  deliveryDate?: Date | string | null;
  trackingNumber?: string | null;
}

export async function sendOrderDeliveredEmail({
  toEmail,
  customerName,
  orderNumber,
  deliveryDate,
  trackingNumber,
}: DeliveredEmailProps) {
  try {
    const resend =
      getResendClient();

    if (!resend) {
      console.warn(
        "[EMAIL_WARN] RESEND_API_KEY missing. Skipping delivered email."
      );

      return;
    }

    const formattedDeliveryDate =
      deliveryDate
        ? new Date(
            deliveryDate
          ).toLocaleDateString(
            "en-IN",
            {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }
          )
        : new Date().toLocaleDateString(
            "en-IN",
            {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }
          );

    const trackingSection =
      trackingNumber
        ? `
          <div class="info-box">

            <p class="label">
              Tracking Number
            </p>

            <p class="tracking-number">
              ${trackingNumber}
            </p>

          </div>
        `
        : "";

    await resend.emails.send({
      from:
        "Chopal Orchard <onboarding@resend.dev>",

      to: [toEmail],

      subject:
        `Your Order Has Been Delivered! ${orderNumber} - Chopal Apple Orchard`,

      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />

            <style>
              body {
                font-family:
                  -apple-system,
                  BlinkMacSystemFont,
                  "Segoe UI",
                  Roboto,
                  sans-serif;

                background-color: #f8fafc;
                padding: 20px;
                margin: 0;
              }

              .card {
                max-width: 500px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 16px;
                padding: 32px;
                border: 1px solid #e2e8f0;
              }

              .header {
                text-align: center;
                border-bottom:
                  1px solid #f1f5f9;
                padding-bottom: 20px;
              }

              .icon {
                font-size: 42px;
                margin-bottom: 10px;
              }

              .title {
                color: #16a34a;
                font-size: 24px;
                font-weight: bold;
                margin: 0;
              }

              .content {
                margin-top: 24px;
                color: #334155;
                line-height: 1.6;
              }

              .order-box {
                background: #f8fafc;
                border-radius: 12px;
                padding: 16px;
                margin: 20px 0;
                border: 1px solid #e2e8f0;
              }

              .info-box {
                background: #f8fafc;
                border-radius: 12px;
                padding: 14px 16px;
                margin: 12px 0;
                border: 1px solid #e2e8f0;
              }

              .label {
                margin: 0 0 4px 0;
                font-size: 13px;
                color: #64748b;
              }

              .value {
                margin: 0;
                font-weight: 600;
                color: #0f172a;
              }

              .tracking-number {
                margin: 0;
                font-weight: bold;
                font-family: monospace;
                color: #0f172a;
              }

              .success-box {
                background: #ecfdf5;
                border: 1px solid #a7f3d0;
                border-radius: 12px;
                padding: 16px;
                margin: 20px 0;
                color: #065f46;
              }

              .footer {
                text-align: center;
                margin-top: 32px;
                font-size: 12px;
                color: #94a3b8;
              }
            </style>
          </head>

          <body>
            <div class="card">

              <div class="header">

                <div class="icon">
                  🍎
                </div>

                <h1 class="title">
                  Your Order Has Been Delivered!
                </h1>

              </div>

              <div class="content">

                <p>
                  Hi
                  <strong>
                    ${customerName}
                  </strong>,
                </p>

                <div class="success-box">

                  <strong>
                    Your fresh Himalayan
                    apples have been
                    delivered successfully.
                  </strong>

                  <p
                    style="
                      margin:8px 0 0 0;
                    "
                  >
                    We hope you enjoy the
                    taste of Chopal Apple
                    Orchard!
                  </p>

                </div>

                <div class="order-box">

                  <p
                    style="
                      margin:0 0 8px 0;
                      font-size:14px;
                      color:#64748b;
                    "
                  >
                    Order Number:
                  </p>

                  <p
                    style="
                      margin:0;
                      font-weight:bold;
                      font-family:monospace;
                    "
                  >
                    ${orderNumber}
                  </p>

                </div>

                <div class="info-box">

                  <p class="label">
                    Delivered On
                  </p>

                  <p class="value">
                    ${formattedDeliveryDate}
                  </p>

                </div>

                ${trackingSection}

                <p>
                  Thank you for supporting
                  Chopal Apple Orchard and
                  buying directly from
                  our farm.
                </p>

              </div>

              <div class="footer">

                <p>
                  Chopal Apple Orchard,
                  Shimla, Himachal Pradesh
                </p>

              </div>

            </div>
          </body>
        </html>
      `,
    });

    console.log(
      "[DELIVERED_EMAIL_SENT]",
      orderNumber
    );
  } catch (error) {
    console.error(
      "[DELIVERED_EMAIL_FAILED]",
      error
    );
  }
}