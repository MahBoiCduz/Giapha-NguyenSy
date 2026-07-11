"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { GitBranch, Users, Settings } from "lucide-react";

interface ClanNavProps {
  clanId: string;
}

export function ClanNav({ clanId }: ClanNavProps) {
  const pathname = usePathname();

  const tabs = [
    {
      label: "Phả đồ",
      href: `/dashboard/clans/${clanId}/tree`,
      icon: GitBranch,
    },
    {
      label: "Thành viên",
      href: `/dashboard/clans/${clanId}/members`,
      icon: Users,
    },
    {
      label: "Cài đặt",
      href: `/dashboard/clans/${clanId}/settings`,
      icon: Settings,
    },
  ];

  return (
    <nav className="flex border-b bg-background">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
