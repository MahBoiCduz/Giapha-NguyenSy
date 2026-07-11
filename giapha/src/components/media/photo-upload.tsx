"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

interface PhotoUploadProps {
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function PhotoUpload({
  currentUrl,
  onUpload,
  onRemove,
  disabled = false,
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");

        const data = await res.json();
        onUpload(data.url);
      } catch (error) {
        console.error("Upload error:", error);
        setPreview(currentUrl || null);
      } finally {
        setUploading(false);
      }
    },
    [currentUrl, onUpload]
  );

  return (
    <div className="flex flex-col items-center gap-3">
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="h-24 w-24 rounded-full object-cover border"
          />
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              onRemove();
            }}
            disabled={disabled}
            className="absolute -top-1 -right-1 rounded-full bg-destructive text-destructive-foreground p-0.5 shadow-sm hover:bg-destructive/90"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="h-24 w-24 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/50">
          <Upload className="h-8 w-8 text-muted-foreground/50" />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
      >
        {uploading ? "Đang tải lên..." : preview ? "Đổi ảnh" : "Tải ảnh lên"}
      </Button>
    </div>
  );
}
