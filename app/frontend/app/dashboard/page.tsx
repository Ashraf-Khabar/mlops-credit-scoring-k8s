"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Percent,
  TrendingUp,
  Wallet,
  CalendarDays,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { PageTransition, Stagger } from "@/components/Motion";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "@/context/AuthContext";
import {
  fetchHistory,
  fetchPlatformStats,
  fetchStatistics,
} from "@/lib/api";
import type { HistoryItem, PlatformStats, Statistics } from "@/lib/types";

const PIE_COLORS = ["#34d399", "#fb7185"];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Statistics | null>(null);
  const [platform, setPlatform] = useState<PlatformStats | null>(null);
  const [recent, setRecent] = useState<HistoryItem[]>([]);

  useEffect(() => {
    fetchStatistics().then(setStats).catch(() => {});
    fetchHistory(1, 8).then((h) => setRecent(h.items)).catch(() => {});
    if (user?.role === "admin") {
      fetchPlatformStats().then(setPlatform).catch(() => {});
    }
  }, [user?.role]);

  const pieData = [
    { name: "Approuvés", value: stats?.approved || 0 },
    { name: "Refusés", value: stats?.rejected || 0 },
  ];

  const trendData = [...recent]
    .reverse()
    .map((item, i) => ({
      name: `#${i + 1}`,
      probability: Math.round((item.probability || 0) * 100),
      loan: item.loan_amount,
    }));

  return (
    <PageTransition className="space-y-6">
      <div>
        <p className="text-sm text-teal-300/80">Bienvenue</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          {user?.full_name || user?.username}
        </h1>
        <p className="mt-1 text-slate-400">
          Pilotage de vos analyses de crédit en temps réel
        </p>
      </div>

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Dossiers analysés"
          value={stats?.total ?? "—"}
          hint={`+${stats?.recent_7d ?? 0} sur 7 jours`}
          icon={Activity}
          accent="teal"
        />
        <StatCard
          label="Taux d'approbation"
          value={`${stats?.approval_rate ?? 0}%`}
          icon={Percent}
          accent="sky"
        />
        <StatCard
          label="Probabilité moyenne"
          value={`${Math.round((stats?.avg_probability || 0) * 100)}%`}
          icon={TrendingUp}
          accent="amber"
        />
        <StatCard
          label="Prêt moyen"
          value={
            stats
              ? `${Math.round(stats.avg_loan_amount).toLocaleString("fr-FR")} €`
              : "—"
          }
          icon={Wallet}
          accent="rose"
        />
      </Stagger>

      {platform && (
        <div className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-sky-300">
            <CalendarDays className="h-4 w-4" /> Vue plateforme (admin)
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-slate-400">Utilisateurs</p>
              <p className="text-2xl font-semibold">{platform.users_total}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Actifs</p>
              <p className="text-2xl font-semibold">{platform.users_active}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Prédictions</p>
              <p className="text-2xl font-semibold">
                {platform.predictions_total}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Approbation globale</p>
              <p className="text-2xl font-semibold text-teal-300">
                {platform.approval_rate}%
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="glass rounded-2xl p-5 lg:col-span-3">
          <h2 className="mb-4 font-display text-lg font-semibold">
            Tendance des scores
          </h2>
          <div className="h-64">
            {trendData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="prob" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "#121a2b",
                      border: "1px solid rgba(148,163,184,0.2)",
                      borderRadius: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="probability"
                    stroke="#2dd4bf"
                    fill="url(#prob)"
                    strokeWidth={2}
                    name="Score %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Lancez une première analyse pour voir le graphique
              </div>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-semibold">
            Répartition
          </h2>
          <div className="h-64">
            {(stats?.total || 0) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#121a2b",
                      border: "1px solid rgba(148,163,184,0.2)",
                      borderRadius: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-500">
                <CheckCircle2 className="h-8 w-8 opacity-40" />
                <p className="text-sm">Aucune décision encore</p>
              </div>
            )}
          </div>
          <div className="mt-2 flex justify-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Approuvés
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-400" /> Refusés
            </span>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
