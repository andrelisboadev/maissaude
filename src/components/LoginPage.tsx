import React, { useState } from "react";
import {
  Building2,
  Stethoscope,
  UserCheck,
  Lock,
  LogIn,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Heart,
  Smartphone,
  Check,
  UserPlus,
  Key,
  Mail,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { loginWithGoogle } from "../lib/supabase";
import { soundEffects } from "../utils/audioEffects";
import { ServiceItem, ClinicConfig, ClinicUser } from "../types";

export type AppUserRole = "admin" | "doctor" | "receptionist";

interface LoginPageProps {
  clinicConfig: ClinicConfig;
  services: ServiceItem[];
  users?: ClinicUser[];
  currentRole: AppUserRole;
  selectedDoctorId?: string;
  onLoginSuccess: (role: AppUserRole, doctorId?: string, user?: ClinicUser) => void;
  onSaveNewUser?: (user: ClinicUser, newService?: ServiceItem) => Promise<void>;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  clinicConfig,
  services,
  users = [],
  currentRole,
  selectedDoctorId,
  onLoginSuccess,
  onSaveNewUser,
}) => {
  const [loginMode, setLoginMode] = useState<"quick" | "credentials" | "register">("quick");
  const [selectedRole, setSelectedRole] = useState<AppUserRole>(currentRole || "admin");
  const [chosenDoctorId, setChosenDoctorId] = useState<string>(
    selectedDoctorId || services[0]?.id || ""
  );
  
  // Credentials mode state
  const [emailInput, setEmailInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [showPin, setShowPin] = useState(false);

  // Register user mode state (for reception/admin)
  const [regRole, setRegRole] = useState<AppUserRole>("doctor");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPin, setRegPin] = useState(Math.floor(1000 + Math.random() * 9000).toString());
  const [regDoctorSpecialty, setRegDoctorSpecialty] = useState("");
  const [regDoctorCrm, setRegDoctorCrm] = useState("");
  const [regDoctorPrice, setRegDoctorPrice] = useState("220");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activeDoctor = services.find((s) => s.id === chosenDoctorId) || services[0];
  const doctorUsers = users.filter((u) => u.role === "doctor" && u.status === "active");

  const handleRoleSelect = (role: AppUserRole) => {
    setSelectedRole(role);
    soundEffects.playClick();
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleQuickLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      setIsLoading(false);
      soundEffects.playPaymentSuccess();

      let matchedUser: ClinicUser | undefined = undefined;
      if (selectedRole === "doctor") {
        matchedUser = users.find((u) => u.doctorId === chosenDoctorId || u.role === "doctor");
      } else {
        matchedUser = users.find((u) => u.role === selectedRole);
      }

      onLoginSuccess(selectedRole, selectedRole === "doctor" ? chosenDoctorId : undefined, matchedUser);
    }, 450);
  };

  const handleCredentialsLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const cleanEmail = emailInput.trim().toLowerCase();
    const user = users.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail ||
        u.name.toLowerCase().includes(cleanEmail) ||
        (u.crm && u.crm.toLowerCase().includes(cleanEmail))
    );

    if (!user) {
      setIsLoading(false);
      setErrorMessage("Usuário ou email não encontrado no sistema.");
      return;
    }

    if (pinInput.trim() && user.pin && user.pin !== pinInput.trim()) {
      setIsLoading(false);
      setErrorMessage("PIN / Senha de acesso incorreto.");
      return;
    }

    setTimeout(() => {
      setIsLoading(false);
      soundEffects.playPaymentSuccess();
      onLoginSuccess(user.role, user.doctorId, user);
    }, 400);
  };

  const handleRegisterNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      setErrorMessage("Por favor, preencha o nome do usuário.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      let doctorId = undefined;
      let createdService: ServiceItem | undefined = undefined;

      if (regRole === "doctor") {
        const slug = (regDoctorSpecialty || regName)
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
        const newSvcId = `med-${slug}-${Date.now().toString().slice(-4)}`;

        createdService = {
          id: newSvcId,
          name: regDoctorSpecialty || `Consulta com ${regName}`,
          category: "Especialidades",
          price: parseFloat(regDoctorPrice) || 220,
          durationMinutes: 30,
          description: `Atendimento com ${regName}`,
          doctor: regName,
          crm: regDoctorCrm || "CRM/PA",
          specialtyDetails: `Especialista em ${regDoctorSpecialty || "atendimento clínico"}`,
          availableDays: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
          workStartHour: "08:00",
          workEndHour: "18:00",
        };
        doctorId = newSvcId;
      }

      const generatedEmail =
        regEmail.trim() ||
        `${regName
          .toLowerCase()
          .replace(/^(dr\.|dra\.)\s*/i, "")
          .trim()
          .replace(/\s+/g, ".")
          .replace(/[^a-z0-9.]/g, "")}@santaclara.com.br`;

      const newUser: ClinicUser = {
        id: `usr-${regRole}-${Date.now()}`,
        name: regName.trim(),
        email: generatedEmail,
        role: regRole,
        doctorId,
        doctorName: regRole === "doctor" ? regName : undefined,
        crm: regRole === "doctor" ? regDoctorCrm : undefined,
        specialty: regRole === "doctor" ? regDoctorSpecialty : undefined,
        phone: regPhone.trim() || undefined,
        pin: regPin.trim() || "1234",
        status: "active",
        createdAt: new Date().toISOString(),
      };

      if (onSaveNewUser) {
        await onSaveNewUser(newUser, createdService);
      }

      soundEffects.playPaymentSuccess();
      setSuccessMessage(`Usuário ${newUser.name} criado com sucesso! Você já pode entrar.`);
      setLoginMode("quick");
      setSelectedRole(newUser.role);
      if (newUser.doctorId) {
        setChosenDoctorId(newUser.doctorId);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Erro ao criar novo usuário.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await loginWithGoogle();
      soundEffects.playPaymentSuccess();
      onLoginSuccess(selectedRole, selectedRole === "doctor" ? chosenDoctorId : undefined);
    } catch (err: any) {
      console.error("Google login error:", err);
      setErrorMessage(err.message || "Erro ao conectar via Google");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 bg-slate-950/20">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Left Side: Brand & Hero Banner */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

          {/* Brand Header */}
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sistema Clínico Inteligente</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                <Heart className="w-7 h-7 text-emerald-400 fill-emerald-400/20" />
                <span>{clinicConfig.clinicName || "Clínica Santa Clara"}</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Portal Integrado • Gestão da Clínica, Portal do Médico & Atendimento WhatsApp 24/7.
              </p>
            </div>
          </div>

          {/* Features Highlights */}
          <div className="relative z-10 my-8 space-y-3">
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <strong className="block text-slate-100 font-semibold">Portal Individual do Médico</strong>
                <span className="text-slate-400 text-[11px]">Prontuário PEP, atestados, receitas e escala</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <strong className="block text-slate-100 font-semibold">Recepção & Balcão</strong>
                <span className="text-slate-400 text-[11px]">Cadastro de usuários, agenda e pagamentos</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <strong className="block text-slate-100 font-semibold">Painel Geral da Clínica (Admin)</strong>
                <span className="text-slate-400 text-[11px]">Faturamento, métricas e IA WhatsApp</span>
              </div>
            </div>
          </div>

          {/* Footer badge */}
          <div className="relative z-10 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Banco Supabase Seguro
            </span>
            <span className="font-mono text-emerald-400 font-medium">Equipe & Acessos</span>
          </div>
        </div>

        {/* Right Side: Login Form & Mode Selector */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white">
          <div className="space-y-5">
            {/* Top Switcher: Quick Login vs Email/Pin vs Register */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode("quick");
                    soundEffects.playClick();
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
                    loginMode === "quick"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Acesso Rápido
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode("credentials");
                    soundEffects.playClick();
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
                    loginMode === "credentials"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Email & PIN
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setLoginMode(loginMode === "register" ? "quick" : "register");
                  soundEffects.playClick();
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{loginMode === "register" ? "Voltar ao Login" : "+ Criar Usuário"}</span>
              </button>
            </div>

            {successMessage && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-2xl border border-emerald-200 font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-200 font-medium animate-in fade-in">
                {errorMessage}
              </div>
            )}

            {/* MODE 1: QUICK ACCESS BY ROLE */}
            {loginMode === "quick" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Selecione seu Perfil de Trabalho
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Acesso direto configurado para a equipe da clínica:
                  </p>
                </div>

                {/* Profile Tabs */}
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleRoleSelect("doctor")}
                    className={`p-3 rounded-2xl border text-left transition-all relative ${
                      selectedRole === "doctor"
                        ? "border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20 shadow-sm"
                        : "border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-1.5 shadow-xs">
                      <Stethoscope className="w-3.5 h-3.5" />
                    </div>
                    <div className="font-bold text-xs">Área do Médico</div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Prontuário PEP</div>
                    {selectedRole === "doctor" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute top-3 right-3" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSelect("admin")}
                    className={`p-3 rounded-2xl border text-left transition-all relative ${
                      selectedRole === "admin"
                        ? "border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-500/20 shadow-sm"
                        : "border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-1.5 shadow-xs">
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="font-bold text-xs">Painel Geral</div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Gestão & Finanças</div>
                    {selectedRole === "admin" && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 absolute top-3 right-3" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSelect("receptionist")}
                    className={`p-3 rounded-2xl border text-left transition-all relative ${
                      selectedRole === "receptionist"
                        ? "border-blue-600 bg-blue-50/80 text-blue-950 ring-2 ring-blue-500/20 shadow-sm"
                        : "border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-1.5 shadow-xs">
                      <UserCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="font-bold text-xs">Recepção / Balcão</div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Check-in & Usuários</div>
                    {selectedRole === "receptionist" && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600 absolute top-3 right-3" />
                    )}
                  </button>
                </div>

                <form onSubmit={handleQuickLogin} className="space-y-4">
                  {selectedRole === "doctor" && (
                    <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-2.5 animate-in fade-in">
                      <label className="block text-xs font-bold text-emerald-950">
                        Identifique o Médico para abrir o Prontuário correspondente:
                      </label>
                      <select
                        value={chosenDoctorId}
                        onChange={(e) => setChosenDoctorId(e.target.value)}
                        className="w-full text-xs font-semibold p-2.5 bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900"
                      >
                        {services.map((srv) => (
                          <option key={srv.id} value={srv.id}>
                            {srv.doctor} — {srv.name} ({srv.crm || "CRM/PA"})
                          </option>
                        ))}
                      </select>

                      {activeDoctor && (
                        <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-emerald-100 text-xs">
                          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                            {activeDoctor.doctor.replace("Dr. ", "").replace("Dra. ", "").charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-slate-900">{activeDoctor.doctor}</div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {activeDoctor.name} • {activeDoctor.crm || "CRM 12345/PA"}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                            Escala Ativa
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedRole === "admin" && (
                    <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-200 space-y-1 text-xs text-indigo-950">
                      <div className="font-bold flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        <span>Acesso Geral de Diretoria & Gestão</span>
                      </div>
                      <p className="text-[11px] text-indigo-900/80">
                        Controle de faturamento, cadastro de médicos, equipe de recepção e IA do WhatsApp.
                      </p>
                    </div>
                  )}

                  {selectedRole === "receptionist" && (
                    <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-1 text-xs text-blue-950">
                      <div className="font-bold flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-blue-600" />
                        <span>Acesso da Recepção & Balcão de Atendimento</span>
                      </div>
                      <p className="text-[11px] text-blue-900/80">
                        Check-in de pacientes, emissão de cobranças balcão e opção de criar usuários/médicos na equipe.
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${
                      selectedRole === "doctor"
                        ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                        : selectedRole === "admin"
                        ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20"
                        : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/20"
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>
                      {isLoading
                        ? "Carregando área..."
                        : selectedRole === "doctor"
                        ? `Entrar como ${activeDoctor?.doctor || "Médico"}`
                        : selectedRole === "admin"
                        ? "Entrar no Painel Admin Geral"
                        : "Entrar na Recepção & Balcão"}
                    </span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </form>
              </div>
            )}

            {/* MODE 2: EMAIL & PIN LOGIN */}
            {loginMode === "credentials" && (
              <form onSubmit={handleCredentialsLogin} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Entrar com Email & PIN
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Digite seu login individual institucional:
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Email ou Login Institucional:
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="Ex: roberto.martins@santaclara.com.br ou admin"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      PIN ou Senha de Acesso:
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPin ? "text" : "password"}
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value)}
                        placeholder="••••"
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isLoading ? "Autenticando..." : "Entrar no Sistema"}</span>
                </button>
              </form>
            )}

            {/* MODE 3: REGISTER NEW USER (FOR RECEPTION / ADMIN) */}
            {loginMode === "register" && (
              <form onSubmit={handleRegisterNewUser} className="space-y-3.5 text-xs">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Cadastrar Novo Usuário na Clínica
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Opção da recepção e diretoria para criar contas de médicos e atendentes:
                  </p>
                </div>

                {/* Role Switcher */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Perfil:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegRole("doctor")}
                      className={`p-2 rounded-xl border text-center font-bold transition-all ${
                        regRole === "doctor"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-950"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Stethoscope className="w-3.5 h-3.5 mx-auto mb-0.5 text-emerald-600" />
                      <span>Médico</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole("receptionist")}
                      className={`p-2 rounded-xl border text-center font-bold transition-all ${
                        regRole === "receptionist"
                          ? "border-blue-600 bg-blue-50 text-blue-950"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5 mx-auto mb-0.5 text-blue-600" />
                      <span>Recepção</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole("admin")}
                      className={`p-2 rounded-xl border text-center font-bold transition-all ${
                        regRole === "admin"
                          ? "border-purple-600 bg-purple-50 text-purple-950"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5 mx-auto mb-0.5 text-purple-600" />
                      <span>Admin</span>
                    </button>
                  </div>
                </div>

                {/* Doctor specific fields */}
                {regRole === "doctor" && (
                  <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-0.5">Especialidade:</label>
                        <input
                          type="text"
                          value={regDoctorSpecialty}
                          onChange={(e) => setRegDoctorSpecialty(e.target.value)}
                          placeholder="Ex: Neurologia, Pediatria"
                          className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-0.5">CRM:</label>
                        <input
                          type="text"
                          value={regDoctorCrm}
                          onChange={(e) => setRegDoctorCrm(e.target.value)}
                          placeholder="Ex: CRM 12345/PA"
                          className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Nome Completo:</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder={regRole === "doctor" ? "Ex: Dr. Roberto Martins" : "Ex: Maria Fernanda"}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                    required
                  />
                </div>

                {/* Email and PIN */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5">Email:</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="email@santaclara.com.br"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5">PIN de Acesso:</label>
                    <input
                      type="text"
                      value={regPin}
                      onChange={(e) => setRegPin(e.target.value)}
                      placeholder="1234"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isLoading ? "Cadastrando..." : "Concluir Cadastro & Liberar Acesso"}</span>
                </button>
              </form>
            )}

            {/* Google Institutional Login Button */}
            {loginMode !== "register" && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full py-2 px-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-200 transition-colors shadow-2xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Entrar com Conta Google Institucional</span>
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 text-center">
            <span className="text-[11px] text-slate-400">
              Acesso institucional protegido por autenticação e Supabase Database.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
