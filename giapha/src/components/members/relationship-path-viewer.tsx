"use client";

import { useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/media/avatar";
import { ArrowRight } from "lucide-react";
import type { Member } from "@/types/member";

interface RelationshipPathViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceMember: Member;
  clanId: string;
  members: Member[];
}

export function RelationshipPathViewer({
  open,
  onOpenChange,
  sourceMember,
  clanId,
  members,
}: RelationshipPathViewerProps) {
  const [targetId, setTargetId] = useState("");
  const [path, setPath] = useState<string[] | null>(null);
  const [pathMembers, setPathMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFindPath = async () => {
    if (!targetId) return;
    setLoading(true);

    try {
      const res = await fetch(
        `/api/clans/${clanId}/members/${sourceMember.id}/relationship-path?targetId=${targetId}`
      );
      if (!res.ok) throw new Error("Không tìm thấy quan hệ");

      const data = await res.json();
      setPath(data.path);

      // Map path IDs to member objects
      const memberMap = new Map(members.map((m) => [m.id, m]));
      setPathMembers(data.path.map((id: string) => memberMap.get(id)).filter(Boolean));
    } catch {
      setPath(null);
      setPathMembers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Xem quan hệ</DialogTitle>
        <DialogDescription>
          Chọn một thành viên để xem đường dẫn quan hệ với{" "}
          <strong>{sourceMember.fullName}</strong>
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 mt-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Thành viên</label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
            >
              <option value="">Chọn thành viên...</option>
              {members
                .filter((m) => m.id !== sourceMember.id)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} (Đời {m.generation})
                  </option>
                ))}
            </select>
          </div>
          <Button onClick={handleFindPath} disabled={!targetId || loading}>
            {loading ? "Đang tìm..." : "Xem"}
          </Button>
        </div>

        {path && pathMembers.length > 0 && (
          <div className="rounded-md border p-4">
            <div className="flex items-center gap-2 flex-wrap">
              {pathMembers.map((member, index) => (
                <div key={member.id} className="flex items-center gap-2">
                  {index > 0 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
                    <MemberAvatar
                      photoUrl={member.photoUrl}
                      fullName={member.fullName}
                      gender={member.gender}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium">{member.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        Đời {member.generation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {path === null && !loading && targetId && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Không tìm thấy đường dẫn quan hệ giữa hai người này
          </p>
        )}
      </div>
    </Dialog>
  );
}
