"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Lock } from "lucide-react";

interface AccessCodeFormProps {
  clanName: string;
  onSubmit: (code: string) => Promise<void>;
}

export function AccessCodeForm({ clanName, onSubmit }: AccessCodeFormProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onSubmit(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mã bảo mật không đúng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Phả đồ được bảo vệ</CardTitle>
        <CardDescription>
          Dòng họ &quot;{clanName}&quot; yêu cầu mã bảo mật để xem phả đồ.
          Vui lòng nhập mã được cung cấp bởi quản trị viên.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="accessCode">Mã bảo mật</Label>
            <Input
              id="accessCode"
              placeholder="Nhập mã bảo mật..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoFocus
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Đang kiểm tra..." : "Xem phả đồ"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
