import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, NotificationType } from "@prisma/client";
import sgMail from "@sendgrid/mail";
import twilio from "twilio";
import { z } from "zod";

const prisma = new PrismaClient();

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

const notificationSchema = z.object({
  type: z.nativeEnum(NotificationType),
  recipient: z.string().min(1, "Recipient is required"),
  subject: z.string().optional(),
  body: z.string().min(1, "Message body is required"),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const validated = notificationSchema.parse(json);

    let dispatchStatus = "SENT";
    let dispatchError: string | null = null;

    if (validated.type === NotificationType.EMAIL) {
      if (process.env.SENDGRID_API_KEY) {
        await sgMail.send({
          to: validated.recipient,
          from: process.env.SENDGRID_FROM_EMAIL || "orders@chopalorchard.com",
          subject: validated.subject || "Chopal Apple Orchard Update",
          html: `<p>${validated.body}</p>`,
        });
      } else {
        dispatchStatus = "SIMULATED";
      }
    } else if (validated.type === NotificationType.WHATSAPP || validated.type === NotificationType.SMS) {
      if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
        const fromNumber =
          validated.type === NotificationType.WHATSAPP
            ? `whatsapp:${process.env.WHATSAPP_BUSINESS_NUMBER}`
            : process.env.TWILIO_PHONE_NUMBER;

        const toNumber =
          validated.type === NotificationType.WHATSAPP && !validated.recipient.startsWith("whatsapp:")
            ? `whatsapp:${validated.recipient}`
            : validated.recipient;

        await twilioClient.messages.create({
          body: validated.body,
          from: fromNumber,
          to: toNumber,
        });
      } else {
        dispatchStatus = "SIMULATED";
      }
    }

    const log = await prisma.notificationLog.create({
      data: {
        type: validated.type,
        recipient: validated.recipient,
        subject: validated.subject,
        body: validated.body,
        status: dispatchStatus,
        error: dispatchError,
        sentAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, log }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("Notification Dispatch Error:", error);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}