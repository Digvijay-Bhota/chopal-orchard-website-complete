"use client";

/**
 * TraceabilityLookup.tsx
 * ───────────────────────────────────────────────
 * Batch verification & traceability search tool.
 * Integrated with live Next.js API Routes (`/api/traceability`).
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  QrCode,
  CheckCircle2,
  XCircle,
  Calendar,
  MapPin,
  User,
  Mountain,
  Thermometer,
  Droplets,
  Wind,
  Clock,
  Package,
  Truck,
  Share2,
  Download,
  Loader2,
  TreePine,
  ShieldCheck,
  Camera,
  Building2,
} from "lucide-react";

// ─── Types ─────────────────────────────────────
interface TraceabilityResult {
  batchCode: string;
  type?: string;
  productName?: string;
  productVariety?: string;
  harvestDate?: string;
  treeBlock?: string;
  farmerName?: string;
  farmerNotes?: string;
  altitudeMeters?: number;
  weatherAtHarvest?: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    condition: string;
  };
  pickedBy?: string[];
  packedDate?: string;
  packedBy?: string;
  coldStorageDays?: number;
  certifications?: string[];
  images?: string[];
  isVerified?: boolean;
  verifiedAt?: string;
  journey?: JourneyStep[];
  details?: {
    companyName?: string;
    contactName?: string;
    varieties?: string[];
    annualVolumeKg?: number;
  };
  status?: string;
}

interface JourneyStep {
  stage: string;
  date: string;
  location: string;
  description: string;
  completed: boolean;
  icon: string;
}

// ─── Mock Data Fallback ────────────────────────
const MOCK_RESULTS: Record<string, TraceabilityResult> = {
  "CHP-2025-RD-001": {
    batchCode: "CHP-2025-RD-001",
    productName: "Royal Delicious",
    productVariety: "Royal Delicious",
    harvestDate: "2025-09-12",
    treeBlock: "Block-A, Rows 12-18",
    farmerName: "Ramesh Thakur",
    farmerNotes:
      "Perfect harvest day — morning dew had just evaporated. Sugar content tested at 14.2 Brix.",
    altitudeMeters: 2400,
    weatherAtHarvest: {
      temperature: 12,
      humidity: 72,
      windSpeed: 5,
      condition: "Clear Morning",
    },
    pickedBy: ["Ramesh Thakur", "Sunita Devi"],
    packedDate: "2025-09-13",
    packedBy: "Sunita Devi",
    coldStorageDays: 2,
    certifications: ["Organic Certified", "GI Tagged"],
    images: [
      "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?q=80&w=600",
      "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?q=80&w=600",
    ],
    isVerified: true,
    verifiedAt: "2025-09-13T08:30:00Z",
    journey: [
      {
        stage: "Blossom",
        date: "2025-04-15",
        location: "Block-A, Chopal Orchard",
        description: "Trees in full bloom.",
        completed: true,
        icon: "flower",
      },
      {
        stage: "Harvest",
        date: "2025-09-12",
        location: "Block-A, Rows 12-18",
        description: "Hand-picked at peak ripeness.",
        completed: true,
        icon: "pick",
      },
      {
        stage: "Delivery",
        date: "2025-09-15",
        location: "En Route to Customer",
        description: "Dispatched via temperature-controlled transport.",
        completed: true,
        icon: "truck",
      },
    ],
  },
};

const JOURNEY_ICONS: Record<string, React.ReactNode> = {
  flower: <TreePine className="w-4 h-4" />,
  sprout: <TreePine className="w-4 h-4" />,
  pick: <Calendar className="w-4 h-4" />,
  package: <Package className="w-4 h-4" />,
  snowflake: <Thermometer className="w-4 h-4" />,
  truck: <Truck className="w-4 h-4" />,
};

function JourneyTimeline({ journey }: { journey: JourneyStep[] }) {
  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200" />
      <div className="space-y-6">
        {journey.map((step, index) => (
          <motion.div
            key={step.stage}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15, duration: 0.5 }}
            className="relative flex items-start gap-4"
          >
            <div
              className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                step.completed ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {JOURNEY_ICONS[step.icon] || <Clock className="w-4 h-4" />}
            </div>
            <div className="flex-1 pt-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-slate-900 text-sm">{step.stage}</h4>
                {step.completed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </div>
              <p className="text-slate-500 text-xs mb-1">{step.date}</p>
              <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span className="text-slate-400 text-xs">{step.location}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function TraceabilityLookup() {
  const [batchCode, setBatchCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TraceabilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const handleSearch = useCallback(async () => {
    const cleanCode = batchCode.trim().toUpperCase();
    if (!cleanCode) {
      setError("Please enter a batch code or inquiry number");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. Live Fetch from backend API Route
      const response = await fetch(`/api/traceability?batchCode=${encodeURIComponent(cleanCode)}`);
      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        // Fallback to local mock array if API has no entry
        if (MOCK_RESULTS[cleanCode]) {
          setResult(MOCK_RESULTS[cleanCode]);
        } else {
          setError(
            data.error ||
              `No record found with code "${cleanCode}". Please check your code and try again.`
          );
        }
      }
    } catch (err) {
      console.error("Verification connection error:", err);
      // Failover mock search
      if (MOCK_RESULTS[cleanCode]) {
        setResult(MOCK_RESULTS[cleanCode]);
      } else {
        setError(`Failed to verify "${cleanCode}". Please check server connection.`);
      }
    } finally {
      setLoading(false);
    }
  }, [batchCode]);

  const handleShare = useCallback(() => {
    if (navigator.share && result) {
      navigator.share({
        title: `Chopal Orchard — ${result.batchCode}`,
        text: `Verify authenticity: ${result.productName || "B2B Inquiry"} (${result.batchCode}).`,
        url: window.location.href,
      });
    }
  }, [result]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <section id="traceability" className="py-24 px-6 md:px-12 bg-white">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-emerald-700 text-sm font-semibold uppercase tracking-widest mb-3 block">
            Farm To Table
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Trace Your Apples
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Enter the batch code or B2B inquiry number from your box to see the complete journey.
          </p>
        </motion.div>

        {/* Search Input Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-xl mx-auto mb-12"
        >
          <div className="relative">
            <label htmlFor="batchSearchInput" className="sr-only">
              Batch Code or Inquiry Number
            </label>
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <QrCode className="w-5 h-5 text-slate-400" />
            </div>
            <input
              id="batchSearchInput"
              name="batchCode"
              type="text"
              value={batchCode}
              onChange={(e) => setBatchCode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter code (e.g. CHP-B2B-244001 or CHP-2025-RD-001)"
              className="w-full pl-12 pr-32 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all duration-300 text-sm font-medium"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-400 text-white font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 text-sm shadow-md"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? "Verifying..." : "Verify"}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
              >
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results View */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={result.batchCode}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-emerald-900 font-bold text-lg">
                      {result.type === "B2B_INQUIRY"
                        ? "Authentic B2B Trade Inquiry"
                        : "Authentic Harvest Batch"}
                    </h3>
                    <p className="text-emerald-700 text-sm">
                      Verified Reference: {result.batchCode}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleShare}
                    className="px-4 py-2.5 bg-white border border-emerald-200 rounded-xl text-emerald-700 font-medium text-sm hover:bg-emerald-50 transition-colors flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>

              {/* B2B Inquiry Specific Layout */}
              {result.type === "B2B_INQUIRY" ? (
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 max-w-2xl mx-auto text-left shadow-sm">
                  <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-4">
                    <Building2 className="w-6 h-6 text-emerald-600" />
                    <div>
                      <h3 className="font-serif text-2xl font-bold text-slate-900">
                        Inquiry Details
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">
                        Reference Number: {result.batchCode}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">
                        Company Name
                      </p>
                      <p className="text-base font-bold text-slate-800">
                        {result.details?.companyName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">
                        Contact Person
                      </p>
                      <p className="text-base font-bold text-slate-800">
                        {result.details?.contactName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">
                        Current Status
                      </p>
                      <span className="inline-block mt-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                        {result.status || "PROCESSING"}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">
                        Submitted On
                      </p>
                      <p className="text-sm font-semibold text-slate-700">
                        {result.harvestDate
                          ? new Date(result.harvestDate).toLocaleDateString("en-IN", {
                              dateStyle: "medium",
                            })
                          : "Recently"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Standard Harvest Batch Layout */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <span className="text-emerald-700 text-xs font-semibold uppercase tracking-wider">
                            {result.productVariety || "Apple Variety"}
                          </span>
                          <h3 className="font-serif text-2xl font-bold text-slate-900 mt-1">
                            {result.productName || "Fresh Himalayan Apple"}
                          </h3>
                        </div>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                          {result.batchCode}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                          <Calendar className="w-5 h-5 text-emerald-600" />
                          <div>
                            <p className="text-slate-500 text-xs">Harvest Date</p>
                            <p className="text-slate-900 font-semibold text-sm">
                              {result.harvestDate
                                ? new Date(result.harvestDate).toLocaleDateString("en-IN", {
                                    dateStyle: "medium",
                                  })
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                          <MapPin className="w-5 h-5 text-emerald-700" />
                          <div>
                            <p className="text-slate-500 text-xs">Tree Block</p>
                            <p className="text-slate-900 font-semibold text-sm">
                              {result.treeBlock || "Block-A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {result.farmerNotes && (
                      <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
                        <h4 className="text-amber-900 text-sm font-semibold mb-3 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Farmer&apos;s Notes
                        </h4>
                        <p className="text-amber-800 text-sm leading-relaxed italic">
                          &ldquo;{result.farmerNotes}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Photo & Journey Column */}
                  <div className="space-y-6">
                    {result.images && result.images.length > 0 && (
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                        <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
                          <img
                            src={result.images[activeImageIndex]}
                            alt={`Harvest photo ${activeImageIndex + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {result.journey && (
                      <div className="bg-white rounded-2xl p-6 border border-slate-200">
                        <h4 className="text-slate-900 font-semibold text-sm mb-6 flex items-center gap-2">
                          <Truck className="w-4 h-4 text-emerald-600" />
                          Complete Journey
                        </h4>
                        <JourneyTimeline journey={result.journey} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!result && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-8"
          >
            <p className="text-slate-400 text-sm">
              Try demo code:{" "}
              <button
                type="button"
                onClick={() => setBatchCode("CHP-2025-RD-001")}
                className="text-emerald-600 font-semibold hover:underline"
              >
                CHP-2025-RD-001
              </button>
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}