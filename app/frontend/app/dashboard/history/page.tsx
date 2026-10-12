"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { PageTransition } from "@/components/Motion";
import { fetchHistory } from "@/lib/api";
import type { HistoryItem } from "@/lib/types";

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const pageSize = 10;

  const load = useCallback(async () => {
    const data = await fetchHistory(page, pageSize, status || undefined);
    setItems(data.items);
    setTotal(data.total);
  }, [page, status]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Historique
          </h1>
          <p className="mt-1 text-slate-400">
            {total} décision{total > 1 ? "s" : ""} enregistrée
            {total > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            className="input-field w-auto"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">Tous les statuts</option>
            <option value="Approuvé">Approuvé</option>
            <option value="Refusé">Refusé</option>
          </select>
        </div>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-white/5 bg-white/[0.02] text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Âge</th>
                <th className="px-4 py-3 font-medium">Revenu</th>
                <th className="px-4 py-3 font-medium">Prêt</th>
                <th className="px-4 py-3 font-medium">Historique</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Décision</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3 text-slate-400">
                    {row.created_at
                      ? new Date(row.created_at).toLocaleString("fr-FR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">{row.age}</td>
                  <td className="px-4 py-3">
                    {row.income.toLocaleString("fr-FR")} €
                  </td>
                  <td className="px-4 py-3">
                    {row.loan_amount.toLocaleString("fr-FR")} €
                  </td>
                  <td className="px-4 py-3">
                    {row.credit_history_length ?? 0} ans
                  </td>
                  <td className="px-4 py-3 text-teal-300">
                    {row.probability != null
                      ? `${Math.round(row.probability * 100)}%`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${
                        row.status === "Approuvé" || row.status === "Approved"
                          ? "badge-ok"
                          : "badge-bad"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    Aucun historique pour le moment
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 px-4 py-3">
          <p className="text-xs text-slate-500">
            Page {page} / {pages}
          </p>
          <div className="flex gap-2">
            <button
              className="btn-ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              className="btn-ghost"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
