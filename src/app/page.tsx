"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  BarChart3,
  BookOpen,
  Camera,
  Target,
  FileText,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: BookOpen,
    title: "Trading Journal",
    description: "Record every trade with detailed information and context.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Understand your performance with powerful visualizations.",
  },
  {
    icon: Target,
    title: "Strategy Tracking",
    description: "Know what strategies make money and refine your edge.",
  },
  {
    icon: FileText,
    title: "Trade Review",
    description: "Learn from every position and improve your decision-making.",
  },
  {
    icon: Camera,
    title: "Screenshot Storage",
    description: "Save chart screenshots to review your setups later.",
  },
  {
    icon: TrendingUp,
    title: "Performance Reports",
    description: "Analyze your progress over time with detailed reports.",
  },
];

const stats = [
  { label: "Active Traders", value: "10K+" },
  { label: "Trades Logged", value: "1M+" },
  { label: "Win Rate Improvement", value: "23%" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Navigation */}
      <nav className="border-b border-zinc-800">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-zinc-100">TradeVault</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-zinc-400 hover:text-zinc-100">
                Login
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Start Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold tracking-tight text-zinc-100 sm:text-6xl">
              Master Your Trading
              <br />
              <span className="text-blue-500">Performance With Data</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
              Track trades, analyze strategies, and build consistency with
              TradeVault. The modern trading journal for serious traders.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/auth/signup">
                <Button size="lg" className="gap-2">
                  Start Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline">
                  Login
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-20 grid grid-cols-3 gap-8 border-t border-zinc-800 pt-10"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-zinc-100">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-zinc-100">
              Everything you need to improve
            </h2>
            <p className="mt-4 text-lg text-zinc-400">
              Powerful tools to track, analyze, and optimize your trading
              performance.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-zinc-800 bg-zinc-900/50">
                  <CardContent className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600/10">
                      <feature.icon className="h-6 w-6 text-blue-500" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-zinc-100">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-400">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-2xl border border-zinc-800 bg-zinc-900/50 p-2 shadow-2xl"
          >
            <div className="rounded-xl bg-zinc-800/50 p-8">
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
                  <div className="text-sm text-zinc-400">Total Trades</div>
                  <div className="mt-1 text-2xl font-bold text-zinc-100">250</div>
                </div>
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="text-sm text-zinc-400">Total Profit</div>
                  <div className="mt-1 text-2xl font-bold text-emerald-500">+$5,240</div>
                </div>
                <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
                  <div className="text-sm text-zinc-400">Win Rate</div>
                  <div className="mt-1 text-2xl font-bold text-zinc-100">68%</div>
                </div>
                <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
                  <div className="text-sm text-zinc-400">Profit Factor</div>
                  <div className="mt-1 text-2xl font-bold text-zinc-100">2.1</div>
                </div>
              </div>
              <div className="mt-4 h-48 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
                <div className="text-sm text-zinc-400">Equity Curve</div>
                <div className="mt-2 flex h-32 items-end gap-1">
                  {[40, 45, 42, 50, 55, 52, 60, 58, 65, 70, 68, 75, 72, 80, 78, 85].map(
                    (height, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-blue-600/50"
                        style={{ height: `${height}%` }}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-blue-600/10 to-zinc-900 p-12 text-center"
          >
            <h2 className="text-3xl font-bold text-zinc-100">
              Start improving your trading today
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-400">
              Join thousands of traders who use TradeVault to track their
              performance and build consistency.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link href="/auth/signup">
                <Button size="lg" className="gap-2">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-zinc-400">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                Free forever
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                Setup in 2 minutes
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600">
                <TrendingUp className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm font-semibold text-zinc-100">
                TradeVault
              </span>
            </div>
            <div className="flex gap-6 text-sm text-zinc-500">
              <Link href="#" className="hover:text-zinc-300">
                About
              </Link>
              <Link href="#" className="hover:text-zinc-300">
                Features
              </Link>
              <Link href="#" className="hover:text-zinc-300">
                Privacy
              </Link>
              <Link href="#" className="hover:text-zinc-300">
                Terms
              </Link>
              <Link href="#" className="hover:text-zinc-300">
                Contact
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center text-xs text-zinc-600">
            &copy; 2026 TradeVault. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
