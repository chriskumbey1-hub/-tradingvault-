"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TagInput } from "@/components/ui/tag-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { toast } from "sonner";

interface UploadedScreenshot {
  url: string;
  path: string;
  name: string;
}

export default function NewTradePage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [screenshots, setScreenshots] = React.useState<UploadedScreenshot[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [dragOver, setDragOver] = React.useState(false);
  const [tags, setTags] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [formData, setFormData] = React.useState({
    trade_date: new Date().toISOString().split("T")[0],
    symbol: "",
    market_type: "",
    direction: "",
    entry_price: "",
    exit_price: "",
    stop_loss: "",
    take_profit: "",
    lot_size: "",
    risk_amount: "",
    profit_loss: "",
    commission: "0",
    fees: "0",
    strategy: "",
    setup: "",
    emotion: "",
    confidence_level: "",
    notes: "",
    lessons_learned: "",
    status: "win",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const uploadFile = async (file: File): Promise<UploadedScreenshot | null> => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const timestamp = Date.now();
    const fileName = `${user.id}/${timestamp}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("trade-screenshots")
      .upload(fileName, file, { contentType: file.type });

    if (uploadError) return null;

    const {
      data: { publicUrl },
    } = supabase.storage.from("trade-screenshots").getPublicUrl(fileName);

    return { url: publicUrl, path: fileName, name: file.name };
  };

  const handleFiles = async (files: FileList | File[]) => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const validTypes = ["image/png", "image/jpeg", "image/gif"];
    const fileArray = Array.from(files).filter((f) => {
      if (!validTypes.includes(f.type)) return false;
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name} exceeds 10MB limit`);
        return false;
      }
      return true;
    }).slice(0, 5 - screenshots.length);

    if (fileArray.length === 0) return;
    if (screenshots.length + fileArray.length > 5) {
      setError("Maximum 5 screenshots allowed.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError("");

    const total = fileArray.length;
    const uploaded: UploadedScreenshot[] = [];

    for (let i = 0; i < total; i++) {
      const result = await uploadFile(fileArray[i]);
      if (result) {
        uploaded.push(result);
      }
      setUploadProgress(Math.round(((i + 1) / total) * 100));
    }

    if (uploaded.length > 0) {
      setScreenshots((prev) => [...prev, ...uploaded].slice(0, 5));
    }
    setUploading(false);
    setUploadProgress(0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in to add a trade.");
      setLoading(false);
      return;
    }

    const entryPrice = parseFloat(formData.entry_price);
    const exitPrice = formData.exit_price ? parseFloat(formData.exit_price) : null;
    const lotSize = parseFloat(formData.lot_size);

    if (isNaN(entryPrice) || isNaN(lotSize)) {
      setError("Entry price and lot size are required.");
      setLoading(false);
      return;
    }

    let profitLoss = formData.profit_loss ? parseFloat(formData.profit_loss) : null;

    if (profitLoss === null && exitPrice !== null && !isNaN(exitPrice) && !isNaN(lotSize)) {
      let multiplier = 1;
      if (formData.market_type === "forex") {
        multiplier = 100000;
      } else if (formData.market_type === "indices" || formData.market_type === "commodities") {
        multiplier = 100;
      }
      profitLoss = (exitPrice - entryPrice) * lotSize * multiplier;
    }

    const commission = parseFloat(formData.commission) || 0;
    const fees = parseFloat(formData.fees) || 0;
    const profitLossNet = profitLoss !== null ? profitLoss - commission - fees : null;

    const tradeData = {
      user_id: user.id,
      symbol: formData.symbol,
      market_type: formData.market_type || null,
      direction: formData.direction,
      entry_price: entryPrice,
      exit_price: exitPrice,
      stop_loss: formData.stop_loss ? parseFloat(formData.stop_loss) : null,
      take_profit: formData.take_profit ? parseFloat(formData.take_profit) : null,
      lot_size: lotSize,
      risk_amount: formData.risk_amount ? parseFloat(formData.risk_amount) : null,
      profit_loss: profitLossNet,
      commission,
      fees,
      strategy: formData.strategy || null,
      setup: formData.setup || null,
      emotion: formData.emotion || null,
      confidence_level: formData.confidence_level ? parseInt(formData.confidence_level) : null,
      notes: formData.notes || null,
      lessons_learned: formData.lessons_learned || null,
      tags: tags,
      status: formData.status,
      trade_date: formData.trade_date,
      screenshots: screenshots.map((s) => s.url),
    };

    const { error: insertError } = await supabase.from("trades").insert(tradeData);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    toast.success("Trade created");
    router.push("/journal");
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/journal">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Add New Trade</h1>
            <p className="text-sm text-zinc-400">
              Record your trade details for future analysis
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-lg text-zinc-100">
                  Trade Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="trade_date" className="text-zinc-300">
                      Date
                    </Label>
                    <Input
                      id="trade_date"
                      name="trade_date"
                      type="date"
                      value={formData.trade_date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="symbol" className="text-zinc-300">
                      Symbol
                    </Label>
                    <Input
                      id="symbol"
                      name="symbol"
                      placeholder="EUR/USD, BTC/USD, GOLD"
                      value={formData.symbol}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Market</Label>
                    <Select
                      value={formData.market_type}
                      onValueChange={(v) =>
                        handleSelectChange("market_type", v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select market" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="forex">Forex</SelectItem>
                        <SelectItem value="crypto">Crypto</SelectItem>
                        <SelectItem value="stocks">Stocks</SelectItem>
                        <SelectItem value="commodities">Commodities</SelectItem>
                        <SelectItem value="indices">Indices</SelectItem>
                        <SelectItem value="futures">Futures</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Direction</Label>
                    <Select
                      value={formData.direction}
                      onValueChange={(v) =>
                        handleSelectChange("direction", v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select direction" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="long">Long</SelectItem>
                        <SelectItem value="short">Short</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="entry_price" className="text-zinc-300">
                      Entry Price
                    </Label>
                    <Input
                      id="entry_price"
                      name="entry_price"
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={formData.entry_price}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exit_price" className="text-zinc-300">
                      Exit Price
                    </Label>
                    <Input
                      id="exit_price"
                      name="exit_price"
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={formData.exit_price}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stop_loss" className="text-zinc-300">
                      Stop Loss
                    </Label>
                    <Input
                      id="stop_loss"
                      name="stop_loss"
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={formData.stop_loss}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="take_profit" className="text-zinc-300">
                      Take Profit
                    </Label>
                    <Input
                      id="take_profit"
                      name="take_profit"
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={formData.take_profit}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="lot_size" className="text-zinc-300">
                      Lot Size
                    </Label>
                    <Input
                      id="lot_size"
                      name="lot_size"
                      type="number"
                      step="any"
                      placeholder="0.01"
                      value={formData.lot_size}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="risk_amount" className="text-zinc-300">
                      Risk Amount ($)
                    </Label>
                    <Input
                      id="risk_amount"
                      name="risk_amount"
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={formData.risk_amount}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commission" className="text-zinc-300">
                      Commission ($)
                    </Label>
                    <Input
                      id="commission"
                      name="commission"
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={formData.commission}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fees" className="text-zinc-300">
                      Fees ($)
                    </Label>
                    <Input
                      id="fees"
                      name="fees"
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={formData.fees}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) =>
                        handleSelectChange("status", v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="win">Win</SelectItem>
                        <SelectItem value="loss">Loss</SelectItem>
                        <SelectItem value="breakeven">Breakeven</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profit_loss" className="text-zinc-300">
                      Profit/Loss ($) — auto-calculated if exit price provided
                    </Label>
                    <Input
                      id="profit_loss"
                      name="profit_loss"
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={formData.profit_loss}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-lg text-zinc-100">
                  Trading Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="strategy" className="text-zinc-300">
                      Strategy
                    </Label>
                    <Input
                      id="strategy"
                      name="strategy"
                      placeholder="ICT, SMC, Breakout, Scalping"
                      value={formData.strategy}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="setup" className="text-zinc-300">
                      Setup
                    </Label>
                    <Input
                      id="setup"
                      name="setup"
                      placeholder="London Open, NY Session"
                      value={formData.setup}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Emotion</Label>
                    <Select
                      value={formData.emotion}
                      onValueChange={(v) =>
                        handleSelectChange("emotion", v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select emotion" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confident">Confident</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="fearful">Fearful</SelectItem>
                        <SelectItem value="greedy">Greedy</SelectItem>
                        <SelectItem value="fomo">FOMO</SelectItem>
                        <SelectItem value="revenge">Revenge</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="confidence_level"
                      className="text-zinc-300"
                    >
                      Confidence Level (1-10)
                    </Label>
                    <Input
                      id="confidence_level"
                      name="confidence_level"
                      type="number"
                      min="1"
                      max="10"
                      placeholder="1-10"
                      value={formData.confidence_level}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-zinc-300">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="What did you learn? What went well? What could be improved?"
                    rows={4}
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Tags</Label>
                  <TagInput
                    tags={tags}
                    onChange={setTags}
                    placeholder="e.g. london-open, breakout, news-trade"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lessons_learned" className="text-zinc-300">
                    Lessons Learned
                  </Label>
                  <Textarea
                    id="lessons_learned"
                    name="lessons_learned"
                    placeholder="What key takeaway will you remember for next time?"
                    rows={3}
                    value={formData.lessons_learned}
                    onChange={handleChange}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-lg text-zinc-100">
                  Screenshots ({screenshots.length}/5)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {screenshots.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                    {screenshots.map((screenshot, index) => (
                      <div
                        key={index}
                        className="group relative overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800"
                      >
                        <img
                          src={screenshot.url}
                          alt={screenshot.name}
                          className="aspect-square w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeScreenshot(index)}
                          aria-label="Remove screenshot"
                          className="absolute right-1 top-1 rounded-full bg-zinc-900/80 p-1 text-zinc-400 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-zinc-900/80 px-2 py-1">
                          <p className="truncate text-xs text-zinc-400">
                            {screenshot.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading... {uploadProgress}%
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif"
                  multiple
                  className="hidden"
                  onChange={handleInputChange}
                />

                {screenshots.length < 5 && !uploading && (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex h-32 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                      dragOver
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                    }`}
                  >
                    <div className="text-center">
                      {dragOver ? (
                        <ImageIcon className="mx-auto h-8 w-8 text-blue-400" />
                      ) : (
                        <Upload className="mx-auto h-8 w-8 text-zinc-500" />
                      )}
                      <p className="mt-2 text-sm text-zinc-400">
                        {dragOver ? "Drop images here" : "Click to upload or drag and drop"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        PNG, JPG, GIF up to 10MB ({5 - screenshots.length} remaining)
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <div className="flex items-center justify-end gap-4">
            <Button variant="outline" type="button" asChild>
              <Link href="/journal">Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading || uploading} className="gap-2">
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : "Save Trade"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
