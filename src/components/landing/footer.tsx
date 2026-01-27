"use client";

import { motion } from "framer-motion";
import { Github } from "lucide-react";
import { fadeIn, viewportOnce } from "@/lib/motion";

export function Footer() {
  return (
    <motion.footer
      className="py-16 px-6 border-t border-border"
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={fadeIn}
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Logo + attribution */}
        <div className="flex items-center gap-3">
          <span className="text-xl" role="img" aria-label="Prospector">
            ⛏️
          </span>
          <span className="text-sm text-stone-400">
            Built by{" "}
            <a
              href="https://github.com/maxwellyoung"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-200 hover:text-gold transition-colors"
            >
              Maxwell Young
            </a>
          </span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/maxwellyoung"
            target="_blank"
            rel="noopener noreferrer"
            className="text-stone-500 hover:text-stone-200 transition-colors"
          >
            <Github className="w-5 h-5" strokeWidth={1.5} />
          </a>
          <span className="text-xs text-stone-500 font-mono">
            v0.1.0 — alpha
          </span>
        </div>
      </div>
    </motion.footer>
  );
}
