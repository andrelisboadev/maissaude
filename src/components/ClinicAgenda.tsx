import React, { useState } from "react";
import {
  Calendar,
  Clock,
  User,
  Phone,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Zap,
  Filter,
  Search,
  Download,
  Stethoscope,
  RefreshCw,
  Plus,
  X,
  FileText,
  Sparkles,
  Settings,
  Edit2,
  Save,
  Check,
  Sliders,
  Sun,
  Moon,
  ChevronRight,
  ShieldCheck,
  CalendarDays,
  Users,
  CreditCard,
} from "lucide-react";
import { Appointment, AvailabilitySlot, ServiceItem, ClinicConfig } from "../types";
import confetti from "canvas-confetti";
import { soundEffects } from "../utils/audioEffects";

interface ClinicAgendaProps {
  appointments: Appointment[];
  slots: AvailabilitySlot[];
  services: ServiceItem[];
  clinicConfig: ClinicConfig;
  onSimulatePayment: (id: string) => Promise<void>;
  onManualAction: (id: string, action: "confirm_paid" | "confirm_cash" | "cancel" | "mark_arrived" | "mark_finished") => Promise<void>;
  onCreateManualAppointment: (data: {
    patientName: string;
    patientPhone: string;
    serviceId: string;
    date: string;
    time: string;
    price?: number;
    status: "confirmed_paid" | "pending_payment";
    notes?: string;
  }) => Promise<void>;
  onRefresh: () => void;
  onSaveServices?: (updatedServices: ServiceItem[]) => Promise<void>;
}

