"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { PhotoUpload } from "@/components/media/photo-upload";
import type { Member } from "@/types/member";

interface MemberFormProps {
  clanId: string;
  member?: Member; // undefined = create mode
  onSuccess?: () => void;
  spouseId?: string; // pre-fill spouse relationship (create mode only)
  parentId?: string; // pre-fill parent relationship (create mode only)
}

export function MemberForm({ clanId, member, onSuccess, spouseId, parentId }: MemberFormProps) {
  const router = useRouter();
  const isEditing = !!member;

  const [familyName, setFamilyName] = useState(member?.familyName || "");
  const [middleName, setMiddleName] = useState(member?.middleName || "");
  const [givenName, setGivenName] = useState(member?.givenName || "");
  const [alias, setAlias] = useState(member?.alias || "");
  const [gender, setGender] = useState<string>(member?.gender || "male");
  const [birthDate, setBirthDate] = useState(member?.birthDate?.split("T")[0] || "");
  const [deathDate, setDeathDate] = useState(member?.deathDate?.split("T")[0] || "");
  const [isLiving, setIsLiving] = useState(member ? member.isLiving === 1 : true);
  const [photoUrl, setPhotoUrl] = useState(member?.photoUrl || null);
  const [generation, setGeneration] = useState(member?.generation || 1);
  const [birthOrder, setBirthOrder] = useState(member?.birthOrder?.toString() || "");
  const [biography, setBiography] = useState(member?.biography || "");
  const [address, setAddress] = useState(member?.address || "");
  const [education, setEducation] = useState(member?.education || "");
  const [occupation, setOccupation] = useState(member?.occupation || "");
  const [phone, setPhone] = useState(member?.phone || "");
  const [email, setEmail] = useState(member?.email || "");
  const [notes, setNotes] = useState(member?.notes || "");

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

    const body = {
      clanId,
      familyName,
      middleName: middleName || undefined,
      givenName,
      fullName,
      alias: alias || undefined,
      gender,
      birthDate: birthDate || undefined,
      deathDate: deathDate || undefined,
      isLiving,
      photoUrl: photoUrl || undefined,
      generation,
      birthOrder: birthOrder ? parseInt(birthOrder) : undefined,
      biography: biography || undefined,
      address: address || undefined,
      education: education || undefined,
      occupation: occupation || undefined,
      phone: phone || undefined,
      email: email || undefined,
      notes: notes || undefined,
      ...(isEditing ? {} : { spouseId: spouseId || undefined, parentId: parentId || undefined }),
    };

    try {
      const url = isEditing
        ? `/api/clans/${clanId}/members/${member!.id}`
        : `/api/clans/${clanId}/members`;
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Lưu thất bại");
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.back();
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
          {error}
        </div>
      )}

      {/* Avatar */}
      <div className="flex justify-center">
        <PhotoUpload
          currentUrl={photoUrl}
          onUpload={(url) => setPhotoUrl(url)}
          onRemove={() => setPhotoUrl(null)}
          disabled={loading}
        />
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="familyName">Họ *</Label>
          <Input
            id="familyName"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            required
            placeholder="Nguyễn"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="middleName">Tên đệm</Label>
          <Input
            id="middleName"
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
            placeholder="Văn"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="givenName">Tên *</Label>
          <Input
            id="givenName"
            value={givenName}
            onChange={(e) => setGivenName(e.target.value)}
            required
            placeholder="Nam"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="alias">Tên thường gọi</Label>
          <Input
            id="alias"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="Bé Ba"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Giới tính *</Label>
          <Select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            options={[
              { value: "male", label: "Nam" },
              { value: "female", label: "Nữ" },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="birthDate">Ngày sinh</Label>
          <Input
            id="birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deathDate">Ngày mất</Label>
          <Input
            id="deathDate"
            type="date"
            value={deathDate}
            onChange={(e) => setDeathDate(e.target.value)}
            disabled={isLiving}
          />
          <div className="flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              id="isLiving"
              checked={isLiving}
              onChange={(e) => {
                setIsLiving(e.target.checked);
                if (e.target.checked) setDeathDate("");
              }}
              className="h-4 w-4"
            />
            <Label htmlFor="isLiving" className="text-sm font-normal">
              Còn sống
            </Label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="generation">Đời thứ</Label>
          <Input
            id="generation"
            type="number"
            min={1}
            value={generation}
            onChange={(e) => setGeneration(parseInt(e.target.value) || 1)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="birthOrder">Thứ tự sinh</Label>
          <Input
            id="birthOrder"
            type="number"
            min={1}
            value={birthOrder}
            onChange={(e) => setBirthOrder(e.target.value)}
          />
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-2">
        <Label htmlFor="biography">Tiểu sử</Label>
        <Textarea
          id="biography"
          value={biography}
          onChange={(e) => setBiography(e.target.value)}
          rows={4}
          placeholder="Tiểu sử của thành viên..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="address">Địa chỉ</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="education">Học vấn</Label>
          <Input id="education" value={education} onChange={(e) => setEducation(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="occupation">Nghề nghiệp</Label>
          <Input id="occupation" value={occupation} onChange={(e) => setOccupation(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">SĐT</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Ghi chú</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Ghi chú thêm..."
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Hủy
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Đang lưu..." : isEditing ? "Cập nhật" : "Thêm thành viên"}
        </Button>
      </div>
    </form>
  );
}
