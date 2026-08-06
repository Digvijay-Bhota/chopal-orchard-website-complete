import HeroSection from "@/components/HeroSection";
import AppleShowcase from "@/components/AppleShowcase";
import TraceabilityLookup from "@/components/TraceabilityLookup";
import B2BInquiryForm from "@/components/B2BInquiryForm";
import EcoTourismBooking from "@/components/EcoTourismBooking";
import SocialFeed from "@/components/SocialFeed";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <AppleShowcase />
      <TraceabilityLookup />
      <B2BInquiryForm />
      <EcoTourismBooking />
      <SocialFeed />
    </main>
  );
}