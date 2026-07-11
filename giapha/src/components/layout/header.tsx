"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, User as UserIcon } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  onMenuClick?: () => void;
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6">
        {isDashboard && (
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <span className="text-primary">🌳</span>
          <span className="hidden sm:inline">Gia Phả</span>
        </Link>

        <div className="flex-1" />

        {user ? (
          <div className="relative">
            <Button
              variant="ghost"
              className="flex items-center gap-2"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                {user.image ? (
                  <img src={user.image} alt="" className="h-8 w-8 rounded-full" />
                ) : (
                  <UserIcon className="h-4 w-4" />
                )}
              </div>
              <span className="hidden md:inline text-sm">{user.name || user.email}</span>
            </Button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-50"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 rounded-md border bg-popover shadow-md z-50">
                  <div className="py-1">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm hover:bg-accent"
                      onClick={() => setMenuOpen(false)}
                    >
                      Bảng điều khiển
                    </Link>
                    <Link
                      href="/api/auth/signout"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-accent"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/signin">
              <Button variant="ghost" size="sm">
                Đăng nhập
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Đăng ký</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
