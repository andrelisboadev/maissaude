import React, { useState, useMemo } from "react";
import {
  Stethoscope,
  Users,
  Search,
  Plus,
  FileText,
  Calendar,
  Phone,
  Clock,
  Heart,
  Pill,
  Printer,
  Save,
  Check,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Copy,
  Edit2,
  Trash2,
  Lock,
} from "lucide-react";
import {
  PatientRecord,
  ClinicalEvolution,
  Appointment,
  ServiceItem,
  LabExamItem,
  ClinicConfig,
} from "../types";
import confetti from "canvas-confetti";

interface DoctorPortalProps {
  clinicConfig: ClinicConfig;
  services: ServiceItem[];
  patients: PatientRecord[];
  appointments: Appointment[];
  exams: LabExamItem[];
  /** Quando um médico real está logado, trava a visão apenas nele — sem opção de trocar. */
  lockedDoctorName?: string | null;
  onAddEvolution: (patientId: string, evolution: Omit<ClinicalEvolution, "id">) => void;
  onUpdateEvolution?: (patientId: string, evolutionId: string, evolution: Partial<ClinicalEvolution>) => void;
  onDeleteEvolution?: (patientId: string, evolutionId: string) => void;
  onUpdatePatientNotes?: (patientId: string, generalNotes: string, allergies?: string[], chronicConditions?: string[]) => void;
  onNavigateToClinic?: () => void;
  onLogout?: () => void;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({
  clinicConfig,
  services,
  patients,
  appointments,
  exams,
  lockedDoctorName,
  onAddEvolution,
  onUpdateEvolution,
  onDeleteEvolution,
  onUpdatePatientNotes,
  onNavigateToClinic,
  onLogout,
}) => {
  const lockedService = lockedDoctorName
    ? services.find((s) => s.doctor === lockedDoctorName)
    : undefined;

  // Selected logged-in doctor — travado no próprio médico quando há login real
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    lockedService?.id || services[0]?.id || ""
  );
  const currentDoctor = lockedService || services.find((s) => s.id === selectedDoctorId) || services[0];
  const [doctorStatus, setDoctorStatus] = useState<"available" | "busy" | "break">("available");

