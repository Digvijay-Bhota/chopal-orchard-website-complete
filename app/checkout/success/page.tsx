"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import Link from "next/link";

import {
  CheckCircle2,
  Package,
  ArrowRight,
  Home,
  Loader2,
  Truck,
  MapPin,
  Clock,
} from "lucide-react";

// ==================================================
// TYPES
// ==================================================

type OrderItem = {
  id: string;

  quantityKg:
    | string
    | number;

  unitPrice:
    | string
    | number;

  totalPrice:
    | string
    | number;

  product?: {
    id: string;
    name: string;
    variety: string;
  } | null;
};

type Order = {
  id: string;

  orderNumber: string;

  status: string;

  paymentStatus: string;

  total:
    | string
    | number;

  currency: string;

  shippingName: string;

  shippingAddress: string;

  shippingCity: string;

  shippingState: string;

  shippingPincode: string;

  shippingPhone: string;

  deliveryDate:
    | string
    | null;

  trackingNumber:
    | string
    | null;

  trackingUrl:
    | string
    | null;

  notes:
    | string
    | null;

  createdAt: string;

  updatedAt: string;

  items?:
    | OrderItem[]
    | null;
};

// ==================================================
// ORDER STATUS STEPS
// ==================================================

const ORDER_STEPS = [
  {
    key: "PROCESSING",

    label: "Processing",

    description:
      "Your order is being prepared",
  },

  {
    key: "PACKED",

    label: "Packed",

    description:
      "Your apples are packed",
  },

  {
    key: "SHIPPED",

    label: "Shipped",

    description:
      "Your order has left the orchard",
  },

  {
    key: "OUT_FOR_DELIVERY",

    label: "Out for Delivery",

    description:
      "Your order is on the way",
  },

  {
    key: "DELIVERED",

    label: "Delivered",

    description:
      "Your order has been delivered",
  },
];

// ==================================================
// STATUS HELPERS
// ==================================================

function getStepIndex(
  status: string
) {
  const index =
    ORDER_STEPS.findIndex(
      (step) =>
        step.key === status
    );

  return index;
}

function getStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "CONFIRMED":
      return "Confirmed";
    case "PROCESSING":
      return "Processing";
    case "PACKED":
      return "Packed";
    case "SHIPPED":
      return "Shipped";
    case "OUT_FOR_DELIVERY":
      return "Out for Delivery";
    case "DELIVERED":
      return "Delivered";
    case "CANCELLED":
      return "Cancelled";
    case "REFUNDED":
      return "Refunded";
    default:
      return status;
  }
}

// ==================================================
// CUSTOMER-FACING STATUS MESSAGE
// ==================================================

function getStatusMessage(status: string) {
  switch (status) {
    case "PENDING":
      return {
        title: "Order Received!",
        description:
          "We've received your order and are waiting for payment confirmation.",
      };
    case "CONFIRMED":
      return {
        title: "Order Confirmed!",
        description:
          "Thank you for your purchase. Your fresh Himalayan apples are confirmed.",
      };
    case "PROCESSING":
      return {
        title: "We're Preparing Your Order!",
        description:
          "Your fresh Himalayan apples are being prepared at the orchard.",
      };
    case "PACKED":
      return {
        title: "Your Order Is Packed!",
        description:
          "Your apples are packed and ready to leave the orchard.",
      };
    case "SHIPPED":
      return {
        title: "Your Order Has Shipped!",
        description:
          "Great news! Your fresh Himalayan apples have left the orchard.",
      };
    case "OUT_FOR_DELIVERY":
      return {
        title: "Your Order Is On the Way!",
        description:
          "Your fresh Himalayan apples are out for delivery.",
      };
    case "DELIVERED":
      return {
        title: "Order Delivered!",
        description:
          "Your fresh farm order has been delivered successfully.",
      };
    case "CANCELLED":
      return {
        title: "Order Cancelled",
        description:
          "This order has been cancelled.",
      };
    case "REFUNDED":
      return {
        title: "Order Refunded",
        description:
          "Your payment for this order has been refunded.",
      };
    default:
      return {
        title: "Order Status Updated",
        description:
          "Your order status has been updated.",
      };
  }
}

// ==================================================
// MONEY FORMATTER
// ==================================================

