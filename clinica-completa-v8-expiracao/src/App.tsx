import React, { useState, useEffect, useCallback } from "react";
import { Header, NavTabType } from "./components/Header";
import { WhatsAppSimulator } from "./components/WhatsAppSimulator";
import { ClinicAgenda } from "./components/ClinicAgenda";
import { PatientManager } from "./components/PatientManager";
import { AutomatedReminders } from "./components/AutomatedReminders";
import { FinancialDashboard } from "./components/FinancialDashboard";
import { DoctorPortal } from "./components/DoctorPortal";
import { AIInspector } from "./components/AIInspector";
import { ClinicSettings } from "./components/ClinicSettings";
import { QuotesAndExams } from "./components/QuotesAndExams";
import { InstallationGuide } from "./components/InstallationGuide";
import { WhatsAppGatewayManager } from "./components/WhatsAppGatewayManager";
import { AuthModal, UserRole } from "./components/AuthModal";
import { ClinicOverview } from "./components/ClinicOverview";
import { LoginPage } from "./components/LoginPage";
import { UserManagement } from "./components/UserManagement";
import {
  Message,
  ClinicConfig,
  ServiceItem,
  AvailabilitySlot,
  Appointment,
  ToolLog,
  LabExamItem,
  QuoteResult,
  PatientRecord,
  ReminderItem,
  ClinicalEvolution,
  ClinicUser,
} from "./types";
import { soundEffects } from "./utils/audioEffects";
import { clientClinicEngine, deduplicateAppointments, deduplicatePatients } from "./utils/clientClinicEngine";
import { supabaseClinicService } from "./services/supabaseClinicService";

const INITIAL_GREETING: Message = {
  id: "msg-init",
  role: "assistant",
  content: `Olá! 👋 Sou o assistente virtual de atendimento da *Clínica Médica Santa Clara* via WhatsApp.\n\nComo posso te ajudar hoje?\n\n🗓️ *1. Consultar horários e especialidades*\n🔬 *2. Orçamento de consultas & exames laboratoriais*\n✅ *3. Agendar uma consulta ou procedimento*\n📋 *4. Verificar status do meu agendamento*\n❌ *5. Cancelar agendamento*\n0️⃣ *0. Falar com Atendente Humano / Ajuda para Agendar*\n\nVocê pode me dizer qual especialidade ou exame procura ou escolher uma das opções acima!`,
  timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
};

