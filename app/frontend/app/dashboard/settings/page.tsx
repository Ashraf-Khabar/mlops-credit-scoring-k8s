"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, Save, Lock } from "lucide-react";
import { PageTransition } from "@/components/Motion";
import { useAuth } from "@/context/AuthContext";
import {
  changePassword,
  getErrorMessage,
  updateProfile,
} from "@/lib/api";

export default function SettingsPage() {
  const { user, setUser, refreshUser } = useAuth();
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
  });

  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.full_name || "",
        email: user.email || "",
      });
    }
  }, [user]);
  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
  });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    setMsg("");
    try {
      const updated = await updateProfile({
        full_name: profile.full_name,
        email: profile.email,
      });
      setUser(updated);
      setMsg("Profil mis à jour");
    } catch (error) {
      setErr(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    setMsg("");
    try {
      await changePassword(
        passwords.current_password,
        passwords.new_password
      );
      setPasswords({ current_password: "", new_password: "" });
      setMsg("Mot de passe modifié");
      await refreshUser();
    } catch (error) {
      setErr(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Paramètres
        </h1>
        <p className="mt-1 text-slate-400">
          Gérez votre profil et la sécurité du compte
        </p>
      </div>

      {msg && <p className="text-sm text-emerald-300">{msg}</p>}
      {err && <p className="text-sm text-rose-300">{err}</p>}

      <form onSubmit={saveProfile} className="glass space-y-4 rounded-2xl p-6">
        <h2 className="font-display text-lg font-semibold">Profil</h2>
        <div>
          <label className="mb-1.5 block text-sm text-slate-300">
            Nom d&apos;utilisateur
          </label>
          <input
            className="input-field opacity-60"
            value={user?.username || ""}
            disabled
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-slate-300">
            Nom complet
          </label>
          <input
            className="input-field"
            value={profile.full_name}
            onChange={(e) =>
              setProfile({ ...profile, full_name: e.target.value })
            }
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-slate-300">Email</label>
          <input
            type="email"
            className="input-field"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Enregistrer
        </button>
      </form>

      <form onSubmit={savePassword} className="glass space-y-4 rounded-2xl p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Lock className="h-4 w-4 text-teal-300" /> Sécurité
        </h2>
        <div>
          <label className="mb-1.5 block text-sm text-slate-300">
            Mot de passe actuel
          </label>
          <input
            type="password"
            className="input-field"
            value={passwords.current_password}
            onChange={(e) =>
              setPasswords({ ...passwords, current_password: e.target.value })
            }
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-slate-300">
            Nouveau mot de passe
          </label>
          <input
            type="password"
            className="input-field"
            minLength={6}
            value={passwords.new_password}
            onChange={(e) =>
              setPasswords({ ...passwords, new_password: e.target.value })
            }
            required
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          Changer le mot de passe
        </button>
      </form>
    </PageTransition>
  );
}
