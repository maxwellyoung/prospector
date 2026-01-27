"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ExternalLink, MessageSquare, TrendingUp, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { springSmooth, springSnappy, fadeUp } from "@/lib/motion";

export interface MiningResult {
  id: string;
  score: number;
  title: string;
  painPoint: string;
  mentions: number;
  willingnessToPay: "Low" | "Medium" | "High" | "Very High";
  marketSize: string;
  category: string;
  sources: { title: string; url: string; platform: string }[];
}

interface ResultCardProps {
  result: MiningResult;
  index: number;
}

export function ResultCard({ result, index }: ResultCardProps) {
  const [expanded, setExpanded] = useState(false);

  const scoreColor =
    result.score >= 8
      ? "text-gold"
      : result.score >= 6
      ? "text-emerald-400"
      : "text-stone-400";

  const wtpColor =
    result.willingnessToPay === "Very High"
      ? "text-gold"
      : result.willingnessToPay === "High"
      ? "text-emerald-400"
      : result.willingnessToPay === "Medium"
      ? "text-amber-400"
      : "text-stone-400";

  return (
    <motion.div
      variants={fadeUp}
      layout
      className="group glass rounded-2xl overflow-hidden transition-all duration-300 hover:border-gold/15"
    >
      <div className="p-6 md:p-8">
        <div className="flex items-start gap-5">
          {/* Score badge */}
          <motion.div
            className="shrink-0 w-14 h-14 rounded-xl bg-gold-muted flex items-center justify-center gold-glow"
            whileHover={{ scale: 1.1, rotate: -3 }}
            transition={springSnappy}
          >
            <span className={`font-serif text-2xl font-semibold ${scoreColor}`}>
              {result.score}
            </span>
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="font-serif text-xl font-medium mb-2 leading-snug">
              {result.title}
            </h3>

            {/* Pain point quote */}
            <p className="text-stone-400 italic text-[15px] leading-relaxed mb-4">
              &ldquo;{result.painPoint}&rdquo;
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-stone-400">
                <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
                <span className="font-mono">{result.mentions}</span>
                <span className="text-stone-500">mentions</span>
              </div>
              <div className={`flex items-center gap-1.5 ${wtpColor}`}>
                <DollarSign className="w-4 h-4" strokeWidth={1.5} />
                <span>{result.willingnessToPay}</span>
                <span className="text-stone-500">WTP</span>
              </div>
              <div className="flex items-center gap-1.5 text-stone-400">
                <TrendingUp className="w-4 h-4" strokeWidth={1.5} />
                <span>{result.marketSize}</span>
              </div>
              <Badge
                variant="secondary"
                className="bg-surface-elevated text-stone-300 border-border font-mono text-xs"
              >
                {result.category}
              </Badge>
            </div>
          </div>
        </div>

        {/* Expand toggle */}
        <motion.button
          onClick={() => setExpanded(!expanded)}
          className="mt-5 flex items-center gap-2 text-sm text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
          whileHover={{ x: 2 }}
          transition={springSnappy}
        >
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={springSnappy}
          >
            <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
          </motion.div>
          {expanded ? "Hide sources" : `View ${result.sources.length} sources`}
        </motion.button>

        {/* Expanded sources */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={springSmooth}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                {result.sources.map((source, i) => (
                  <motion.a
                    key={i}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-surface hover:bg-surface-elevated transition-colors group/source"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, ...springSnappy }}
                  >
                    <span className="text-xs font-mono text-stone-500 uppercase w-14 shrink-0">
                      {source.platform}
                    </span>
                    <span className="text-sm text-stone-300 truncate flex-1">
                      {source.title}
                    </span>
                    <ExternalLink
                      className="w-4 h-4 text-stone-500 opacity-0 group-hover/source:opacity-100 transition-opacity"
                      strokeWidth={1.5}
                    />
                  </motion.a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
