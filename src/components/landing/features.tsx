"use client";

import { motion } from "framer-motion";
import { Brain, Globe, BarChart3, FileDown } from "lucide-react";
import {
  scaleUp,
  staggerContainer,
  viewportOnce,
  springSmooth,
  fadeUp,
} from "@/lib/motion";

const features = [
  {
    icon: Brain,
    title: "AI Sentiment Analysis",
    description:
      "Claude analyzes frustration intensity, emotional valence, and urgency across every mention. Not just keywords — understanding.",
    accent: "from-gold/20 to-transparent",
  },
  {
    icon: Globe,
    title: "Multi-Source Mining",
    description:
      "Reddit, Hacker News, Brave Search, app reviews. We go where the conversations are and extract signal from noise.",
    accent: "from-blue-500/10 to-transparent",
  },
  {
    icon: BarChart3,
    title: "Opportunity Scoring",
    description:
      "Frequency × intensity × willingness to pay. A single number that tells you where to dig deeper.",
    accent: "from-emerald-500/10 to-transparent",
  },
  {
    icon: FileDown,
    title: "Export Reports",
    description:
      "JSON, Markdown, or shareable dashboards. Take your research wherever you need it.",
    accent: "from-purple-500/10 to-transparent",
  },
];

export function Features() {
  return (
    <section className="relative py-32 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
          className="text-center mb-20"
        >
          <p className="text-sm font-mono text-gold mb-3 tracking-wider uppercase">
            Features
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight">
            Everything you need to prospect
          </h2>
          <p className="mt-4 text-stone-400 max-w-lg mx-auto text-lg">
            Built for founders who want signal, not noise.
          </p>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={scaleUp}
              whileHover={{ y: -4, transition: springSmooth }}
              className="group relative overflow-hidden rounded-2xl glass p-8 cursor-default"
            >
              {/* Gradient accent — top left glow */}
              <div
                className={`absolute top-0 left-0 w-40 h-40 bg-gradient-to-br ${feature.accent} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
              />

              <div className="relative z-10">
                {/* Icon */}
                <motion.div
                  className="w-12 h-12 rounded-xl bg-gold-muted flex items-center justify-center mb-5"
                  whileHover={{ rotate: -5, scale: 1.05 }}
                  transition={springSmooth}
                >
                  <feature.icon
                    className="w-6 h-6 text-gold"
                    strokeWidth={1.5}
                  />
                </motion.div>

                {/* Content */}
                <h3 className="font-serif text-xl font-medium mb-3">
                  {feature.title}
                </h3>
                <p className="text-stone-400 leading-relaxed text-[15px]">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
