import React, { useState, useMemo } from "react";
import {
  Users,
  Search,
  Plus,
  FileText,
  Calendar,
  Phone,
  Mail,
  AlertCircle,
  Clock,
  UserCheck,
  Stethoscope,
  Heart,
  Pill,
  Edit2,
  Trash2,
  CheckCircle2,
  MessageCircle,
  ChevronRight,
  Sparkles,
  Printer,
  Save,
  Check,
} from "lucide-react";
import { PatientRecord, ClinicalEvolution, Appointment, QuoteResult } from "../types";

interface PatientManagerProps {
  patients: PatientRecord[];
  appointments: Appointment[];
  quotes: QuoteResult[];
  onSavePatients: (patients: PatientRecord[]) => void;
  onAddEvolution: (patientId: string, evolution: Omit<ClinicalEvolution, "id">) => void;
  onUpdateEvolution?: (patientId: string, evolutionId: string, evolution: Partial<ClinicalEvolution>) => void;
  onDeleteEvolution?: (patientId: string, evolutionId: string) => void;
  onUpdatePatientNotes?: (patientId: string, generalNotes: string, allergies?: string[], chronicConditions?: string[]) => void;
  onNavigateToSchedule?: (patientName: string, patientPhone: string) => void;
  onNavigateToQuote?: (patientName: string) => void;
  onBookForPatient?: (patient: PatientRecord) => void;
  onQuoteForPatient?: (patient: PatientRecord) => void;
}

