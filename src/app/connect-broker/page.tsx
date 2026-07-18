"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  Zap,
  Database,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PROVIDERS, getProvidersByCategory } from "@/integrations/shared/providers";
import type { ProviderMeta, ProviderField, BrokerCredentials } from "@/integrations/shared/types";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  forex: <Globe className="h-5 w-5" />,
  crypto: <Zap className="h-5 w-5" />,
  prop: <Database className="h-5 w-5" />,
  multi: <Globe className="h-5 w-5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  forex: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  crypto: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  prop: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  multi: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

type Step = "platform" | "credentials" | "test" | "save";

export default function ConnectBrokerPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("platform");
  const [selectedProvider, setSelectedProvider] = React.useState<ProviderMeta | null>(null);
  const [credentialValues, setCredentialValues] = React.useState<Record<string, string>>({});
  const [accountName, setAccountName] = React.useState("");
  const [accountType, setAccountType] = React.useState("live");
  const [showPasswords, setShowPasswords] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [testResult, setTestResult] = React.useState<{
    success: boolean;
    message: string;
    accountInfo?: Record<string, unknown>;
  } | null>(null);

  const steps: Step[] = ["platform", "credentials", "test", "save"];
  const currentStepIndex = steps.indexOf(step);

  const handleSelectPlatform = (provider: ProviderMeta) => {
    setSelectedProvider(provider);
    setCredentialValues({});
    setError("");
    setTestResult(null);
    setStep("credentials");
  };

  const handleFieldChange = (key: string, value: string) => {
    setCredentialValues((prev) => ({ ...prev, [key]: value }));
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleTestConnection = async () => {
    if (!selectedProvider) return;
    setLoading(true);
    setError("");
    setTestResult(null);

    try {
      const res = await fetch("/api/broker-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider.id,
          credentials: credentialValues,
          accountName: accountName || `${selectedProvider.name} Account`,
          accountType,
          brokerName: selectedProvider.name,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setTestResult({
          success: false,
          message: data.error || "Connection failed",
        });
      } else {
        setTestResult({
          success: true,
          message: "Connection successful! Account details retrieved.",
          accountInfo: data,
        });
      }
    } catch {
      setTestResult({
        success: false,
        message: "Network error. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    router.push("/accounts");
  };

  const isFieldValid = (field: ProviderField): boolean => {
    if (!field.required) return true;
    return Boolean(credentialValues[field.key]?.trim());
  };

  const allFieldsValid = selectedProvider?.fields.every(isFieldValid) ?? false;

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-zinc-100">TradeVault</span>
          </Link>
        </div>

        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {steps.map((s, i) => (
              <React.Fragment key={s}>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    i < currentStepIndex
                      ? "bg-blue-600 text-white"
                      : i === currentStepIndex
                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/40"
                        : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {i < currentStepIndex ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`h-0.5 w-8 ${
                      i < currentStepIndex ? "bg-blue-600" : "bg-zinc-800"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="mt-2 text-center text-sm text-zinc-500 capitalize">{step}</p>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Platform Selection */}
          {step === "platform" && (
            <motion.div
              key="platform"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardHeader>
                  <CardTitle className="text-zinc-100">Select Platform</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Choose your broker or trading platform to connect
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {(["forex", "crypto", "prop", "multi"] as const).map((category) => {
                    const providers = getProvidersByCategory(category);
                    if (providers.length === 0) return null;
                    return (
                      <div key={category}>
                        <div className="mb-3 flex items-center gap-2">
                          <div className={CATEGORY_COLORS[category]}>
                            {CATEGORY_ICONS[category]}
                          </div>
                          <h3 className="text-sm font-medium text-zinc-300 uppercase tracking-wider">
                            {category === "multi" ? "Multi-Asset" : category}
                          </h3>
                        </div>
                        <div className="grid gap-2">
                          {providers.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => handleSelectPlatform(p)}
                              className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-800/50"
                            >
                              <div>
                                <span className="text-sm font-medium text-zinc-200">
                                  {p.name}
                                </span>
                                <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">
                                  {p.description}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {p.hasRealApi ? (
                                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs">
                                    <Wifi className="mr-1 h-3 w-3" /> Live API
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="border-zinc-600 text-zinc-500 text-xs">
                                    <WifiOff className="mr-1 h-3 w-3" /> Gateway
                                  </Badge>
                                )}
                                <ArrowRight className="h-4 w-4 text-zinc-600" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Credentials */}
          {step === "credentials" && selectedProvider && (
            <motion.div
              key="credentials"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep("platform")}
                      className="text-zinc-400 hover:text-zinc-200"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                      <CardTitle className="text-zinc-100">
                        {selectedProvider.name} Credentials
                      </CardTitle>
                      <CardDescription className="text-zinc-400">
                        {!selectedProvider.hasRealApi
                          ? "Note: This provider requires additional setup. See documentation below."
                          : "Enter your API credentials to connect"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!selectedProvider.hasRealApi && (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                      <p className="text-sm text-amber-400">
                        {selectedProvider.description}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="accountName" className="text-zinc-300">
                      Account Name (optional)
                    </Label>
                    <Input
                      id="accountName"
                      placeholder={`${selectedProvider.name} Account`}
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Account Type</Label>
                    <div className="flex gap-2">
                      {["live", "demo", "prop", "paper"].map((type) => (
                        <button
                          key={type}
                          onClick={() => setAccountType(type)}
                          className={`flex-1 rounded-lg border p-2 text-sm capitalize transition-colors ${
                            accountType === type
                              ? "border-blue-500 bg-blue-500/10 text-blue-400"
                              : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedProvider.fields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={field.key} className="text-zinc-300">
                        {field.label}
                        {field.required && <span className="ml-1 text-red-400">*</span>}
                      </Label>
                      {field.type === "select" ? (
                        <select
                          id={field.key}
                          value={credentialValues[field.key] || ""}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className="flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        >
                          <option value="">Select...</option>
                          {field.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="relative">
                          <Input
                            id={field.key}
                            type={
                              field.type === "password" && !showPasswords.has(field.key)
                                ? "password"
                                : "text"
                            }
                            placeholder={field.placeholder}
                            value={credentialValues[field.key] || ""}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            className={`${
                              field.type === "password" ? "pr-9" : ""
                            } bg-zinc-800 border-zinc-700`}
                          />
                          {field.type === "password" && (
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(field.key)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                            >
                              {showPasswords.has(field.key) ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      )}
                      {field.helpText && (
                        <p className="text-xs text-zinc-500">{field.helpText}</p>
                      )}
                    </div>
                  ))}

                  {error && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setStep("platform")}
                      className="flex-1"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      onClick={() => setStep("test")}
                      disabled={!allFieldsValid}
                      className="flex-1"
                    >
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Test Connection */}
          {step === "test" && selectedProvider && (
            <motion.div
              key="test"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardHeader>
                  <CardTitle className="text-zinc-100">Test Connection</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Verify your credentials and connect to {selectedProvider.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!testResult && !loading && (
                    <div className="text-center py-8">
                      <Wifi className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
                      <p className="text-zinc-400">
                        Click the button below to test your connection to{" "}
                        {selectedProvider.name}
                      </p>
                    </div>
                  )}

                  {loading && (
                    <div className="text-center py-8">
                      <Loader2 className="mx-auto h-12 w-12 text-blue-500 animate-spin mb-4" />
                      <p className="text-zinc-400">Testing connection...</p>
                    </div>
                  )}

                  {testResult && (
                    <div
                      className={`rounded-lg border p-4 ${
                        testResult.success
                          ? "border-emerald-500/20 bg-emerald-500/10"
                          : "border-red-500/20 bg-red-500/10"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {testResult.success ? (
                          <Check className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        <p
                          className={`text-sm font-medium ${
                            testResult.success ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {testResult.message}
                        </p>
                      </div>
                      {testResult.accountInfo && (
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(testResult.accountInfo)
                            .filter(([k]) =>
                              [
                                "balance",
                                "equity",
                                "margin",
                                "freeMargin",
                                "currency",
                                "openPositions",
                              ].includes(k)
                            )
                            .map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-zinc-500 capitalize">
                                  {key.replace(/([A-Z])/g, " $1").trim()}:
                                </span>
                                <span className="text-zinc-200">
                                  {typeof value === "number"
                                    ? value.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })
                                    : String(value)}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setStep("credentials")}
                      className="flex-1"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    {testResult?.success ? (
                      <Button onClick={() => setStep("save")} className="flex-1">
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleTestConnection}
                        disabled={loading}
                        className="flex-1"
                      >
                        {loading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Wifi className="mr-2 h-4 w-4" />
                        )}
                        Test Connection
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Save */}
          {step === "save" && selectedProvider && (
            <motion.div
              key="save"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardHeader>
                  <CardTitle className="text-zinc-100">Connection Saved</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Your {selectedProvider.name} account is now connected
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                      <Check className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-medium text-zinc-100">
                      {accountName || selectedProvider.name + " Account"}
                    </h3>
                    <p className="text-sm text-zinc-400">
                      Your account will sync automatically every 5 minutes. You can
                      also trigger a manual sync from the Accounts page.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleComplete}
                      className="flex-1"
                    >
                      Go to Accounts
                    </Button>
                    <Button onClick={handleComplete} className="flex-1">
                      Go to Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
