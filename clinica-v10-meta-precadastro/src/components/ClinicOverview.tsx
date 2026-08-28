import React, { useState } from "react";
import {
  Building2,
  Stethoscope,
  Users,
  DollarSign,
  Calendar,
  Clock,
  Phone,
  MapPin,
  CheckCircle2,
  TrendingUp,
  Activity,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap,
  Smartphone,
  ExternalLink,
  Plus,
  Edit2,
  Search,
  Check,
} from "lucide-react";
import {
  ClinicConfig,
  ServiceItem,
  Appointment,
  PatientRecord,
  LabExamItem,
} from "../types";
import { soundEffects } from "../utils/audioEffects";

interface ClinicOverviewProps {
  clinicConfig: ClinicConfig;
  services: ServiceItem[];
  appointments: Appointment[];
  patients: PatientRecord[];
  exams: LabExamItem[];
  onNavigateTab: (tab: any) => void;
  onSelectDoctorForPortal?: (doctorId: string) => void;
  viewMode?: "client" | "agency";
}

export const ClinicOverview: React.FC<ClinicOverviewProps> = ({
  clinicConfig = {} as ClinicConfig,
  services = [],
  appointments = [],
  patients = [],
  exams = [],
  onNavigateTab,
  onSelectDoctorForPortal,
  viewMode = "client",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");

  const safeConfig = clinicConfig || {};
  const safeServices = Array.isArray(services) ? services : [];
  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  const safePatients = Array.isArray(patients) ? patients : [];
  const safeExams = Array.isArray(exams) ? exams : [];

  // Calculated Metrics
  const totalAppointments = safeAppointments.length;
  const confirmedAppointments = safeAppointments.filter((a) => a && a.status === "confirmed_paid");
  const pendingAppointments = safeAppointments.filter((a) => a && a.status === "pending_payment");
  const totalRevenue = confirmedAppointments.reduce((acc, a) => acc + (Number(a.price) || 0), 0);
  const totalPatientsCount = safePatients.length;

  const specialtiesList = Array.from(new Set(safeServices.map((s) => s?.name || "Geral").filter(Boolean)));

  const filteredServices = safeServices.filter((srv) => {
    if (!srv) return false;
    const docName = String(srv.doctor || "");
    const specName = String(srv.name || "");
    const crmCode = String(srv.crm || "");
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      docName.toLowerCase().includes(searchLower) ||
      specName.toLowerCase().includes(searchLower) ||
      crmCode.toLowerCase().includes(searchLower);
    const matchesSpec = selectedSpecialty === "all" || specName === selectedSpecialty;
    return matchesSearch && matchesSpec;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Hero Banner - Clinic Identification */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Painel Institucional da Clínica
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Operação Ativa
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {clinicConfig.clinicName || "Clínica Médica Santa Clara"}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300 pt-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{clinicConfig.address || "Av. Principal, 1500 - Sala 402"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>WhatsApp: {clinicConfig.phone || "(91) 98839-0894"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{clinicConfig.businessHours || "Seg a Sex: 08h às 18h | Sáb: 08h às 12h"}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
            <button
              onClick={() => {
                onNavigateTab("agenda");
                soundEffects.playClick();
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Calendar className="w-4 h-4" />
              <span>Abrir Agenda Geral</span>
            </button>

            <button
              onClick={() => {
                onNavigateTab("gateway");
                soundEffects.playClick();
              }}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-all"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Conexão WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Faturamento Confirmado
            </span>
            <div className="text-lg sm:text-2xl font-black text-emerald-700">
              R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{confirmedAppointments.length} consultas pagas</span>
            </div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pacientes Cadastrados
            </span>
            <div className="text-lg sm:text-2xl font-black text-slate-900">
              {totalPatientsCount}
            </div>
            <div className="text-[10px] text-indigo-600 font-semibold flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>Base ativa da clínica</span>
            </div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Corpo Clínico Ativo
            </span>
            <div className="text-lg sm:text-2xl font-black text-slate-900">
              {services.length}
            </div>
            <div className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
              <Stethoscope className="w-3 h-3" />
              <span>{specialtiesList.length} especialidades</span>
            </div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Exames Disponíveis
            </span>
            <div className="text-lg sm:text-2xl font-black text-slate-900">
              {exams.length}
            </div>
            <div className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>Orçamentos rápidos</span>
            </div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Grid: Medical Staff & Rooms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Medical Staff Management & Portals */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-indigo-600" />
                  <span>Corpo Clínico & Médicos Cadastrados</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Clique no médico para abrir o <strong>Portal do Médico</strong> correspondente com prontuário.
                </p>
              </div>

              <button
                onClick={() => {
                  onNavigateTab("settings");
                  soundEffects.playClick();
                }}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar / Editar Médicos</span>
              </button>
            </div>

            {/* Search and Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por médico ou CRM..."
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold text-slate-700"
              >
                <option value="all">Todas as Especialidades</option>
                {specialtiesList.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            {/* Medical Staff Cards List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {filteredServices.map((doctor) => {
                if (!doctor) return null;
                const docName = doctor.doctor || "Médico Especialista";
                const doctorAppointments = safeAppointments.filter(
                  (a) => a && (a.doctor === docName || a.serviceName === doctor.name)
                );
                const confirmedDoctorAppts = doctorAppointments.filter(
                  (a) => a && a.status === "confirmed_paid"
                );
                const priceFormatted = Number(doctor.price || 0).toFixed(2);
                const firstLetter = docName.replace("Dr. ", "").replace("Dra. ", "").charAt(0) || "M";
                const shortName = docName.split(" ")[0] || "Médico";

                return (
                  <div
                    key={doctor.id || Math.random().toString()}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all bg-white group flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-sm border border-indigo-100 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                            {firstLetter}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                              {docName}
                            </h4>
                            <div className="text-[11px] text-indigo-700 font-semibold">
                              {doctor.name || "Consulta Médica"}
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-mono">
                          {doctor.crm || "CRM Ativo"}
                        </span>
                      </div>

                      {/* Doctor Schedule and Price Details */}
                      <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Valor Consulta:</span>
                          <strong className="text-emerald-700 font-bold">
                            R$ {priceFormatted}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Horário:</span>
                          <span className="font-medium text-slate-700">
                            {doctor.workStartHour || "08:00"} às {doctor.workEndHour || "18:00"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Dias:</span>
                          <span className="font-medium text-slate-700 truncate max-w-[150px]">
                            {Array.isArray(doctor.availableDays) ? doctor.availableDays.join(", ") : "Seg a Sex"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 gap-1.5">
                      <button
                        onClick={() => {
                          if (onSelectDoctorForPortal && doctor.id) {
                            onSelectDoctorForPortal(doctor.id);
                          }
                          onNavigateTab("doctor");
                          soundEffects.playClick();
                        }}
                        className="w-full py-2 px-3 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Abrir Portal do {shortName}</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                      </button>

                      <button
                        onClick={() => {
                          onNavigateTab("agenda");
                          soundEffects.playClick();
                        }}
                        className="w-full py-1.5 px-3 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
                      >
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Ajustar Escala & Horário</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Clinic Fast Operations & Today's Overview */}
        <div className="space-y-6">
          
          {/* Quick Operations Box */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Operações Rápidas da Clínica</span>
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => {
                  onNavigateTab("agenda");
                  soundEffects.playClick();
                }}
                className="w-full p-3 bg-slate-50 hover:bg-emerald-50 rounded-2xl border border-slate-200 hover:border-emerald-300 text-left transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-950">
                      Recepção & Balcão
                    </div>
                    <div className="text-[10px] text-slate-500">Agendar e dar baixa em pagamentos</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              </button>

              <button
                onClick={() => {
                  onNavigateTab("quotes");
                  soundEffects.playClick();
                }}
                className="w-full p-3 bg-slate-50 hover:bg-indigo-50 rounded-2xl border border-slate-200 hover:border-indigo-300 text-left transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 group-hover:text-indigo-950">
                      Orçamentos & Exames
                    </div>
                    <div className="text-[10px] text-slate-500">Gerar cotação para WhatsApp com Pix</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
              </button>

              <button
                onClick={() => {
                  onNavigateTab("gateway");
                  soundEffects.playClick();
                }}
                className="w-full p-3 bg-slate-50 hover:bg-teal-50 rounded-2xl border border-slate-200 hover:border-teal-300 text-left transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 group-hover:text-teal-950">
                      Conexão WhatsApp Real
                    </div>
                    <div className="text-[10px] text-slate-500">QR Code, Evolution API e Webhooks</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600" />
              </button>

              <button
                onClick={() => {
                  onNavigateTab("settings");
                  soundEffects.playClick();
                }}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-left transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">
                      Configurações da Clínica
                    </div>
                    <div className="text-[10px] text-slate-500">Endereço, regras de robô e preços</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Clinic Support & Security Information */}
          <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Atendimento & Segurança</span>
              </h4>
              <span className="text-[10px] text-emerald-400 font-medium">Canal Oficial</span>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-slate-700">
                <span>Canal WhatsApp:</span>
                <strong className="text-emerald-400">{clinicConfig.phone || clinicConfig.agencyPhone || "Atendimento 24h"}</strong>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-slate-700">
                <span>Agendamento:</span>
                <strong className="text-indigo-400">Confirmação Imediata</strong>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-slate-700">
                <span>Privacidade:</span>
                <strong className="text-slate-200">Proteção LGPD Médica</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
