"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pickaxe, Clock, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { springSnappy } from "@/lib/motion";

const navItems = [
  {
    label: "Mine",
    href: "/mine",
    icon: Pickaxe,
  },
  {
    label: "History",
    href: "/history",
    icon: Clock,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-16 md:w-64 flex flex-col bg-background border-r border-border z-50">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 px-4 md:px-6 h-16">
        <span className="text-2xl">⛏️</span>
        <span className="hidden md:block font-serif text-lg font-medium tracking-tight">
          Prospector
        </span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-2 md:px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                  isActive
                    ? "text-gold"
                    : "text-stone-400 hover:text-stone-200"
                )}
                whileHover={{ x: 2 }}
                transition={springSnappy}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-gold-muted"
                    transition={springSnappy}
                  />
                )}

                <item.icon
                  className="relative z-10 w-5 h-5 shrink-0"
                  strokeWidth={1.5}
                />
                <span className="relative z-10 hidden md:block">
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-4 md:px-6 py-4 border-t border-border">
        <p className="hidden md:block text-xs text-stone-500 font-mono">
          v0.1.0-alpha
        </p>
      </div>
    </aside>
  );
}
