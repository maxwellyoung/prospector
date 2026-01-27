"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { springSmooth, fadeUp } from "@/lib/motion";

export type MiningStage =
  | "idle"
  | "reddit"
  | "hackernews"
  | "analyzing"
  | "scoring"
  | "complete";

const stages: { id: MiningStage; label: string; mono: string }[] = [
  { id: "reddit", label: "Searching Reddit...", mono: "REDDIT     ▓▓▓░░░" },
  {
    id: "hackernews",
    label: "Searching Hacker News...",
    mono: "HN         ▓▓▓▓░░",
  },
  {
    id: "analyzing",
    label: "Analyzing with Claude...",
    mono: "CLAUDE     ▓▓▓▓▓░",
  },
  {
    id: "scoring",
    label: "Scoring opportunities...",
    mono: "SCORING    ▓▓▓▓▓▓",
  },
];

interface MiningProgressProps {
  currentStage: MiningStage;
}

export function MiningProgress({ currentStage }: MiningProgressProps) {
  if (currentStage === "idle" || currentStage === "complete") return null;

  const currentIndex = stages.findIndex((s) => s.id === currentStage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={springSmooth}
      className="glass rounded-2xl p-6 md:p-8"
    >
      {/* Terminal-style header — nod to CLI origins */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-3 h-3 rounded-full bg-gold/60 animate-pulse" />
        <span className="font-mono text-sm text-gold">Mining in progress</span>
      </div>

      {/* Progress stages */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {stages.map((stage, i) => {
            const isActive = stage.id === currentStage;
            const isComplete = i < currentIndex;
            const isPending = i > currentIndex;

            return (
              <motion.div
                key={stage.id}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="flex items-center gap-4"
              >
                {/* Status icon */}
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  {isComplete ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={springSmooth}
                    >
                      <Check
                        className="w-4 h-4 text-emerald-400"
                        strokeWidth={2}
                      />
                    </motion.div>
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 text-gold animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-stone-500/30" />
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-sm transition-colors ${
                    isActive
                      ? "text-foreground"
                      : isComplete
                      ? "text-stone-400"
                      : "text-stone-500/50"
                  }`}
                >
                  {stage.label}
                </span>

                {/* Mono progress — CLI nod */}
                {(isActive || isComplete) && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`ml-auto font-mono text-xs ${
                      isActive ? "text-gold mining-pulse" : "text-stone-500"
                    }`}
                  >
                    {stage.mono}
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
