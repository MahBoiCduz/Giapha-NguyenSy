"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { ScrollText, PlusCircle, Users } from "lucide-react";
import { ClanCreateDialog } from "@/components/clans/clan-create-dialog";
import type { Clan } from "@/types/clan";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [clans, setClans] = useState<Clan[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchClans = useCallback(async () => {
    try {
      const res = await fetch("/api/clans");
      if (res.ok) {
        const data = await res.json();
        setClans(data);
      }
    } catch (err) {
      console.error("Failed to fetch clans:", err);
    }
  }, []);

  useEffect(() => {
    fetchClans();
  }, [fetchClans]);

  const handleCreateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      fetchClans(); // refresh list
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-14 bottom-0 left-0 z-40 w-64 border-r bg-background transition-transform duration-200 md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Dòng họ của tôi
            </h2>
          </div>

          <div className="flex-1 overflow-auto py-2">
            {clans.length === 0 ? (
              <p className="px-4 py-8 text-sm text-muted-foreground text-center">
                Chưa có dòng họ nào
              </p>
            ) : (
              <nav className="space-y-0.5 px-2">
                {clans.map((clan) => {
                  const isActive = pathname.includes(`/clans/${clan.id}`);
                  return (
                    <Link
                      key={clan.id}
                      href={`/dashboard/clans/${clan.id}`}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )}
                    >
                      <Users className="h-4 w-4 shrink-0" />
                      <span className="truncate">{clan.name}</span>
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          <div className="border-t p-4 space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              <ScrollText className="h-4 w-4" />
              Tất cả dòng họ
            </Link>
            <button
              onClick={handleCreateClick}
              className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors text-left"
            >
              <PlusCircle className="h-4 w-4" />
              Tạo dòng họ mới
            </button>
          </div>
        </div>
      </aside>

      <ClanCreateDialog open={dialogOpen} onOpenChange={handleDialogClose} />
    </>
  );
}
