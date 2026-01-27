"use client";

import { motion } from "framer-motion";
import { fadeUp, viewportOnce } from "@/lib/motion";

export function SocialProof() {
  return (
    <motion.section
      className="py-16 px-6"
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={fadeUp}
    >
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center gap-6 px-8 py-5 rounded-2xl glass">
          {/* Honest metric — Rams */}
          <div>
            <p className="font-serif text-3xl font-medium text-gold">0</p>
            <p className="text-sm text-stone-400 mt-1">prospectors</p>
          </div>
          <div className="w-px h-10 bg-border" />
          <div>
            <p className="font-serif text-3xl font-medium text-foreground">—</p>
            <p className="text-sm text-stone-400 mt-1">ideas mined</p>
          </div>
          <div className="w-px h-10 bg-border" />
          <div>
            <p className="font-serif text-3xl font-medium text-foreground">∞</p>
            <p className="text-sm text-stone-400 mt-1">potential</p>
          </div>
        </div>
        <p className="mt-6 text-sm text-stone-500 font-mono">
          Just launched. You&apos;re early.
        </p>
      </div>
    </motion.section>
  );
}
