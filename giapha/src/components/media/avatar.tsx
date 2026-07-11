import { Avatar as UIAvatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface MemberAvatarProps {
  photoUrl?: string | null;
  fullName: string;
  gender?: "male" | "female";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
};

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

export function MemberAvatar({
  photoUrl,
  fullName,
  gender,
  size = "md",
  className,
}: MemberAvatarProps) {
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <UIAvatar className={cn(sizeClasses[size], className)}>
      {photoUrl && <AvatarImage src={photoUrl} alt={fullName} />}
      <AvatarFallback
        className={cn(
          "font-medium",
          gender === "male"
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
            : gender === "female"
            ? "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200"
            : "bg-muted text-muted-foreground"
        )}
      >
        {initials || <User className={iconSizes[size]} />}
      </AvatarFallback>
    </UIAvatar>
  );
}
