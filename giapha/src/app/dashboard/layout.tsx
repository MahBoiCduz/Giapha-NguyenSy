"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import type { Clan } from "@/types/clan";

const MOCK_CLANS: Clan[] = [];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex-1 flex">
        <Sidebar
          clans={MOCK_CLANS}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 md:pl-64">{children}</main>
      </div>
    </div>
  );
}
