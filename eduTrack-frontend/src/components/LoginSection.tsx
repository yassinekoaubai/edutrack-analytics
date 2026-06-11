/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { login } from '../api/academicApi';
import { setToken } from '../api/client';
import { Lock, Mail, AlertCircle, LogIn, GraduationCap } from 'lucide-react';
import { AuthToken } from '../types';

interface LoginSectionProps {
  onLoginSuccess: (auth: AuthToken) => void;
}

export const LoginSection: React.FC<LoginSectionProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await login({ email, password });
      setToken(data.access_token);
      // Store user details too
      localStorage.setItem('edutrack_user_v1', JSON.stringify({
        id: data.user_id,
        role: data.role,
        nom: data.nom,
        prenom: data.prenom
      }));
      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.message || "Erreur d'authentification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 text-[#5EA8DA] mb-4 shadow-lg">
            <GraduationCap className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 font-sans tracking-tight">
            EduTrack Analytics
          </h1>
          <p className="text-slate-500 font-sans text-sm">
            Plateforme d&apos;Analyse de Performance (staff uniquement)
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block font-sans ml-1">
                Adresse Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom.prenom@ynov.com"
                  className="w-full bg-slate-50 border border-slate-200 py-3.5 pl-11 pr-4 text-sm text-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#5EA8DA]/20 focus:border-[#5EA8DA] transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block font-sans ml-1">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 py-3.5 pl-11 pr-4 text-sm text-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#5EA8DA]/20 focus:border-[#5EA8DA] transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3 text-sm text-rose-800 animate-shake">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <p className="font-sans font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white font-sans text-sm font-bold py-4 rounded-2xl cursor-pointer flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-[#AFE3F4]" />
                  <span>Se connecter</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-4 text-center">
            <p className="text-[11px] text-slate-400 font-sans">
              Problème de connexion ? Contactez le service informatique.
            </p>
          </div>
        </div>

        <div className="text-center">
          <span className="text-[10px] font-mono text-slate-300 uppercase tracking-widest">
            v1.0.0-PROD
          </span>
        </div>
      </div>
    </div>
  );
};
