import { Resend } from "resend";

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
    if (!process.env.RESEND_API_KEY) {
      console.warn("[EMAIL_WARN] RESEND_API_KEY missing in .env. Skipping email dispatch.");
      return;
    }

    // Instantiated inside the function so build-time static evaluation won't fail
    const resend = new Resend(process.env.RESEND_API_KEY);

    const emailResponse = await resend.emails.send({
      from: "Chopal Orchard <onboarding@resend.dev>", // Replace with your domain once verified on Resend
      to: [toEmail],
      subject: `Order Confirmed! ${orderNumber} - Chopal Apple Orchard`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 20px; }
              .card { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; }
              .header { text-align: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; }
              .title { color: #16a34a; font-size: 24px; font-weight: bold; margin: 0; }
              .content { margin-top: 24px; color: #334155; line-height: 1.6; }
              .order-box { background: #f8fafc; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0; }
              .total { font-size: 20px; font-weight: bold; color: #0f172a; }
              .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #94a3b8; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="header">
                <h1 class="title">Order Confirmed! 🍎</h1>
              </div>
              <div class="content">
                <p>Hi <strong>${customerName}</strong>,</p>
                <p>Thank you for buying directly from Chopal Apple Orchard! Your order has been placed and is now being prepared for shipping.</p>
                
                <div class="order-box">
                  <p style="margin:0 0 8px 0; font-size: 14px; color: #64748b;">Order Number:</p>
                  <p style="margin:0; font-weight: bold; font-family: monospace;">${orderNumber}</p>
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 12px 0;" />
                  <p style="margin:0; font-size: 14px; color: #64748b;">Amount Paid:</p>
                  <p class="total" style="margin:4px 0 0 0;">₹${amountPaid}</p>
                </div>

                <p>We will notify you with the shipment tracking details as soon as your fresh Himalayan apples leave our farm.</p>
              </div>
              <div class="footer">
                <p>Chopal Apple Orchard, Shimla, Himachal Pradesh</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("[EMAIL_SENT_SUCCESS]", emailResponse);
  } catch (error) {
    console.error("[EMAIL_DISPATCH_FAILED]", error);
  }
}
