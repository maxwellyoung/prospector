"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pickaxe, Zap, Layers, AlertTriangle } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [counts, setCounts] = useState<{ reddit?: number; hn?: number }>({});
  const abortRef = useRef<AbortController | null>(null);

  const handleSSEEvent = useCallback((data: Record<string, unknown>) => {
    const eventStage = data.stage as string;
    const status = data.status as string;

    if (data.message) {
      setStatusMessage(data.message as string);
    }

    switch (eventStage) {
      case "reddit":
        if (status === "searching") {
          setStage("reddit");
        } else if (status === "done") {
          setCounts((prev) => ({ ...prev, reddit: data.count as number }));
        }
        break;

      case "hackernews":
        if (status === "searching") {
          setStage("hackernews");
        } else if (status === "done") {
          setCounts((prev) => ({ ...prev, hn: data.count as number }));
        }
        break;

      case "analyze":
        if (status === "processing") {
          setStage("analyzing");
        } else if (status === "error") {
          setError(data.message as string);
        }
        break;

      case "scoring":
        if (status === "processing") {
          setStage("scoring");
        }
        break;

      case "complete":
        setStage("complete");
        if (data.results && Array.isArray(data.results)) {
          setResults(data.results as MiningResult[]);
        }
        if (data.results && (data.results as unknown[]).length === 0 && data.message) {
          setError(data.message as string);
        }
        break;

      case "error":
        setError(data.message as string);
        setStage("idle");
        break;
    }
  }, []);

  const startMining = useCallback(async () => {
    if (!query.trim() || stage !== "idle") return;

    setResults([]);
    setError(null);
    setStatusMessage("");
    setCounts({});
    setStage("reddit");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/mine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), depth }),
        signal: controller.signal,
      });

      // Handle non-streaming error responses
      if (!response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = await response.json();
          setError(data.error || `Server error (${response.status})`);
          setStage("idle");
          return;
        }
        setError(`Server error (${response.status})`);
        setStage("idle");
        return;
      }

      // Read the SSE stream
      const reader = response.body?.getReader();
      if (!reader) {
        setError("Failed to read response stream");
        setStage("idle");
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(trimmed.slice(6));
            handleSSEEvent(data);
          } catch {
            // Skip malformed events
          }
        }
      }

      // Process any remaining data in buffer
      if (buffer.trim().startsWith("data: ")) {
        try {
          const data = JSON.parse(buffer.trim().slice(6));
          handleSSEEvent(data);
        } catch {
          // Skip
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // User cancelled
        setStage("idle");
        return;
      }
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setStage("idle");
    }
  }, [query, stage, depth, handleSSEEvent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startMining();
  };

  const resetMining = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setStage("idle");
    setResults([]);
    setError(null);
    setStatusMessage("");
    setCounts({});
  };

  const isMining = stage !== "idle" && stage !== "complete";

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

      {/* Error display */}
      <AnimatePresence>
        {error && stage === "idle" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={springSmooth}
            className="glass rounded-2xl p-5 border-amber-500/20 bg-amber-500/5"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-amber-200 text-sm font-medium">Mining failed</p>
                <p className="text-amber-300/70 text-sm mt-1">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            disabled={isMining}
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
                onClick={() => !isMining && setDepth(mode)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  depth === mode
                    ? "bg-gold-muted text-gold border border-gold/20"
                    : "bg-surface text-stone-400 border border-border hover:text-stone-200 hover:border-border/80"
                }`}
                whileHover={!isMining ? { scale: 1.02 } : {}}
                whileTap={!isMining ? { scale: 0.98 } : {}}
                transition={springSnappy}
              >
                {mode === "quick" ? (
                  <Zap className="w-4 h-4" strokeWidth={1.5} />
                ) : (
                  <Layers className="w-4 h-4" strokeWidth={1.5} />
                )}
                <span className="capitalize">{mode}</span>
                <span className="text-xs text-stone-500 ml-1">
                  {mode === "quick" ? "~30s" : "~2min"}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-3">
          {isMining ? (
            <Button
              type="button"
              onClick={resetMining}
              size="lg"
              className="h-12 px-8 bg-stone-700 hover:bg-stone-600 text-stone-200 font-semibold rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
          ) : (
            <motion.div
              whileHover={stage === "idle" ? buttonHover : {}}
              whileTap={stage === "idle" ? buttonTap : {}}
              transition={springSnappy}
            >
              <Button
                type="submit"
                disabled={!query.trim() || isMining}
                size="lg"
                className="h-12 px-8 bg-gold hover:bg-gold-light text-background font-semibold rounded-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Pickaxe className="w-5 h-5 mr-2" strokeWidth={1.5} />
                Start Mining
              </Button>
            </motion.div>
          )}

          {results.length > 0 && !isMining && (
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
        {isMining && (
          <MiningProgress
            currentStage={stage}
            statusMessage={statusMessage}
            counts={counts}
          />
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && stage === "complete" && (
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
                  Ranked by opportunity score (frequency × intensity × WTP × market)
                </p>
                {(counts.reddit !== undefined || counts.hn !== undefined) && (
                  <p className="text-xs text-stone-500 mt-1 font-mono">
                    Analyzed {counts.reddit ?? 0} Reddit + {counts.hn ?? 0} HN posts
                  </p>
                )}
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

      {/* No results state */}
      <AnimatePresence>
        {results.length === 0 && stage === "complete" && !error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={springSmooth}
            className="glass rounded-2xl p-8 text-center"
          >
            <p className="text-stone-400 text-lg">
              No opportunities found for this query. Try a broader niche or different keywords.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
