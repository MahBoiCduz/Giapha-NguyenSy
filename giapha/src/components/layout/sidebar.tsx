"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { ScrollText, PlusCircle, Settings, Users } from "lucide-react";
import type { Clan } from "@/types/clan";

interface SidebarProps {
  clans: Clan[];
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ clans, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

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
            <Link
              href="/dashboard?create=true"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              Tạo dòng họ mới
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
