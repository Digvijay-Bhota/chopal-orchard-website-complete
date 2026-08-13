"use client";

/**
 * AppleShowcase.tsx
 * ───────────────────────────────────────────────
 * Interactive product grid showcasing apple varieties.
 * Integrated with Razorpay Checkout Engine & Router Navigation.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Calendar,
  Leaf,
  Sun,
  ShoppingBag,
  Check,
  AlertCircle,
  ChevronRight,
  Star,
  Filter,
  TrendingUp,
  Package,
  Mountain,
  Bell,
  Loader2,
} from "lucide-react";

// ─── Types ─────────────────────────────────────

interface AppleProduct {
  id: string;
  slug: string;
  name: string;
  variety: string;
  tagline: string;
  description: string;
  pricePerKg: number;
  comparePrice?: number;
  stockKg: number;
  isAvailable: boolean;
  isPreOrder: boolean;
  preOrderOpens?: string;
  preOrderCloses?: string;
  harvestStart?: string;
  harvestEnd?: string;
  sweetness: number;
  crispness: number;
  acidity: number;
  image: string;
  certifications: string[];
  originStory: string;
  altitudeMeters: number;
}

// ─── Mock Data ─────────────────────────────────

const APPLE_PRODUCTS: AppleProduct[] = [
  {
    id: "1",
    slug: "royal-delicious-test",
    name: "Royal Delicious",
    variety: "ROYAL_DELICIOUS",
    tagline: "The Crown Jewel of Chopal",
    description:
      "Our signature variety. Deep crimson skin with a honeyed, aromatic flesh. The perfect balance of sweetness and subtle tartness that defines Himalayan apples.",
    pricePerKg: 280,
    comparePrice: 350,
    stockKg: 450,
    isAvailable: true,
    isPreOrder: false,
    harvestStart: "2025-08-15",
    harvestEnd: "2025-10-20",
    sweetness: 9,
    crispness: 8,
    acidity: 5,
    image:
      "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?q=80&w=800&auto=format&fit=crop",
    certifications: ["Organic", "GI Tagged"],
    originStory:
      "Grown on 40-year-old trees in Block A, our Royal Delicious benefits from the highest elevation plots at 2,400m.",
    altitudeMeters: 2400,
  },
  {
    id: "2",
    slug: "red-delicious",
    name: "Red Delicious",
    variety: "RED_DELICIOUS",
    tagline: "Classic Elegance, Mountain Fresh",
    description:
      "America's favorite, perfected in the Himalayas. Bright red, conical shape with a mild sweetness and exceptionally juicy texture.",
    pricePerKg: 250,
    stockKg: 320,
    isAvailable: true,
    isPreOrder: false,
    harvestStart: "2025-08-20",
    harvestEnd: "2025-10-25",
    sweetness: 8,
    crispness: 7,
    acidity: 4,
    image:
      "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?q=80&w=800&auto=format&fit=crop",
    certifications: ["Organic"],
    originStory:
      "Introduced to Chopal in 1982, our Red Delicious has adapted to the unique microclimate, developing deeper color and richer flavor.",
    altitudeMeters: 2350,
  },
  {
    id: "3",
    slug: "golden-delicious",
    name: "Golden Delicious",
    variety: "GOLDEN_DELICIOUS",
    tagline: "Sunshine in Every Bite",
    description:
      "Pale golden skin with a creamy, buttery flesh. Higher natural sugar content makes it ideal for fresh eating and baking alike.",
    pricePerKg: 260,
    comparePrice: 320,
    stockKg: 180,
    isAvailable: true,
    isPreOrder: false,
    harvestStart: "2025-09-01",
    harvestEnd: "2025-10-30",
    sweetness: 10,
    crispness: 6,
    acidity: 3,
    image:
      "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?q=80&w=800&auto=format&fit=crop",
    certifications: ["Organic", "Export Grade"],
    originStory:
      "Our Golden Delicious thrives in the sun-drenched south-facing slopes, developing their signature honey-like sweetness.",
    altitudeMeters: 2320,
  },
  {
    id: "4",
    slug: "dark-baron",
    name: "Dark Baron",
    variety: "DARK_BARON",
    tagline: "Single-Origin. Limited Edition.",
    description:
      "An exclusive single-origin variety found only in our highest orchard blocks. Near-black skin with an intensely complex flavor profile.",
    pricePerKg: 450,
    stockKg: 0,
    isAvailable: false,
    isPreOrder: true,
    preOrderOpens: "2025-07-01",
    preOrderCloses: "2025-08-10",
    harvestStart: "2025-09-15",
    harvestEnd: "2025-10-10",
    sweetness: 7,
    crispness: 9,
    acidity: 8,
    image:
      "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?q=80&w=800&auto=format&fit=crop",
    certifications: ["Organic", "Single Origin", "Limited Release"],
    originStory:
      "Discovered as a natural mutation in Block D, only 200 trees produce this rare variety. Each box is numbered and signed by the orchardist.",
    altitudeMeters: 2480,
  },
];

const VARIETY_FILTERS = [
  { label: "All Varieties", value: "ALL" },
  { label: "Available Now", value: "AVAILABLE" },
  { label: "Pre-Order", value: "PREORDER" },
];

// ─── Utility: Countdown Timer ──────────────────

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!targetDate) {
      return;
    }

    const target = new Date(targetDate).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
        return;
      }

      setTimeLeft({
        days: Math.floor(
          diff / (1000 * 60 * 60 * 24)
        ),
        hours: Math.floor(
          (diff % (1000 * 60 * 60 * 24)) /
            (1000 * 60 * 60)
        ),
        minutes: Math.floor(
          (diff % (1000 * 60 * 60)) /
            (1000 * 60)
        ),
        seconds: Math.floor(
          (diff % (1000 * 60)) / 1000
        ),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

// ─── Rating Meter Component ────────────────────

function RatingMeter({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-3.5 h-3.5 ${color}`} />
          <span className="text-mist-600 text-xs font-medium">
            {label}
          </span>
        </div>

        <span className="text-mist-800 text-xs font-bold">
          {value}/10
        </span>
      </div>

      <div className="h-1.5 bg-mist-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${value * 10}%` }}
          viewport={{ once: true }}
          transition={{
            duration: 1,
            ease: "easeOut",
            delay: 0.3,
          }}
          className={`h-full rounded-full ${
            value >= 8
              ? "bg-emerald-500"
              : value >= 6
              ? "bg-gold-500"
              : "bg-orange-400"
          }`}
        />
      </div>
    </div>
  );
}

// ─── Product Card ──────────────────────────────

function ProductCard({
  product,
  index,
  customer,
}: {
  product: AppleProduct;
  index: number;
  customer: {
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    shippingAddress: string;
    shippingCity: string;
    shippingState: string;
    shippingPincode: string;
  };
}) {
  const router = useRouter();

  const [quantity, setQuantity] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const countdown = useCountdown(
    product.isPreOrder && product.preOrderOpens
      ? product.preOrderOpens
      : product.harvestStart || ""
  );

  // ─── Razorpay Payment ────────────────────────

  const handlePayment = async (
    amount: number,
    productName: string,
    productSlug: string,
    quantityKg: number
  ) => {
    try {
      setIsLoading(true);

      if (!customerInfoComplete) {
        throw new Error(
          "Please complete all delivery details before payment."
        );
      }

      if (!Number.isFinite(quantityKg) || quantityKg <= 0) {
        throw new Error("Please select a valid quantity.");
      }

      // 1. Create database order + Razorpay order
      const res = await fetch(
        "/api/payment/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            currency: "INR",
            productSlug,
            productName,
            quantityKg,
            guestName: customer.guestName.trim(),
            guestEmail: customer.guestEmail.trim(),
            guestPhone: customer.guestPhone.trim(),
            shippingAddress: customer.shippingAddress.trim(),
            shippingCity: customer.shippingCity.trim(),
            shippingState: customer.shippingState.trim(),
            shippingPincode: customer.shippingPincode.trim(),
          }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error || "Failed to create Razorpay order."
        );
      }

      if (
        !data?.success ||
        !data?.razorpayOrderId ||
        !data?.dbOrderId ||
        !data?.amount ||
        !data?.keyId
      ) {
        console.error(
          "[PAYMENT_ORDER_INVALID_RESPONSE]",
          data
        );

        throw new Error(
          "Payment order was created incorrectly. Please try again."
        );
      }

      console.log("[PAYMENT_ORDER_CREATED]", {
        dbOrderId: data.dbOrderId,
        orderNumber: data.orderNumber,
        razorpayOrderId: data.razorpayOrderId,
      });

      // 2. Make sure Razorpay Checkout is available
      if (!(window as any).Razorpay) {
        throw new Error(
          "Razorpay checkout is not loaded. Please refresh the page and try again."
        );
      }

      // 3. Open Razorpay Checkout modal
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency || "INR",
        name: "Chopal Apple Orchard",
        description: `Order for ${productName} (${quantityKg} kg)`,

        // IMPORTANT: always use the Razorpay Order ID returned by our server.
        order_id: data.razorpayOrderId,

        prefill: {
          name: customer.guestName.trim(),
          email: customer.guestEmail.trim(),
          contact: customer.guestPhone.trim(),
        },

        notes: {
          shipping_address: customer.shippingAddress.trim(),
          shipping_city: customer.shippingCity.trim(),
          shipping_state: customer.shippingState.trim(),
          shipping_pincode: customer.shippingPincode.trim(),
        },

        handler: async function (response: any) {
          try {
            console.log("[RAZORPAY_PAYMENT_SUCCESS]", {
              razorpayOrderId: response?.razorpay_order_id,
              razorpayPaymentId: response?.razorpay_payment_id,
            });

            // 4. Validate Razorpay response
            if (
              !response?.razorpay_order_id ||
              !response?.razorpay_payment_id ||
              !response?.razorpay_signature
            ) {
              throw new Error(
                "Razorpay returned an incomplete payment response."
              );
            }

            // 5. Verify Razorpay payment on the server
            const verifyRes = await fetch(
              "/api/payment/verify",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              }
            );

            const verifyData = await verifyRes
              .json()
              .catch(() => null);

            if (!verifyRes.ok || !verifyData?.success) {
              console.error("[PAYMENT_VERIFICATION_FAILED]", {
                status: verifyRes.status,
                error: verifyData?.error,
              });

              throw new Error(
                verifyData?.error ||
                  "Payment verification failed."
              );
            }

            // 6. Make sure the verified Razorpay order belongs to
            // the database order we created above.
            if (
              verifyData.razorpayOrderId &&
              verifyData.razorpayOrderId !== data.razorpayOrderId
            ) {
              console.error("[PAYMENT_ORDER_MISMATCH]", {
                expected: data.razorpayOrderId,
                received: verifyData.razorpayOrderId,
              });

              throw new Error(
                "Payment order verification mismatch."
              );
            }

            setAddedToCart(true);

            // IMPORTANT: use OUR Prisma database order ID,
            // never the Razorpay order ID, for the success page.
            const dbOrderId =
              verifyData.orderId || data.dbOrderId;

            if (!dbOrderId) {
              throw new Error(
                "Database order ID was not returned."
              );
            }

            router.push(
              `/checkout/success?orderId=${encodeURIComponent(
                dbOrderId
              )}`
            );
          } catch (verificationError) {
            console.error(
              "[PAYMENT_VERIFICATION_ERROR]",
              verificationError
            );

            alert(
              verificationError instanceof Error
                ? verificationError.message
                : "Payment was completed, but order verification failed. Please contact support."
            );
          }
        },

        theme: {
          color: "#a82626",
        },

        modal: {
          ondismiss: function () {
            console.log("[RAZORPAY_CHECKOUT_DISMISSED]");
            setIsLoading(false);
          },
        },
      };

      // 7. Create Razorpay instance
      const razorpay = new (window as any).Razorpay(options);

      // 8. Handle payment failure
      razorpay.on(
        "payment.failed",
        function (response: any) {
          console.error(
            "[RAZORPAY_PAYMENT_FAILED]",
            response?.error || response
          );

          alert(
            response?.error?.description ||
              "Payment failed. Please try again."
          );

          setIsLoading(false);
        }
      );

      razorpay.open();
    } catch (err) {
      console.error("[PAYMENT_TRIGGER_ERROR]", err);

      alert(
        err instanceof Error
          ? err.message
          : "Could not process payment. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isInStock = product.stockKg > 0;

  const customerInfoComplete =
    customer.guestName.trim().length > 0 &&
    customer.guestEmail.trim().length > 0 &&
    customer.guestPhone.trim().length > 0 &&
    customer.shippingAddress.trim().length > 0 &&
    customer.shippingCity.trim().length > 0 &&
    customer.shippingState.trim().length > 0 &&
    customer.shippingPincode.trim().length > 0;

  const stockPercentage = Math.min(
    (product.stockKg / 500) * 100,
    100
  );

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 40,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        margin: "-50px",
      }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
      }}
      onMouseEnter={() =>
        setIsHovered(true)
      }
      onMouseLeave={() =>
        setIsHovered(false)
      }
      className="group relative bg-white rounded-3xl overflow-hidden border border-mist-200 hover:border-mist-300 hover:shadow-xl hover:shadow-mist-950/5 transition-all duration-500"
    >
      {/* Image Section */}

      <div className="relative h-64 overflow-hidden">
        <motion.img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          animate={{
            scale: isHovered ? 1.08 : 1,
          }}
          transition={{
            duration: 0.6,
            ease: "easeOut",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-mist-950/60 via-transparent to-transparent" />

        {/* Badges */}

        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {product.certifications.map(
            (cert) => (
              <span
                key={cert}
                className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-mist-800"
              >
                {cert}
              </span>
            )
          )}
        </div>

        {/* Availability Badge */}

        <div className="absolute top-4 right-4">
          {product.isPreOrder ? (
            <span className="px-3 py-1.5 bg-gold-500 text-white rounded-full text-xs font-bold flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Pre-Order
            </span>
          ) : isInStock ? (
            <span className="px-3 py-1.5 bg-emerald-500 text-white rounded-full text-xs font-bold flex items-center gap-1.5">
              <Leaf className="w-3 h-3" />
              In Stock
            </span>
          ) : (
            <span className="px-3 py-1.5 bg-mist-500 text-white rounded-full text-xs font-bold flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3" />
              Sold Out
            </span>
          )}
        </div>

        {/* Origin Story Overlay */}

        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="absolute inset-0 bg-mist-950/80 backdrop-blur-sm flex items-end p-6"
            >
              <div>
                <p className="text-gold-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  Origin Story
                </p>

                <p className="text-mist-100 text-sm leading-relaxed">
                  {product.originStory}
                </p>

                <div className="flex items-center gap-2 mt-3">
                  <Mountain className="w-4 h-4 text-mist-400" />

                  <span className="text-mist-300 text-xs">
                    {product.altitudeMeters}m
                    elevation
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content Section */}

      <div className="p-6">
        <div className="mb-4">
          <h3 className="font-serif text-xl font-bold text-mist-900 mb-1">
            {product.name}
          </h3>

          <p className="text-ruby-700 text-sm font-medium">
            {product.tagline}
          </p>
        </div>

        <p className="text-mist-600 text-sm leading-relaxed mb-5 line-clamp-2">
          {product.description}
        </p>

        <div className="space-y-3 mb-5">
          <RatingMeter
            label="Sweetness"
            value={product.sweetness}
            color="text-gold-500"
            icon={Star}
          />

          <RatingMeter
            label="Crispness"
            value={product.crispness}
            color="text-emerald-500"
            icon={TrendingUp}
          />

          <RatingMeter
            label="Acidity"
            value={product.acidity}
            color="text-orange-500"
            icon={Sun}
          />
        </div>

        <div className="bg-mist-50 rounded-xl p-3 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-pine-700" />

            <span className="text-mist-700 text-xs font-semibold">
              Harvest Season
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-mist-600">
              {product.harvestStart
                ? new Date(
                    product.harvestStart
                  ).toLocaleDateString(
                    "en-IN",
                    {
                      month: "short",
                      day: "numeric",
                    }
                  )
                : "TBA"}
            </span>

            <div className="flex-1 mx-3 h-1 bg-mist-200 rounded-full overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-pine-400 to-gold-400 rounded-full" />
            </div>

            <span className="text-mist-600">
              {product.harvestEnd
                ? new Date(
                    product.harvestEnd
                  ).toLocaleDateString(
                    "en-IN",
                    {
                      month: "short",
                      day: "numeric",
                    }
                  )
                : "TBA"}
            </span>
          </div>
        </div>

        {isInStock &&
          !product.isPreOrder && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-mist-600 flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  Stock Available
                </span>

                <span
                  className={`font-bold ${
                    stockPercentage < 20
                      ? "text-ruby-600"
                      : "text-emerald-600"
                  }`}
                >
                  {product.stockKg} kg left
                </span>
              </div>

              <div className="h-1.5 bg-mist-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{
                    width: 0,
                  }}
                  whileInView={{
                    width: `${stockPercentage}%`,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    duration: 1,
                    delay: 0.5,
                  }}
                  className={`h-full rounded-full ${
                    stockPercentage < 20
                      ? "bg-ruby-500"
                      : "bg-emerald-500"
                  }`}
                />
              </div>
            </div>
          )}

        {product.isPreOrder && (
          <div className="bg-gold-50 border border-gold-200 rounded-xl p-3 mb-4">
            <p className="text-gold-800 text-xs font-semibold mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Pre-Order Opens In
            </p>

            <div className="grid grid-cols-4 gap-2">
              {[
                {
                  value: countdown.days,
                  label: "Days",
                },
                {
                  value: countdown.hours,
                  label: "Hrs",
                },
                {
                  value: countdown.minutes,
                  label: "Min",
                },
                {
                  value: countdown.seconds,
                  label: "Sec",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white rounded-lg py-2 text-center"
                >
                  <span className="text-gold-700 text-lg font-bold block">
                    {String(
                      item.value
                    ).padStart(2, "0")}
                  </span>

                  <span className="text-gold-600 text-[10px] uppercase">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price & Action */}

        <div className="flex items-end justify-between pt-4 border-t border-mist-100">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-mist-900">
                ₹{product.pricePerKg * quantity}
              </span>

              <span className="text-mist-500 text-sm">
                / {quantity} kg
              </span>
            </div>

            {product.comparePrice && (
              <span className="text-mist-400 text-sm line-through">
                ₹
                {product.comparePrice *
                  quantity}
              </span>
            )}
          </div>

          {/* Pre-Order */}

          {product.isPreOrder ? (
            <button
              type="button"
              onClick={() =>
                handlePayment(
                  product.pricePerKg *
                    quantity,
                  product.name,
                  product.slug,
                  quantity
                )
              }
              disabled={
                isLoading ||
                addedToCart ||
                !customerInfoComplete
              }
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                addedToCart
                  ? "bg-emerald-500 text-white"
                  : "bg-gold-600 hover:bg-gold-500 text-white hover:shadow-lg hover:shadow-gold-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : addedToCart ? (
                <>
                  <Check className="w-4 h-4" />
                  Pre-Ordered
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  Pre-Order
                </>
              )}
            </button>
          ) : isInStock ? (
            <div className="flex items-center gap-3">
              {/* Quantity */}

              <div className="flex items-center border border-mist-300 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() =>
                    setQuantity(
                      Math.max(
                        1,
                        quantity - 1
                      )
                    )
                  }
                  className="px-3 py-2 text-mist-600 hover:bg-mist-100 transition-colors"
                >
                  −
                </button>

                <span className="px-3 py-2 text-sm font-semibold text-mist-800 min-w-[40px] text-center">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity(
                      quantity + 1
                    )
                  }
                  className="px-3 py-2 text-mist-600 hover:bg-mist-100 transition-colors"
                >
                  +
                </button>
              </div>

              {/* Add / Pay */}

              <button
                type="button"
                onClick={() =>
                  handlePayment(
                    product.pricePerKg *
                      quantity,
                    product.name,
                    product.slug,
                    quantity
                  )
                }
                disabled={
                  isLoading ||
                  addedToCart ||
                  !customerInfoComplete
                }
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                  addedToCart
                    ? "bg-emerald-500 text-white"
                    : "bg-ruby-700 hover:bg-ruby-600 text-white hover:shadow-lg hover:shadow-ruby-700/30 disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : addedToCart ? (
                  <>
                    <Check className="w-4 h-4" />
                    Paid
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    Add
                  </>
                )}
              </button>
            </div>
          ) : (
            <span className="text-mist-400 text-sm font-medium">
              Restocking Soon
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────

export default function AppleShowcase() {
  const [activeFilter, setActiveFilter] =
    useState("ALL");

  const [guestName, setGuestName] =
    useState("");

  const [guestEmail, setGuestEmail] =
    useState("");

  const [guestPhone, setGuestPhone] =
    useState("");

  const [shippingAddress, setShippingAddress] =
    useState("");

  const [shippingCity, setShippingCity] =
    useState("");

  const [shippingState, setShippingState] =
    useState("");

  const [shippingPincode, setShippingPincode] =
    useState("");

  const [mobileFilterOpen, setMobileFilterOpen] =
    useState(false);

  const customerInfoComplete =
    guestName.trim().length > 0 &&
    guestEmail.trim().length > 0 &&
    guestPhone.trim().length > 0 &&
    shippingAddress.trim().length > 0 &&
    shippingCity.trim().length > 0 &&
    shippingState.trim().length > 0 &&
    shippingPincode.trim().length > 0;

  const [products, setProducts] =
    useState<AppleProduct[]>(APPLE_PRODUCTS);

  const [productsLoading, setProductsLoading] =
    useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch(
          "/api/products",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load products"
          );
        }

        const databaseProducts =
          await response.json();

        if (
          !Array.isArray(databaseProducts) ||
          databaseProducts.length === 0
        ) {
          return;
        }

        const mergedProducts =
          APPLE_PRODUCTS.map(
            (fallbackProduct) => {
              const dbProduct =
                databaseProducts.find(
                  (item: any) =>
                    item.slug ===
                    fallbackProduct.slug
                );

              if (!dbProduct) {
                return fallbackProduct;
              }

              return {
                ...fallbackProduct,

                id: dbProduct.id,
                slug: dbProduct.slug,
                name: dbProduct.name,
                variety: dbProduct.variety,

                pricePerKg:
                  Number(
                    dbProduct.pricePerKg
                  ),

                comparePrice:
                  dbProduct.comparePrice != null
                    ? Number(
                        dbProduct.comparePrice
                      )
                    : undefined,

                stockKg:
                  Number(
                    dbProduct.stockKg
                  ),

                isAvailable:
                  Boolean(
                    dbProduct.isAvailable
                  ),

                isPreOrder:
                  Boolean(
                    dbProduct.isPreOrder
                  ),

                preOrderOpens:
                  dbProduct.preOrderOpens
                    ? String(
                        dbProduct.preOrderOpens
                      )
                    : undefined,

                preOrderCloses:
                  dbProduct.preOrderCloses
                    ? String(
                        dbProduct.preOrderCloses
                      )
                    : undefined,

                harvestStart:
                  dbProduct.harvestStart
                    ? String(
                        dbProduct.harvestStart
                      )
                    : fallbackProduct.harvestStart,

                harvestEnd:
                  dbProduct.harvestEnd
                    ? String(
                        dbProduct.harvestEnd
                      )
                    : fallbackProduct.harvestEnd,

                sweetness:
                  Number(
                    dbProduct.sweetness ??
                      fallbackProduct.sweetness
                  ),

                crispness:
                  Number(
                    dbProduct.crispness ??
                      fallbackProduct.crispness
                  ),

                acidity:
                  Number(
                    dbProduct.acidity ??
                      fallbackProduct.acidity
                  ),

                certifications:
                  Array.isArray(
                    dbProduct.certifications
                  )
                    ? dbProduct.certifications
                    : fallbackProduct.certifications,

                originStory:
                  dbProduct.originStory ||
                  fallbackProduct.originStory,

                altitudeMeters:
                  Number(
                    dbProduct.altitudeMeters ??
                      fallbackProduct.altitudeMeters
                  ),

                image:
                  Array.isArray(
                    dbProduct.images
                  ) &&
                  dbProduct.images.length > 0
                    ? dbProduct.images[0]
                    : fallbackProduct.image,
              };
            }
          );

        setProducts(mergedProducts);
      } catch (error) {
        console.error(
          "Failed to load database products:",
          error
        );
      } finally {
        setProductsLoading(false);
      }
    }

    loadProducts();
  }, []);

  const filteredProducts =
    products.filter((p) => {
      if (
        activeFilter === "AVAILABLE"
      ) {
        return (
          p.isAvailable &&
          !p.isPreOrder
        );
      }

      if (
        activeFilter === "PREORDER"
      ) {
        return p.isPreOrder;
      }

      return true;
    });

  return (
    <section
      id="our-apples"
      className="py-24 px-6 md:px-12 bg-mist-50"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.7,
          }}
          className="text-center mb-16"
        >
          <span className="text-ruby-700 text-sm font-semibold uppercase tracking-widest mb-3 block">
            Our Harvest
          </span>

          <h2 className="font-serif text-4xl md:text-5xl font-bold text-mist-900 mb-4">
            Premium Apple Varieties
          </h2>

          <p className="text-mist-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Each variety is cultivated with care
            in our high-altitude orchards,
            benefiting from Chopal&apos;s unique
            climate and mineral-rich Himalayan
            soil.
          </p>
        </motion.div>

        <div className="flex items-center justify-between mb-10">
          <div className="hidden md:flex items-center gap-2">
            {VARIETY_FILTERS.map(
              (filter) => (
                <button
                  type="button"
                  key={filter.value}
                  onClick={() =>
                    setActiveFilter(
                      filter.value
                    )
                  }
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeFilter ===
                    filter.value
                      ? "bg-mist-900 text-mist-50 shadow-lg"
                      : "bg-white text-mist-600 hover:bg-mist-100 border border-mist-200"
                  }`}
                >
                  {filter.label}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              setMobileFilterOpen(
                !mobileFilterOpen
              )
            }
            className="md:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-mist-200 rounded-full text-sm font-medium text-mist-700"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>

          <span className="text-mist-500 text-sm">
            {filteredProducts.length} varieties
          </span>
        </div>

        <AnimatePresence>
          {mobileFilterOpen && (
            <motion.div
              initial={{
                height: 0,
                opacity: 0,
              }}
              animate={{
                height: "auto",
                opacity: 1,
              }}
              exit={{
                height: 0,
                opacity: 0,
              }}
              className="md:hidden overflow-hidden mb-6"
            >
              <div className="bg-white rounded-2xl border border-mist-200 p-2 space-y-1">
                {VARIETY_FILTERS.map(
                  (filter) => (
                    <button
                      type="button"
                      key={filter.value}
                      onClick={() => {
                        setActiveFilter(
                          filter.value
                        );
                        setMobileFilterOpen(
                          false
                        );
                      }}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium text-left transition-all ${
                        activeFilter ===
                        filter.value
                          ? "bg-mist-900 text-mist-50"
                          : "text-mist-600 hover:bg-mist-50"
                      }`}
                    >
                      {filter.label}
                    </button>
                  )
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ==========================================================
            CUSTOMER + DELIVERY DETAILS
           ========================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 bg-white rounded-3xl border border-mist-200 shadow-sm p-6 md:p-8"
        >
          <div className="mb-6">
            <h3 className="font-serif text-2xl font-bold text-mist-900">
              Delivery Details
            </h3>
            <p className="text-mist-600 text-sm mt-1">
              Enter your details before choosing a variety and paying.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="block">
              <span className="block text-sm font-semibold text-mist-700 mb-2">
                Full Name *
              </span>
              <input
                type="text"
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder="Your full name"
                autoComplete="name"
                className="w-full rounded-xl border border-mist-300 bg-white px-4 py-3 text-sm text-mist-900 outline-none transition focus:border-ruby-500 focus:ring-2 focus:ring-ruby-500/10"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-semibold text-mist-700 mb-2">
                Email *
              </span>
              <input
                type="email"
                value={guestEmail}
                onChange={(event) => setGuestEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-xl border border-mist-300 bg-white px-4 py-3 text-sm text-mist-900 outline-none transition focus:border-ruby-500 focus:ring-2 focus:ring-ruby-500/10"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-semibold text-mist-700 mb-2">
                Phone *
              </span>
              <input
                type="tel"
                value={guestPhone}
                onChange={(event) => setGuestPhone(event.target.value)}
                placeholder="10-digit mobile number"
                autoComplete="tel"
                inputMode="tel"
                className="w-full rounded-xl border border-mist-300 bg-white px-4 py-3 text-sm text-mist-900 outline-none transition focus:border-ruby-500 focus:ring-2 focus:ring-ruby-500/10"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-semibold text-mist-700 mb-2">
                Pincode *
              </span>
              <input
                type="text"
                value={shippingPincode}
                onChange={(event) => setShippingPincode(event.target.value)}
                placeholder="171211"
                autoComplete="postal-code"
                inputMode="numeric"
                maxLength={6}
                className="w-full rounded-xl border border-mist-300 bg-white px-4 py-3 text-sm text-mist-900 outline-none transition focus:border-ruby-500 focus:ring-2 focus:ring-ruby-500/10"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="block text-sm font-semibold text-mist-700 mb-2">
                Shipping Address *
              </span>
              <textarea
                value={shippingAddress}
                onChange={(event) => setShippingAddress(event.target.value)}
                placeholder="House / village / street / landmark"
                autoComplete="street-address"
                rows={3}
                className="w-full rounded-xl border border-mist-300 bg-white px-4 py-3 text-sm text-mist-900 outline-none transition focus:border-ruby-500 focus:ring-2 focus:ring-ruby-500/10 resize-none"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-semibold text-mist-700 mb-2">
                City *
              </span>
              <input
                type="text"
                value={shippingCity}
                onChange={(event) => setShippingCity(event.target.value)}
                placeholder="City"
                autoComplete="address-level2"
                className="w-full rounded-xl border border-mist-300 bg-white px-4 py-3 text-sm text-mist-900 outline-none transition focus:border-ruby-500 focus:ring-2 focus:ring-ruby-500/10"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-semibold text-mist-700 mb-2">
                State *
              </span>
              <input
                type="text"
                value={shippingState}
                onChange={(event) => setShippingState(event.target.value)}
                placeholder="State"
                autoComplete="address-level1"
                className="w-full rounded-xl border border-mist-300 bg-white px-4 py-3 text-sm text-mist-900 outline-none transition focus:border-ruby-500 focus:ring-2 focus:ring-ruby-500/10"
              />
            </label>
          </div>

          {!customerInfoComplete && (
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>
                Please complete all required delivery details before
                clicking Buy or Pre-Order.
              </p>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {productsLoading && (
            <div className="col-span-full flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-ruby-700" />
              <span className="ml-2 text-mist-600">
                Loading current prices...
              </span>
            </div>
          )}
          <AnimatePresence mode="popLayout">
            {filteredProducts.map(
              (product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  customer={{
                    guestName,
                    guestEmail,
                    guestPhone,
                    shippingAddress,
                    shippingCity,
                    shippingState,
                    shippingPincode,
                  }}
                />
              )
            )}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.6,
            delay: 0.3,
          }}
          className="mt-16 text-center"
        >
          <a
            href="#b2b"
            className="inline-flex items-center gap-2 text-ruby-700 font-semibold hover:text-ruby-600 transition-colors"
          >
            Looking for wholesale quantities?
            <ChevronRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}