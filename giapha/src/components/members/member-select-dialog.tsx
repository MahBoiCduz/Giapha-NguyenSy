"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MemberAvatar } from "@/components/media/avatar";
import type { Member } from "@/types/member";

interface MemberSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clanId: string;
  onSelect: (memberId: string) => void;
  excludeIds?: string[]; // members to hide from list (e.g., already linked)
  title: string;
  description?: string;
}

export function MemberSelectDialog({
  open,
  onOpenChange,
  clanId,
  onSelect,
  excludeIds = [],
  title,
  description,
}: MemberSelectDialogProps) {
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchMembers = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      const res = await fetch(`/api/clans/${clanId}/members?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [clanId]);

  useEffect(() => {
    if (open) {
      setSearch("");
      fetchMembers();
    }
  }, [open, fetchMembers]);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchMembers(search || undefined);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, open, fetchMembers]);

  const filtered = members.filter((m) => !excludeIds.includes(m.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      <div className="mt-4 space-y-3">
        <Input
          placeholder="Tìm kiếm thành viên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        <div className="max-h-64 overflow-y-auto space-y-1">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Đang tìm...
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {search ? "Không tìm thấy thành viên" : "Chưa có thành viên nào"}
            </p>
          ) : (
            filtered.map((m) => (
              <button
                key={m.id}
                type="button"
                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left transition-colors"
                onClick={() => {
                  onSelect(m.id);
                  onOpenChange(false);
                }}
              >
                <MemberAvatar
                  photoUrl={m.photoUrl}
                  fullName={m.fullName}
                  gender={m.gender}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.gender === "male" ? "Nam" : "Nữ"} • Đời thứ {m.generation}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </Dialog>
  );
}
