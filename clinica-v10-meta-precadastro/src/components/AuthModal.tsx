import React, { useState, useEffect } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import {
  ShieldCheck,
  UserCheck,
  LogOut,
  LogIn,
  Stethoscope,
  Building2,
  Lock,
  CheckCircle2,
  Sparkles,
  X,
  Mail,
  KeyRound,
} from "lucide-react";
import { auth, loginWithGoogle, loginWithEmail, logoutUser, fetchStaffProfile, StaffProfile } from "../lib/supabase";
import { soundEffects } from "../utils/audioEffects";

export type UserRole = "admin" | "receptionist" | "doctor";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onAuthResolved?: (profile: StaffProfile | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onRoleChange,
  onAuthResolved,
}) => {
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const resolveProfile = async (user: SupabaseUser | null) => {
      setCurrentUser(user);
      if (!user) {
        setStaffProfile(null);
        onAuthResolved?.(null);
        return;
      }
      const profile = await fetchStaffProfile(user.id);
      setStaffProfile(profile);
      onAuthResolved?.(profile);
    };

    auth.getSession().then(({ data }) => resolveProfile(data.session?.user ?? null));
    const {
      data: { subscription },
    } = auth.onAuthStateChange((_event, session) => {
      resolveProfile(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isOpen) return null;

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    try {
      await loginWithEmail(email.trim(), password);
      soundEffects.playPaymentSuccess();
    } catch (err: any) {
      console.error(err);
      setAuthError(
        err.message?.includes("Invalid login")
          ? "E-mail ou senha incorretos."
          : err.message || "Erro ao entrar"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await loginWithGoogle();
      soundEffects.playPaymentSuccess();
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Erro ao conectar com Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    soundEffects.playSent();
  };

  const roleLabel: Record<UserRole, string> = {
    admin: "Gestor / Admin",
    receptionist: "Recepção",
    doctor: "Médico",
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white">
              Acesso da Equipe & Segurança
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* User Account Status */}
          {currentUser ? (
            <div className="space-y-3">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentUser.user_metadata?.avatar_url ? (
                    <img
                      src={currentUser.user_metadata.avatar_url}
                      alt={staffProfile?.name || "User"}
                      className="w-11 h-11 rounded-full border border-emerald-300"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                      {(staffProfile?.name || currentUser.email || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-emerald-950">
                      {staffProfile?.name || "Usuário Autenticado"}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-mono">
                      {currentUser.email}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-white rounded-xl transition-colors text-xs font-semibold flex items-center gap-1"
                  title="Desconectar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {staffProfile ? (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2 text-xs">
                  {staffProfile.role === "admin" && <Building2 className="w-4 h-4 text-emerald-600" />}
                  {staffProfile.role === "receptionist" && <UserCheck className="w-4 h-4 text-indigo-600" />}
                  {staffProfile.role === "doctor" && <Stethoscope className="w-4 h-4 text-blue-600" />}
                  <span className="font-semibold text-slate-800">
                    Perfil: {roleLabel[staffProfile.role]}
                    {staffProfile.role === "doctor" && staffProfile.doctorName ? ` — ${staffProfile.doctorName}` : ""}
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                  Este login não está vinculado a nenhum perfil de equipe ativo. Peça ao gestor/admin
                  para cadastrar seu acesso em <strong>Equipe & Médicos</strong>.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto border border-slate-200 shadow-sm text-slate-700">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Login da Equipe</h4>
                <p className="text-xs text-slate-500">
                  Cada médico e recepcionista tem seu próprio login — os dados são isolados por perfil.
                </p>
              </div>

              {authError && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200 font-medium">
                  {authError}
                </div>
              )}

              <form onSubmit={handleEmailLogin} className="space-y-2.5">
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isLoading ? "Entrando..." : "Entrar"}</span>
                </button>
              </form>

              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <div className="flex-1 h-px bg-slate-200" />
                <span>ou</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
              >
                <LogIn className="w-4 h-4 text-emerald-400" />
                <span>Entrar com Conta Google</span>
              </button>

              {/* Demo mode: só aparece pra quem NÃO tem login real — não concede acesso real a dados */}
              <details className="text-xs">
                <summary className="cursor-pointer text-slate-400 font-medium select-none">
                  Modo demonstração (sem login real)
                </summary>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {(["admin", "receptionist", "doctor"] as UserRole[]).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        onRoleChange(role);
                        soundEffects.playClick();
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        currentRole === role
                          ? "border-slate-400 bg-slate-100 text-slate-900 font-bold"
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <div className="text-[11px]">{roleLabel[role]}</div>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                  Só troca a aparência da tela para apresentações — não dá acesso real a dados de pacientes,
                  que exigem login de verdade.
                </p>
              </details>
            </div>
          )}

          {/* Cloud Security Indicator */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              O banco de dados <strong>Supabase (Postgres)</strong> isola os dados por perfil: cada médico só
              acessa seus próprios pacientes e prontuários.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
