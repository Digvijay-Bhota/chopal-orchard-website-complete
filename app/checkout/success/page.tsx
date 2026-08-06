"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Package, ArrowRight, Home, Loader2 } from "lucide-react";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </div>

      <h1 className="font-serif text-3xl font-bold text-slate-900 mb-2">
        Order Confirmed!
      </h1>
      <p className="text-slate-600 text-sm mb-6">
        Thank you for your purchase. We are preparing your fresh farm order.
      </p>

      {orderId && (
        <div className="bg-slate-50 rounded-2xl p-4 mb-6 text-left border border-slate-200/60">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <Package className="w-4 h-4 text-emerald-600" />
            Order Reference ID
          </div>
          <p className="font-mono text-sm font-semibold text-slate-800 break-all">
            {orderId}
          </p>
        </div>
      )}

      <div className="space-y-3">
        <Link
          href="/"
          className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md"
        >
          <Home className="w-4 h-4" />
          Return to Home
        </Link>
        <a
          href="#our-apples"
          className="w-full inline-flex items-center justify-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium py-2 transition-colors"
        >
          Buy More Apples
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

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