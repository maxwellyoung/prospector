"use client";

import { motion } from "framer-motion";
import { Search, Pickaxe, Gem } from "lucide-react";
import {
  fadeUp,
  staggerContainer,
  scaleUp,
  viewportOnce,
  springSmooth,
} from "@/lib/motion";

const steps = [
  {
    icon: Search,
    title: "Enter a niche",
    description:
      "Type any market, problem space, or audience. Fitness apps, invoicing, pet care — anything.",
    step: "01",
  },
  {
    icon: Pickaxe,
    title: "We mine the internet",
    description:
      "Prospector scours Reddit, Hacker News, forums, and reviews for real frustration signals.",
    step: "02",
  },
  {
    icon: Gem,
    title: "Get ranked opportunities",
    description:
      "AI scores each opportunity by frequency, intensity, and willingness to pay. Gold surfaces first.",
    step: "03",
  },
];

export function HowItWorks() {
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
            How it works
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight">
            Three steps to gold
          </h2>
        </motion.div>

        {/* Steps */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {steps.map((step) => (
            <motion.div
              key={step.step}
              variants={scaleUp}
              className="group relative"
            >
              <div className="glass rounded-2xl p-8 h-full transition-all duration-300 hover:border-gold/20">
                {/* Step number */}
                <span className="block font-mono text-sm text-stone-500 mb-6">
                  {step.step}
                </span>

                {/* Icon */}
                <motion.div
                  className="w-12 h-12 rounded-xl bg-gold-muted flex items-center justify-center mb-6"
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={springSmooth}
                >
                  <step.icon className="w-6 h-6 text-gold" strokeWidth={1.5} />
                </motion.div>

                {/* Content */}
                <h3 className="font-serif text-xl font-medium mb-3">
                  {step.title}
                </h3>
                <p className="text-stone-400 leading-relaxed text-[15px]">
                  {step.description}
                </p>
              </div>

              {/* Connector line (desktop only) */}
              {step.step !== "03" && (
                <div className="hidden md:block absolute top-1/2 -right-6 w-12 border-t border-dashed border-stone-500/20" />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
