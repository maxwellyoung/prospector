"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pickaxe, Zap, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  fadeUp,
  staggerFast,
  springSnappy,
  springSmooth,
  buttonHover,
  buttonTap,
} from "@/lib/motion";
import { MiningProgress, type MiningStage } from "./mining-progress";
import { ResultCard, type MiningResult } from "./result-card";

// ===== Mock Data =====
const mockResults: MiningResult[] = [
  {
    id: "1",
    score: 9,
    title: "Automated client reporting for freelancers",
    painPoint:
      "I spend 3 hours every week manually creating reports for my clients. There has to be a better way...",
    mentions: 847,
    willingnessToPay: "Very High",
    marketSize: "$2.4B",
    category: "Freelance Tools",
    sources: [
      {
        title: "r/freelance — Weekly frustration with client reports",
        url: "#",
        platform: "Reddit",
      },
      {
        title: "r/webdev — Tools for automating client deliverables",
        url: "#",
        platform: "Reddit",
      },
      {
        title: "Ask HN: How do you handle client reporting?",
        url: "#",
        platform: "HN",
      },
      {
        title: "The nightmare of manual status updates",
        url: "#",
        platform: "Blog",
      },
    ],
  },
  {
    id: "2",
    score: 8,
    title: "Smart expense categorization for small teams",
    painPoint:
      "Our accountant keeps miscategorizing expenses. We need something that learns our patterns.",
    mentions: 623,
    willingnessToPay: "High",
    marketSize: "$5.1B",
    category: "FinTech",
    sources: [
      {
        title: "r/smallbusiness — Expense tracking nightmares",
        url: "#",
        platform: "Reddit",
      },
      {
        title: "r/accounting — AI categorization that actually works?",
        url: "#",
        platform: "Reddit",
      },
      {
        title: "Show HN: ML-based expense sorting",
        url: "#",
        platform: "HN",
      },
    ],
  },
  {
    id: "3",
    score: 7,
    title: "API monitoring with plain-english alerts",
    painPoint:
      "PagerDuty alerts are useless walls of text. I want to know WHAT broke and WHY in one sentence.",
    mentions: 412,
    willingnessToPay: "High",
    marketSize: "$3.8B",
    category: "DevTools",
    sources: [
      {
        title: "r/devops — Alert fatigue is killing my team",
        url: "#",
        platform: "Reddit",
      },
      {
        title: "Ask HN: Best practices for on-call alerts?",
        url: "#",
        platform: "HN",
      },
      {
        title: "The state of incident management in 2025",
        url: "#",
        platform: "Blog",
      },
    ],
  },
  {
    id: "4",
    score: 7,
    title: "Design system documentation generator",
    painPoint:
      "We have 200+ components and zero documentation. New devs are lost for weeks.",
    mentions: 389,
    willingnessToPay: "Medium",
    marketSize: "$1.2B",
    category: "DevTools",
    sources: [
      {
        title: "r/reactjs — Auto-generating component docs",
        url: "#",
        platform: "Reddit",
      },
      {
        title: "r/Frontend — Design system maintenance burden",
        url: "#",
        platform: "Reddit",
      },
    ],
  },
  {
    id: "5",
    score: 6,
    title: "Async standup bot that summarizes, not just collects",
    painPoint:
      "Every standup bot just collects updates. None of them actually surface blockers or patterns.",
    mentions: 298,
    willingnessToPay: "Medium",
    marketSize: "$890M",
    category: "Productivity",
    sources: [
      {
        title: "r/ExperiencedDevs — Standup fatigue solutions",
        url: "#",
        platform: "Reddit",
      },
      {
        title: "Ask HN: Async standups that don't suck?",
        url: "#",
        platform: "HN",
      },
    ],
  },
];

const stageSequence: MiningStage[] = [
  "reddit",
  "hackernews",
  "analyzing",
  "scoring",
  "complete",
];

type DepthMode = "quick" | "deep";

