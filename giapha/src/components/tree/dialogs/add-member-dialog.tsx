"use client";

import { useState } from "react";
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
import { Select } from "@/components/ui/select";
import { useRouter } from "next/navigation";

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clanId: string;
  parentId?: string;
  spouseId?: string;
  suggestedGeneration?: number;
}

export function AddMemberDialog({
  open,
  onOpenChange,
  clanId,
  parentId,
  spouseId,
  suggestedGeneration = 1,
}: AddMemberDialogProps) {
  const router = useRouter();
  const [familyName, setFamilyName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [givenName, setGivenName] = useState("");
  const [gender, setGender] = useState("male");
  const [birthDate, setBirthDate] = useState("");
  const [generation, setGeneration] = useState(suggestedGeneration);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fullName = [familyName, middleName, givenName]
      .filter(Boolean)
      .join(" ")
      .trim();

    try {
      const body: Record<string, unknown> = {
        clanId,
        familyName,
        middleName: middleName || undefined,
        givenName,
        fullName,
        gender,
        birthDate: birthDate || undefined,
        generation,
        isLiving: true,
        parentId: parentId || undefined,
        spouseId: spouseId || undefined,
      };

      const res = await fetch(`/api/clans/${clanId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Thêm thất bại");

      onOpenChange(false);
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
        <DialogTitle>
          {parentId ? "Thêm con" : spouseId ? "Thêm vợ/chồng" : "Thêm thành viên"}
        </DialogTitle>
        <DialogDescription>
          {parentId
            ? "Thêm con cho thành viên này"
            : spouseId
            ? "Thêm vợ/chồng cho thành viên này"
            : "Thêm thành viên mới vào dòng họ"}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 mt-4">
          {error && (
            <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Họ *</Label>
              <Input
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                required
                placeholder="Nguyễn"
              />
            </div>
            <div className="space-y-2">
              <Label>Tên đệm</Label>
              <Input
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                placeholder="Văn"
              />
            </div>
            <div className="space-y-2">
              <Label>Tên *</Label>
              <Input
                value={givenName}
                onChange={(e) => setGivenName(e.target.value)}
                required
                placeholder="Nam"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Giới tính</Label>
              <Select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                options={[
                  { value: "male", label: "Nam" },
                  { value: "female", label: "Nữ" },
                ]}
              />
            </div>
            <div className="space-y-2">
              <Label>Ngày sinh</Label>
              <Input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Đời thứ</Label>
              <Input
                type="number"
                min={1}
                value={generation}
                onChange={(e) => setGeneration(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Đang thêm..." : "Thêm"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
