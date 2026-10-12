"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, UserPlus, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/api";

export default function RegisterPage() {
  const { register, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    full_name: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && token) router.replace("/dashboard");
  }, [authLoading, token, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await register({
        username: form.username,
        password: form.password,
        email: form.email || undefined,
        full_name: form.full_name || undefined,
      });
      setSuccess("Compte créé. Redirection vers la connexion…");
      setTimeout(() => router.push("/login"), 900);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 mesh-grid opacity-60" />
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="glass relative z-10 w-full max-w-md rounded-3xl p-8"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-300">
            <UserPlus className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Rejoindre CreditPro
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Créez votre espace d&apos;analyse crédit
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5">
          {(
            [
              ["username", "Nom d'utilisateur", "text"],
              ["full_name", "Nom complet", "text"],
              ["email", "Email", "email"],
              ["password", "Mot de passe", "password"],
            ] as const
          ).map(([key, label, type]) => (
            <div key={key}>
              <label className="mb-1.5 block text-sm text-slate-300">{label}</label>
              <input
                type={type}
                className="input-field"
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required={key === "username" || key === "password"}
                minLength={key === "password" ? 6 : undefined}
              />
            </div>
          ))}

          {error && <p className="text-center text-sm text-rose-300">{error}</p>}
          {success && (
            <p className="text-center text-sm text-emerald-300">{success}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Créer mon compte <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Déjà inscrit ?{" "}
          <Link href="/login" className="font-semibold text-teal-300 hover:text-teal-200">
            Se connecter
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
