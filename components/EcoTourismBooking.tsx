"use client";

import { useState } from "react";
import { Calendar, Users, CheckCircle } from "lucide-react";

export default function EcoTourismBooking() {
  const [selectedDate, setSelectedDate] = useState("");
  const [guests, setGuests] = useState(2);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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
            <p className="text-sm text-mist-600">
              We have received your booking request for {guests} guests on {selectedDate}. Our team will contact you on WhatsApp shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-mist-50 p-6 md:p-8 rounded-3xl border border-mist-200 max-w-xl mx-auto space-y-4">
            <div className="text-left space-y-1">
              <label className="text-xs font-semibold text-mist-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-ruby-700" /> Visit Date
              </label>
              <input
                type="date"
                required
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-mist-300 bg-white text-mist-900 text-sm focus:outline-none focus:ring-2 focus:ring-ruby-600"
              />
            </div>

            <div className="text-left space-y-1">
              <label className="text-xs font-semibold text-mist-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-ruby-700" /> Number of Guests
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 rounded-xl border border-mist-300 bg-white text-mist-900 text-sm focus:outline-none focus:ring-2 focus:ring-ruby-600"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-ruby-700 hover:bg-ruby-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-ruby-700/20 text-sm"
            >
              Reserve Visit Slot
            </button>
          </form>
        )}
      </div>
    </section>
  );
}