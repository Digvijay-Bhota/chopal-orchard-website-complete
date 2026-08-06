"use client";

import { Instagram } from "lucide-react";

const POSTS = [
  {
    id: 1,
    title: "Morning Frost in Block A",
    views: "12.4k",
    image: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Hand-picking Royal Delicious",
    views: "8.9k",
    image: "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Grading & Packaging Process",
    views: "15.1k",
    image: "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?q=80&w=600&auto=format&fit=crop",
  },
];

export default function SocialFeed() {
  return (
    <section className="py-20 px-6 md:px-12 bg-mist-100">
      <div className="mx-auto max-w-7xl text-center">
        <span className="text-ruby-700 text-sm font-semibold uppercase tracking-widest block mb-2">
          Live From Chopal
        </span>
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-mist-900 mb-8">
          Follow Our Harvest Journey
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {POSTS.map((post) => (
            <div key={post.id} className="relative group rounded-2xl overflow-hidden shadow-md bg-white">
              <img src={post.image} alt={post.title} className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-5 text-left text-white">
                <span className="text-gold-400 text-xs font-semibold flex items-center gap-1">
                  <Instagram className="w-3.5 h-3.5" /> {post.views} views
                </span>
                <p className="font-semibold text-sm mt-1">{post.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}