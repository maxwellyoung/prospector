/**
 * Prospector Motion System
 * 
 * Inspired by Emil Kowalski's motion grammar:
 * Named, composable, consistent spring configurations
 * and animation variants.
 * 
 * Every animation is intentional. Nothing moves without reason.
 */

import type { Transition, Variants } from "framer-motion";

// ===== Spring Configurations =====
// Named springs — each has a personality

/** Gentle entrance — for hero elements, first impressions */
export const springGentle: Transition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
  mass: 1,
};

/** Snappy response — for buttons, interactive elements */
export const springSnappy: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 0.8,
};

/** Bouncy delight — for success states, celebrations */
export const springBouncy: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 15,
  mass: 0.5,
};

/** Smooth glide — for layout transitions, cards */
export const springSmooth: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 25,
  mass: 1,
};

/** Heavy settle — for modals, important elements */
export const springHeavy: Transition = {
  type: "spring",
  stiffness: 150,
  damping: 30,
  mass: 1.5,
};

// ===== Animation Variants =====
// Composable building blocks

/** Fade up — the workhorse entrance */
export const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: springGentle,
  },
};

/** Fade in — simple opacity */
export const fadeIn: Variants = {
  hidden: {
    opacity: 0,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    transition: springGentle,
  },
};

/** Scale up — for cards, interactive elements */
export const scaleUp: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: springSmooth,
  },
};

/** Slide in from left */
export const slideLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -30,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: springGentle,
  },
};

/** Slide in from right */
export const slideRight: Variants = {
  hidden: {
    opacity: 0,
    x: 30,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: springGentle,
  },
};

// ===== Stagger Containers =====

/** Stagger children — for lists and grids */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

/** Slow stagger — for hero sections */
export const staggerSlow: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

/** Fast stagger — for result cards appearing */
export const staggerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

// ===== Hover Micro-interactions =====

/** Card hover — subtle lift with warm shadow */
export const cardHover = {
  scale: 1.02,
  y: -2,
  transition: springSnappy,
};

/** Button hover — gentle scale */
export const buttonHover = {
  scale: 1.03,
  transition: springSnappy,
};

/** Button tap — satisfying press */
export const buttonTap = {
  scale: 0.97,
  transition: { duration: 0.1 },
};

/** Icon hover — playful rotation */
export const iconHover = {
  rotate: 5,
  scale: 1.1,
  transition: springBouncy,
};

// ===== Page Transitions =====

export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      ...springGentle,
      duration: 0.4,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
    },
  },
};

// ===== Viewport trigger config =====
export const viewportOnce = {
  once: true,
  margin: "-50px",
};

export const viewportAlways = {
  once: false,
  margin: "-50px",
};
