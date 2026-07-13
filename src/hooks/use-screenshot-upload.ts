"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const VALID_TYPES = ["image/png", "image/jpeg", "image/gif"];
const MAX_SCREENSHOTS = 5;

export interface UploadedScreenshot {
  url: string;
  name: string;
  path: string;
}

export function useScreenshotUpload() {
  const [screenshots, setScreenshots] = React.useState<UploadedScreenshot[]>([]);
  const [uploading, setUploading] = React.useState(false);

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => {
      if (!VALID_TYPES.includes(f.type)) return false;
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name} exceeds 10MB limit`);
        return false;
      }
      return true;
    });

    if (fileArray.length === 0) return;
    if (screenshots.length + fileArray.length > MAX_SCREENSHOTS) {
      toast.error(`Maximum ${MAX_SCREENSHOTS} screenshots allowed`);
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      return;
    }

    const newScreenshots: UploadedScreenshot[] = [];
    for (const file of fileArray) {
      const timestamp = Date.now();
      const fileName = `${user.id}/${timestamp}_${file.name}`;
      const { error } = await supabase.storage
        .from("trade-screenshots")
        .upload(fileName, file, { contentType: file.type });
      if (error) continue;
      const { data: { publicUrl } } = supabase.storage.from("trade-screenshots").getPublicUrl(fileName);
      newScreenshots.push({ url: publicUrl, name: file.name, path: fileName });
    }

    setScreenshots((prev) => [...prev, ...newScreenshots].slice(0, MAX_SCREENSHOTS));
    setUploading(false);
  };

  const removeScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return {
    screenshots,
    setScreenshots,
    uploading,
    handleFiles,
    removeScreenshot,
    handleDrop,
    handleDragOver,
    handleDragLeave,
  };
}
