"use client";

import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { SocialProof } from "@/components/landing/social-proof";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      {/* Background noise texture — Cooper */}
      <div className="fixed inset-0 noise-overlay pointer-events-none z-0" />

      {/* Grid pattern — subtle structural reference */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative z-10">
        <Hero />
        <HowItWorks />
        <SocialProof />
        <Features />
        <Footer />
      </div>
    </main>
  );
}