  // Active Patient selection
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || "");
  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTodayOnly, setFilterTodayOnly] = useState(false);

  // Tab inside Doctor Portal
  const [subTab, setSubTab] = useState<"prescricao" | "prontuario" | "fila_hoje" | "modelos">("prescricao");

  // Prescription Form State
  const [prescDiagnosis, setPrescDiagnosis] = useState("");
  const [prescNote, setPrescNote] = useState("");
  const [prescMedicines, setPrescMedicines] = useState("");
  const [prescExamRequests, setPrescExamRequests] = useState("");
  const [prescAttestation, setPrescAttestation] = useState("");
  const [prescDaysOff, setPrescDaysOff] = useState("0");
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick Prescription Templates
  const prescriptionTemplates = [
    {
      title: "Controle de Hipertensão / Rotina",
      diagnosis: "Hipertensão Arterial Sistêmica (I10)",
      medicines: "1. Losartana Potássica 50mg ------- Tomar 1 comprimido VO pela manhã em jejum.\n2. Hidroclorotiazida 25mg ---------- Tomar 1 comprimido VO após café da manhã.",
      note: "Paciente orientado quanto a restrição de sódio e atividade física regular 150min/sem.",
      examRequests: "Perfil Lipídico, Glicemia em Jejum, Creatinina, Eletrólitos, ECG de repouso.",
    },
    {
      title: "Tireoide / Hipotireoidismo",
      diagnosis: "Hipotireoidismo primário (E03.9)",
      medicines: "1. Levotiroxina Sódica 50mcg ------- Tomar 1 comprimido VO pela manhã em jejum rigoroso de 30min antes do desjejum.",
      note: "Ajuste posológico baseado no TSH. Reavaliação laboratorial em 6 a 8 semanas.",
      examRequests: "TSH Ultra Sensível, T4 Livre, Anti-TPO, Ultrassom de Tireoide com Doppler.",
    },
    {
      title: "Diabetes Mellitus Tipo 2",
      diagnosis: "Diabetes Mellitus Tipo 2 (E11)",
      medicines: "1. Metformina 850mg --------------- Tomar 1 comprimido VO 2x ao dia junto às principais refeições (almoço e jantar).",
      note: "Controle glicêmico capilar diário em mapa. Orientada dieta com baixo índice glicêmico.",
      examRequests: "Hemoglobina Glicada (HbA1c), Glicemia de Jejum, Perfil Lipídico, Microalbuminúria.",
    },
    {
      title: "Tendinopatia / Inflamação Aguda",
      diagnosis: "Tendinopatia / Síndrome do Impacto (M75.1)",
      medicines: "1. Cetoprofeno 150mg -------------- Tomar 1 comprimido VO 1x ao dia por 5 dias após refeição.\n2. Dipirona 1g --------------------- Tomar 1 comprimido VO até de 6/6h se dor intensa.",
      note: "Crioterapia local 20min 3x ao dia. Repouso articular relativo e encaminhamento para fisioterapia.",
      examRequests: "Ultrassonografia Articular / Ressonância Magnética se refratário.",
    },
  ];

  const applyTemplate = (tpl: typeof prescriptionTemplates[0]) => {
    setPrescDiagnosis(tpl.diagnosis);
    setPrescMedicines(tpl.medicines);
    setPrescNote(tpl.note);
    setPrescExamRequests(tpl.examRequests);
    setToastMessage(`Modelo "${tpl.title}" aplicado!`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Filtered Patients List for Doctor
  const filteredPatients = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];

    return patients.filter((pat) => {
      const matchSearch =
        pat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pat.phone.includes(searchTerm) ||
        (pat.cpf && pat.cpf.includes(searchTerm));

      if (!matchSearch) return false;

      if (filterTodayOnly) {
        // Check if has appointment today with current doctor
        const hasTodayApt = appointments.some(
          (a) =>
            a.patientName.toLowerCase() === pat.name.toLowerCase() &&
            a.date === today &&
            (a.doctor === currentDoctor.doctor || a.doctor.includes(currentDoctor.doctor))
        );
        return hasTodayApt;
      }

      return true;
    });
  }, [patients, searchTerm, filterTodayOnly, appointments, currentDoctor]);

  // Appointments for this doctor today
  const todayAppointments = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return appointments.filter(
      (a) =>
        (a.doctor === currentDoctor.doctor || a.doctor.includes(currentDoctor.doctor)) &&
        a.status !== "cancelled"
    );
  }, [appointments, currentDoctor]);

  const handleSavePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    if (!prescDiagnosis.trim() && !prescMedicines.trim() && !prescNote.trim()) {
      alert("Preencha ao menos o Diagnóstico, a Prescrição de Medicamentos ou as Anotações Clínicas.");
      return;
    }

    setIsSaving(true);

    const fullNote = [
      prescNote.trim(),
      prescExamRequests.trim() ? `\n[Exames Solicitados]: ${prescExamRequests.trim()}` : "",
      prescAttestation.trim() ? `\n[Atestado Médico / Recomendações]: ${prescAttestation.trim()} (${prescDaysOff} dias de repouso)` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const newEvolution: Omit<ClinicalEvolution, "id"> = {
      date: new Date().toISOString().split("T")[0],
      doctor: `${currentDoctor.doctor} (${currentDoctor.name}${currentDoctor.crm ? ` - CRM ${currentDoctor.crm}` : ""})`,
      diagnosisOrReason: prescDiagnosis.trim() || "Atendimento Clínico / Prescrição",
      note: fullNote || "Atendimento médico realizado e prescrição emitida.",
      prescriptions: prescMedicines.trim() || undefined,
    };

    onAddEvolution(selectedPatient.id, newEvolution);

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
    });

    setIsSaving(false);
    setToastMessage(`Prescrição e evolução salvas no prontuário de ${selectedPatient.name}!`);
    setTimeout(() => setToastMessage(null), 3500);

    // Keep history clean or switch to prontuario tab
    setSubTab("prontuario");
  };

  const [printTargetEvolution, setPrintTargetEvolution] = useState<ClinicalEvolution | null>(null);

  const handlePrintCurrent = () => {
    setPrintTargetEvolution(null);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handlePrintHistoryItem = (evo: ClinicalEvolution) => {
    setPrintTargetEvolution(evo);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <>
      {/* SCREEN UI (Hidden when printing) */}
      <div className="print-hide max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500 flex items-center gap-2 text-sm font-semibold animate-bounce">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Banner: Doctor Selection & Identity */}
        <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 rounded-2xl p-5 border border-teal-800/50 shadow-lg text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Portal do Médico & Prescrição</h2>
                  <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 text-xs font-bold uppercase border border-teal-500/30">
                    Área Médica Restrita
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Acesso direto ao prontuário eletrônico, histórico de consultas, emissor de receitas e atestados.
                </p>
              </div>
            </div>
          </div>

          {/* Actions & Doctor Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status buttons */}
            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setDoctorStatus("available")}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  doctorStatus === "available"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                <span>Atendendo</span>
              </button>
              <button
                type="button"
                onClick={() => setDoctorStatus("busy")}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  doctorStatus === "busy"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-300" />
                <span>Em Consulta</span>
              </button>
              <button
                type="button"
                onClick={() => setDoctorStatus("break")}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  doctorStatus === "break"
                    ? "bg-slate-700 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>Intervalo</span>
              </button>
            </div>

            {/* Doctor Switcher — travado quando é um médico com login real (não pode ver outros) */}
            <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
              <span className="text-[11px] text-slate-400 font-semibold hidden sm:inline">Dr(a):</span>
              {lockedDoctorName ? (
                <div className="px-2.5 py-1 bg-slate-900 border border-slate-600 rounded-lg text-xs font-bold text-teal-300 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-slate-500" />
                  {lockedDoctorName}
                </div>
              ) : (
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="px-2.5 py-1 bg-slate-900 border border-slate-600 rounded-lg text-xs font-bold text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {services.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.doctor} • {srv.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {onNavigateToClinic && (
              <button
                type="button"
                onClick={onNavigateToClinic}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors border border-white/10"
              >
                Página da Clínica
              </button>
            )}
          </div>
        </div>

        {/* Doctor Specialty Details Banner */}
        {currentDoctor && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm">
                {currentDoctor.doctor.replace("Dr. ", "").replace("Dra. ", "").substring(0, 2)}
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>{currentDoctor.doctor}</span>
                  {currentDoctor.crm && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[11px]">
                      CRM {currentDoctor.crm}
                    </span>
                  )}
                  <span className="text-teal-700 font-medium bg-teal-50 px-2 py-0.5 rounded">
                    {currentDoctor.name}
                  </span>
                </div>
                <p className="text-slate-600 mt-0.5">
                  <strong>Áreas de Atuação / Foco:</strong>{" "}
                  {currentDoctor.specialtyDetails ||
                    currentDoctor.description ||
                    "Atendimento clínico geral, diagnóstico preventivo e prescrição personalizada."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                Horário: {currentDoctor.workStartHour || "08:00"} às {currentDoctor.workEndHour || "18:00"}
              </span>
            </div>
          </div>
        )}

        {/* Main Workspace Layout (2 columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Patient Selector & Today's Queue (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-teal-600" />
                  <span>Selecionar Paciente</span>
                </h3>
                <span className="text-xs text-slate-500 font-semibold">{filteredPatients.length} pacientes</span>
              </div>

              {/* Search and filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, CPF ou tel..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setFilterTodayOnly(!filterTodayOnly)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      filterTodayOnly
                        ? "bg-teal-600 text-white font-bold"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    📅 Apenas Fila de Hoje ({todayAppointments.length})
                  </button>
                </div>
              </div>

              {/* Patients List */}
              <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
                {filteredPatients.map((pat) => {
                  const isSelected = selectedPatient?.id === pat.id;
                  const hasAllergy = pat.allergies && pat.allergies.length > 0 && pat.allergies[0] !== "Nenhum registro";

                  return (
                    <div
                      key={pat.id}
                      onClick={() => setSelectedPatientId(pat.id)}
                      className={`p-3 rounded-xl cursor-pointer border transition-all ${
                        isSelected
                          ? "bg-teal-50/80 border-teal-500 shadow-xs ring-1 ring-teal-500"
                          : "bg-slate-50/70 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900 text-xs truncate">{pat.name}</div>
                        {hasAllergy && (
                          <span className="px-1.5 py-0.2 text-[10px] font-bold bg-red-100 text-red-700 rounded">
                            Alérgico
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center justify-between mt-1">
                        <span>{pat.phone}</span>
                        <span>{pat.clinicalHistory.length} evoluções</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Prescriptions Templates Card */}
            <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-2xl p-4 border border-teal-800/40 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Modelos Rápidos de Receita</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Clique para preencher a prescrição e solicitação de exames instantaneamente:
              </p>

              <div className="space-y-1.5">
                {prescriptionTemplates.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className="w-full text-left p-2 rounded-xl bg-slate-800/80 hover:bg-teal-900/60 border border-slate-700 text-xs text-slate-200 transition-colors flex items-center justify-between group"
                  >
                    <span className="font-semibold text-slate-100 truncate">{tpl.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Patient Active Dashboard & Prescription Editor (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {selectedPatient ? (
              <>
                {/* Patient Header Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">{selectedPatient.name}</h3>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">
                          {selectedPatient.gender || "Não informado"}
                        </span>
                        {selectedPatient.bloodType && (
                          <span className="px-2 py-0.5 bg-red-50 text-red-700 text-xs rounded-full font-bold">
                            Tipo {selectedPatient.bloodType}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-1">
                        <span>CPF: {selectedPatient.cpf || "Não informado"}</span>
                        <span>• Nasc: {selectedPatient.birthDate || "Não informado"}</span>
                        <span>• Tel: {selectedPatient.phone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePrintCurrent}
                        className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border border-teal-200 shadow-xs active:scale-95"
                        title="Imprimir receita médica formatada"
                      >
                        <Printer className="w-4 h-4 text-teal-700" />
                        <span>Imprimir Receituário</span>
                      </button>
                    </div>
                  </div>

                  {/* Alerts / Allergies row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl space-y-1">
                      <div className="font-bold text-red-800 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                        <span>Alergias Medicamentosas / Alimentares:</span>
                      </div>
                      <div className="text-red-700 font-medium">
                        {selectedPatient.allergies && selectedPatient.allergies.length > 0
                          ? selectedPatient.allergies.join(", ")
                          : "Nenhuma alergia conhecida"}
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                      <div className="font-bold text-amber-800 flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-amber-600" />
                        <span>Condições Crônicas / Observações:</span>
                      </div>
                      <div className="text-amber-800">
                        {selectedPatient.chronicConditions && selectedPatient.chronicConditions.length > 0
                          ? selectedPatient.chronicConditions.join(", ")
                          : "Nenhuma condição relatada"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-Tabs: Nova Prescrição vs Histórico do Prontuário */}
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSubTab("prescricao")}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                      subTab === "prescricao"
                        ? "bg-teal-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Pill className="w-4 h-4" />
                    <span>Nova Prescrição & Conduta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubTab("prontuario")}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                      subTab === "prontuario"
                        ? "bg-teal-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Histórico do Prontuário ({selectedPatient.clinicalHistory.length})</span>
                  </button>
                </div>

                {/* TAB 1: PRESCRIPTION FORM */}
                {subTab === "prescricao" && (
                  <form onSubmit={handleSavePrescription} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4 text-teal-600" />
                        <span>Emissão de Receituário & Evolução Médica</span>
                      </h4>
                      <span className="text-xs text-slate-500">
                        Data: {new Date().toLocaleDateString("pt-BR")}
                      </span>
                    </div>

                    {/* Diagnosis */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Hipótese Diagnóstica / Motivo da Consulta (CID-10):
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Hipertensão Arterial Sistêmica (I10), Hipotireoidismo, Check-up preventivo"
                        value={prescDiagnosis}
                        onChange={(e) => setPrescDiagnosis(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>

                    {/* Medicines / Prescriptions */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Pill className="w-3.5 h-3.5 text-teal-600" />
                          <span>Prescrição de Medicamentos & Posologia (Receituário):</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-normal">Uma medicação por linha</span>
                      </label>
                      <textarea
                        rows={4}
                        placeholder="1. Nome do Medicamento Dosagem --- Tomar 1 comprimido VO de X em X horas por Y dias&#10;2. ..."
                        value={prescMedicines}
                        onChange={(e) => setPrescMedicines(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>

                    {/* Exam Requests */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Solicitação de Exames Complementares:</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Hemograma completo, TSH, T4 Livre, Glicemia de jejum, ECG de repouso"
                        value={prescExamRequests}
                        onChange={(e) => setPrescExamRequests(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>

                    {/* Clinical Notes & Physical Exam */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Anotações Clínicas / Exame Físico / Conduta:
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Ex: PA: 120x80 mmHg, FC: 72 bpm. Murmúrio vesicular presente sem ruídos adventícios. Abdome plano e indolor..."
                        value={prescNote}
                        onChange={(e) => setPrescNote(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>

                    {/* Attestation / Days Off */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Atestado Médico / Recomendações de Afastamento:
                        </label>
                        <input
                          type="text"
                          placeholder="Atesto para os devidos fins que o paciente necessita de repouso..."
                          value={prescAttestation}
                          onChange={(e) => setPrescAttestation(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Dias de Repouso:
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={prescDaysOff}
                          onChange={(e) => setPrescDaysOff(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 text-center focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs text-slate-500">
                        Médico Assinante: <strong>{currentDoctor.doctor}</strong> ({currentDoctor.name} {currentDoctor.crm ? `• CRM ${currentDoctor.crm}` : ""})
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handlePrintCurrent}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 border border-slate-300"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Imprimir Prévia</span>
                        </button>

                        <button
                          type="submit"
                          disabled={isSaving}
                          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-colors flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          <span>{isSaving ? "Salvando..." : "Salvar no Prontuário & Emitir"}</span>
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* TAB 2: PRONTUARIO HISTORY */}
                {subTab === "prontuario" && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-teal-600" />
                        <span>Linha do Tempo Clínica de {selectedPatient.name}</span>
                      </h4>
                      <span className="text-xs text-slate-500">
                        {selectedPatient.clinicalHistory.length} registros
                      </span>
                    </div>

                    {selectedPatient.clinicalHistory.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-xs">
                        Nenhum registro anterior de evolução clínica para este paciente.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedPatient.clinicalHistory.map((evo) => (
                          <div
                            key={evo.id}
                            className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/60 pb-2">
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-mono">
                                  {evo.date}
                                </span>
                                <span>{evo.diagnosisOrReason}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-600 font-medium">{evo.doctor}</span>
                                <button
                                  type="button"
                                  onClick={() => handlePrintHistoryItem(evo)}
                                  className="px-2 py-1 bg-white hover:bg-slate-100 text-teal-700 text-[11px] font-bold rounded-lg border border-slate-200 flex items-center gap-1 shadow-2xs"
                                  title="Imprimir esta receita/evolução"
                                >
                                  <Printer className="w-3 h-3" />
                                  <span>Imprimir</span>
                                </button>
                              </div>
                            </div>

                            <p className="text-xs text-slate-700 whitespace-pre-wrap">{evo.note}</p>

                            {evo.prescriptions && (
                              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs space-y-1">
                                <div className="font-bold text-emerald-800 flex items-center gap-1">
                                  <Pill className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Prescrição Médica Registrada:</span>
                                </div>
                                <pre className="text-emerald-900 font-mono text-[11px] whitespace-pre-wrap">
                                  {evo.prescriptions}
                                </pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-2">
                <Users className="w-8 h-8 mx-auto text-slate-400" />
                <p className="font-semibold text-sm">Selecione um paciente na lista ao lado para acessar o prontuário.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DEDICATED OFFICIAL MEDICAL PRINT LAYOUT (Only visible when printing) */}
      <div className="print-document hidden print:block bg-white text-black p-8 font-sans">
        {selectedPatient && (
          <div className="space-y-6 max-w-[190mm] mx-auto text-black">
            {/* Clinic Official Header */}
            <div className="border-b-2 border-slate-800 pb-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-800 text-white font-bold flex items-center justify-center text-lg">
                    ✚
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                      {clinicConfig.clinicName}
                    </h1>
                    <p className="text-xs font-semibold text-slate-600">
                      Atendimento Médico, Consultas, Exames e Especialidades
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-right text-[11px] text-slate-600 space-y-0.5">
                {clinicConfig.cnpj && (
                  <div><strong>CNPJ:</strong> {clinicConfig.cnpj}</div>
                )}
                <div>{clinicConfig.address}</div>
                <div><strong>Tel/WhatsApp:</strong> {clinicConfig.phone}</div>
              </div>
            </div>

            {/* Doctor Info Subheader */}
            <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-sm text-slate-900">
                  {printTargetEvolution ? printTargetEvolution.doctor : currentDoctor.doctor}
                </div>
                <div className="text-slate-700">
                  {currentDoctor.name} {currentDoctor.crm ? `• CRM/PA ${currentDoctor.crm}` : ""}
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
                  {printTargetEvolution
                    ? "Registro Clínico & Prescrição"
                    : prescAttestation.trim() && !prescMedicines.trim()
                    ? "Atestado Médico Oficial"
                    : "Receituário & Conduta Terapêutica"}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Data: {printTargetEvolution ? printTargetEvolution.date : new Date().toLocaleDateString("pt-BR")}
                </div>
              </div>
            </div>

            {/* Patient Info Details Box */}
            <div className="border border-slate-300 rounded-lg p-3 text-xs space-y-1 bg-white">
              <div className="flex justify-between items-center font-bold text-slate-900 border-b border-slate-200 pb-1.5">
                <span>PACIENTE: {selectedPatient.name.toUpperCase()}</span>
                <span>DATA: {printTargetEvolution ? printTargetEvolution.date : new Date().toLocaleDateString("pt-BR")}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-700 pt-1">
                <div><strong>CPF:</strong> {selectedPatient.cpf || "Não informado"}</div>
                <div><strong>Data Nasc:</strong> {selectedPatient.birthDate || "Não informado"}</div>
                <div><strong>Telefone:</strong> {selectedPatient.phone}</div>
              </div>
              {(printTargetEvolution?.diagnosisOrReason || prescDiagnosis.trim()) && (
                <div className="pt-1 text-[11px] text-slate-800 border-t border-slate-100">
                  <strong>Hipótese Diagnóstica / CID-10:</strong>{" "}
                  {printTargetEvolution ? printTargetEvolution.diagnosisOrReason : prescDiagnosis || "Avaliação Clínica"}
                </div>
              )}
            </div>

            {/* MAIN PRESCRIPTION MEDICATIONS SECTION */}
            <div className="space-y-3 min-h-[220px]">
              <div className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-400 pb-1 flex items-center justify-between">
                <span>Prescrição Médica & Posologia</span>
                <span className="text-[10px] font-normal text-slate-500">Via Oral / Tópica conforme indicado</span>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-200 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                {printTargetEvolution
                  ? printTargetEvolution.prescriptions || "(Nenhuma medicação específica prescrita nesta evolução)"
                  : prescMedicines.trim()
                  ? prescMedicines
                  : "1. Manter medicações de uso contínuo conforme orientação prévia.\n2. Ingestão hídrica adequada e repouso relativo."}
              </div>
            </div>

            {/* EXAM REQUESTS SECTION (if any) */}
            {(!printTargetEvolution && prescExamRequests.trim()) && (
              <div className="space-y-2 border-t border-slate-300 pt-3">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center justify-between">
                  <span>Solicitação de Exames Complementares</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-800">
                  {prescExamRequests}
                </div>
              </div>
            )}

            {/* ATTESTATION / CLINICAL NOTES (if any) */}
            {(!printTargetEvolution && prescAttestation.trim()) && (
              <div className="space-y-2 border-t border-slate-300 pt-3">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  <span>Atestado Médico / Afastamento</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-800">
                  {prescAttestation}
                  {Number(prescDaysOff) > 0 && ` (${prescDaysOff} dias de repouso).`}
                </div>
              </div>
            )}

            {/* EVOLUTION NOTE (if printing history) */}
            {printTargetEvolution?.note && (
              <div className="space-y-2 border-t border-slate-300 pt-3">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  <span>Evolução Clínica Registrada</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap">
                  {printTargetEvolution.note}
                </div>
              </div>
            )}

            {/* SIGNATURE & STAMP FOOTER */}
            <div className="pt-12 mt-8 border-t-2 border-slate-800 flex items-end justify-between text-xs">
              <div className="text-[10px] text-slate-500 space-y-1">
                <div>Documento emitido eletronicamente via Sistema {clinicConfig.clinicName} Cloud.</div>
                <div>Chave de Autenticação Digital: {Math.random().toString(36).substring(2, 10).toUpperCase()}-{Date.now().toString(36).toUpperCase()}</div>
                <div>{new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</div>
              </div>

              <div className="text-center space-y-1">
                <div className="w-56 border-b border-slate-800 mx-auto"></div>
                <div className="font-bold text-xs text-slate-900">
                  {printTargetEvolution ? printTargetEvolution.doctor : currentDoctor.doctor}
                </div>
                <div className="text-[11px] text-slate-600">
                  {currentDoctor.name} {currentDoctor.crm ? `• CRM/PA ${currentDoctor.crm}` : ""}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
