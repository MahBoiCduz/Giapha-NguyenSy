"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ClanCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClanCreateDialog({ open, onOpenChange }: ClanCreateDialogProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [origin, setOrigin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/clans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || undefined, origin: origin || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Tạo dòng họ thất bại");
      }

      const clan = await res.json();
      onOpenChange(false);
      router.push(`/dashboard/clans/${clan.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Tạo dòng họ mới</DialogTitle>
        <DialogDescription>
          Nhập thông tin cơ bản về dòng họ của bạn
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 mt-4">
          {error && (
            <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Tên dòng họ *</Label>
            <Input
              id="name"
              placeholder="Ví dụ: Họ Nguyễn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="origin">Quê quán gốc</Label>
            <Input
              id="origin"
              placeholder="Ví dụ: Nam Định, Việt Nam"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              placeholder="Mô tả ngắn về dòng họ của bạn..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Đang tạo..." : "Tạo dòng họ"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
