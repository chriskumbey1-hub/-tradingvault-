"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle2, BookOpen, Target, Wallet, Calculator, BarChart3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Welcome to TradeVault",
    description: "Your personal trading journal and analytics platform. Let's get you set up in 3 quick steps.",
    icon: BookOpen,
    color: "text-blue-500",
  },
  {
    title: "Set Your Preferences",
    description: "Choose your currency and timezone for accurate tracking.",
    icon: Target,
    color: "text-emerald-500",
  },
  {
    title: "Connect Your Account",
    description: "Link your trading account or start with manual entry.",
    icon: Wallet,
    color: "text-purple-500",
  },
];

export function OnboardingFlow({ onComplete }: OnboardingProps) {
  const [step, setStep] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [currency, setCurrency] = React.useState("USD");
  const [timezone, setTimezone] = React.useState("UTC");
  const [accountType, setAccountType] = React.useState("manual");
  const [accountName, setAccountName] = React.useState("");
  const [brokerName, setBrokerName] = React.useState("");

  const handleComplete = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Update user preferences
    await supabase.from("user_preferences").upsert({
      user_id: user.id,
      currency,
      timezone,
      onboarding_completed: true,
    }, { onConflict: "user_id" });

    // Create account if specified
    if (accountType !== "manual" && accountName) {
      await supabase.from("trading_accounts").insert({
        user_id: user.id,
        account_name: accountName,
        broker_name: brokerName || accountType,
        account_type: "live",
        platform: accountType,
        currency,
      });
    }

    onComplete();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 backdrop-blur-sm">
      <div className="w-full max-w-lg px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8"
          >
            <div className="flex flex-col items-center text-center">
              {React.createElement(steps[step].icon, {
                className: `h-12 w-12 ${steps[step].color} mb-4`,
              })}
              <h2 className="text-xl font-bold text-zinc-100">{steps[step].title}</h2>
              <p className="mt-2 text-sm text-zinc-400">{steps[step].description}</p>
            </div>

            <div className="mt-8">
              {step === 0 && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4 text-center">
                      <BarChart3 className="mx-auto h-8 w-8 text-blue-500" />
                      <p className="mt-2 text-sm font-medium text-zinc-100">Track Trades</p>
                      <p className="text-xs text-zinc-500">Log every trade with details</p>
                    </div>
                    <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4 text-center">
                      <Calculator className="mx-auto h-8 w-8 text-emerald-500" />
                      <p className="mt-2 text-sm font-medium text-zinc-100">13 Calculators</p>
                      <p className="text-xs text-zinc-500">Professional trading tools</p>
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="EST">EST (UTC-5)</SelectItem>
                        <SelectItem value="CST">CST (UTC-6)</SelectItem>
                        <SelectItem value="PST">PST (UTC-8)</SelectItem>
                        <SelectItem value="GMT">GMT (UTC+0)</SelectItem>
                        <SelectItem value="CET">CET (UTC+1)</SelectItem>
                        <SelectItem value="JST">JST (UTC+9)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">How would you like to start?</Label>
                    <Select value={accountType} onValueChange={setAccountType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual Entry (No Broker)</SelectItem>
                        <SelectItem value="mt5">MetaTrader 5</SelectItem>
                        <SelectItem value="mt4">MetaTrader 4</SelectItem>
                        <SelectItem value="ctrader">cTrader</SelectItem>
                        <SelectItem value="matchtrader">MatchTrader</SelectItem>
                        <SelectItem value="binance">Binance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {accountType !== "manual" && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-zinc-300">Account Name</Label>
                        <Input
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          placeholder="My Trading Account"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-zinc-300">Broker Name (Optional)</Label>
                        <Input
                          value={brokerName}
                          onChange={(e) => setBrokerName(e.target.value)}
                          placeholder="e.g. IC Markets"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-colors ${
                      i === step ? "w-6 bg-blue-500" : "w-1.5 bg-zinc-700"
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                {step > 0 && (
                  <Button variant="outline" onClick={() => setStep(step - 1)}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}
                {step < steps.length - 1 ? (
                  <Button onClick={() => setStep(step + 1)}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={handleComplete} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    Get Started
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
