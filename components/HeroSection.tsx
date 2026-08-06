"use client";

/**
 * HeroSection.tsx
 * ───────────────────────────────────────────────
 * Premium parallax hero for Chopal Apple Orchard.
 * Features:
 *   • Full-viewport parallax background with overlay
 *   • Live weather & elevation badge (fetched from API)
 *   • Animated headline with staggered text reveal
 *   • Sticky social contact drawer (WhatsApp, Instagram, etc.)
 *   • Scroll-down indicator
 *   • Responsive: mobile-first, desktop-enhanced
 *
 * Dependencies: framer-motion, lucide-react
 */

import { useState, useEffect, useCallback } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Mountain,
  Thermometer,
  Droplets,
  Wind,
  ChevronDown,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  MessageCircle,
  MapPin,
  X,
} from "lucide-react";

// ─── Types ─────────────────────────────────────
interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  icon: string;
  elevation: number;
  fetchedAt: string;
}

interface SocialLink {
  name: string;
  url: string;
  icon: React.ReactNode;
  color: string;
}

// ─── Constants ─────────────────────────────────
const ELEVATION_METERS = 2300;
const WEATHER_REFRESH_MS = 10 * 60 * 1000; // 10 minutes

const SOCIAL_LINKS: SocialLink[] = [
  {
    name: "Instagram",
    url: "https://instagram.com/chopalorchard",
    icon: <Instagram className="w-5 h-5" />,
    color: "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600",
  },
  {
    name: "Facebook",
    url: "https://facebook.com/chopalorchard",
    icon: <Facebook className="w-5 h-5" />,
    color: "bg-blue-600",
  },
  {
    name: "YouTube",
    url: "https://youtube.com/@chopalorchard",
    icon: <Youtube className="w-5 h-5" />,
    color: "bg-red-600",
  },
  {
    name: "LinkedIn",
    url: "https://linkedin.com/company/chopal-orchard",
    icon: <Linkedin className="w-5 h-5" />,
    color: "bg-blue-700",
  },
];

const WHATSAPP_NUMBER = "+919876543210";
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hi! I'm interested in Chopal Apple Orchard's premium apples. Can you share more details?"
);

// ─── Animation Variants ────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, delay: 1.2, ease: "easeOut" },
  },
};

