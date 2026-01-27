"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  fadeUp,
  staggerSlow,
  springSnappy,
  buttonHover,
  buttonTap,
  viewportOnce,
} from "@/lib/motion";

export function Hero() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/mine?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Ambient glow — Cooper depth */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full bg-gold/3 blur-[80px] pointer-events-none" />

      <motion.div
        className="relative z-10 max-w-3xl mx-auto px-6 text-center"
        variants={staggerSlow}
        initial="hidden"
        animate="visible"
        viewport={viewportOnce}
      >
        {/* Eyebrow */}
        <motion.div variants={fadeUp} className="mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-mono text-stone-300 glass-subtle">
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            AI-powered opportunity mining
          </span>
        </motion.div>

        {/* Heading — serif, editorial */}
        <motion.h1
          variants={fadeUp}
          className="font-serif text-5xl sm:text-6xl md:text-7xl font-medium tracking-tight leading-[1.1] mb-6"
        >
          <span className="gold-shimmer">Mine</span> the internet
          <br />
          for your next idea.
        </motion.h1>

        {/* Subtext */}
        <motion.p
          variants={fadeUp}
          className="text-lg sm:text-xl text-stone-300 max-w-xl mx-auto mb-10 leading-relaxed"
        >
          Prospector analyzes thousands of conversations to find the problems
          people will pay you to solve.
        </motion.p>

        {/* Search input + button */}
        <motion.form
          variants={fadeUp}
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
        >
          <Input
            type="text"
            placeholder="Enter a niche — e.g. fitness apps, invoicing..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-13 bg-surface border-border/50 text-foreground placeholder:text-stone-400 rounded-xl px-5 text-base focus-visible:ring-gold/50 focus-visible:border-gold/30 flex-1"
          />
          <motion.div
            whileHover={buttonHover}
            whileTap={buttonTap}
            transition={springSnappy}
          >
            <Button
              type="submit"
              size="lg"
              className="h-13 px-8 bg-gold hover:bg-gold-light text-background font-semibold rounded-xl cursor-pointer whitespace-nowrap"
            >
              Start mining ⛏️
            </Button>
          </motion.div>
        </motion.form>

        {/* Subtle hint */}
        <motion.p
          variants={fadeUp}
          className="mt-6 text-sm text-stone-500 font-mono"
        >
          Free to explore. No account required.
        </motion.p>
      </motion.div>
    </section>
  );
}
