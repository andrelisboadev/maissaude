import React, { useState } from "react";
import {
  MessageSquare,
  Calendar,
  Terminal,
  Settings,
  BookOpen,
  RefreshCw,
  Zap,
  Volume2,
  VolumeX,
  PhoneCall,
  Sparkles,
  ShieldCheck,
  FlaskConical,
  Users,
  Bell,
  TrendingUp,
  Stethoscope,
  Database,
  Building2,
  LogIn,
  Share2,
  Lock,
  Check,
} from "lucide-react";

export type NavTabType =
  | "clinic"
  | "agenda"
  | "doctor"
  | "patients"
  | "reminders"
  | "quotes"
  | "dashboard"
  | "chat"
  | "gateway"
  | "users"
  | "settings"
  | "inspector"
  | "guide"
  | "login";

interface HeaderProps {
  activeTab: NavTabType;
  setActiveTab: (tab: NavTabType) => void;
  viewMode: "client" | "agency";
  setViewMode: (mode: "client" | "agency") => void;
  clinicName: string;
  agencyPhone: string;
  hasGeminiKey: boolean;
  onReset: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  onSimulateWebhook?: () => void;
  pendingCount: number;
  remindersCount?: number;
  databaseConnected?: boolean;
  onOpenAuthModal?: () => void;
  currentRole?: "admin" | "receptionist" | "doctor";
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  viewMode,
  setViewMode,
  clinicName,
  agencyPhone,
  hasGeminiKey,
  onReset,
  soundEnabled,
  setSoundEnabled,
  onSimulateWebhook,
  pendingCount,
  remindersCount,
  databaseConnected = true,
  onOpenAuthModal,
  currentRole = "admin",
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const handleCopyClientLink = () => {
    const origin = window.location.origin;
    const clientUrl = `${origin}/?mode=client`;
    navigator.clipboard.writeText(clientUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleUnlockAdmin = () => {
    // Standard quick PIN or direct confirm
    if (adminPinInput === "1234" || adminPinInput === "admin" || adminPinInput === "") {
      setViewMode("agency");
      setShowAdminLoginModal(false);
      setAdminPinInput("");
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-40 shadow-md">
      {/* Top Agency & Status Bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 px-4 py-1.5 border-b border-slate-800/80 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{viewMode === "client" ? "Atendimento WhatsApp Online 24/7" : "Painel de Controle • Sistema Integrado"}</span>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-medium text-[11px]">
            <Database className="w-3 h-3 text-emerald-400" />
            <span>{viewMode === "client" ? "Canal Oficial Conectado" : <>Sistema <strong>Nuvem Ativo</strong></>}</span>
          </div>
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center gap-2.5">
          {viewMode === "agency" ? (
            <>
              {/* Button to Copy Direct Client Link */}
              <button
                id="btn-copy-client-link"
                onClick={handleCopyClientLink}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-sm text-[11px] animate-pulse"
                title="Copiar link limpo para enviar aos clientes e pacientes"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-100" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Link do Cliente Copiado!" : "Copiar Link para Cliente"}</span>
              </button>

              {/* Toggle to Preview Client View */}
              <button
                onClick={() => {
                  setViewMode("client");
                  setActiveTab("clinic");
                }}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium text-[11px] transition-all"
                title="Alternar para visualização que o cliente vê"
              >
                Ver como Cliente
              </button>
            </>
          ) : (
            /* Client Mode: Discreet restricted area link */
            <button
              onClick={() => setShowAdminLoginModal(true)}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-[11px] px-2 py-1 rounded hover:bg-slate-800/60 transition-colors"
              title="Acesso exclusivo para administradores e equipe médica"
            >
              <Lock className="w-3 h-3" />
              <span>Área da Equipe</span>
            </button>
          )}

          <a
            href={`https://wa.me/55${(agencyPhone || "91988390894").replace(/\D/g, "")}?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20o%20Agente%20WhatsApp%20para%20Cl%C3%ADnicas`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition-colors text-[11px]"
          >
            <PhoneCall className="w-3 h-3 text-emerald-400" />
            <span>Suporte WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-3 py-2.5">
        {/* Clinic Identity */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg text-white leading-tight tracking-tight">
                {clinicName}
              </h1>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                {viewMode === "client" ? "Portal do Paciente" : "Painel Gestão"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {viewMode === "client"
                ? "Atendimento Inteligente 24h, Consultas, Exames e Especialidades"
                : "Gestão Médica Completa, Prontuário Eletrônico e Atendimento IA"}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/60 overflow-x-auto max-w-full">
          {/* 1. Página da Clínica (Apresentação, Médicos & Agendamento) */}
          <button
            id="tab-clinic"
            onClick={() => setActiveTab("clinic")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 ${
              activeTab === "clinic"
                ? "bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400"
                : "text-indigo-300 hover:text-white hover:bg-indigo-900/50"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Página da Clínica</span>
          </button>

          {/* 2. Chat / Atendimento WhatsApp IA */}
          <button
            id="tab-chat"
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 ${
              activeTab === "chat"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-700/60"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>{viewMode === "client" ? "Atendente WhatsApp" : "Simulador WhatsApp"}</span>
          </button>

          {/* 3. Horários / Agenda */}
          <button
            id="tab-agenda"
            onClick={() => setActiveTab("agenda")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
              activeTab === "agenda"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-700/60"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{viewMode === "client" ? "Horários & Especialidades" : "Agenda"}</span>
            {viewMode === "agency" && pendingCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>

          {/* 4. Orçamentos & Tabela de Exames */}
          <button
            id="tab-quotes"
            onClick={() => setActiveTab("quotes")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
              activeTab === "quotes"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-700/60"
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>{viewMode === "client" ? "Exames & Preços" : "Orçamentos & Exames"}</span>
          </button>

          {/* Portal do Médico (PEP) — visível também no modo cliente: é onde o médico escreve prescrições */}
          <button
            id="tab-doctor"
            onClick={() => setActiveTab("doctor")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 ${
              activeTab === "doctor"
                ? "bg-teal-600 text-white shadow-sm ring-1 ring-teal-400"
                : "text-teal-300 hover:text-white hover:bg-teal-900/50"
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Página do Médico</span>
          </button>

          {/* Pacientes & Prontuários — visível também no modo cliente */}
          <button
            id="tab-patients"
            onClick={() => setActiveTab("patients")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
              activeTab === "patients"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-700/60"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Pacientes</span>
          </button>

          {/* INTERNAL / ADMIN TABS (Visible ONLY in Agency/Admin Mode) */}
          {viewMode === "agency" && (
            <>
              {/* Lembretes D-1 */}
              <button
                id="tab-reminders"
                onClick={() => setActiveTab("reminders")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
                  activeTab === "reminders"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/60"
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>Lembretes</span>
                {remindersCount !== undefined && remindersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                    {remindersCount}
                  </span>
                )}
              </button>

              {/* Financeiro */}
              <button
                id="tab-dashboard"
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
                  activeTab === "dashboard"
                    ? "bg-teal-700 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/60"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Financeiro</span>
              </button>

              {/* Conectar WhatsApp */}
              <button
                id="tab-gateway"
                onClick={() => setActiveTab("gateway")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 ${
                  activeTab === "gateway"
                    ? "bg-emerald-500 text-slate-950 shadow-sm"
                    : "text-emerald-300 hover:text-white hover:bg-emerald-900/50"
                }`}
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>WhatsApp</span>
              </button>

              {/* Equipe, Médicos & Usuários */}
              <button
                id="tab-users"
                onClick={() => setActiveTab("users")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 ${
                  activeTab === "users"
                    ? "bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400"
                    : "text-indigo-200 hover:text-white hover:bg-indigo-900/50"
                }`}
                title="Gestão de Usuários, Médicos e Logins da Recepção"
              >
                <Users className="w-4 h-4 text-indigo-300" />
                <span>Equipe & Médicos</span>
              </button>

              {/* Configurações */}
              <button
                id="tab-settings"
                onClick={() => setActiveTab("settings")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
                  activeTab === "settings"
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/60"
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Config</span>
              </button>

              {/* Inspetor IA */}
              <button
                id="tab-inspector"
                onClick={() => setActiveTab("inspector")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
                  activeTab === "inspector"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/60"
                }`}
              >
                <Terminal className="w-4 h-4" />
                <span>Inspetor IA</span>
              </button>

              {/* Deploy & WhatsApp */}
              <button
                id="tab-guide"
                onClick={() => setActiveTab("guide")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
                  activeTab === "guide"
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/60"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Guia</span>
              </button>

              {/* Login / Switch Profile button */}
              <button
                id="tab-login"
                onClick={() => setActiveTab("login")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                  activeTab === "login"
                    ? "bg-slate-100 text-slate-900 shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/60"
                }`}
                title="Ir para Tela de Login e Troca de Perfil"
              >
                <LogIn className="w-4 h-4 text-emerald-400" />
                <span>Perfis</span>
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Admin Unlock Modal for staff when in Client Mode */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-950 border border-emerald-700/50 rounded-xl text-emerald-400">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Área Restrita da Equipe</h3>
                <p className="text-xs text-slate-400">Acesso ao painel administrativo da clínica</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
              Você está na visualização do cliente. Para acessar as telas administrativas (prontuários, financeiro e configurações), clique abaixo:
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowAdminLoginModal(false);
                  setPinError(false);
                }}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUnlockAdmin}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
              >
                Entrar no Painel Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
