import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

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
// GET — Fetch all orders
// ADMIN ONLY
// ==================================================

export async function GET(
  request: NextRequest
) {
  try {
    // --------------------------------------------------
    // 1. Verify admin authentication
    // --------------------------------------------------

    const authError =
      await requireAdmin(request);

    if (authError) {
      return authError;
    }

    // --------------------------------------------------
    // 2. Fetch orders
    // --------------------------------------------------

    const orders =
      await prisma.order.findMany({
        orderBy: {
          createdAt: "desc",
        },

        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },

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
    // 3. Return orders
    // --------------------------------------------------

    return NextResponse.json(
      orders
    );
  } catch (error) {
    console.error(
      "[ADMIN_ORDERS_FETCH_ERROR]",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch orders",
      },
      {
        status: 500,
      }
    );
  }
}