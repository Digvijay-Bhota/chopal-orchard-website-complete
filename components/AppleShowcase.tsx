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
    slug: "royal-delicious",
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
    image: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?q=80&w=800&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?q=80&w=800&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?q=80&w=800&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?q=80&w=800&auto=format&fit=crop",
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
    const target = new Date(targetDate).getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = target - now;
      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
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
          <span className="text-mist-600 text-xs font-medium">{label}</span>
        </div>
        <span className="text-mist-800 text-xs font-bold">{value}/10</span>
      </div>
      <div className="h-1.5 bg-mist-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${value * 10}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
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
}: {
  product: AppleProduct;
  index: number;
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

  const handlePayment = async (amount: number, productName: string) => {
    try {
      setIsLoading(true);

      // 1. Create order on backend
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          guestName: "Customer Name",
          guestEmail: "customer@example.com",
          guestPhone: "9876543210",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create Razorpay order");
      }

      const data = await res.json();

      // 2. Open Razorpay Checkout modal
      const options = {
        key: data.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency || "INR",
        name: "Chopal Apple Orchard",
        description: `Order for ${productName} (${quantity} kg)`,
        order_id: data.orderId || data.id,
        handler: async function (response: any) {
          console.log("[RAZORPAY_RESPONSE]", response);

          // 3. Trigger backend verification to update Supabase
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();

          if (verifyRes.ok && verifyData.success) {
            setAddedToCart(true);
            const dbId = data.dbOrderId || data.orderId || data.id;
            router.push(`/checkout/success?orderId=${dbId}`);
          } else {
            alert("Verification failed: " + (verifyData.error || "Could not update database"));
          }
        },
        theme: { color: "#a82626" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment trigger error:", err);
      alert("Could not process payment. Please check server connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const isInStock = product.stockKg > 0;
  const stockPercentage = Math.min((product.stockKg / 500) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-white rounded-3xl overflow-hidden border border-mist-200 hover:border-mist-300 hover:shadow-xl hover:shadow-mist-950/5 transition-all duration-500"
    >
      {/* Image Section */}
      <div className="relative h-64 overflow-hidden">
        <motion.img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          animate={{ scale: isHovered ? 1.08 : 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-mist-950/60 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {product.certifications.map((cert) => (
            <span
              key={cert}
              className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-mist-800"
            >
              {cert}
            </span>
          ))}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                    {product.altitudeMeters}m elevation
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
          <p className="text-ruby-700 text-sm font-medium">{product.tagline}</p>
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
                ? new Date(product.harvestStart).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                  })
                : "TBA"}
            </span>
            <div className="flex-1 mx-3 h-1 bg-mist-200 rounded-full overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-pine-400 to-gold-400 rounded-full" />
            </div>
            <span className="text-mist-600">
              {product.harvestEnd
                ? new Date(product.harvestEnd).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                  })
                : "TBA"}
            </span>
          </div>
        </div>

        {isInStock && !product.isPreOrder && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-mist-600 flex items-center gap-1">
                <Package className="w-3 h-3" />
                Stock Available
              </span>
              <span
                className={`font-bold ${
                  stockPercentage < 20 ? "text-ruby-600" : "text-emerald-600"
                }`}
              >
                {product.stockKg} kg left
              </span>
            </div>
            <div className="h-1.5 bg-mist-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${stockPercentage}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.5 }}
                className={`h-full rounded-full ${
                  stockPercentage < 20 ? "bg-ruby-500" : "bg-emerald-500"
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
                { value: countdown.days, label: "Days" },
                { value: countdown.hours, label: "Hrs" },
                { value: countdown.minutes, label: "Min" },
                { value: countdown.seconds, label: "Sec" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white rounded-lg py-2 text-center"
                >
                  <span className="text-gold-700 text-lg font-bold block">
                    {String(item.value).padStart(2, "0")}
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
              <span className="text-mist-500 text-sm">/ {quantity} kg</span>
            </div>
            {product.comparePrice && (
              <span className="text-mist-400 text-sm line-through">
                ₹{product.comparePrice * quantity}
              </span>
            )}
          </div>

          {product.isPreOrder ? (
            <button
              onClick={() => handlePayment(product.pricePerKg * quantity, product.name)}
              disabled={isLoading || addedToCart}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                addedToCart
                  ? "bg-emerald-500 text-white"
                  : "bg-gold-600 hover:bg-gold-500 text-white hover:shadow-lg hover:shadow-gold-600/20"
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
              <div className="flex items-center border border-mist-300 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-mist-600 hover:bg-mist-100 transition-colors"
                >
                  −
                </button>
                <span className="px-3 py-2 text-sm font-semibold text-mist-800 min-w-[40px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-mist-600 hover:bg-mist-100 transition-colors"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => handlePayment(product.pricePerKg * quantity, product.name)}
                disabled={isLoading || addedToCart}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                  addedToCart
                    ? "bg-emerald-500 text-white"
                    : "bg-ruby-700 hover:bg-ruby-600 text-white hover:shadow-lg hover:shadow-ruby-700/30"
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
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const filteredProducts = APPLE_PRODUCTS.filter((p) => {
    if (activeFilter === "AVAILABLE") return p.isAvailable && !p.isPreOrder;
    if (activeFilter === "PREORDER") return p.isPreOrder;
    return true;
  });

  return (
    <section id="our-apples" className="py-24 px-6 md:px-12 bg-mist-50">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-ruby-700 text-sm font-semibold uppercase tracking-widest mb-3 block">
            Our Harvest
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-mist-900 mb-4">
            Premium Apple Varieties
          </h2>
          <p className="text-mist-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Each variety is cultivated with care in our high-altitude orchards,
            benefiting from Chopal&apos;s unique climate and mineral-rich Himalayan
            soil.
          </p>
        </motion.div>

        <div className="flex items-center justify-between mb-10">
          <div className="hidden md:flex items-center gap-2">
            {VARIETY_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeFilter === filter.value
                    ? "bg-mist-900 text-mist-50 shadow-lg"
                    : "bg-white text-mist-600 hover:bg-mist-100 border border-mist-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
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
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden mb-6"
            >
              <div className="bg-white rounded-2xl border border-mist-200 p-2 space-y-1">
                {VARIETY_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      setActiveFilter(filter.value);
                      setMobileFilterOpen(false);
                    }}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium text-left transition-all ${
                      activeFilter === filter.value
                        ? "bg-mist-900 text-mist-50"
                        : "text-mist-600 hover:bg-mist-50"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
              />
            ))}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
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