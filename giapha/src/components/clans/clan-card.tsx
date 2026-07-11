import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, GitBranch, Globe } from "lucide-react";
import type { ClanWithStats } from "@/types/clan";

interface ClanCardProps {
  clan: ClanWithStats;
}

export function ClanCard({ clan }: ClanCardProps) {
  return (
    <Link href={`/dashboard/clans/${clan.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{clan.name}</CardTitle>
              {clan.origin && (
                <CardDescription className="mt-1">Quê quán: {clan.origin}</CardDescription>
              )}
            </div>
            {clan.isPublic === 0 && (
              <Badge variant="secondary">Riêng tư</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {clan.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {clan.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {clan.memberCount} thành viên
            </span>
            <span className="flex items-center gap-1">
              <GitBranch className="h-4 w-4" />
              {clan.generationCount} đời
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
