"use client";

import * as React from "react";
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { PLATFORMS, PLATFORM_FIELDS, BROKER_SERVERS } from "@/lib/platforms";
import { PlatformType } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

interface ConnectionFormModalProps {
  open: boolean;
  platform: PlatformType | null;
  onOpenChange: (open: boolean) => void;
  onConnect: (data: {
    platform: PlatformType;
    accountName: string;
    credentials: Record<string, string>;
    accountType: string;
  }) => void;
  connecting: boolean;
}

export function ConnectionFormModal({
  open,
  platform,
  onOpenChange,
  onConnect,
  connecting,
}: ConnectionFormModalProps) {
  const [fields, setFields] = React.useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = React.useState<Record<string, boolean>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [serverSearch, setServerSearch] = React.useState("");
  const [showServerDropdown, setShowServerDropdown] = React.useState(false);
  const serverInputRef = React.useRef<HTMLDivElement>(null);
  const firstInputRef = React.useRef<HTMLInputElement>(null);

  const platformInfo = PLATFORMS.find((p) => p.id === platform);
  const platformFields = platform ? PLATFORM_FIELDS[platform] || [] : [];
  const servers = platform ? BROKER_SERVERS[platform] || [] : [];
  const hasServerField = platformFields.some((f) => f.label === "Broker Server");

  React.useEffect(() => {
    if (open) {
      setFields({});
      setErrors({});
      setServerSearch("");
      setShowPasswords({});
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [open]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (serverInputRef.current && !serverInputRef.current.contains(e.target as Node)) {
        setShowServerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!platform || !platformInfo) return null;

  const filteredServers = servers.filter((s) =>
    s.toLowerCase().includes(serverSearch.toLowerCase())
  );

  const handleChange = (label: string, value: string) => {
    setFields((prev) => ({ ...prev, [label]: value }));
    if (errors[label]) setErrors((prev) => ({ ...prev, [label]: "" }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    for (const field of platformFields) {
      if (field.required && !fields[field.label]?.trim()) {
        newErrors[field.label] = `${field.label} is required`;
      }
      if (field.label === "Login ID" && fields[field.label] && !/^\d+$/.test(fields[field.label])) {
        newErrors[field.label] = "Must be numbers only";
      }
      if (field.label === "Account Name" && fields[field.label] && fields[field.label].length > 50) {
        newErrors[field.label] = "Maximum 50 characters";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate() || connecting) return;
    const credentials: Record<string, string> = {};
    platformFields.forEach((f) => {
      if (fields[f.label]) credentials[f.label] = fields[f.label];
    });
    onConnect({
      platform,
      accountName: fields["Account Name"] || `${platformInfo.name} Account`,
      credentials: {
        ...credentials,
        server: fields["Broker Server"] || "",
        loginId: fields["Login ID"] || fields["Account Number"] || "",
        password: fields["Password"] || fields["API Secret"] || "",
        apiSecret: fields["API Secret"] || "",
      },
      accountType: "live",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !connecting) handleSubmit();
  };

  const canSubmit =
    platformFields.filter((f) => f.required).every((f) => fields[f.label]?.trim()) &&
    !connecting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-zinc-800 bg-zinc-900 p-0" onKeyDown={handleKeyDown}>
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold text-white"
              style={{ backgroundColor: platformInfo.logoColor + "20", color: platformInfo.logoColor }}
            >
              {platform.toUpperCase().slice(0, 2)}
            </div>
            <div>
              <DialogTitle className="text-lg text-zinc-100">
                Connect {platformInfo.name}
              </DialogTitle>
            </div>
          </div>
          <p className="text-sm text-zinc-400">
            Enter your account credentials to connect
          </p>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {platformFields.map((field, index) => {
            if (field.label === "Broker Server" && servers.length > 0) {
              return (
                <div key={field.label} className="space-y-2" ref={serverInputRef}>
                  <Label className="text-zinc-300">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </Label>
                  <div className="relative">
                    <Input
                      ref={index === 0 ? firstInputRef : undefined}
                      placeholder={field.placeholder}
                      value={fields[field.label] || serverSearch}
                      onChange={(e) => {
                        setServerSearch(e.target.value);
                        handleChange(field.label, e.target.value);
                        setShowServerDropdown(true);
                      }}
                      onFocus={() => setShowServerDropdown(true)}
                      className={errors[field.label] ? "border-red-500/50" : ""}
                    />
                    {showServerDropdown && filteredServers.length > 0 && (
                      <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-800 shadow-xl">
                        {filteredServers.map((server) => (
                          <button
                            key={server}
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
                            onClick={() => {
                              handleChange(field.label, server);
                              setServerSearch("");
                              setShowServerDropdown(false);
                            }}
                          >
                            {server}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors[field.label] && (
                    <p className="text-xs text-red-400">{errors[field.label]}</p>
                  )}
                </div>
              );
            }

            if (field.label === "Account Type" && platform === "manual") {
              return (
                <div key={field.label} className="space-y-2">
                  <Label className="text-zinc-300">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </Label>
                  <Select
                    value={fields[field.label] || ""}
                    onValueChange={(v) => handleChange(field.label, v)}
                  >
                    <SelectTrigger className={errors[field.label] ? "border-red-500/50" : ""}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="demo">Demo</SelectItem>
                      <SelectItem value="prop">Prop Firm</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors[field.label] && (
                    <p className="text-xs text-red-400">{errors[field.label]}</p>
                  )}
                </div>
              );
            }

            if (field.label === "Currency" && platform === "manual") {
              return (
                <div key={field.label} className="space-y-2">
                  <Label className="text-zinc-300">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </Label>
                  <Select
                    value={fields[field.label] || ""}
                    onValueChange={(v) => handleChange(field.label, v)}
                  >
                    <SelectTrigger className={errors[field.label] ? "border-red-500/50" : ""}>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="USDT">USDT</SelectItem>
                      <SelectItem value="BTC">BTC</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors[field.label] && (
                    <p className="text-xs text-red-400">{errors[field.label]}</p>
                  )}
                </div>
              );
            }

            const isPassword = field.type === "password" || field.label.toLowerCase().includes("secret") || field.label.toLowerCase().includes("password");
            const showKey = `show_${field.label}`;

            return (
              <div key={field.label} className="space-y-2">
                <Label className="text-zinc-300">
                  {field.label}
                  {field.required && <span className="text-red-400 ml-1">*</span>}
                </Label>
                <div className="relative">
                  <Input
                    ref={index === 0 ? firstInputRef : undefined}
                    type={isPassword && !showPasswords[showKey] ? "password" : field.type === "number" ? "number" : "text"}
                    placeholder={field.placeholder}
                    value={fields[field.label] || ""}
                    onChange={(e) => handleChange(field.label, e.target.value)}
                    className={isPassword ? "pr-10" : ""}
                    autoComplete={isPassword ? "new-password" : "off"}
                  />
                  {isPassword && (
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords((prev) => ({ ...prev, [showKey]: !prev[showKey] }))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showPasswords[showKey] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  )}
                </div>
                {errors[field.label] && (
                  <p className="text-xs text-red-400">{errors[field.label]}</p>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter className="px-6 pb-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={connecting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} className="min-w-[140px]">
            {connecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Connect Account
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
