"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  Users,
  History,
  Sparkles,
  Settings,
  LogOut,
  Shield,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const links = [
  { href: "/dashboard", label: "Vue d'ensemble", icon: Activity },
  { href: "/dashboard/predict", label: "Scoring", icon: Sparkles },
  { href: "/dashboard/history", label: "Historique", icon: History },
  { href: "/dashboard/users", label: "Utilisateurs", icon: Users, admin: true },
  { href: "/dashboard/settings", label: "Paramètres", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="glass flex h-full w-[260px] shrink-0 flex-col rounded-3xl p-4">
      <div className="mb-8 flex items-center gap-3 px-2 pt-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-400/15 text-teal-300">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <p className="font-display text-lg font-semibold tracking-tight">
            CreditPro
          </p>
          <p className="text-xs text-slate-400">AI Credit SaaS</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {links
          .filter((l) => !l.admin || user?.role === "admin")
          .map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/dashboard" && pathname.startsWith(link.href));
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "text-teal-100" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-teal-400/12 border border-teal-400/20"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="relative z-10 h-4 w-4" />
                <span className="relative z-10">{link.label}</span>
              </Link>
            );
          })}
      </nav>

      <div className="mt-4 border-t border-white/5 pt-4">
        <div className="mb-3 px-2">
          <p className="truncate text-sm font-medium">
            {user?.full_name || user?.username}
          </p>
          <p className="truncate text-xs text-slate-400">
            {user?.role === "admin" ? "Administrateur" : "Analyste"}
          </p>
        </div>
        <button onClick={logout} className="btn-ghost w-full justify-start">
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
