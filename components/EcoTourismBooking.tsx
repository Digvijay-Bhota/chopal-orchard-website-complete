"use client";

/**
 * EcoTourismBooking.tsx
 * ───────────────────────────────────────────────
 * Eco-tourism Orchard Tour booking form.
 * Connects to /api/bookings to persist user reservation requests into Supabase.
 */

import { useState } from "react";
import { Calendar, Users, CheckCircle, User, Mail, Phone, Clock, Loader2, AlertCircle } from "lucide-react";

export default function EcoTourismBooking() {
  const [selectedDate, setSelectedDate] = useState("");
  const [guests, setGuests] = useState(2);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [tourSlot, setTourSlot] = useState("MORNING");
  
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookingNumber, setBookingNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitDate: selectedDate,
          guestsCount: Number(guests),
          guestName,
          guestEmail,
          guestPhone,
          tourSlot,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Failed to submit reservation.");
      }

      setBookingNumber(resData.bookingNumber || resData.booking?.bookingNumber || "CONFIRMED");
      setSubmitted(true);
    } catch (err: any) {
      console.error("Booking Error:", err);
      setError(err.message || "Something went wrong while booking.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="visit-us" className="py-20 px-6 md:px-12 bg-white">
      <div className="mx-auto max-w-4xl text-center">
        <span className="text-ruby-700 text-sm font-semibold uppercase tracking-widest block mb-2">
          Experience Chopal
        </span>
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-mist-900 mb-4">
          Book an Orchard Visit & Harvest Tour
        </h2>
        <p className="text-mist-600 mb-10">
          Walk through our 2,300m elevation apple blocks, pick fresh fruit, and enjoy traditional Himalayan hospitality.
        </p>

        {submitted ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 max-w-lg mx-auto text-center">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-mist-900 mb-1">Reservation Requested!</h3>
            {bookingNumber && (
              <p className="text-xs font-mono text-emerald-800 font-bold mb-2">
                Reference: {bookingNumber}
              </p>
            )}
            <p className="text-sm text-mist-600">
              We have received your booking request for {guests} guest(s) on {selectedDate}. Our team will contact you on WhatsApp shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-mist-50 p-6 md:p-8 rounded-3xl border border-mist-200 max-w-xl mx-auto space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-left space-y-1">
                <label className="text-xs font-semibold text-mist-700 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-ruby-700" /> Full Name
                </label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-4 py-3 rounded-xl border border-mist-300 bg-white text-mist-900 text-sm focus:outline-none focus:ring-2 focus:ring-ruby-600"
                />
              </div>

              <div className="text-left space-y-1">
                <label className="text-xs font-semibold text-mist-700 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-ruby-700" /> Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 rounded-xl border border-mist-300 bg-white text-mist-900 text-sm focus:outline-none focus:ring-2 focus:ring-ruby-600"
                />
              </div>
            </div>

            <div className="text-left space-y-1">
              <label className="text-xs font-semibold text-mist-700 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-ruby-700" /> Email Address
              </label>
              <input
                type="email"
                required
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-mist-300 bg-white text-mist-900 text-sm focus:outline-none focus:ring-2 focus:ring-ruby-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-left space-y-1">
                <label className="text-xs font-semibold text-mist-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-ruby-700" /> Visit Date
                </label>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl border border-mist-300 bg-white text-mist-900 text-sm focus:outline-none focus:ring-2 focus:ring-ruby-600"
                />
              </div>

              <div className="text-left space-y-1">
                <label className="text-xs font-semibold text-mist-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-ruby-700" /> Time Slot
                </label>
                <select
                  value={tourSlot}
                  onChange={(e) => setTourSlot(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl border border-mist-300 bg-white text-mist-900 text-sm focus:outline-none focus:ring-2 focus:ring-ruby-600"
                >
                  <option value="MORNING">Morning (09:00 AM)</option>
                  <option value="AFTERNOON">Afternoon (02:00 PM)</option>
                  <option value="EVENING">Sunset (05:00 PM)</option>
                </select>
              </div>

              <div className="text-left space-y-1">
                <label className="text-xs font-semibold text-mist-700 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-ruby-700" /> Guests
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-3 rounded-xl border border-mist-300 bg-white text-mist-900 text-sm focus:outline-none focus:ring-2 focus:ring-ruby-600"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-ruby-700 hover:bg-ruby-600 disabled:bg-mist-400 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-ruby-700/20 text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Reserving...
                </>
              ) : (
                "Reserve Visit Slot"
              )}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}