export default function App() {
  const [viewMode, setViewMode] = useState<"client" | "agency">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get("mode");
      const view = params.get("view");
      if (mode === "client" || view === "cliente" || view === "client" || params.get("cliente") === "true") {
        return "client";
      }
    }
    return "agency";
  });
  const [activeTab, setActiveTab] = useState<NavTabType>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get("mode");
      const tab = params.get("tab") as NavTabType;
      if (tab) return tab;
      if (mode === "client" || params.get("view") === "cliente") return "clinic";
    }
    return "clinic";
  });
  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING]);
  const [isLoading, setIsLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>("admin");
  const [loggedInDoctorName, setLoggedInDoctorName] = useState<string | null>(null);
  const [isRealAuthActive, setIsRealAuthActive] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");

  // Patient Profile state (WhatsApp Simulator)
  const [patientPhone, setPatientPhone] = useState("5591981112233");
  const [patientName, setPatientName] = useState("Carlos Eduardo Silva");

  // Clinic DB State
  const [clinicConfig, setClinicConfig] = useState<ClinicConfig>(clientClinicEngine.config);
  const [services, setServices] = useState<ServiceItem[]>(clientClinicEngine.services);
  const [exams, setExams] = useState<LabExamItem[]>(clientClinicEngine.exams);
  const [quotes, setQuotes] = useState<QuoteResult[]>(clientClinicEngine.quotes);
  const [slots, setSlots] = useState<AvailabilitySlot[]>(clientClinicEngine.slots);
  const [appointments, setAppointments] = useState<Appointment[]>(clientClinicEngine.appointments);
  const [patients, setPatients] = useState<PatientRecord[]>(clientClinicEngine.patients);
  const [reminders, setReminders] = useState<ReminderItem[]>(clientClinicEngine.reminders);
  const [toolLogs, setToolLogs] = useState<ToolLog[]>(clientClinicEngine.toolLogs);
  const [users, setUsers] = useState<ClinicUser[]>(clientClinicEngine.users);
  const [hasGeminiKey, setHasGeminiKey] = useState(true);

  // Sync state from client engine
  const syncFromClientEngine = useCallback(() => {
    setClinicConfig({ ...clientClinicEngine.config });
    setServices([...clientClinicEngine.services]);
    setExams([...clientClinicEngine.exams]);
    setQuotes([...clientClinicEngine.quotes]);
    setSlots([...clientClinicEngine.slots]);
    setAppointments([...clientClinicEngine.appointments]);
    setPatients([...clientClinicEngine.patients]);
    setReminders([...clientClinicEngine.reminders]);
    setToolLogs([...clientClinicEngine.toolLogs]);
    setUsers([...clientClinicEngine.users]);
  }, []);

  // Fetch Clinic State from Backend (with silent fallback to client engine and smart merging)
  const fetchClinicState = useCallback(async () => {
    try {
      const res = await fetch("/api/clinic/state");
      if (res.ok) {
        const data = await res.json();
        if (data.config) setClinicConfig(data.config);
        if (data.services) setServices(data.services);
        if (data.exams) setExams(data.exams);
        if (data.quotes) setQuotes(data.quotes);
        if (data.slots) setSlots(data.slots);
        
        // Merge appointments cleanly and deduplicate
        if (Array.isArray(data.appointments)) {
          const serverIds = new Set(data.appointments.map((a: Appointment) => a.id));
          const clientOnly = clientClinicEngine.appointments.filter((a) => !serverIds.has(a.id));
          const merged = deduplicateAppointments([...clientOnly, ...data.appointments]);
          setAppointments(merged);
          clientClinicEngine.appointments = merged;
          clientClinicEngine.saveToStorage();
        } else {
          const deApts = deduplicateAppointments(clientClinicEngine.appointments);
          setAppointments(deApts);
        }

        if (Array.isArray(data.patients)) {
          const serverIds = new Set(data.patients.map((p: PatientRecord) => p.id));
          const clientOnly = clientClinicEngine.patients.filter((p) => !serverIds.has(p.id));
          const merged = deduplicatePatients([...clientOnly, ...data.patients]);
          setPatients(merged);
          clientClinicEngine.patients = merged;
          clientClinicEngine.saveToStorage();
        } else {
          const dePats = deduplicatePatients(clientClinicEngine.patients);
          setPatients(dePats);
        }

        if (data.reminders) setReminders(data.reminders);
        if (data.toolLogs) setToolLogs(data.toolLogs);
        if (data.users) setUsers(data.users);
        if (typeof data.hasGeminiKey === "boolean") setHasGeminiKey(data.hasGeminiKey);
      } else {
        syncFromClientEngine();
      }
    } catch {
      syncFromClientEngine();
    }
  }, [syncFromClientEngine]);

  useEffect(() => {
    fetchClinicState();

    let unsubAppointments: (() => void) | undefined;
    let unsubPatients: (() => void) | undefined;
    let unsubServices: (() => void) | undefined;
    let unsubUsers: (() => void) | undefined;

    // Initialize Supabase Cloud Database
    supabaseClinicService.initializeDatabase().then((ready) => {
      setIsCloudSynced(ready);
      if (ready) {
        try {
          // Subscribe to real-time appointments updates
          unsubAppointments = supabaseClinicService.subscribeAppointments((cloudApts) => {
            if (cloudApts && cloudApts.length > 0) {
              const cloudIds = new Set(cloudApts.map((a) => a.id));
              const clientOnly = clientClinicEngine.appointments.filter((a) => !cloudIds.has(a.id));
              const merged = deduplicateAppointments([...clientOnly, ...cloudApts]);
              setAppointments(merged);
              clientClinicEngine.appointments = merged;
              clientClinicEngine.saveToStorage();
            }
          });

          // Subscribe to real-time patients updates
          unsubPatients = supabaseClinicService.subscribePatients((cloudPatients) => {
            if (cloudPatients && cloudPatients.length > 0) {
              const cloudIds = new Set(cloudPatients.map((p) => p.id));
              const clientOnly = clientClinicEngine.patients.filter((p) => !cloudIds.has(p.id));
              const merged = deduplicatePatients([...clientOnly, ...cloudPatients]);
              setPatients(merged);
              clientClinicEngine.patients = merged;
              clientClinicEngine.saveToStorage();
            }
          });

          // Subscribe to real-time services
          unsubServices = supabaseClinicService.subscribeServices((cloudServices) => {
            if (cloudServices && cloudServices.length > 0) {
              setServices(cloudServices);
              clientClinicEngine.services = cloudServices;
              clientClinicEngine.saveToStorage();
            }
          });

          // Subscribe to real-time users
          unsubUsers = supabaseClinicService.subscribeUsers((cloudUsers) => {
            if (cloudUsers && cloudUsers.length > 0) {
              setUsers(cloudUsers);
              clientClinicEngine.users = cloudUsers;
              clientClinicEngine.saveToStorage();
            }
          });
        } catch (e) {
          console.warn("Supabase subscription error handled:", e);
        }
      }
    }).catch((err) => {
      console.warn("Supabase initialization error handled:", err);
    });

    return () => {
      if (unsubAppointments) unsubAppointments();
      if (unsubPatients) unsubPatients();
      if (unsubServices) unsubServices();
      if (unsubUsers) unsubUsers();
    };
  }, [fetchClinicState]);

  // Send WhatsApp Message handler
  const handleSendMessage = async (text: string, customPhone?: string, customName?: string) => {
    const currentPhone = customPhone || patientPhone;
    const currentName = customName || patientName;
    const timeNow = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    // User message
    const userMsg: Message = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: timeNow,
      status: "delivered",
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    if (soundEnabled) {
      soundEffects.playSent();
    }

    try {
      const chatHistory = messages
        .filter((m) => !m.isWebhookNotification)
        .map((m) => ({ role: m.role, content: m.content }));

      let data: any = null;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            history: chatHistory,
            phone: currentPhone,
            name: currentName,
          }),
        });

        if (res.ok) {
          data = await res.json();
        }
      } catch {
        // Backend not available
      }

      // If backend was not reached or returned an error, use client engine
      if (!data || !data.reply) {
        data = clientClinicEngine.processMessage(text, currentPhone, currentName);
      }

      const assistantMsg: Message = {
        id: `msg-asst-${Date.now()}`,
        role: "assistant",
        content: data.reply || "Olá! Como posso te ajudar?",
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        toolCalls: data.toolCalls || data.toolLogs?.map((l: any) => l.toolName) || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (soundEnabled) {
        soundEffects.playReceived();
      }

      // Refresh state after tool execution
      await fetchClinicState();
    } catch (err) {
      console.error("Chat error:", err);
      const fallbackMsg: Message = {
        id: `msg-err-${Date.now()}`,
        role: "assistant",
        content: "Desculpe, tive uma instabilidade momentânea. Pode repetir?",
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate Payment Webhook (Pix confirmation)
  const handleSimulatePayment = async (appointmentId: string) => {
    try {
      let updatedApt: Appointment | null = null;

      try {
        const res = await fetch(`/api/appointments/${appointmentId}/simulate-payment`, {
          method: "POST",
        });
        if (res.ok) {
          const result = await res.json();
          updatedApt = result.appointment;
        }
      } catch {
        // Fallback
      }

      if (!updatedApt) {
        const simResult = clientClinicEngine.simulatePayment(appointmentId);
        updatedApt = simResult ? simResult.appointment : null;
      }

      if (updatedApt) {
        if (soundEnabled) {
          soundEffects.playPaymentSuccess();
        }

        // Update Supabase
        await supabaseClinicService.updateAppointmentStatus(appointmentId, "confirmed_paid", "pix");

        // Add webhook push notification in chat
        const notificationMsg: Message = {
          id: `webhook-${Date.now()}`,
          role: "assistant",
          content: `⚡ *NOTIFICAÇÃO WEBHOOK PIX RECEBIDA:*\nPagamento de *R$ ${updatedApt.price.toFixed(2)}* confirmado via Pix Instantâneo!\n\nConsulta para *${updatedApt.patientName}* no dia *${updatedApt.date} às ${updatedApt.time}* com *${updatedApt.doctor}* está *CONFIRMADA*.`,
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          isWebhookNotification: true,
        };

        setMessages((prev) => [...prev, notificationMsg]);
        await fetchClinicState();
      }
    } catch (e) {
      console.error("Payment simulation error:", e);
    }
  };

  // Manual Agenda Action (Recepção)
  const handleManualAction = async (
    appointmentId: string,
    action: "confirm_cash" | "cancel" | "mark_arrived" | "mark_finished"
  ) => {
    try {
      // 1. Send to server backend
      try {
        await fetch(`/api/clinic/appointments/${appointmentId}/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: appointmentId, action }),
        });
      } catch {
        // Fallback
      }

      // 2. Local engine update
      const updated = clientClinicEngine.manualAction(appointmentId, action);
      if (updated) {
        setAppointments([...clientClinicEngine.appointments]);
        setSlots([...clientClinicEngine.slots]);
        setPatients([...clientClinicEngine.patients]);
      }
      
      // 3. Update Supabase
      const newStatus = action === "confirm_cash" ? "confirmed_paid" : action === "cancel" ? "cancelled" : undefined;
      if (newStatus) {
        await supabaseClinicService.updateAppointmentStatus(
          appointmentId,
          newStatus,
          action === "confirm_cash" ? "balcao_dinheiro" : undefined
        );
      }

      if (soundEnabled) {
        soundEffects.playSent();
      }
      await fetchClinicState();
    } catch (e) {
      console.error("Manual action error:", e);
    }
  };

  // Create Manual Appointment via Reception
  const handleCreateManualAppointment = async (newApt: Partial<Appointment>) => {
    if (!newApt.patientName || !newApt.patientPhone || !newApt.serviceId || !newApt.date || !newApt.time) {
      console.warn("Incomplete appointment payload:", newApt);
      return;
    }

    // 1. Create in local engine first (this performs double-booking validation)
    const createdApt = clientClinicEngine.createManualAppointment({
      patientName: newApt.patientName,
      patientPhone: newApt.patientPhone,
      serviceId: newApt.serviceId,
      date: newApt.date,
      time: newApt.time,
      price: newApt.price,
      status: newApt.status === "pending_payment" ? "pending_payment" : "confirmed_paid",
      notes: newApt.notes,
    });

    // Update React state directly with deduplication
    if (createdApt) {
      setAppointments((prev) => {
        const filtered = prev.filter((a) => a.id !== createdApt.id);
        return deduplicateAppointments([createdApt, ...filtered]);
      });
      setSlots([...clientClinicEngine.slots]);
      setPatients(deduplicatePatients([...clientClinicEngine.patients]));

      // 2. Persist to Supabase
      try {
        await supabaseClinicService.saveAppointment(createdApt);

        // Also ensure patient record is in Supabase
        const cleanPhone = newApt.patientPhone.replace(/\D/g, "");
        const cleanName = newApt.patientName.toLowerCase().trim();
        const matchedPatient = clientClinicEngine.patients.find(
          (p) => (cleanPhone && p.phone.replace(/\D/g, "") === cleanPhone) || p.name.toLowerCase().trim() === cleanName
        );
        if (matchedPatient) {
          await supabaseClinicService.savePatient(matchedPatient);
        }
      } catch (fErr) {
        console.warn("Supabase sync warning:", fErr);
      }
    }

    // 3. Post to backend server endpoint with exact ID to prevent duplicate generation
    try {
      await fetch("/api/clinic/appointment/create-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: createdApt.id, // Explicit ID avoids server generating a different duplicate
          patientName: newApt.patientName,
          patientPhone: newApt.patientPhone,
          serviceId: newApt.serviceId,
          date: newApt.date,
          time: newApt.time,
          price: newApt.price,
          status: newApt.status,
          notes: newApt.notes,
        }),
      });
    } catch (err) {
      console.warn("Backend manual appointment sync fallback handled:", err);
    }

    if (soundEnabled) {
      soundEffects.playSent();
    }

    // Re-fetch state
    await fetchClinicState();
  };

  // Save Settings
  const handleSaveSettings = async (config: ClinicConfig, updatedServices: ServiceItem[]) => {
    try {
      try {
        await fetch("/api/clinic/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config, services: updatedServices }),
        });
      } catch {
        // Fallback
      }
      clientClinicEngine.config = { ...config };
      clientClinicEngine.updateServices(updatedServices);
      setClinicConfig(config);
      setServices(updatedServices);
      setSlots([...clientClinicEngine.slots]);
      await fetchClinicState();
    } catch (e) {
      console.error("Error saving settings:", e);
    }
  };

  // Save updated exams
  const handleSaveExams = async (updatedExams: LabExamItem[]) => {
    try {
      try {
        await fetch("/api/clinic/exams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exams: updatedExams }),
        });
      } catch {
        // Fallback
      }
      clientClinicEngine.updateExams(updatedExams);
      setExams(updatedExams);
      await fetchClinicState();
    } catch (e) {
      console.error("Error saving exams:", e);
    }
  };

  // Save Patients
  const handleSavePatients = async (updatedPatients: PatientRecord[]) => {
    try {
      try {
        await fetch("/api/clinic/patients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patients: updatedPatients }),
        });
      } catch {
        // Fallback
      }
      clientClinicEngine.updatePatients(updatedPatients);
      setPatients([...updatedPatients]);

      // Save each to Supabase
      for (const p of updatedPatients) {
        await supabaseClinicService.savePatient(p);
      }
    } catch (e) {
      console.error("Error saving patients:", e);
    }
  };

  // Add Clinical Evolution to Patient
  const handleAddEvolution = async (patientId: string, evolution: Omit<ClinicalEvolution, "id">) => {
    try {
      try {
        await fetch(`/api/clinic/patients/${patientId}/evolutions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(evolution),
        });
      } catch {
        // Fallback
      }
      const newEvol = clientClinicEngine.addClinicalEvolution(patientId, evolution);
      setPatients([...clientClinicEngine.patients]);

      if (newEvol) {
        await supabaseClinicService.addClinicalEvolution(patientId, newEvol);
      }
    } catch (e) {
      console.error("Error adding evolution:", e);
    }
  };

  // Update Existing Clinical Evolution
  const handleUpdateEvolution = async (
    patientId: string,
    evolutionId: string,
    updatedData: Partial<ClinicalEvolution>
  ) => {
    try {
      try {
        await fetch(`/api/clinic/patients/${patientId}/evolutions/${evolutionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        });
      } catch {
        // Fallback
      }
      clientClinicEngine.updateClinicalEvolution(patientId, evolutionId, updatedData);
      setPatients([...clientClinicEngine.patients]);
    } catch (e) {
      console.error("Error updating evolution:", e);
    }
  };

  // Delete Clinical Evolution
  const handleDeleteEvolution = async (patientId: string, evolutionId: string) => {
    try {
      try {
        await fetch(`/api/clinic/patients/${patientId}/evolutions/${evolutionId}`, {
          method: "DELETE",
        });
      } catch {
        // Fallback
      }
      clientClinicEngine.deleteClinicalEvolution(patientId, evolutionId);
      setPatients([...clientClinicEngine.patients]);
    } catch (e) {
      console.error("Error deleting evolution:", e);
    }
  };

  // Quick Update Patient Notes
  const handleUpdatePatientNotes = (
    patientId: string,
    generalNotes: string,
    allergies?: string[],
    chronicConditions?: string[]
  ) => {
    clientClinicEngine.updatePatientNotes(patientId, generalNotes, allergies, chronicConditions);
    setPatients([...clientClinicEngine.patients]);
  };

  // Reminders: Send single reminder
  const handleSendReminder = async (reminderId: string) => {
    try {
      try {
        await fetch(`/api/reminders/${reminderId}/send`, { method: "POST" });
      } catch {
        // Fallback
      }
      clientClinicEngine.sendReminder(reminderId);
      if (soundEnabled) {
        soundEffects.playSent();
      }
      await fetchClinicState();
    } catch (e) {
      console.error("Error sending reminder:", e);
    }
  };

  // Reminders: Send all pending reminders
  const handleSendAllPendingReminders = async () => {
    try {
      const scheduled = reminders.filter((r) => r.status === "scheduled");
      for (const r of scheduled) {
        await handleSendReminder(r.id);
      }
    } catch (e) {
      console.error("Error sending all reminders:", e);
    }
  };

  // Reminders: Simulate patient reply ("1 - Confirmar" or "2 - Cancelar")
  const handleSimulateReminderResponse = async (reminderId: string, action: "confirm" | "cancel") => {
    try {
      try {
        await fetch(`/api/reminders/${reminderId}/respond`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
      } catch {
        // Fallback
      }
      clientClinicEngine.processReminderResponse(reminderId, action);
      if (soundEnabled) {
        if (action === "confirm") soundEffects.playPaymentSuccess();
        else soundEffects.playSent();
      }
      await fetchClinicState();
    } catch (e) {
      console.error("Error simulating reminder response:", e);
    }
  };

  // Reminders: Generate D-1 reminders automatically for all appointments
  const handleGenerateRemindersFromAppointments = () => {
    const existingAptIds = new Set(reminders.map((r) => r.appointmentId));
    const newReminders: ReminderItem[] = [];

    appointments.forEach((apt) => {
      if (apt.status !== "cancelled" && !existingAptIds.has(apt.id)) {
        newReminders.push({
          id: `rem-d1-${apt.id}`,
          appointmentId: apt.id,
          patientName: apt.patientName,
          patientPhone: apt.patientPhone,
          serviceName: apt.serviceName,
          doctor: apt.doctor,
          date: apt.date,
          time: apt.time,
          type: "d_minus_1",
          status: "scheduled",
          scheduledFor: `${apt.date} 09:00`,
          messageText: `Olá, ${apt.patientName}! 👋 Lembramos da sua consulta de ${apt.serviceName} com ${apt.doctor} amanhã às ${apt.time} na ${clinicConfig.clinicName}. Responda '1' para confirmar presença ou '2' para remarcar.`,
        });
      }
    });

    if (newReminders.length > 0) {
      const merged = [...reminders, ...newReminders];
      clientClinicEngine.reminders = merged;
      setReminders(merged);
      alert(`Sincronização concluída! ${newReminders.length} lembrete(s) adicionados à fila.`);
    } else {
      alert("Todos os agendamentos ativos já possuem lembretes configurados!");
    }
  };

  // Dispatch quote message to WhatsApp simulator
  const handleSendQuoteToWhatsApp = (quote: QuoteResult) => {
    const itemsList = quote.items
      .map((it) => `• *${it.name}* (${it.type === "exame" ? "Exame Laboratorial" : "Consulta Médica"}): R$ ${it.price.toFixed(2)}`)
      .join("\n");

    const quoteMessage = `Olá, *${quote.patientName || "Paciente"}*! Preparei seu orçamento solicitado: 📋\n\n${itemsList}\n\n───────────────\n🧾 *Subtotal:* R$ ${quote.subtotal.toFixed(2)}\n${quote.discount > 0 ? `🎁 *Desconto Pacote:* R$ ${quote.discount.toFixed(2)}\n` : ""}💰 *Total:* R$ ${quote.total.toFixed(2)}\n✨ *À vista no Pix com 5% de desconto:* *R$ ${(quote.pixDiscountTotal || quote.total * 0.95).toFixed(2)}*\n\n🔑 *Chave Pix:* \`\`\`${quote.pixCode}\`\`\`\n\n📌 *Validade:* 7 dias.\n🧪 *Horário de Coleta:* Segunda a Sábado das 07:00 às 11:30 (sem necessidade de agendar exames de sangue).`;

    const assistantMsg: Message = {
      id: `msg-quote-${Date.now()}`,
      role: "assistant",
      content: quoteMessage,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setActiveTab("chat");
    if (soundEnabled) {
      soundEffects.playSent();
    }
  };

  // Reset Demo
  const handleReset = async () => {
    try {
      try {
        await fetch("/api/clinic/reset", { method: "POST" });
      } catch {
        // Fallback
      }
      clientClinicEngine.reset();
      setMessages([INITIAL_GREETING]);
      await fetchClinicState();
    } catch (e) {
      console.error("Error resetting:", e);
    }
  };

  // User Management Handlers (Reception & Admin)
  const handleSaveUser = async (user: ClinicUser, newService?: ServiceItem) => {
    clientClinicEngine.addUser(user);
    if (newService) {
      clientClinicEngine.services.push(newService);
      setServices([...clientClinicEngine.services]);
      await supabaseClinicService.saveServices(clientClinicEngine.services);
    }
    setUsers([...clientClinicEngine.users]);
    await supabaseClinicService.saveUser(user);
  };

  const handleDeleteUser = async (userId: string) => {
    clientClinicEngine.deleteUser(userId);
    setUsers([...clientClinicEngine.users]);
    await supabaseClinicService.deleteUser(userId);
  };

  const handleLoginAsUser = (user: ClinicUser) => {
    setCurrentRole(user.role);
    if (user.role === "doctor" && user.doctorId) {
      setSelectedDoctorId(user.doctorId);
      setActiveTab("doctor");
    } else if (user.role === "receptionist") {
      setActiveTab("agenda");
    } else {
      setActiveTab("clinic");
    }
    setViewMode("agency");
    soundEffects.playPaymentSuccess();
  };

  const pendingAppointments = appointments.filter((a) => a.status === "pending_payment");
  const pendingReminders = reminders.filter((r) => r.status === "scheduled");
  const latestAppointment = appointments.length > 0 ? appointments[0] : undefined;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Universal Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        viewMode={viewMode}
        setViewMode={setViewMode}
        clinicName={clinicConfig.clinicName}
        agencyPhone={clinicConfig.agencyPhone}
        hasGeminiKey={hasGeminiKey}
        onReset={handleReset}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onSimulateWebhook={
          pendingAppointments.length > 0
            ? () => handleSimulatePayment(pendingAppointments[0].id)
            : undefined
        }
        pendingCount={pendingAppointments.length}
        remindersCount={pendingReminders.length}
        databaseConnected={isCloudSynced}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        currentRole={currentRole}
      />

      {/* Main Content Area */}
      <main className="flex-1 bg-slate-100 dark:bg-slate-950 py-4 sm:py-6">
        {activeTab === "clinic" && (
          <ClinicOverview
            clinicConfig={clinicConfig}
            services={services}
            appointments={appointments}
            patients={patients}
            exams={exams}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onSelectDoctorForPortal={(docId) => {
              setSelectedDoctorId(docId);
              setActiveTab("doctor");
            }}
            viewMode={viewMode}
          />
        )}

        {activeTab === "login" && (
          <LoginPage
            clinicConfig={clinicConfig}
            services={services}
            users={users}
            currentRole={currentRole}
            selectedDoctorId={selectedDoctorId}
            onLoginSuccess={(role, docId, user) => {
              setCurrentRole(role);
              if (docId) setSelectedDoctorId(docId);
              if (role === "doctor") {
                setActiveTab("doctor");
              } else if (role === "admin") {
                setActiveTab("clinic");
              } else {
                setActiveTab("agenda");
              }
              setViewMode("agency");
            }}
            onSaveNewUser={handleSaveUser}
          />
        )}

        {activeTab === "chat" && (
          <WhatsAppSimulator
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            clinicConfig={clinicConfig}
            activeAppointment={latestAppointment}
            onSimulatePayment={handleSimulatePayment}
            onClearChat={() => setMessages([INITIAL_GREETING])}
            onOpenInspector={() => setActiveTab("inspector")}
            patientPhone={patientPhone}
            setPatientPhone={setPatientPhone}
            patientName={patientName}
            setPatientName={setPatientName}
            viewMode={viewMode}
          />
        )}

        {activeTab === "gateway" && (
          <WhatsAppGatewayManager
            onSimulateIncomingMessage={(phone, text, name) => {
              setPatientPhone(phone);
              if (name) setPatientName(name);
              handleSendMessage(text);
              setActiveTab("chat");
            }}
          />
        )}

        {activeTab === "agenda" && (
          <ClinicAgenda
            appointments={appointments}
            slots={slots}
            services={services}
            clinicConfig={clinicConfig}
            onSimulatePayment={handleSimulatePayment}
            onManualAction={handleManualAction}
            onCreateManualAppointment={handleCreateManualAppointment}
            onRefresh={fetchClinicState}
            onSaveServices={async (updatedServices) => {
              await handleSaveSettings(clinicConfig, updatedServices);
            }}
          />
        )}

        {activeTab === "doctor" && (
          <DoctorPortal
            clinicConfig={clinicConfig}
            lockedDoctorName={isRealAuthActive && currentRole === "doctor" ? loggedInDoctorName : null}
            services={services}
            patients={patients}
            appointments={appointments}
            exams={exams}
            onAddEvolution={handleAddEvolution}
            onUpdateEvolution={handleUpdateEvolution}
            onDeleteEvolution={handleDeleteEvolution}
            onUpdatePatientNotes={handleUpdatePatientNotes}
            onNavigateToClinic={() => setActiveTab("clinic")}
            onLogout={() => setActiveTab("login")}
          />
        )}

        {activeTab === "patients" && (
          <PatientManager
            patients={patients}
            appointments={appointments}
            quotes={quotes}
            onSavePatients={handleSavePatients}
            onAddEvolution={handleAddEvolution}
            onUpdateEvolution={handleUpdateEvolution}
            onDeleteEvolution={handleDeleteEvolution}
            onUpdatePatientNotes={handleUpdatePatientNotes}
            onNavigateToSchedule={(name, phone) => {
              setPatientPhone(phone);
              setPatientName(name);
              setActiveTab("agenda");
            }}
            onNavigateToQuote={(name) => {
              setPatientName(name);
              setActiveTab("quotes");
            }}
            onBookForPatient={(p) => {
              setPatientPhone(p.phone);
              setPatientName(p.name);
              setActiveTab("chat");
            }}
            onQuoteForPatient={(p) => {
              setPatientPhone(p.phone);
              setPatientName(p.name);
              setActiveTab("quotes");
            }}
          />
        )}

        {activeTab === "reminders" && (
          <AutomatedReminders
            reminders={reminders}
            appointments={appointments}
            clinicName={clinicConfig.clinicName}
            onSendReminder={handleSendReminder}
            onSendAllPending={handleSendAllPendingReminders}
            onSimulatePatientResponse={handleSimulateReminderResponse}
            onGenerateRemindersFromAppointments={handleGenerateRemindersFromAppointments}
          />
        )}

        {activeTab === "quotes" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <QuotesAndExams
              exams={exams}
              services={services}
              quotes={quotes}
              onSaveExams={handleSaveExams}
              onSendQuoteToWhatsApp={handleSendQuoteToWhatsApp}
              viewMode={viewMode}
            />
          </div>
        )}

        {activeTab === "dashboard" && (
          <FinancialDashboard
            appointments={appointments}
            quotes={quotes}
            services={services}
            exams={exams}
          />
        )}

        {activeTab === "inspector" && (
          <AIInspector
            toolLogs={toolLogs}
            clinicConfig={clinicConfig}
            hasGeminiKey={hasGeminiKey}
          />
        )}

        {activeTab === "users" && (
          <UserManagement
            users={users}
            services={services}
            currentRole={currentRole}
            onSaveUser={handleSaveUser}
            onDeleteUser={handleDeleteUser}
            onLoginAsUser={handleLoginAsUser}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === "settings" && (
          <ClinicSettings
            clinicConfig={clinicConfig}
            services={services}
            onSaveSettings={handleSaveSettings}
            onReset={handleReset}
            onNavigateToUsers={() => setActiveTab("users")}
          />
        )}

        {activeTab === "guide" && <InstallationGuide clinicConfig={clinicConfig} />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {clinicConfig.clinicName} • Sistema de Atendimento Automatizado WhatsApp & IA
          </span>
          <div className="flex items-center gap-3">
            <span>Desenvolvido por <strong>LocalizeHub / Venda Mais Digital</strong></span>
            <a
              href="https://wa.me/5591988390894"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline font-semibold"
            >
              (91) 98839-0894
            </a>
          </div>
        </div>
      </footer>

      {/* Team Auth & Role Access Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        onAuthResolved={(profile) => {
          if (profile) {
            setCurrentRole(profile.role);
            setLoggedInDoctorName(profile.role === "doctor" ? profile.doctorName || profile.name : null);
            setIsRealAuthActive(true);
          } else {
            setIsRealAuthActive(false);
            setLoggedInDoctorName(null);
          }
        }}
      />
    </div>
  );
}