const ALL_WEEKDAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export const ClinicAgenda: React.FC<ClinicAgendaProps> = ({
  appointments,
  slots,
  services,
  clinicConfig,
  onSimulatePayment,
  onManualAction,
  onCreateManualAppointment,
  onRefresh,
  onSaveServices,
}) => {
  // Navigation / View Tabs
  const [activeTab, setActiveTab] = useState<"appointments" | "doctor_schedules" | "slot_grid">("appointments");

  // Filter States for Appointments Tab
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Modal State for Manual Appointment
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || "");
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [appointmentTime, setAppointmentTime] = useState("09:15");
  const [customPrice, setCustomPrice] = useState<string>("");
  const [appointmentStatus, setAppointmentStatus] = useState<"confirmed_paid" | "pending_payment">("confirmed_paid");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "balcao_dinheiro" | "balcao_cartao" | "balcao_outros">("balcao_cartao");
  const [appointmentNotes, setAppointmentNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Doctor Schedule Edit Modal & In-Line Edit State
  const [editingDoctorService, setEditingDoctorService] = useState<ServiceItem | null>(null);
  const [editWorkStart, setEditWorkStart] = useState("08:00");
  const [editWorkEnd, setEditWorkEnd] = useState("18:00");
  const [editDuration, setEditDuration] = useState(30);
  const [editDays, setEditDays] = useState<string[]>(["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]);
  const [editPrice, setEditPrice] = useState("200");
  const [editCrm, setEditCrm] = useState("");
  const [isSavingDoctor, setIsSavingDoctor] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Selected Service Details
  const currentSelectedService = services.find((s) => s.id === selectedServiceId) || services[0];

  // Available free slots for selected service & date
  const availableSlotsForDate = slots.filter(
    (s) => s.serviceId === selectedServiceId && s.date === appointmentDate && !s.isBooked
  );

  // Filtered Appointments
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patientPhone.includes(searchTerm) ||
      apt.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.doctor.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    const matchesDoctor = selectedDoctor === "all" || apt.doctor === selectedDoctor;
    const matchesDate = !selectedDate || apt.date === selectedDate;

    return matchesSearch && matchesStatus && matchesDoctor && matchesDate;
  });

  // Calculate Metrics
  const totalAppointments = appointments.length;
  const pendingAppointments = appointments.filter((a) => a.status === "pending_payment");
  const confirmedAppointments = appointments.filter((a) => a.status === "confirmed_paid");
  const cancelledAppointments = appointments.filter((a) => a.status === "cancelled");

  const totalRevenueConfirmed = confirmedAppointments.reduce((acc, a) => acc + (a.price || 0), 0);
  const totalRevenuePending = pendingAppointments.reduce((acc, a) => acc + (a.price || 0), 0);

  // Unique Doctors list
  const uniqueDoctors = Array.from(new Set(services.map((s) => s.doctor).filter(Boolean)));

  const handleApprovePix = async (id: string) => {
    await onSimulatePayment(id);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  const handleOpenModal = () => {
    if (services.length > 0) {
      setSelectedServiceId(services[0].id);
      setCustomPrice(services[0].price.toString());
    }
    setIsModalOpen(true);
  };

  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const srv = services.find((s) => s.id === serviceId);
    if (srv) {
      setCustomPrice(srv.price.toString());
    }
  };

  const handleCreateAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim() || !appointmentDate || !appointmentTime) {
      alert("Por favor, preencha todos os campos obrigatórios (Nome, Telefone, Data e Horário).");
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateManualAppointment({
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        serviceId: selectedServiceId,
        date: appointmentDate,
        time: appointmentTime,
        price: customPrice ? parseFloat(customPrice) : undefined,
        status: appointmentStatus,
        notes: `${appointmentNotes.trim() ? appointmentNotes.trim() + " • " : ""}Forma de pagamento: ${paymentMethod === 'pix' ? 'Pix Automático' : paymentMethod === 'balcao_dinheiro' ? 'Balcão (Dinheiro)' : paymentMethod === 'balcao_cartao' ? 'Balcão (Cartão)' : 'Balcão (Outros)'}`,
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Reset form
      setPatientName("");
      setPatientPhone("");
      setAppointmentNotes("");
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Doctor Schedule Editor Modal
  const handleOpenEditDoctor = (srv: ServiceItem) => {
    setEditingDoctorService(srv);
    setEditWorkStart(srv.workStartHour || "08:00");
    setEditWorkEnd(srv.workEndHour || "18:00");
    setEditDuration(srv.durationMinutes || 30);
    setEditDays(srv.availableDays && srv.availableDays.length > 0 ? [...srv.availableDays] : ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]);
    setEditPrice(String(srv.price || 200));
    setEditCrm(srv.crm || "");
    soundEffects.playClick();
  };

  // Toggle Weekday in Schedule Editor
  const handleToggleDay = (day: string) => {
    setEditDays((prev) => {
      if (prev.includes(day)) {
        return prev.length > 1 ? prev.filter((d) => d !== day) : prev;
      } else {
        return [...prev, day];
      }
    });
  };

  // Apply Quick Shift Preset
  const handleApplyShiftPreset = (preset: "morning" | "afternoon" | "full" | "night") => {
    if (preset === "morning") {
      setEditWorkStart("08:00");
      setEditWorkEnd("12:00");
    } else if (preset === "afternoon") {
      setEditWorkStart("13:00");
      setEditWorkEnd("18:00");
    } else if (preset === "full") {
      setEditWorkStart("08:00");
      setEditWorkEnd("18:00");
    } else if (preset === "night") {
      setEditWorkStart("18:00");
      setEditWorkEnd("21:00");
    }
    soundEffects.playClick();
  };

  // Save Doctor Schedule Changes
  const handleSaveDoctorSchedule = async () => {
    if (!editingDoctorService) return;

    setIsSavingDoctor(true);
    try {
      const updatedServices = services.map((s) => {
        if (s.id === editingDoctorService.id) {
          return {
            ...s,
            workStartHour: editWorkStart,
            workEndHour: editWorkEnd,
            durationMinutes: editDuration,
            availableDays: editDays,
            price: Math.max(10, parseFloat(editPrice) || s.price),
            crm: editCrm.trim() || s.crm,
          };
        }
        return s;
      });

      if (onSaveServices) {
        await onSaveServices(updatedServices);
      }

      confetti({
        particleCount: 75,
        spread: 65,
        origin: { y: 0.6 },
      });
      soundEffects.playReceived();

      setSaveSuccessNotice(`Horários do ${editingDoctorService.doctor} atualizados com sucesso!`);
      setTimeout(() => setSaveSuccessNotice(null), 4000);
      setEditingDoctorService(null);
    } catch (e) {
      console.error("Erro ao salvar horário do médico:", e);
      alert("Não foi possível salvar os horários. Tente novamente.");
    } finally {
      setIsSavingDoctor(false);
    }
  };

  // Calculate live preview slots count
  const calculatePreviewSlots = (start: string, end: string, dur: number) => {
    const startM = parseInt(start.split(":")[0] || "8", 10) * 60 + parseInt(start.split(":")[1] || "0", 10);
    const endM = parseInt(end.split(":")[0] || "18", 10) * 60 + parseInt(end.split(":")[1] || "0", 10);
    let count = 0;
    for (let m = startM; m + dur <= endM; m += dur) {
      if (endM - startM >= 360 && m >= 720 && m < 780) continue;
      count++;
    }
    return Math.max(0, count);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Agenda & Escala Médica</h2>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Sincronizado em Tempo Real
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Gerencie os agendamentos de consultas, altere horários e dias de atendimento dos médicos e visualize a ocupação da clínica.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("doctor_schedules")}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "doctor_schedules"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Editar Horários dos Médicos</span>
          </button>

          <button
            onClick={handleOpenModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Agendamento</span>
          </button>

          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors border border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Save Success Notice Banner */}
      {saveSuccessNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center justify-between text-xs sm:text-sm animate-in fade-in slide-in-from-top-2 shadow-sm">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{saveSuccessNotice}</span>
          </div>
          <button
            onClick={() => setSaveSuccessNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => {
            setActiveTab("appointments");
            soundEffects.playClick();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "appointments"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Consultas & Agendamentos ({appointments.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("doctor_schedules");
            soundEffects.playClick();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "doctor_schedules"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200"
          }`}
        >
          <Clock className="w-4 h-4 text-indigo-400" />
          <span>Horários & Escala dos Médicos ({services.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("slot_grid");
            soundEffects.playClick();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "slot_grid"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Grade de Vagas Livres</span>
        </button>
      </div>

      {/* TAB 1: APPOINTMENTS & PATIENTS */}
      {activeTab === "appointments" && (
        <div className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>Total de Agendamentos</span>
                <Calendar className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{totalAppointments}</div>
              <div className="text-[11px] text-slate-500 mt-1">Registrados no sistema</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
              <div className="flex items-center justify-between text-amber-700 text-xs mb-1 font-semibold">
                <span>Pendentes de Pagamento</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-amber-900">{pendingAppointments.length}</div>
              <div className="text-[11px] text-amber-700 font-medium mt-1">
                R$ {totalRevenuePending.toFixed(2)} em pré-reservas
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs">
              <div className="flex items-center justify-between text-emerald-700 text-xs mb-1 font-semibold">
                <span>Confirmados & Pagos</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-900">{confirmedAppointments.length}</div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1">
                R$ {totalRevenueConfirmed.toFixed(2)} confirmados
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>Cancelados / Liberados</span>
                <XCircle className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold text-slate-700">{cancelledAppointments.length}</div>
              <div className="text-[11px] text-slate-500 mt-1">Horários devolvidos à grade</div>
            </div>
          </div>

          {/* Appointments Management Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Table Controls */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por paciente, código, serviço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="all">Todos os Status</option>
                  <option value="pending_payment">Pendente Pagamento</option>
                  <option value="confirmed_paid">Confirmado & Pago</option>
                  <option value="cancelled">Cancelado</option>
                </select>

                {/* Doctor Filter */}
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="all">Todos os Médicos</option>
                  {uniqueDoctors.map((doc) => (
                    <option key={doc} value={doc}>
                      {doc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">ID / Paciente</th>
                    <th className="px-4 py-3">Serviço & Especialista</th>
                    <th className="px-4 py-3">Data & Horário</th>
                    <th className="px-4 py-3">Valor</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        Nenhum agendamento encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((apt) => {
                      return (
                        <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{apt.patientName}</div>
                            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                              <span className="font-semibold text-emerald-700 bg-emerald-50 px-1 rounded">
                                {apt.id}
                              </span>
                              <span>• {apt.patientPhone}</span>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800">{apt.serviceName}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Stethoscope className="w-3 h-3 text-indigo-500" />
                              <span>{apt.doctor}</span>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-800">{apt.date}</div>
                            <div className="text-xs text-slate-500">{apt.time}</div>
                          </td>

                          <td className="px-4 py-3 font-semibold text-slate-900">
                            R$ {(apt.price || 0).toFixed(2)}
                          </td>

                          <td className="px-4 py-3">
                            {apt.status === "confirmed_paid" && (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Confirmado</span>
                                </span>
                                <div className="text-[10px] font-medium text-slate-500">
                                  {apt.notes?.toLowerCase().includes("balcão") || apt.notes?.toLowerCase().includes("balcao") || apt.paymentMethod?.startsWith("balcao")
                                    ? "💳 Pago no Balcão"
                                    : "⚡ Pix WhatsApp"}
                                </div>
                              </div>
                            )}
                            {apt.status === "pending_payment" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Pendente Pix</span>
                              </span>
                            )}
                            {apt.status === "cancelled" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Cancelado</span>
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {apt.status === "pending_payment" && (
                                <button
                                  onClick={() => handleApprovePix(apt.id)}
                                  title="Simular Webhook Mercado Pago: Pagamento Aprovado"
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 shadow-xs transition-colors"
                                >
                                  <Zap className="w-3 h-3 fill-current" />
                                  <span>Aprovar Pix</span>
                                </button>
                              )}

                              {apt.status !== "cancelled" && (
                                <button
                                  onClick={() => onManualAction(apt.id, "cancel")}
                                  title="Cancelar agendamento e liberar vaga"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DOCTOR SCHEDULES & WORKING HOURS (ESCALA DOS MÉDICOS) */}
      {activeTab === "doctor_schedules" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 rounded-3xl border border-indigo-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>Gestão de Escalas & Horários</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Horários de Atendimento dos Médicos
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                Altere os horários de início e término, dias da semana e intervalo de cada profissional.
                As vagas do <strong>WhatsApp com IA</strong> e da <strong>Recepção</strong> são recalculadas automaticamente.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-semibold">
                {services.length} Médicos Ativos
              </span>
            </div>
          </div>

          {/* Doctor Schedule Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((srv) => {
              const allowedDays = srv.availableDays || ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
              const srvSlots = slots.filter((s) => s.serviceId === srv.id);
              const freeSlots = srvSlots.filter((s) => !s.isBooked);
              const duration = srv.durationMinutes || 30;
              const slotsPerDay = calculatePreviewSlots(srv.workStartHour || "08:00", srv.workEndHour || "18:00", duration);

              return (
                <div
                  key={srv.id}
                  className="bg-white rounded-3xl border border-slate-200 hover:border-indigo-400 p-5 shadow-sm transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Doctor Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-base group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          {srv.doctor.replace("Dr. ", "").replace("Dra. ", "").charAt(0) || "M"}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{srv.doctor}</h4>
                          <div className="text-xs font-semibold text-indigo-700">{srv.name}</div>
                          <span className="text-[10px] font-mono text-slate-500">{srv.crm || "CRM Ativo"}</span>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                        R$ {(srv.price || 0).toFixed(2)}
                      </span>
                    </div>

                    {/* Schedule Details Card */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Horário de Atendimento:</span>
                        </span>
                        <strong className="text-slate-900 font-bold">
                          {srv.workStartHour || "08:00"} às {srv.workEndHour || "18:00"}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Sliders className="w-3.5 h-3.5 text-amber-600" />
                          <span>Duração / Intervalo:</span>
                        </span>
                        <span className="font-bold text-slate-800">{duration} min / paciente</span>
                      </div>

                      <div className="pt-1 border-t border-slate-200">
                        <span className="text-slate-500 text-[11px] block mb-1">Dias de Atendimento:</span>
                        <div className="flex flex-wrap gap-1">
                          {ALL_WEEKDAYS.map((day) => {
                            const isAvailable = allowedDays.includes(day);
                            return (
                              <span
                                key={day}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${
                                  isAvailable
                                    ? "bg-indigo-600 text-white"
                                    : "bg-slate-200 text-slate-400 opacity-60"
                                }`}
                              >
                                {day.slice(0, 3)}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Capacity and Slots Info */}
                    <div className="flex items-center justify-between text-[11px] text-slate-600 px-1">
                      <span>Capacidade: <strong>~{slotsPerDay} vagas/dia</strong></span>
                      <span className="text-emerald-700 font-bold">{freeSlots.length} livres na semana</span>
                    </div>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => handleOpenEditDoctor(srv)}
                    className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border border-indigo-200 hover:border-indigo-600 shadow-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar Horário & Escala</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SLOT GRID (GRADE DE VAGAS) */}
      {activeTab === "slot_grid" && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Grade & Horários por Especialista (Próximos Dias)
            </h3>
            <p className="text-xs text-slate-500">
              Grade gerada automaticamente conforme os dias e horários de atendimento configurados para cada profissional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((srv) => {
              const srvSlots = slots.filter((s) => s.serviceId === srv.id);
              const freeSlots = srvSlots.filter((s) => !s.isBooked);
              const allowedDays = srv.availableDays || ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

              return (
                <div
                  key={srv.id}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-colors flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{srv.name}</h4>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        R$ {(srv.price || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 mb-2 flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-semibold text-slate-800">{srv.doctor}</span>
                    </div>

                    {/* Doctor Schedule Days & Hours */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 mb-3 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-medium text-slate-500">Dias de Atendimento:</span>
                        <span className="font-semibold text-slate-800">
                          {allowedDays.length === 6 ? "Seg a Sáb" : allowedDays.join(", ")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-medium text-slate-500">Horário:</span>
                        <span className="font-semibold text-slate-800">
                          {srv.workStartHour || "08:00"} às {srv.workEndHour || "18:00"} ({srv.durationMinutes || 30}min/paciente)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span>
                        Vagas livres: <strong className="text-emerald-700">{freeSlots.length}</strong> / {srvSlots.length}
                      </span>
                    </div>

                    {/* Mini Slot Chips preview */}
                    <div className="flex flex-wrap gap-1">
                      {freeSlots.slice(0, 6).map((sl) => (
                        <span
                          key={sl.id}
                          className="px-2 py-0.5 bg-white border border-emerald-200 text-emerald-800 rounded-md text-[10px] font-mono"
                        >
                          {sl.date.slice(5)} {sl.time}
                        </span>
                      ))}
                      {freeSlots.length > 6 && (
                        <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded-md text-[10px]">
                          +{freeSlots.length - 6} vagas
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenEditDoctor(srv)}
                    className="w-full py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors text-center"
                  >
                    Ajustar Horários Deste Médico
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: EDIT DOCTOR SCHEDULE & WORKING HOURS */}
      {editingDoctorService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-900 to-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-200">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Editar Escala & Horários: {editingDoctorService.doctor}
                  </h3>
                  <p className="text-xs text-indigo-200">
                    {editingDoctorService.name} • {editingDoctorService.crm || "CRM"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditingDoctorService(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {/* Quick Shift Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Atalhos Rápidos de Turno:</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyShiftPreset("morning")}
                    className="p-2 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50 text-slate-700 text-xs font-bold flex flex-col items-center gap-1 transition-all"
                  >
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Manhã (08h - 12h)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyShiftPreset("afternoon")}
                    className="p-2 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50 text-slate-700 text-xs font-bold flex flex-col items-center gap-1 transition-all"
                  >
                    <Sun className="w-4 h-4 text-orange-500" />
                    <span>Tarde (13h - 18h)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyShiftPreset("full")}
                    className="p-2 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50 text-slate-700 text-xs font-bold flex flex-col items-center gap-1 transition-all"
                  >
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Integral (08h - 18h)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyShiftPreset("night")}
                    className="p-2 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50 text-slate-700 text-xs font-bold flex flex-col items-center gap-1 transition-all"
                  >
                    <Moon className="w-4 h-4 text-indigo-600" />
                    <span>Noite (18h - 21h)</span>
                  </button>
                </div>
              </div>

              {/* Start and End Time Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Horário Inicial de Atendimento:
                  </label>
                  <input
                    type="time"
                    value={editWorkStart}
                    onChange={(e) => setEditWorkStart(e.target.value)}
                    className="w-full text-sm font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Horário Final de Atendimento:
                  </label>
                  <input
                    type="time"
                    value={editWorkEnd}
                    onChange={(e) => setEditWorkEnd(e.target.value)}
                    className="w-full text-sm font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Consultation Duration / Interval */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Duração da Consulta (Intervalo por Paciente):
                </label>
                <div className="flex flex-wrap gap-2">
                  {[15, 20, 30, 45, 60].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setEditDuration(dur)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        editDuration === dur
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {dur} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Available Days of the Week */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Dias de Atendimento na Semana:
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditDays(["Segunda", "Terça", "Quarta", "Quinta", "Sexta"])}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline"
                  >
                    Segunda a Sexta
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ALL_WEEKDAYS.map((day) => {
                    const isSelected = editDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleDay(day)}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-500 text-indigo-900"
                            : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
                        }`}
                      >
                        <span>{day}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price & CRM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Valor da Consulta (R$):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">R$</span>
                    <input
                      type="number"
                      step="5"
                      min="10"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    CRM do Médico:
                  </label>
                  <input
                    type="text"
                    value={editCrm}
                    onChange={(e) => setEditCrm(e.target.value)}
                    placeholder="Ex: CRM 12345/PA"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Preview Live Slots Box */}
              <div className="bg-indigo-50/80 p-3 rounded-2xl border border-indigo-100 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-indigo-950">Capacidade Calculada:</span>
                  <p className="text-[11px] text-indigo-700">
                    Gera <strong>{calculatePreviewSlots(editWorkStart, editWorkEnd, editDuration)} horários por dia de atendimento</strong> para agendamentos.
                  </p>
                </div>
                <span className="px-2 py-1 bg-indigo-600 text-white font-bold rounded-lg text-xs">
                  {editDays.length} dias/sem
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingDoctorService(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveDoctorSchedule}
                disabled={isSavingDoctor}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSavingDoctor ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Horários do Médico</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO AGENDAMENTO MANUAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col my-auto max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header (Fixed at top) */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/90 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200/70 flex items-center justify-center text-emerald-700 shadow-xs shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                    Novo Agendamento Manual
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Cadastre uma consulta na recepção e bloqueie o horário na agenda geral.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateAppointmentSubmit} className="flex flex-col flex-1 overflow-hidden">
              {/* Scrollable Form Body */}
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(92vh-140px)] text-xs sm:text-sm">
                {/* Paciente Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Nome Completo do Paciente *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Eduardo Silva"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp / Telefone *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: (91) 98111-2233"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-mono transition-all"
                    />
                  </div>
                </div>

                {/* Especialidade & Médico */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Especialidade & Médico Responsável *</span>
                  </label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => handleServiceChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900 font-medium text-xs sm:text-sm transition-all cursor-pointer"
                  >
                    {services.map((srv) => (
                      <option key={srv.id} value={srv.id}>
                        {srv.name} — {srv.doctor} (R$ {srv.price.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Data & Horário */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Data da Consulta *</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900 text-xs sm:text-sm font-medium transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Horário da Consulta *</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900 font-bold text-xs sm:text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Free Slots Quick Select */}
                {availableSlotsForDate.length > 0 ? (
                  <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200/70">
                    <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Horários disponíveis nesta data (clique para preencher):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {availableSlotsForDate.slice(0, 8).map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setAppointmentTime(slot.time)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                            appointmentTime === slot.time
                              ? "bg-emerald-600 text-white shadow-xs scale-105"
                              : "bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300"
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-500 text-[11px] flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Nenhum horário livre pré-cadastrado na grade para este dia. O horário digitado acima será reservado manualmente.</span>
                  </div>
                )}

                {/* Valor & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Valor da Consulta (R$)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">R$</span>
                      <input
                        type="number"
                        placeholder={currentSelectedService ? String(currentSelectedService.price) : "180"}
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900 font-bold text-xs sm:text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Status do Pagamento</span>
                    </label>
                    <select
                      value={appointmentStatus}
                      onChange={(e) => setAppointmentStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900 font-medium text-xs sm:text-sm transition-all cursor-pointer"
                    >
                      <option value="confirmed_paid">✅ Confirmado & Pago</option>
                      <option value="pending_payment">⏳ Pendente Pagamento</option>
                    </select>
                  </div>
                </div>

                {/* Forma de Pagamento */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                    <span>Forma de Pagamento (se pago no balcão / recepção)</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900 font-medium text-xs sm:text-sm transition-all cursor-pointer"
                  >
                    <option value="balcao_cartao">💳 Cartão de Crédito / Débito (Balcão)</option>
                    <option value="balcao_dinheiro">💵 Dinheiro em Espécie (Balcão)</option>
                    <option value="pix">⚡ Pix Instantâneo (WhatsApp / QR Code)</option>
                    <option value="balcao_outros">📑 Convênio Médico / Outros</option>
                  </select>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Observações Internas (Opcional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Primeira consulta, paciente com preferência de atendimento, sintomas relatados..."
                    value={appointmentNotes}
                    onChange={(e) => setAppointmentNotes(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer Actions (Fixed at bottom) */}
              <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/90 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200/80 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Agendando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar e Bloquear Vaga</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
