"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const router = useRouter();

  const handlePayment = async () => {
    try {
      // 1. Create order on backend
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 500,
          guestEmail: "customer@example.com",
          guestPhone: "9876543210",
          guestName: "Customer Name",
        }),
      });

      const orderData = await res.json();

      if (!res.ok) {
        alert("Failed to create order: " + (orderData.error || "Unknown error"));
        return;
      }

      // 2. Initialize Razorpay modal with explicit order details
      const options = {
        key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        order_id: orderData.orderId || orderData.id,
        name: "Chopal Apple Orchard",
        description: "Fresh Farm Direct Purchase",
        handler: async function (response: any) {
          console.log("[RAZORPAY_SUCCESS_CALLBACK]", response);

          // 3. Send payment tokens to backend verification API
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
            // Redirect to success page with dbOrderId / orderId parameter
            const dbId = orderData.dbOrderId || orderData.orderId || orderData.id;
            router.push(`/checkout/success?orderId=${dbId}`);
          } else {
            alert("Payment verification failed: " + (verifyData.error || "Database update failed"));
          }
        },
        prefill: {
          name: "Customer Name",
          email: "customer@example.com",
          contact: "9876543210",
        },
        theme: {
          color: "#16a34a",
        },
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.on("payment.failed", function (response: any) {
        alert("Payment failed: " + response.error.description);
      });

      rzp.open();
    } catch (err) {
      console.error("Payment execution error:", err);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="p-8 flex justify-center items-center min-h-screen">
        <button
          onClick={handlePayment}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-all"
        >
          Proceed to Pay
        </button>
      </div>
    </>
  );
}