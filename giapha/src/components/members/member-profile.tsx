"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MemberAvatar } from "@/components/media/avatar";
import { MemberSelectDialog } from "@/components/members/member-select-dialog";
import { Pencil, Users, UserPlus, GitBranch, Link2 } from "lucide-react";
import type { Member, MemberWithRelations } from "@/types/member";

interface MemberProfileProps {
  member: MemberWithRelations;
  clanId: string;
  onRefresh?: () => void;
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 py-1.5">
      <span className="text-sm text-muted-foreground min-w-[120px]">{label}:</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export function MemberProfile({ member, clanId, onRefresh }: MemberProfileProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkType, setLinkType] = useState<"spouse" | "child" | "parent">("spouse");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState("");

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const age = member.birthDate
    ? new Date().getFullYear() - new Date(member.birthDate).getFullYear()
    : null;

  const handleLinkMember = async (targetId: string) => {
    setLinkLoading(true);
    setLinkError("");
    try {
      let url = "";
      const body: Record<string, string> = {};

      if (linkType === "spouse") {
        url = `/api/clans/${clanId}/members/${member.id}/spouses`;
        body.spouseId = targetId;
      } else if (linkType === "child") {
        url = `/api/clans/${clanId}/members/${member.id}/children`;
        body.childId = targetId;
      } else if (linkType === "parent") {
        url = `/api/clans/${clanId}/members/${member.id}/parents`;
        body.parentId = targetId;
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Liên kết thất bại");
      }

      onRefresh?.();
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setLinkLoading(false);
    }
  };

  const openLinkDialog = (type: "spouse" | "child" | "parent") => {
    setLinkType(type);
    setLinkError("");
    setLinkDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <MemberAvatar
          photoUrl={member.photoUrl}
          fullName={member.fullName}
          gender={member.gender}
          size="xl"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{member.fullName}</h1>
            <Badge variant={member.gender === "male" ? "male" : "female"}>
              {member.gender === "male" ? "Nam" : "Nữ"}
            </Badge>
            {member.isLiving === 0 && (
              <Badge variant="secondary">Đã mất</Badge>
            )}
          </div>
          {member.alias && (
            <p className="text-muted-foreground">({member.alias})</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            {member.birthDate && (
              <span>🎂 {formatDate(member.birthDate)}</span>
            )}
            {age && member.isLiving === 1 && (
              <span>({age} tuổi)</span>
            )}
            {member.deathDate && (
              <span>🕊 {formatDate(member.deathDate)}</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Đời thứ {member.generation} • {member.birthOrder ? `Con thứ ${member.birthOrder}` : "Thứ tự sinh chưa rõ"}
          </p>
        </div>
        <Link href={`/dashboard/clans/${clanId}/members/${member.id}/edit`}>
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4 mr-1" /> Sửa
          </Button>
        </Link>
      </div>

      <Separator />

      {/* Family */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Parents */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" /> Cha mẹ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {member.parents.length > 0 ? (
              <div className="space-y-2">
                {member.parents.map((p) => (
                  <Link
                    key={p.id}
                    href={`/dashboard/clans/${clanId}/members/${p.id}`}
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <MemberAvatar
                      photoUrl={p.photoUrl}
                      fullName={p.fullName}
                      gender={p.gender}
                      size="sm"
                    />
                    <span>{p.fullName}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa rõ</p>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={() => openLinkDialog("parent")}
            >
              <Link2 className="h-4 w-4 mr-1" /> Liên kết
            </Button>
          </CardContent>
        </Card>

        {/* Spouses */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" /> Vợ / Chồng
            </CardTitle>
          </CardHeader>
          <CardContent>
            {member.spouses.length > 0 ? (
              <div className="space-y-2">
                {member.spouses.map((s) => (
                  <Link
                    key={s.id}
                    href={`/dashboard/clans/${clanId}/members/${s.id}`}
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <MemberAvatar
                      photoUrl={s.photoUrl}
                      fullName={s.fullName}
                      gender={s.gender}
                      size="sm"
                    />
                    <span>{s.fullName}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có</p>
            )}
            <div className="flex gap-2 mt-2">
              <Link href={`/dashboard/clans/${clanId}/members/new?spouseId=${member.id}`} className="flex-1">
                <Button variant="ghost" size="sm" className="w-full">
                  <UserPlus className="h-4 w-4 mr-1" /> Thêm mới
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => openLinkDialog("spouse")}
              >
                <Link2 className="h-4 w-4 mr-1" /> Liên kết
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Children */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <GitBranch className="h-4 w-4" /> Con
            </CardTitle>
          </CardHeader>
          <CardContent>
            {member.children.length > 0 ? (
              <div className="space-y-2">
                {member.children.map((c) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/clans/${clanId}/members/${c.id}`}
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <MemberAvatar
                      photoUrl={c.photoUrl}
                      fullName={c.fullName}
                      gender={c.gender}
                      size="sm"
                    />
                    <span>{c.fullName}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có</p>
            )}
            <div className="flex gap-2 mt-2">
              <Link href={`/dashboard/clans/${clanId}/members/new?parentId=${member.id}`} className="flex-1">
                <Button variant="ghost" size="sm" className="w-full">
                  <UserPlus className="h-4 w-4 mr-1" /> Thêm mới
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => openLinkDialog("child")}
              >
                <Link2 className="h-4 w-4 mr-1" /> Liên kết
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thông tin chi tiết</CardTitle>
        </CardHeader>
        <CardContent>
          {member.biography && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-1">Tiểu sử</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {member.biography}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2">
            <div>
              <InfoRow label="Ngày sinh" value={formatDate(member.birthDate)} />
              <InfoRow label="Ngày sinh âm lịch" value={member.birthDateLunar} />
              <InfoRow label="Ngày mất" value={formatDate(member.deathDate)} />
              <InfoRow label="Ngày mất âm lịch" value={member.deathDateLunar} />
              <InfoRow label="Địa chỉ" value={member.address} />
              <InfoRow label="Học vấn" value={member.education} />
            </div>
            <div>
              <InfoRow label="Nghề nghiệp" value={member.occupation} />
              <InfoRow label="Nhóm máu" value={member.bloodType} />
              <InfoRow label="SĐT" value={member.phone} />
              <InfoRow label="Email" value={member.email} />
              <InfoRow label="Đời thứ" value={`Thứ ${member.generation}`} />
              <InfoRow label="Thứ tự sinh" value={member.birthOrder ? `Thứ ${member.birthOrder}` : null} />
            </div>
          </div>

          {member.notes && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium mb-1">Ghi chú</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {member.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link existing member dialog */}
      <MemberSelectDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        clanId={clanId}
        onSelect={handleLinkMember}
        excludeIds={[
          member.id,
          ...(linkType === "spouse"
            ? member.spouses.map((s) => s.id)
            : linkType === "child"
            ? member.children.map((c) => c.id)
            : member.parents.map((p) => p.id)),
        ]}
        title={
          linkType === "spouse"
            ? "Liên kết vợ/chồng"
            : linkType === "child"
            ? "Liên kết con"
            : "Liên kết cha/mẹ"
        }
        description="Chọn thành viên có sẵn để liên kết"
      />
    </div>
  );
}