export const PatientManager: React.FC<PatientManagerProps> = ({
  patients,
  appointments,
  quotes,
  onSavePatients,
  onAddEvolution,
  onUpdateEvolution,
  onDeleteEvolution,
  onUpdatePatientNotes,
  onNavigateToSchedule,
  onNavigateToQuote,
  onBookForPatient,
  onQuoteForPatient,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || "");
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [isAddingEvolution, setIsAddingEvolution] = useState(false);
  const [editingEvolution, setEditingEvolution] = useState<ClinicalEvolution | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick inline notes editing state
  const [inlineNotes, setInlineNotes] = useState<string>("");
  const [isSavingInlineNotes, setIsSavingInlineNotes] = useState(false);

  // Form states for Patient
  const [patientForm, setPatientForm] = useState<Partial<PatientRecord>>({
    name: "",
    phone: "55",
    cpf: "",
    birthDate: "",
    email: "",
    gender: "Feminino",
    bloodType: "O+",
    allergies: [],
    chronicConditions: [],
    generalNotes: "",
  });

  const [allergyInput, setAllergyInput] = useState("");
  const [chronicInput, setChronicInput] = useState("");

  // Form states for Clinical Evolution
  const [evolutionForm, setEvolutionForm] = useState({
    doctor: "Dr. Roberto Martins (Clínico Geral)",
    diagnosisOrReason: "",
    note: "",
    prescriptions: "",
    date: new Date().toISOString().split("T")[0],
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Filtered patients
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const term = searchTerm.toLowerCase();
      return (
        p.name.toLowerCase().includes(term) ||
        p.phone.includes(term) ||
        (p.cpf && p.cpf.includes(term)) ||
        (p.email && p.email.toLowerCase().includes(term))
      );
    });
  }, [patients, searchTerm]);

  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || patients[0];
  }, [patients, selectedPatientId]);

  // Sync inline notes when selected patient changes
  React.useEffect(() => {
    if (selectedPatient) {
      setInlineNotes(selectedPatient.generalNotes || "");
    }
  }, [selectedPatient?.id, selectedPatient?.generalNotes]);

  // Appointments for selected patient
  const patientAppointments = useMemo(() => {
    if (!selectedPatient) return [];
    return appointments.filter(
      (a) =>
        a.patientName.toLowerCase() === selectedPatient.name.toLowerCase() ||
        a.patientPhone.replace(/\D/g, "") === selectedPatient.phone.replace(/\D/g, "")
    );
  }, [appointments, selectedPatient]);

  // Open Edit modal
  const handleOpenEdit = (patient: PatientRecord) => {
    setPatientForm({
      ...patient,
      allergies: [...(patient.allergies || [])],
      chronicConditions: [...(patient.chronicConditions || [])],
    });
    setAllergyInput("");
    setChronicInput("");
    setIsEditingPatient(true);
  };

  // Open Add modal
  const handleOpenAdd = () => {
    setPatientForm({
      id: `pat-${Date.now()}`,
      name: "",
      phone: "55919",
      cpf: "",
      birthDate: "1990-01-01",
      email: "",
      gender: "Feminino",
      bloodType: "A+",
      allergies: [],
      chronicConditions: [],
      generalNotes: "",
      totalAppointments: 0,
      totalSpent: 0,
      clinicalHistory: [],
    });
    setAllergyInput("");
    setChronicInput("");
    setIsAddingPatient(true);
  };

  // Save new or edited patient
  const handleSavePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientForm.name || !patientForm.phone) return;

    if (isAddingPatient) {
      const newPatient: PatientRecord = {
        id: `pat-${Date.now()}`,
        name: patientForm.name,
        phone: patientForm.phone.replace(/\D/g, ""),
        cpf: patientForm.cpf || "",
        birthDate: patientForm.birthDate || "",
        email: patientForm.email || "",
        gender: (patientForm.gender as any) || "Outro",
        bloodType: patientForm.bloodType || "O+",
        allergies: patientForm.allergies || [],
        chronicConditions: patientForm.chronicConditions || [],
        generalNotes: patientForm.generalNotes || "",
        totalAppointments: 0,
        totalSpent: 0,
        clinicalHistory: [],
      };
      const updated = [newPatient, ...patients];
      onSavePatients(updated);
      setSelectedPatientId(newPatient.id);
      setIsAddingPatient(false);
      showToast(`Paciente ${newPatient.name} cadastrado com sucesso!`);
    } else if (isEditingPatient && patientForm.id) {
      const updated = patients.map((p) =>
        p.id === patientForm.id ? ({ ...p, ...patientForm } as PatientRecord) : p
      );
      onSavePatients(updated);
      setIsEditingPatient(false);
      showToast(`Ficha e prontuário de ${patientForm.name} atualizados com sucesso!`);
    }
  };

  // Delete patient
  const handleDeletePatient = (patientId: string) => {
    if (confirm("Tem certeza que deseja excluir esta ficha de paciente e seu histórico?")) {
      const updated = patients.filter((p) => p.id !== patientId);
      onSavePatients(updated);
      if (updated.length > 0) {
        setSelectedPatientId(updated[0].id);
      }
      showToast("Ficha do paciente excluída.");
    }
  };

  // Save quick inline notes
  const handleSaveInlineNotes = () => {
    if (!selectedPatient) return;
    setIsSavingInlineNotes(true);
    if (onUpdatePatientNotes) {
      onUpdatePatientNotes(selectedPatient.id, inlineNotes, selectedPatient.allergies, selectedPatient.chronicConditions);
    } else {
      const updated = patients.map((p) =>
        p.id === selectedPatient.id ? { ...p, generalNotes: inlineNotes } : p
      );
      onSavePatients(updated);
    }
    setTimeout(() => {
      setIsSavingInlineNotes(false);
      showToast("Anotações gerais do prontuário salvas!");
    }, 300);
  };

  // Add clinical evolution
  const handleSaveNewEvolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !evolutionForm.diagnosisOrReason) return;

    onAddEvolution(selectedPatient.id, {
      date: evolutionForm.date,
      doctor: evolutionForm.doctor,
      diagnosisOrReason: evolutionForm.diagnosisOrReason,
      note: evolutionForm.note,
      prescriptions: evolutionForm.prescriptions,
    });

    setEvolutionForm({
      doctor: "Dr. Roberto Martins (Clínico Geral)",
      diagnosisOrReason: "",
      note: "",
      prescriptions: "",
      date: new Date().toISOString().split("T")[0],
    });
    setIsAddingEvolution(false);
    showToast("Evolução médica registrada no prontuário!");
  };

  // Open Edit evolution modal
  const handleOpenEditEvolution = (ev: ClinicalEvolution) => {
    setEditingEvolution(ev);
  };

  // Save edited evolution
  const handleSaveEditedEvolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !editingEvolution) return;

    if (onUpdateEvolution) {
      onUpdateEvolution(selectedPatient.id, editingEvolution.id, {
        date: editingEvolution.date,
        doctor: editingEvolution.doctor,
        diagnosisOrReason: editingEvolution.diagnosisOrReason,
        note: editingEvolution.note,
        prescriptions: editingEvolution.prescriptions,
      });
    } else {
      const updatedHistory = (selectedPatient.clinicalHistory || []).map((ev) =>
        ev.id === editingEvolution.id ? editingEvolution : ev
      );
      const updatedPatients = patients.map((p) =>
        p.id === selectedPatient.id ? { ...p, clinicalHistory: updatedHistory } : p
      );
      onSavePatients(updatedPatients);
    }

    setEditingEvolution(null);
    showToast("Evolução médica alterada com sucesso!");
  };

  // Delete evolution
  const handleDeleteEvolution = (evolutionId: string) => {
    if (!selectedPatient) return;
    if (confirm("Tem certeza que deseja excluir esta anotação de evolução médica?")) {
      if (onDeleteEvolution) {
        onDeleteEvolution(selectedPatient.id, evolutionId);
      } else {
        const updatedHistory = (selectedPatient.clinicalHistory || []).filter((e) => e.id !== evolutionId);
        const updatedPatients = patients.map((p) =>
          p.id === selectedPatient.id ? { ...p, clinicalHistory: updatedHistory } : p
        );
        onSavePatients(updatedPatients);
      }
      showToast("Evolução clínica removida.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Toast Alert Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white border border-emerald-500/50 shadow-2xl animate-fade-in text-xs sm:text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 border border-slate-700/60 shadow-lg text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Prontuário & Gestão de Pacientes</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Edição completa do prontuário, anotações clínicas, evoluções médicas, histórico e integração com agendamentos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-add-patient"
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Paciente</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left List (1/3) + Right Details (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Patient List */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col h-[780px]">
          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="input-search-patient"
              type="text"
              placeholder="Buscar por nome, CPF ou WhatsApp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between px-1 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Pacientes Cadastrados ({filteredPatients.length})</span>
          </div>

          {/* Patient Cards List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredPatients.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Nenhum paciente encontrado com o termo "{searchTerm}".
              </div>
            ) : (
              filteredPatients.map((patient) => {
                const isSelected = selectedPatient?.id === patient.id;
                return (
                  <button
                    key={patient.id}
                    onClick={() => setSelectedPatientId(patient.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group ${
                      isSelected
                        ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 shadow-xs"
                        : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          {patient.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {patient.name}
                          </p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {patient.phone}
                          </p>
                        </div>
                      </div>

                      {patient.allergies && patient.allergies.length > 0 && patient.allergies[0] !== "Nenhum registro" && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                          <AlertCircle className="w-2.5 h-2.5" />
                          Alérgica: {patient.allergies.join(", ")}
                        </span>
                      )}
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        isSelected ? "text-emerald-600 translate-x-0.5" : "text-slate-300 group-hover:text-slate-400"
                      }`}
                    />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Patient Profile & Medical Record */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col h-[780px] overflow-y-auto">
          {selectedPatient ? (
            <div className="space-y-6">
              {/* Profile Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center text-xl font-bold shadow-md">
                    {selectedPatient.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                        {selectedPatient.name}
                      </h3>
                      {selectedPatient.bloodType && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          {selectedPatient.bloodType}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-1">
                      <span>CPF: {selectedPatient.cpf || "Não informado"}</span>
                      <span>•</span>
                      <span>Nascimento: {selectedPatient.birthDate || "Não informado"}</span>
                      <span>•</span>
                      <span>Gênero: {selectedPatient.gender || "Não informado"}</span>
                    </p>
                  </div>
                </div>

                {/* Top Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    id="btn-edit-patient-main"
                    onClick={() => handleOpenEdit(selectedPatient)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold hover:bg-indigo-100 transition-colors shadow-2xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar Ficha Completa</span>
                  </button>

                  <button
                    onClick={() => setIsPrinting(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-200 transition-colors"
                    title="Imprimir prontuário médico"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir</span>
                  </button>

                  <a
                    href={`https://wa.me/${selectedPatient.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    onClick={() => handleDeletePatient(selectedPatient.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Excluir paciente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Medical Tags & Alerts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Alergias Registradas
                    </span>
                    <button
                      onClick={() => handleOpenEdit(selectedPatient)}
                      className="text-[10px] text-amber-700 underline hover:text-amber-900"
                    >
                      Editar
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {selectedPatient.allergies && selectedPatient.allergies.length > 0
                      ? selectedPatient.allergies.join(", ")
                      : "Nenhuma alergia relatada."}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50">
                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-800 dark:text-indigo-300 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5" />
                      Condições Crônicas
                    </span>
                    <button
                      onClick={() => handleOpenEdit(selectedPatient)}
                      className="text-[10px] text-indigo-700 underline hover:text-indigo-900"
                    >
                      Editar
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {selectedPatient.chronicConditions && selectedPatient.chronicConditions.length > 0
                      ? selectedPatient.chronicConditions.join(", ")
                      : "Sem doenças crônicas ativas."}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Resumo Clínico</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    <strong>{selectedPatient.totalAppointments || patientAppointments.length}</strong> atendimentos • Última em{" "}
                    <strong>{selectedPatient.lastVisit || "N/A"}</strong>
                  </p>
                </div>
              </div>

              {/* Quick Inline Observações Gerais do Prontuário */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <span>Observações Gerais & Histórico Clínico do Paciente</span>
                  </label>
                  <button
                    onClick={handleSaveInlineNotes}
                    disabled={isSavingInlineNotes}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-2xs transition-all active:scale-95"
                  >
                    <Save className="w-3 h-3" />
                    <span>{isSavingInlineNotes ? "Salvando..." : "Salvar Anotação"}</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={inlineNotes}
                  onChange={(e) => setInlineNotes(e.target.value)}
                  placeholder="Anotações permanentes, convênio, recomendações de conduta, preferências de horário..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Action shortcuts */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {onNavigateToSchedule && (
                  <button
                    onClick={() => onNavigateToSchedule(selectedPatient.name, selectedPatient.phone)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Agendar Consulta</span>
                  </button>
                )}

                {onNavigateToQuote && (
                  <button
                    onClick={() => onNavigateToQuote(selectedPatient.name)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Orçamento / Exames</span>
                  </button>
                )}

                <button
                  id="btn-new-evolution"
                  onClick={() => setIsAddingEvolution(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors ml-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nova Evolução Médica</span>
                </button>
              </div>

              {/* Section: Clinical Evolution & Medical History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-emerald-500" />
                    <span>Evoluções Médicas & Prescrições ({selectedPatient.clinicalHistory?.length || 0})</span>
                  </h4>
                  <button
                    onClick={() => setIsAddingEvolution(true)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Adicionar Evolução
                  </button>
                </div>

                {selectedPatient.clinicalHistory && selectedPatient.clinicalHistory.length > 0 ? (
                  <div className="space-y-3">
                    {selectedPatient.clinicalHistory.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2 group transition-all hover:border-slate-300 dark:hover:border-slate-700"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            {ev.diagnosisOrReason}
                          </span>

                          <div className="flex items-center gap-3">
                            <span className="text-slate-500 font-medium">
                              {ev.date} • {ev.doctor}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditEvolution(ev)}
                                className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                                title="Editar esta evolução médica"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteEvolution(ev.id)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="Excluir esta anotação"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                          {ev.note}
                        </p>

                        {ev.prescriptions && (
                          <div className="mt-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-1">
                              <Pill className="w-3.5 h-3.5" />
                              Prescrição & Orientações:
                            </span>
                            <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line">{ev.prescriptions}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500 space-y-2">
                    <p>Nenhuma evolução clínica registrada ainda.</p>
                    <button
                      onClick={() => setIsAddingEvolution(true)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Registrar Primeira Evolução
                    </button>
                  </div>
                )}
              </div>

              {/* Section: Appointment History */}
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <span>Histórico de Agendamentos na Clínica</span>
                </h4>

                {patientAppointments.length > 0 ? (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                        <tr>
                          <th className="p-2.5">Data & Hora</th>
                          <th className="p-2.5">Especialidade / Serviço</th>
                          <th className="p-2.5">Profissional</th>
                          <th className="p-2.5">Valor</th>
                          <th className="p-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {patientAppointments.map((apt) => (
                          <tr key={apt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 font-medium">{apt.date} às {apt.time}</td>
                            <td className="p-2.5">{apt.serviceName}</td>
                            <td className="p-2.5 text-slate-500">{apt.doctor}</td>
                            <td className="p-2.5 font-semibold text-emerald-600">R$ {apt.price}</td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  apt.status === "confirmed_paid"
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                    : apt.status === "pending_payment"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                    : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                }`}
                              >
                                {apt.status === "confirmed_paid"
                                  ? "Confirmado / Pago"
                                  : apt.status === "pending_payment"
                                  ? "Aguardando Pix"
                                  : "Cancelado"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Nenhum agendamento gravado nesta sessão para este paciente.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="m-auto text-center space-y-2 text-slate-400">
              <Users className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm">Selecione um paciente na lista para visualizar o prontuário.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add or Edit Patient */}
      {(isAddingPatient || isEditingPatient) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isAddingPatient ? "Cadastrar Novo Paciente" : "Editar Ficha de Paciente & Prontuário"}
              </h3>
              <button
                onClick={() => {
                  setIsAddingPatient(false);
                  setIsEditingPatient(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePatient} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={patientForm.name || ""}
                  onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                  placeholder="Ex: Maria dos Santos"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp / Telefone *
                  </label>
                  <input
                    type="text"
                    required
                    value={patientForm.phone || ""}
                    onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                    placeholder="Ex: 5591988390894"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={patientForm.cpf || ""}
                    onChange={(e) => setPatientForm({ ...patientForm, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={patientForm.birthDate || ""}
                    onChange={(e) => setPatientForm({ ...patientForm, birthDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gênero
                  </label>
                  <select
                    value={patientForm.gender || "Feminino"}
                    onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo Sanguíneo
                  </label>
                  <select
                    value={patientForm.bloodType || "O+"}
                    onChange={(e) => setPatientForm({ ...patientForm, bloodType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={patientForm.email || ""}
                  onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                  placeholder="paciente@exemplo.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Allergies tag input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alergias Medicamentosas / Alimentares
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={allergyInput}
                    onChange={(e) => setAllergyInput(e.target.value)}
                    placeholder="Ex: Dipirona, Penicilina, Iodo..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && allergyInput.trim()) {
                        e.preventDefault();
                        setPatientForm({
                          ...patientForm,
                          allergies: [...(patientForm.allergies || []), allergyInput.trim()],
                        });
                        setAllergyInput("");
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (allergyInput.trim()) {
                        setPatientForm({
                          ...patientForm,
                          allergies: [...(patientForm.allergies || []), allergyInput.trim()],
                        });
                        setAllergyInput("");
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold"
                  >
                    Adicionar
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {patientForm.allergies?.map((al, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1"
                    >
                      {al}
                      <button
                        type="button"
                        onClick={() =>
                          setPatientForm({
                            ...patientForm,
                            allergies: patientForm.allergies?.filter((_, i) => i !== idx),
                          })
                        }
                        className="hover:text-rose-900"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Chronic conditions input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Condições Crônicas / Comorbidades
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chronicInput}
                    onChange={(e) => setChronicInput(e.target.value)}
                    placeholder="Ex: Hipertensão, Diabetes Tipo 2..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && chronicInput.trim()) {
                        e.preventDefault();
                        setPatientForm({
                          ...patientForm,
                          chronicConditions: [...(patientForm.chronicConditions || []), chronicInput.trim()],
                        });
                        setChronicInput("");
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (chronicInput.trim()) {
                        setPatientForm({
                          ...patientForm,
                          chronicConditions: [...(patientForm.chronicConditions || []), chronicInput.trim()],
                        });
                        setChronicInput("");
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold"
                  >
                    Adicionar
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {patientForm.chronicConditions?.map((ch, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs flex items-center gap-1"
                    >
                      {ch}
                      <button
                        type="button"
                        onClick={() =>
                          setPatientForm({
                            ...patientForm,
                            chronicConditions: patientForm.chronicConditions?.filter((_, i) => i !== idx),
                          })
                        }
                        className="hover:text-indigo-900"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* General notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observações Gerais do Prontuário
                </label>
                <textarea
                  rows={2}
                  value={patientForm.generalNotes || ""}
                  onChange={(e) => setPatientForm({ ...patientForm, generalNotes: e.target.value })}
                  placeholder="Informações de convênio, preferências de horário, observações clínicas..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingPatient(false);
                    setIsEditingPatient(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md"
                >
                  Salvar Ficha do Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Clinical Evolution */}
      {isAddingEvolution && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Registrar Nova Evolução Médica ({selectedPatient.name})
                </h3>
              </div>
              <button onClick={() => setIsAddingEvolution(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewEvolution} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data do Atendimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={evolutionForm.date}
                    onChange={(e) => setEvolutionForm({ ...evolutionForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Médico / Profissional *
                  </label>
                  <input
                    type="text"
                    required
                    value={evolutionForm.doctor}
                    onChange={(e) => setEvolutionForm({ ...evolutionForm, doctor: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo / Hipótese Diagnóstica *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Avaliação de cefaleia recorrente, controle de hipertensão..."
                  value={evolutionForm.diagnosisOrReason}
                  onChange={(e) => setEvolutionForm({ ...evolutionForm, diagnosisOrReason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Anotações da Consulta / Anamnese & Exame Físico *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Sinais vitais (PA, FC, Temp), anamnese, conduta adotada e orientações clínicas..."
                  value={evolutionForm.note}
                  onChange={(e) => setEvolutionForm({ ...evolutionForm, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Prescrições & Exames Solicitados
                </label>
                <textarea
                  rows={2}
                  placeholder="Medicamentos receitados, posologia e exames laboratoriais requeridos..."
                  value={evolutionForm.prescriptions}
                  onChange={(e) => setEvolutionForm({ ...evolutionForm, prescriptions: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingEvolution(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md"
                >
                  Registrar no Prontuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Existing Clinical Evolution */}
      {editingEvolution && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Editar Evolução Médica ({selectedPatient.name})
                </h3>
              </div>
              <button onClick={() => setEditingEvolution(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedEvolution} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data do Atendimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={editingEvolution.date}
                    onChange={(e) =>
                      setEditingEvolution({ ...editingEvolution, date: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Médico / Profissional *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingEvolution.doctor}
                    onChange={(e) =>
                      setEditingEvolution({ ...editingEvolution, doctor: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo / Hipótese Diagnóstica *
                </label>
                <input
                  type="text"
                  required
                  value={editingEvolution.diagnosisOrReason}
                  onChange={(e) =>
                    setEditingEvolution({
                      ...editingEvolution,
                      diagnosisOrReason: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Anotações da Consulta / Anamnese & Exame Físico *
                </label>
                <textarea
                  rows={4}
                  required
                  value={editingEvolution.note}
                  onChange={(e) =>
                    setEditingEvolution({ ...editingEvolution, note: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Prescrições & Exames Solicitados
                </label>
                <textarea
                  rows={2}
                  value={editingEvolution.prescriptions || ""}
                  onChange={(e) =>
                    setEditingEvolution({
                      ...editingEvolution,
                      prescriptions: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEvolution(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Printable Medical Record View */}
      {isPrinting && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs print:p-0 print:static print:bg-white print:z-auto">
          <div className="print-document bg-white text-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl p-8 space-y-6 max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-0">
            <div className="flex items-center justify-between pb-4 border-b border-slate-300 print:hidden">
              <h3 className="text-lg font-bold">Visualização do Prontuário Médico para Impressão</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir / Salvar PDF
                </button>
                <button
                  onClick={() => setIsPrinting(false)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold"
                >
                  Fechar
                </button>
              </div>
            </div>

            {/* Formatted Medical Document */}
            <div className="space-y-6 text-sm">
              <div className="text-center pb-4 border-b-2 border-slate-800">
                <h2 className="text-xl font-bold uppercase tracking-wide">Clínica Médica Santa Clara</h2>
                <p className="text-xs text-slate-600">Prontuário Médico e Histórico de Atendimentos • CNPJ: 14.285.901/0001-44</p>
                <p className="text-[11px] text-slate-500">Av. Nazaré, 450 - Belém/PA • Tel/WhatsApp: (91) 98839-0894</p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <p><strong>Paciente:</strong> {selectedPatient.name}</p>
                  <p><strong>CPF:</strong> {selectedPatient.cpf || "N/A"}</p>
                  <p><strong>Nascimento:</strong> {selectedPatient.birthDate || "N/A"}</p>
                </div>
                <div>
                  <p><strong>WhatsApp:</strong> {selectedPatient.phone}</p>
                  <p><strong>Tipo Sanguíneo:</strong> {selectedPatient.bloodType || "N/A"}</p>
                  <p><strong>Gênero:</strong> {selectedPatient.gender || "N/A"}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <p><strong>Alergias:</strong> {selectedPatient.allergies?.join(", ") || "Nenhuma relatada"}</p>
                <p><strong>Condições Crônicas:</strong> {selectedPatient.chronicConditions?.join(", ") || "Nenhuma relatada"}</p>
                {selectedPatient.generalNotes && (
                  <p><strong>Observações Clínicas:</strong> {selectedPatient.generalNotes}</p>
                )}
              </div>

              <div className="space-y-4 pt-2">
                <h4 className="font-bold border-b border-slate-200 pb-1 uppercase tracking-wide text-xs">
                  Histórico de Evoluções e Prescrições
                </h4>
                {selectedPatient.clinicalHistory && selectedPatient.clinicalHistory.length > 0 ? (
                  selectedPatient.clinicalHistory.map((ev, i) => (
                    <div key={i} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5 text-xs">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>{ev.diagnosisOrReason}</span>
                        <span>{ev.date} — {ev.doctor}</span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-line">{ev.note}</p>
                      {ev.prescriptions && (
                        <div className="mt-2 p-2 rounded bg-white border border-slate-200">
                          <strong>Prescrição:</strong>
                          <p className="text-slate-600 whitespace-pre-line">{ev.prescriptions}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">Sem registros clínicos prévios.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