export function MiningInterface({
  initialQuery,
}: {
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery || "");
  const [depth, setDepth] = useState<DepthMode>("quick");
  const [stage, setStage] = useState<MiningStage>("idle");
  const [results, setResults] = useState<MiningResult[]>([]);

  const startMining = useCallback(() => {
    if (!query.trim() || stage !== "idle") return;
    setResults([]);

    // Simulate mining stages
    const delays = depth === "quick" ? [0, 1200, 2400, 3600, 4800] : [0, 2000, 4000, 6500, 9000];
    stageSequence.forEach((s, i) => {
      setTimeout(() => {
        setStage(s);
        if (s === "complete") {
          setResults(mockResults);
        }
      }, delays[i]);
    });
  }, [query, stage, depth]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startMining();
  };

  const resetMining = () => {
    setStage("idle");
    setResults([]);
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springSmooth}
      >
        <h1 className="font-serif text-3xl md:text-4xl font-medium tracking-tight mb-2">
          Mine
        </h1>
        <p className="text-stone-400 text-lg">
          Discover SaaS opportunities hiding in plain sight.
        </p>
      </motion.div>

      {/* Input area */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springSmooth, delay: 0.1 }}
        className="glass rounded-2xl p-6 md:p-8 space-y-5"
      >
        {/* Query input */}
        <div>
          <label className="block text-sm text-stone-400 mb-2 font-mono">
            NICHE / QUERY
          </label>
          <Input
            type="text"
            placeholder="What niche are you exploring? e.g. fitness apps, invoicing tools..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={stage !== "idle"}
            className="h-14 bg-surface border-border/50 text-foreground text-lg placeholder:text-stone-500 rounded-xl px-5 focus-visible:ring-gold/50 focus-visible:border-gold/30"
          />
        </div>

        {/* Depth selector */}
        <div>
          <label className="block text-sm text-stone-400 mb-3 font-mono">
            MINING DEPTH
          </label>
          <div className="flex gap-3">
            {(["quick", "deep"] as const).map((mode) => (
              <motion.button
                key={mode}
                type="button"
                onClick={() => stage === "idle" && setDepth(mode)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  depth === mode
                    ? "bg-gold-muted text-gold border border-gold/20"
                    : "bg-surface text-stone-400 border border-border hover:text-stone-200 hover:border-border/80"
                }`}
                whileHover={stage === "idle" ? { scale: 1.02 } : {}}
                whileTap={stage === "idle" ? { scale: 0.98 } : {}}
                transition={springSnappy}
              >
                {mode === "quick" ? (
                  <Zap className="w-4 h-4" strokeWidth={1.5} />
                ) : (
                  <Layers className="w-4 h-4" strokeWidth={1.5} />
                )}
                <span className="capitalize">{mode}</span>
                <span className="text-xs text-stone-500 ml-1">
                  {mode === "quick" ? "~5s" : "~10s"}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={stage === "idle" ? buttonHover : {}}
            whileTap={stage === "idle" ? buttonTap : {}}
            transition={springSnappy}
          >
            <Button
              type="submit"
              disabled={!query.trim() || stage !== "idle"}
              size="lg"
              className="h-12 px-8 bg-gold hover:bg-gold-light text-background font-semibold rounded-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Pickaxe className="w-5 h-5 mr-2" strokeWidth={1.5} />
              Start Mining
            </Button>
          </motion.div>

          {results.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={springSnappy}
              onClick={resetMining}
              className="text-sm text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
            >
              Mine again
            </motion.button>
          )}
        </div>
      </motion.form>

      {/* Mining progress */}
      <AnimatePresence>
        {stage !== "idle" && stage !== "complete" && (
          <MiningProgress currentStage={stage} />
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={springSmooth}
          >
            {/* Results header */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex items-center justify-between mb-6"
            >
              <div>
                <h2 className="font-serif text-2xl font-medium">
                  {results.length} opportunities found
                </h2>
                <p className="text-sm text-stone-400 mt-1 font-mono">
                  Ranked by opportunity score (frequency × intensity × WTP)
                </p>
              </div>
            </motion.div>

            {/* Result cards */}
            <motion.div
              className="space-y-4"
              variants={staggerFast}
              initial="hidden"
              animate="visible"
            >
              {results.map((result, i) => (
                <ResultCard key={result.id} result={result} index={i} />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
