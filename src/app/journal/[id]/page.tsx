"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Pencil,
  Trash2,
  Calendar,
  Upload,
  X,
  Loader2,
  ImageIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Trade {
  id: string;
  symbol: string;
  direction: string;
  market_type: string | null;
  entry_price: number;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  lot_size: number;
  risk_amount: number | null;
  profit_loss: number | null;
  commission: number;
  fees: number;
  strategy: string | null;
  setup: string | null;
  emotion: string | null;
  confidence_level: number | null;
  notes: string | null;
  lessons_learned: string | null;
  status: string;
  trade_date: string;
  screenshots: string[] | null;
}

function LoadingSkeleton() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
            <Separator />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function TradeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [trade, setTrade] = React.useState<Trade | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [screenshots, setScreenshots] = React.useState<string[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [dragOver, setDragOver] = React.useState(false);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    async function fetchTrade() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setTrade(data);
        setScreenshots(data.screenshots || []);
      }
      setLoading(false);
    }

    fetchTrade();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this trade?")) return;
    const supabase = createClient();

    // Delete screenshots from storage first
    if (screenshots.length > 0) {
      const filePaths = screenshots
        .map((url) => {
          const match = url.match(/trade-screenshots\/(.+?)(\?|$)/);
          return match ? decodeURIComponent(match[1]) : null;
        })
        .filter(Boolean) as string[];
      if (filePaths.length > 0) {
        await supabase.storage.from("trade-screenshots").remove(filePaths);
      }
    }

    const { error } = await supabase.from("trades").delete().eq("id", id);
    if (!error) {
      router.push("/journal");
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
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

    return publicUrl;
  };

  const handleFiles = async (files: FileList | File[]) => {
    const validTypes = ["image/png", "image/jpeg", "image/gif"];
    const fileArray = Array.from(files).filter((f) => validTypes.includes(f.type));

    if (fileArray.length === 0) return;
    if (screenshots.length + fileArray.length > 5) {
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const total = fileArray.length;
    const newUrls: string[] = [];

    for (let i = 0; i < total; i++) {
      const url = await uploadFile(fileArray[i]);
      if (url) {
        newUrls.push(url);
      }
      setUploadProgress(Math.round(((i + 1) / total) * 100));
    }

    if (newUrls.length > 0) {
      const updated = [...screenshots, ...newUrls].slice(0, 5);
      setScreenshots(updated);

      const supabase = createClient();
      await supabase.from("trades").update({ screenshots: updated }).eq("id", id);
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

  const removeScreenshot = async (index: number) => {
    const updated = screenshots.filter((_, i) => i !== index);
    setScreenshots(updated);
    const supabase = createClient();
    await supabase.from("trades").update({ screenshots: updated }).eq("id", id);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (loading) return <LoadingSkeleton />;

  if (notFound || !trade) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/journal">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">Trade Not Found</h1>
              <p className="text-sm text-zinc-400">
                The trade you&apos;re looking for doesn&apos;t exist.
              </p>
            </div>
          </div>
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-zinc-500">This trade may have been deleted.</p>
              <Link href="/journal">
                <Button className="mt-4">Back to Journal</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const netPnl = trade.profit_loss || 0;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/journal">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-zinc-100">
                  {trade.symbol}
                </h1>
                <Badge
                  variant={
                    trade.direction === "long" ? "default" : "secondary"
                  }
                >
                  {trade.direction === "long" ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {trade.direction.toUpperCase()}
                </Badge>
                <Badge
                  variant={
                    trade.status === "win" ? "default" : "destructive"
                  }
                >
                  {trade.status}
                </Badge>
              </div>
              <p className="text-sm text-zinc-400">
                {new Date(trade.trade_date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => router.push(`/journal/${trade.id}/edit`)}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-red-500 hover:text-red-400"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-lg text-zinc-100">
                Trade Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-sm text-zinc-400">Entry Price</p>
                  <p className="text-lg font-semibold text-zinc-100">
                    {trade.entry_price}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-zinc-400">Exit Price</p>
                  <p className="text-lg font-semibold text-zinc-100">
                    {trade.exit_price ?? "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-zinc-400">Stop Loss</p>
                  <p className="text-lg font-semibold text-red-500">
                    {trade.stop_loss ?? "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-zinc-400">Take Profit</p>
                  <p className="text-lg font-semibold text-emerald-500">
                    {trade.take_profit ?? "—"}
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-sm text-zinc-400">Lot Size</p>
                  <p className="text-lg font-semibold text-zinc-100">
                    {trade.lot_size}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-zinc-400">Risk Amount</p>
                  <p className="text-lg font-semibold text-zinc-100">
                    {trade.risk_amount ? `$${trade.risk_amount.toLocaleString()}` : "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-zinc-400">Profit/Loss</p>
                  <p
                    className={`text-lg font-semibold ${
                      (trade.profit_loss || 0) >= 0 ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    {(trade.profit_loss || 0) >= 0 ? "+" : ""}${(trade.profit_loss || 0).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-zinc-400">Market</p>
                  <p className="text-lg font-semibold text-zinc-100">
                    {trade.market_type ?? "—"}
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-sm text-zinc-400">Commission</p>
                  <p className="text-lg font-semibold text-zinc-100">
                    ${(trade.commission || 0).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-zinc-400">Fees</p>
                  <p className="text-lg font-semibold text-zinc-100">
                    ${(trade.fees || 0).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-zinc-400">Net P&L</p>
                  <p
                    className={`text-lg font-semibold ${
                      netPnl >= 0 ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    {netPnl >= 0 ? "+" : ""}${netPnl.toLocaleString()}
                  </p>
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
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-sm text-zinc-400">Strategy</p>
                  <Badge variant="secondary">{trade.strategy ?? "—"}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-zinc-400">Setup</p>
                  <Badge variant="secondary">{trade.setup ?? "—"}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-zinc-400">Emotion</p>
                  <Badge variant="secondary">{trade.emotion ?? "—"}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-zinc-400">Confidence</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{
                          width: `${((trade.confidence_level || 0) / 10) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-zinc-300">
                      {trade.confidence_level ?? 0}/10
                    </span>
                  </div>
                </div>
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
                Notes & Lessons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-zinc-300">
                {trade.notes || "No notes added."}
              </p>
              {trade.lessons_learned && (
                <>
                  <Separator className="my-4" />
                  <h4 className="mb-2 text-sm font-medium text-zinc-400">Lessons Learned</h4>
                  <p className="whitespace-pre-wrap text-zinc-300">
                    {trade.lessons_learned}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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
                  {screenshots.map((url, index) => (
                    <div
                      key={index}
                      className="group relative cursor-pointer overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800"
                      onClick={() => openLightbox(index)}
                    >
                      <img
                        src={url}
                        alt={`Screenshot ${index + 1}`}
                        className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeScreenshot(index);
                        }}
                        className="absolute right-1 top-1 rounded-full bg-zinc-900/80 p-1 text-zinc-400 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
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

              {screenshots.length === 0 && !uploading && (
                <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/50">
                  <p className="text-sm text-zinc-500">No screenshots uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl border-zinc-700 bg-zinc-900 p-2">
          <div className="relative">
            <img
              src={screenshots[lightboxIndex]}
              alt={`Screenshot ${lightboxIndex + 1}`}
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900/80 px-3 py-1 text-sm text-zinc-400">
              {lightboxIndex + 1} / {screenshots.length}
            </div>
            {screenshots.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setLightboxIndex(
                      (prev) => (prev - 1 + screenshots.length) % screenshots.length
                    )
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-zinc-900/80 p-2 text-zinc-400 hover:text-zinc-100"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() =>
                    setLightboxIndex(
                      (prev) => (prev + 1) % screenshots.length
                    )
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-zinc-900/80 p-2 text-zinc-400 hover:text-zinc-100 rotate-180"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
