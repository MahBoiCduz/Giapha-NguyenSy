import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MemberAvatar } from "@/components/media/avatar";
import type { Member } from "@/types/member";

interface MemberCardProps {
  member: Member;
  clanId: string;
}

export function MemberCard({ member, clanId }: MemberCardProps) {
  const formatYear = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).getFullYear();
  };

  const birthYear = formatYear(member.birthDate);
  const deathYear = formatYear(member.deathDate);

  return (
    <Link href={`/dashboard/clans/${clanId}/members/${member.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="flex items-center gap-4 p-4">
          <MemberAvatar
            photoUrl={member.photoUrl}
            fullName={member.fullName}
            gender={member.gender}
            size="lg"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{member.fullName}</h3>
              <Badge variant={member.gender === "male" ? "male" : "female"}>
                {member.gender === "male" ? "Nam" : "Nữ"}
              </Badge>
            </div>

            {member.alias && (
              <p className="text-sm text-muted-foreground truncate">
                ({member.alias})
              </p>
            )}

            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              {birthYear && <span>{birthYear}</span>}
              {birthYear && deathYear && <span>-</span>}
              {deathYear && <span>{deathYear}</span>}
              {member.isLiving === 1 && !deathYear && birthYear && (
                <span className="text-green-600 dark:text-green-400">
                  ({new Date().getFullYear() - birthYear} tuổi)
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-1">
              Đời thứ {member.generation}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
