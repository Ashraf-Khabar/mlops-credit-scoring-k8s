"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, History, Settings, Sparkles, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const links = [
    { href: "/dashboard", label: "Home", icon: Activity },
    { href: "/dashboard/predict", label: "Score", icon: Sparkles },
    { href: "/dashboard/history", label: "Histo", icon: History },
    ...(user?.role === "admin"
      ? [{ href: "/dashboard/users", label: "Users", icon: Users }]
      : []),
    { href: "/dashboard/settings", label: "Compte", icon: Settings },
  ];

  return (
    <nav className="glass fixed bottom-3 left-3 right-3 z-40 flex justify-around rounded-2xl px-2 py-2 md:hidden">
      {links.map((link) => {
        const active =
          pathname === link.href ||
          (link.href !== "/dashboard" && pathname.startsWith(link.href));
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-medium ${
              active ? "text-teal-300" : "text-slate-500"
            }`}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
