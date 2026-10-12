"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Plus,
  Search,
  Shield,
  Trash2,
  KeyRound,
  UserCheck,
  UserX,
} from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { PageTransition } from "@/components/Motion";
import { useAuth } from "@/context/AuthContext";
import {
  createUser,
  deleteUser,
  fetchUsers,
  getErrorMessage,
  resetUserPassword,
  updateUser,
} from "@/lib/api";
import type { User } from "@/lib/types";

export default function UsersPage() {
  return (
    <AuthGuard adminOnly>
      <UsersAdmin />
    </AuthGuard>
  );
}

function UsersAdmin() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    full_name: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUsers({ q: q || undefined });
      setUsers(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(() => load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await createUser({
        username: form.username,
        password: form.password,
        email: form.email || undefined,
        full_name: form.full_name || undefined,
      });
      setShowCreate(false);
      setForm({ username: "", password: "", email: "", full_name: "" });
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const toggleActive = async (u: User) => {
    await updateUser(u.id, { is_active: !u.is_active });
    await load();
  };

  const toggleRole = async (u: User) => {
    await updateUser(u.id, { role: u.role === "admin" ? "user" : "admin" });
    await load();
  };

  const onReset = async (u: User) => {
    const pwd = window.prompt(`Nouveau mot de passe pour ${u.username}`);
    if (!pwd || pwd.length < 6) return;
    await resetUserPassword(u.id, pwd);
    alert("Mot de passe réinitialisé");
  };

  const onDelete = async (u: User) => {
    if (!window.confirm(`Supprimer ${u.username} ?`)) return;
    await deleteUser(u.id);
    await load();
  };

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Utilisateurs
          </h1>
          <p className="mt-1 text-slate-400">
            Gestion des comptes, rôles et accès
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Nouvel utilisateur
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          className="input-field pl-10"
          placeholder="Rechercher par nom, email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-rose-300">{error}</p>}

      <div className="glass overflow-hidden rounded-2xl">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-teal-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-white/5 bg-white/[0.02] text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Utilisateur</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Rôle</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/[0.04]">
                    <td className="px-4 py-3">
                      <p className="font-medium">{u.full_name || u.username}</p>
                      <p className="text-xs text-slate-500">@{u.username}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {u.email || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          u.role === "admin" ? "badge-admin" : "badge-user"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          u.is_active ? "badge-ok" : "badge-bad"
                        }`}
                      >
                        {u.is_active ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          className="btn-ghost"
                          title="Changer rôle"
                          onClick={() => toggleRole(u)}
                          disabled={u.id === me?.id}
                        >
                          <Shield className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="btn-ghost"
                          title={u.is_active ? "Désactiver" : "Activer"}
                          onClick={() => toggleActive(u)}
                          disabled={u.id === me?.id}
                        >
                          {u.is_active ? (
                            <UserX className="h-3.5 w-3.5" />
                          ) : (
                            <UserCheck className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          className="btn-ghost"
                          title="Reset password"
                          onClick={() => onReset(u)}
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="btn-danger"
                          title="Supprimer"
                          onClick={() => onDelete(u)}
                          disabled={u.id === me?.id}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreate(false)}
          >
            <motion.form
              onClick={(e) => e.stopPropagation()}
              onSubmit={onCreate}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
              className="glass w-full max-w-md space-y-3 rounded-2xl p-6"
            >
              <h2 className="font-display text-xl font-semibold">
                Créer un utilisateur
              </h2>
              {(
                [
                  ["username", "Username"],
                  ["full_name", "Nom complet"],
                  ["email", "Email"],
                  ["password", "Mot de passe"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="mb-1 block text-sm text-slate-300">
                    {label}
                  </label>
                  <input
                    type={key === "password" ? "password" : "text"}
                    className="input-field"
                    value={form[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                    required={key === "username" || key === "password"}
                    minLength={key === "password" ? 6 : undefined}
                  />
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowCreate(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Créer
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
