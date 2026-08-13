import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [orders, products, b2bInquiries] = await Promise.all([
    prisma.order.count(),
    prisma.product.count(),
    prisma.b2BInquiry.count(),
  ]);

  return (
    <main>
      <h1>Admin Dashboard</h1>

      <p>Welcome to the Chopal Apple Orchard admin panel.</p>

      <section>
        <h2>Quick Overview</h2>

        <div>
          <p>Orders: {orders}</p>
          <p>Products: {products}</p>
          <p>Inventory: Connected</p>
          <p>B2B Inquiries: {b2bInquiries}</p>
        </div>
      </section>
    </main>
  );
}