function formatMoney(
  amount:
    | string
    | number,

  currency: string
) {
  const numericAmount =
    Number(amount);

  if (
    !Number.isFinite(
      numericAmount
    )
  ) {
    return `${currency} 0.00`;
  }

  return `${currency} ${numericAmount.toFixed(
    2
  )}`;
}

// ==================================================
// DATE FORMATTER
// ==================================================

function formatDeliveryDate(
  date:
    | string
    | null
) {
  if (!date) {
    return null;
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return null;
  }

  return parsedDate.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",

      month: "long",

      year: "numeric",
    }
  );
}

// ==================================================
// MAIN CONTENT
// ==================================================

function CheckoutSuccessContent() {
  const searchParams =
    useSearchParams();

  const orderId =
    searchParams.get(
      "orderId"
    );

  const [order, setOrder] =
    useState<Order | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ==================================================
  // FETCH ORDER
  // ==================================================

  useEffect(() => {
    if (!orderId) {
      setLoading(false);

      setError(
        "Order ID is missing."
      );

      return;
    }

    let isMounted = true;

    async function fetchOrder(
      showLoading = false
    ) {
      try {
        if (showLoading) {
          setLoading(true);
        }

        const response =
          await fetch(
            `/api/orders/${encodeURIComponent(
              orderId
            )}`,
            {
              method: "GET",

              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Failed to load order"
          );
        }

        if (!data?.order) {
          throw new Error(
            "Order data was not returned"
          );
        }

        if (isMounted) {
          setOrder(
            data.order
          );

          setError("");
        }
      } catch (error) {
        console.error(
          "[CUSTOMER_ORDER_FETCH_ERROR]",
          error
        );

        if (isMounted) {
          setError(
            error instanceof Error
              ? error.message
              : "Failed to load your order."
          );
        }
      } finally {
        if (
          showLoading &&
          isMounted
        ) {
          setLoading(false);
        }
      }
    }

    // Initial fetch
    fetchOrder(true);

    // ==================================================
    // AUTO REFRESH
    // ==================================================

    const interval =
      window.setInterval(
        () => {
          fetchOrder(false);
        },
        5000
      );

    return () => {
      isMounted = false;

      window.clearInterval(
        interval
      );
    };
  }, [orderId]);

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // ==================================================
  // ERROR
  // ==================================================

  if (
    error ||
    !order
  ) {
    return (
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">

        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Package className="w-9 h-9 text-red-600" />
        </div>

        <h1 className="font-serif text-2xl font-bold text-slate-900 mb-3">
          Order Not Found
        </h1>

        <p className="text-slate-600 text-sm mb-6">
          {error ||
            "We couldn't find this order."}
        </p>

        <Link
          href="/"
          className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md"
        >
          <Home className="w-4 h-4" />

          Return to Home
        </Link>

      </div>
    );
  }

  // ==================================================
  // NORMALIZE ITEMS
  // ==================================================

  const orderItems =
    Array.isArray(
      order.items
    )
      ? order.items
      : [];

  // ==================================================
  // STATUS
  // ==================================================

  const currentStepIndex =
    getStepIndex(
      order.status
    );

  const statusLabel =
    getStatusLabel(
      order.status
    );

  const statusMessage =
    getStatusMessage(
      order.status
    );

  const deliveryDate =
    formatDeliveryDate(
      order.deliveryDate
    );

  const isCancelled =
    order.status ===
    "CANCELLED";

  const isRefunded =
    order.status ===
    "REFUNDED";

  const isDelivered =
    order.status ===
    "DELIVERED";

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8">

      {/* ==================================================
          HEADER
          ================================================== */}

      <div className="text-center">

        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
            isCancelled ||
            isRefunded
              ? "bg-red-100"
              : isDelivered
              ? "bg-emerald-100"
              : "bg-emerald-100"
          }`}
        >

          {isCancelled ||
          isRefunded ? (
            <Package className="w-10 h-10 text-red-600" />
          ) : (
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          )}

        </div>

        <h1 className="font-serif text-3xl font-bold text-slate-900 mb-2">
          {statusMessage.title}
        </h1>

        <p className="text-slate-600 text-sm mb-6">
          {statusMessage.description}
        </p>

      </div>

      {/* ==================================================
          LIVE UPDATE INDICATOR
          ================================================== */}

      {!isCancelled &&
        !isRefunded && (
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-5">

            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />

            <span>
              Order status updates automatically
            </span>

          </div>
        )}

      {/* ==================================================
          ORDER NUMBER
          ================================================== */}

      <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-200/60">

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">

          <Package className="w-4 h-4 text-emerald-600" />

          Order Number

        </div>

        <p className="font-mono text-sm font-semibold text-slate-800 break-all">
          {order.orderNumber}
        </p>

      </div>

      {/* ==================================================
          ORDER STATUS
          ================================================== */}

      <div className="mb-8">

        <div className="flex items-center justify-between mb-4">

          <h2 className="font-semibold text-slate-900">
            Order Status
          </h2>

          <span
            className={`text-sm font-semibold ${
              isCancelled ||
              isRefunded
                ? "text-red-600"
                : "text-emerald-600"
            }`}
          >
            {statusLabel}
          </span>

        </div>

        {/* CANCELLED */}

        {isCancelled && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">

            <p className="font-semibold text-red-700">
              Order Cancelled
            </p>

            <p className="text-sm text-red-600 mt-1">
              This order has been cancelled.
            </p>

          </div>
        )}

        {/* REFUNDED */}

        {isRefunded && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">

            <p className="font-semibold text-amber-700">
              Order Refunded
            </p>

            <p className="text-sm text-amber-600 mt-1">
              Your payment for this order has been refunded.
            </p>

          </div>
        )}

        {/* NORMAL TIMELINE */}

        {!isCancelled &&
          !isRefunded && (
            <div className="space-y-5">

              {ORDER_STEPS.map(
                (
                  step,
                  index
                ) => {

                  const completed =
                    currentStepIndex >=
                    index;

                  const active =
                    currentStepIndex ===
                    index;

                  return (
                    <div
                      key={
                        step.key
                      }
                      className="flex items-start gap-4"
                    >

                      {/* TIMELINE ICON */}

                      <div className="flex flex-col items-center">

                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                            completed
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "bg-white border-slate-300 text-slate-400"
                          }`}
                        >

                          {completed ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <span className="text-xs font-bold">
                              {index +
                                1}
                            </span>
                          )}

                        </div>

                        {index <
                          ORDER_STEPS.length -
                            1 && (
                          <div
                            className={`w-0.5 h-8 ${
                              currentStepIndex >
                              index
                                ? "bg-emerald-600"
                                : "bg-slate-200"
                            }`}
                          />
                        )}

                      </div>

                      {/* TIMELINE TEXT */}

                      <div className="pt-1">

                        <p
                          className={`font-semibold ${
                            active
                              ? "text-emerald-700"
                              : completed
                              ? "text-slate-800"
                              : "text-slate-400"
                          }`}
                        >
                          {
                            step.label
                          }
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {
                            step.description
                          }
                        </p>

                        {active && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600">

                            <Clock className="w-3.5 h-3.5" />

                            <span>
                              Current status
                            </span>

                          </div>
                        )}

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

      </div>

      {/* ==================================================
          PAYMENT
          ================================================== */}

      <div className="bg-slate-50 rounded-2xl p-4 mb-6">

        <div className="flex justify-between items-center">

          <span className="text-sm text-slate-500">
            Payment
          </span>

          <span
            className={`text-sm font-semibold ${
              order.paymentStatus ===
              "COMPLETED"
                ? "text-emerald-600"
                : order.paymentStatus ===
                  "FAILED"
                ? "text-red-600"
                : "text-amber-600"
            }`}
          >
            {order.paymentStatus}
          </span>

        </div>

        {/* PAYMENT ID REMOVED FROM CUSTOMER VIEW */}

        <div className="flex justify-between items-center mt-2">

          <span className="text-sm text-slate-500">
            Total
          </span>

          <span className="font-bold text-slate-900">

            {formatMoney(
              order.total,
              order.currency ||
                "INR"
            )}

          </span>

        </div>

      </div>

      {/* ==================================================
          ORDER ITEMS
          ================================================== */}

      <div className="mb-8">

        <h2 className="font-semibold text-slate-900 mb-4">
          Your Order
        </h2>

        <div className="space-y-3">

          {orderItems.map(
            (item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-4"
              >

                <div>

                  <p className="font-semibold text-slate-900">
                    {item.product?.name ||
                      "Product"}
                  </p>

                  <p className="text-xs text-slate-500 mt-1">

                    {item.product
                      ?.variety ||
                      "—"}

                    {" • "}

                    {item.quantityKg} kg

                  </p>

                </div>

                <p className="font-semibold text-slate-900">

                  {formatMoney(
                    item.totalPrice,
                    order.currency ||
                      "INR"
                  )}

                </p>

              </div>
            )
          )}

          {orderItems.length ===
            0 && (
            <p className="text-sm text-slate-500">
              No order items found.
            </p>
          )}

        </div>

      </div>

      {/* ==================================================
          DELIVERY
          ================================================== */}

      <div className="mb-8">

        <div className="flex items-center gap-2 mb-4">

          <Truck className="w-5 h-5 text-emerald-600" />

          <h2 className="font-semibold text-slate-900">
            Delivery
          </h2>

        </div>

        {/* DELIVERY DATE */}

        {deliveryDate && (
          <div className="bg-slate-50 rounded-xl p-4 mb-3">

            <p className="text-xs text-slate-500 mb-1">

              {isDelivered
                ? "Delivered On"
                : "Expected / Delivery Date"}

            </p>

            <p className="font-semibold text-slate-900">
              {deliveryDate}
            </p>

          </div>
        )}

        {/* TRACKING NUMBER */}

        {order.trackingNumber && (
          <div className="bg-slate-50 rounded-xl p-4 mb-3">

            <p className="text-xs text-slate-500 mb-1">
              Tracking Number
            </p>

            <p className="font-mono font-semibold text-slate-900 break-all">
              {order.trackingNumber}
            </p>

          </div>
        )}

        {/* TRACKING BUTTON */}

        {order.trackingUrl && (
          <a
            href={order.trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold py-3 px-5 rounded-xl transition-colors mb-3"
          >

            <MapPin className="w-4 h-4" />

            Track Shipment

            <ArrowRight className="w-4 h-4" />

          </a>
        )}

        {/* DELIVERY NOTE */}

        {order.notes && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">

            <p className="text-xs text-amber-700 font-semibold mb-1">
              Delivery Note
            </p>

            <p className="text-sm text-slate-700">
              {order.notes}
            </p>

          </div>
        )}

        {/* NO TRACKING YET */}

        {!deliveryDate &&
          !order.trackingNumber &&
          !order.trackingUrl &&
          !order.notes && (
            <div className="bg-slate-50 rounded-xl p-4">

              <p className="text-sm text-slate-500">
                Tracking information will
                appear here once your
                order has been shipped.
              </p>

            </div>
          )}

      </div>

      {/* ==================================================
          SHIPPING ADDRESS
          ================================================== */}

      <div className="mb-8">

        <h2 className="font-semibold text-slate-900 mb-3">
          Delivery Address
        </h2>

        <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">

          <p className="font-semibold text-slate-900">
            {order.shippingName}
          </p>

          <p className="mt-1">
            {order.shippingAddress}
          </p>

          <p>
            {order.shippingCity},{" "}
            {order.shippingState}{" "}
            {order.shippingPincode}
          </p>

          {order.shippingPhone && (
            <p className="mt-1">
              Phone:{" "}
              {order.shippingPhone}
            </p>
          )}

        </div>

      </div>

      {/* ==================================================
          ACTIONS
          ================================================== */}

      <div className="space-y-3">

        <Link
          href="/"
          className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md"
        >

          <Home className="w-4 h-4" />

          Return to Home

        </Link>

        <a
          href="/#our-apples"
          className="w-full inline-flex items-center justify-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium py-2 transition-colors"
        >

          Buy More Apples

          <ArrowRight className="w-4 h-4" />

        </a>

      </div>

    </div>
  );
}

// ==================================================
// PAGE
// ==================================================

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">

      <Suspense
        fallback={
          <div className="flex items-center justify-center p-12">

            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />

          </div>
        }
      >

        <CheckoutSuccessContent />

      </Suspense>

    </div>
  );
}