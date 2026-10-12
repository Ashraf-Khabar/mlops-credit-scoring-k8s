"use client";

import { FormEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { PageTransition } from "@/components/Motion";
import { getErrorMessage, predict } from "@/lib/api";
import type { PredictResult } from "@/lib/types";

export default function PredictPage() {
  const [form, setForm] = useState({
    age: 35,
    income: 45000,
    loan_amount: 12000,
    credit_history_length: 5,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PredictResult | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await predict(form);
      setResult(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const approved = result?.status === "Approuvé" || result?.status === "Approved";

  return (
    <PageTransition className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Scoring crédit
        </h1>
        <p className="mt-1 text-slate-400">
          Analysez un dossier et obtenez une décision assistée par IA
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={onSubmit} className="glass space-y-4 rounded-2xl p-6">
          {(
            [
              ["age", "Âge", 18, 100],
              ["income", "Revenu annuel (€)", 1, 1_000_000],
              ["loan_amount", "Montant du prêt (€)", 1, 2_000_000],
              ["credit_history_length", "Historique crédit (années)", 0, 60],
            ] as const
          ).map(([key, label, min, max]) => (
            <div key={key}>
              <div className="mb-1.5 flex justify-between text-sm">
                <label className="text-slate-300">{label}</label>
                <span className="font-medium text-teal-300">{form[key]}</span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={key === "age" || key === "credit_history_length" ? 1 : 500}
                value={form[key]}
                onChange={(e) =>
                  setForm({ ...form, [key]: Number(e.target.value) })
                }
                className="w-full accent-teal-400"
              />
              <input
                type="number"
                className="input-field mt-2"
                min={min}
                max={max}
                value={form[key]}
                onChange={(e) =>
                  setForm({ ...form, [key]: Number(e.target.value) })
                }
              />
            </div>
          ))}

          {error && <p className="text-sm text-rose-300">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Lancer l&apos;analyse
              </>
            )}
          </button>
        </form>

        <div className="glass relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-2xl p-6">
          <AnimatePresence mode="wait">
            {!result && !loading && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-slate-500"
              >
                <Sparkles className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p>Le résultat du scoring apparaîtra ici</p>
              </motion.div>
            )}
            {loading && (
              <motion.div
                key="load"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-teal-400" />
                <p className="mt-3 text-sm text-slate-400">Inférence en cours…</p>
              </motion.div>
            )}
            {result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                className="w-full text-center"
              >
                <div
                  className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${
                    approved
                      ? "bg-emerald-400/15 text-emerald-300"
                      : "bg-rose-400/15 text-rose-300"
                  }`}
                >
                  {approved ? (
                    <CheckCircle2 className="h-8 w-8" />
                  ) : (
                    <XCircle className="h-8 w-8" />
                  )}
                </div>
                <p
                  className={`font-display text-3xl font-semibold ${
                    approved ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  {result.status}
                </p>
                <p className="mt-2 text-slate-400">{result.message}</p>
                <div className="mt-6">
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Probabilité
                  </p>
                  <p className="mt-1 font-display text-4xl font-semibold text-teal-300">
                    {Math.round(result.probability * 100)}%
                  </p>
                  <div className="mx-auto mt-4 h-2 max-w-xs overflow-hidden rounded-full bg-slate-800">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${result.probability * 100}%` }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