// ─── Component ─────────────────────────────────
export default function HeroSection() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.3], [0, -100]);

  // Fetch weather data
  const fetchWeather = useCallback(async () => {
    try {
      // In production: const res = await fetch('/api/weather');
      // Mock response for demo:
      const mockWeather: WeatherData = {
        temperature: 14,
        feelsLike: 12,
        humidity: 68,
        windSpeed: 8.5,
        condition: "Partly Cloudy",
        icon: "02d",
        elevation: ELEVATION_METERS,
        fetchedAt: new Date().toISOString(),
      };
      setWeather(mockWeather);
    } catch (error) {
      console.error("Weather fetch failed:", error);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, WEATHER_REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
  };

  return (
    <section className="relative h-screen w-full overflow-hidden bg-mist-950">
      {/* ── Parallax Background ── */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ y: backgroundY }}
      >
        {/* Replace with actual orchard image from Cloudinary */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?q=80&w=2940&auto=format&fit=crop')`,
          }}
        />
        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-mist-950/60 via-mist-950/30 to-mist-950/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-mist-950/50 via-transparent to-mist-950/30" />
      </motion.div>

      {/* ── Navigation (absolute, transparent) ── */}
      <nav className="absolute top-0 left-0 right-0 z-30 px-6 py-6 md:px-12">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-ruby-700 flex items-center justify-center">
              <Mountain className="w-5 h-5 text-mist-50" />
            </div>
            <div>
              <h1 className="font-serif text-xl md:text-2xl text-mist-50 font-bold tracking-tight">
                Chopal Orchard
              </h1>
              <p className="text-mist-300 text-xs tracking-widest uppercase">
                Himalayan Heritage
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden md:flex items-center gap-8"
          >
            {["Our Apples", "Traceability", "B2B", "Visit Us", "Contact"].map(
              (item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s/g, "-")}`}
                  className="text-mist-200 text-sm font-medium hover:text-gold-400 transition-colors duration-300 tracking-wide"
                >
                  {item}
                </a>
              )
            )}
          </motion.div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <motion.div
        className="relative z-20 h-full flex flex-col items-center justify-center px-6 text-center"
        style={{ opacity: textOpacity, y: textY }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl"
        >
          {/* Location Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mist-950/40 backdrop-blur-md border border-mist-700/30 mb-8"
          >
            <MapPin className="w-4 h-4 text-gold-400" />
            <span className="text-mist-200 text-sm font-medium tracking-wide">
              Chopal, Shimla — Himachal Pradesh, India
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="font-serif text-5xl md:text-7xl lg:text-8xl text-mist-50 font-bold leading-[1.1] mb-6"
          >
            Nature&apos;s Finest
            <br />
            <span className="text-ruby-400">Himalayan Apples</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="text-mist-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Grown at 2,300 meters in the pristine mountain air of Chopal.
            Hand-picked, cold-stored, and delivered from our family orchard
            to your doorstep.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="#our-apples"
              className="px-8 py-4 bg-ruby-700 hover:bg-ruby-600 text-mist-50 font-semibold rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-ruby-700/30 text-sm tracking-wide"
            >
              Explore Our Harvest
            </a>
            <a
              href="#traceability"
              className="px-8 py-4 bg-transparent border border-mist-600 text-mist-200 hover:bg-mist-800/50 hover:border-mist-500 font-semibold rounded-full transition-all duration-300 text-sm tracking-wide"
            >
              Verify Your Batch
            </a>
          </motion.div>
        </motion.div>

        {/* ── Live Weather Badge ── */}
        <motion.div
          variants={badgeVariants}
          initial="hidden"
          animate="visible"
          className="absolute bottom-32 md:bottom-24 left-1/2 -translate-x-1/2 md:left-auto md:right-12 md:translate-x-0"
        >
          <div className="bg-mist-950/60 backdrop-blur-xl border border-mist-700/30 rounded-2xl p-5 min-w-[280px]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-mist-400 text-xs font-semibold uppercase tracking-wider">
                Live from Chopal
              </span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-xs">Live</span>
              </div>
            </div>

            {weatherLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-8 bg-mist-800 rounded w-20" />
                <div className="h-4 bg-mist-800 rounded w-32" />
              </div>
            ) : weather ? (
              <>
                <div className="flex items-end gap-3 mb-3">
                  <Thermometer className="w-6 h-6 text-gold-400" />
                  <span className="text-4xl font-bold text-mist-50">
                    {weather.temperature}°C
                  </span>
                  <span className="text-mist-400 text-sm mb-1">
                    feels {weather.feelsLike}°
                  </span>
                </div>
                <p className="text-mist-300 text-sm mb-3">
                  {weather.condition}
                </p>
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-mist-800">
                  <div className="text-center">
                    <Droplets className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                    <span className="text-mist-200 text-xs font-medium">
                      {weather.humidity}%
                    </span>
                  </div>
                  <div className="text-center">
                    <Wind className="w-4 h-4 text-mist-400 mx-auto mb-1" />
                    <span className="text-mist-200 text-xs font-medium">
                      {weather.windSpeed} km/h
                    </span>
                  </div>
                  <div className="text-center">
                    <Mountain className="w-4 h-4 text-gold-400 mx-auto mb-1" />
                    <span className="text-mist-200 text-xs font-medium">
                      {weather.elevation.toLocaleString()}m
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-mist-500 text-sm">Weather unavailable</p>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* ── Scroll Indicator ── */}
      <motion.button
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-mist-400 hover:text-mist-200 transition-colors"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <ChevronDown className="w-5 h-5" />
      </motion.button>

      {/* ── Sticky Social Drawer ── */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50">
        {/* Toggle Button */}
        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          className={`absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-l-xl flex items-center justify-center transition-all duration-300 ${
            drawerOpen
              ? "bg-mist-800 text-mist-200"
              : "bg-ruby-700 text-mist-50 hover:bg-ruby-600"
          }`}
          aria-label="Toggle social links"
        >
          {drawerOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <MessageCircle className="w-5 h-5" />
          )}
        </button>

        {/* Drawer Panel */}
        <motion.div
          initial={false}
          animate={{
            width: drawerOpen ? 200 : 0,
            opacity: drawerOpen ? 1 : 0,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden bg-mist-950/95 backdrop-blur-xl border border-mist-800/50 rounded-l-2xl mr-12"
        >
          <div className="p-4 space-y-3 min-w-[180px]">
            <p className="text-mist-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Connect With Us
            </p>

            {/* WhatsApp (Primary CTA) */}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/30 transition-all duration-200 group"
            >
              <MessageCircle className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div>
                <span className="text-mist-100 text-sm font-medium block">
                  WhatsApp
                </span>
                <span className="text-mist-500 text-xs">Chat Now</span>
              </div>
            </a>

            {/* Social Links */}
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-mist-800/50 transition-all duration-200 group"
              >
                <div
                  className={`w-8 h-8 rounded-lg ${social.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}
                >
                  {social.icon}
                </div>
                <span className="text-mist-200 text-sm font-medium">
                  {social.name}
                </span>
              </a>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Bottom Gradient Fade ── */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-mist-50 to-transparent z-10" />
    </section>
  );
}
