"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { MobileNav } from "@/components/MobileNav";
import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen gap-4 p-4 pb-24 md:p-5 md:pb-5">
        <div className="sticky top-5 hidden h-[calc(100vh-2.5rem)] md:block">
          <Sidebar />
        </div>
        <main className="min-w-0 flex-1 overflow-auto">{children}</main>
        <MobileNav />
      </div>
    </AuthGuard>
  );
}
