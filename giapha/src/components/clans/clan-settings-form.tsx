"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { Clan } from "@/types/clan";

interface ClanSettingsFormProps {
  clan: Clan;
}

export function ClanSettingsForm({ clan }: ClanSettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(clan.name);
  const [description, setDescription] = useState(clan.description || "");
  const [origin, setOrigin] = useState(clan.origin || "");
  const [isPublic, setIsPublic] = useState(clan.isPublic === 1);
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async () => {
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/clans/${clan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          origin: origin || undefined,
          isPublic,
          ...(accessCode ? { accessCode } : {}),
        }),
      });

      if (!res.ok) throw new Error("Cập nhật thất bại");

      setMessage({ type: "success", text: "Đã cập nhật thông tin dòng họ" });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Đã xảy ra lỗi. Vui lòng thử lại." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {message && (
        <div
          className={`rounded-md p-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
          <CardDescription>Cập nhật thông tin dòng họ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên dòng họ</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="origin">Quê quán gốc</Label>
            <Input id="origin" value={origin} onChange={(e) => setOrigin(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Mô tả</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quyền riêng tư</CardTitle>
          <CardDescription>Quản lý ai có thể xem phả đồ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Phả đồ công khai</Label>
              <p className="text-sm text-muted-foreground">
                Cho phép mọi người xem phả đồ mà không cần mã bảo mật
              </p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          {!isPublic && (
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="accessCode">Đặt mã bảo mật mới</Label>
              <Input
                id="accessCode"
                type="password"
                placeholder="Để trống nếu không đổi"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Mã này sẽ được yêu cầu khi người ngoài muốn xem phả đồ
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </div>
  );
}
