export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  status?: "sending" | "sent" | "delivered" | "read";
  toolCalls?: Array<{
    name: string;
    args: Record<string, any>;
    result: Record<string, any>;
  }>;
  appointment?: Appointment;
  paymentLink?: string;
  pixCode?: string;
  transferredToHuman?: boolean;
  isWebhookNotification?: boolean;
  executionTimeMs?: number;
  modelUsed?: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  type?: "consulta" | "exame" | "procedimento";
  price: number;
  durationMinutes: number;
  description: string;
  doctor: string;
  specialtyDetails?: string; // Informações detalhadas da especialidade (ex: tireoide, hipertireoidismo, diabetes, etc)
  crm?: string; // CRM do médico
  availableDays?: string[];
  workStartHour?: string;
  workEndHour?: string;
  preparation?: string;
  resultDeadlineHours?: number;
}

export interface LabExamItem {
  id: string;
  name: string;
  category: "Sangue / Bioquímica" | "Imagem / Ultrassom" | "Cardiológico" | "Urina / Fezes" | "Genético / Hormonal";
  price: number;
  preparation: string;
  resultDeadline: string;
  popular?: boolean;
}

export interface QuoteItem {
  id: string;
  name: string;
  type: "consulta" | "exame";
  price: number;
  doctorOrLab?: string;
  preparation?: string;
}

export interface QuoteResult {
  id: string;
  patientName?: string;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  total: number;
  pixDiscountTotal?: number;
  createdAt: string;
  pixCode?: string;
  paymentLink?: string;
  notes?: string;
}

export interface AvailabilitySlot {
  id: string;
  serviceId: string;
  doctor: string;
  date: string;
  time: string;
  isBooked: boolean;
}

export interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  serviceId: string;
  serviceName: string;
  doctor: string;
  date: string;
  time: string;
  price: number;
  status: "pending_payment" | "confirmed_paid" | "cancelled" | "transferred";
  paymentMethod?: "pix" | "balcao_dinheiro" | "balcao_cartao" | "balcao_outros";
  paymentId?: string;
  paymentLink?: string;
  pixCode?: string;
  createdAt: string;
  confirmedAt?: string;
  notes?: string;
}

export interface ClinicConfig {
  clinicName: string;
  phone: string;
  address: string;
  businessHours: string;
  agencyPhone: string;
  paymentTimeoutMinutes: number;
  cnpj?: string;
}

export interface ToolLog {
  id: string;
  timestamp: string;
  toolName: string;
  arguments: Record<string, any>;
  result: Record<string, any>;
  success: boolean;
}

export interface ClinicalEvolution {
  id: string;
  date: string;
  doctor: string;
  diagnosisOrReason: string;
  note: string;
  prescriptions?: string;
}

export interface PatientRecord {
  id: string;
  name: string;
  phone: string;
  cpf?: string;
  birthDate?: string;
  email?: string;
  gender?: "Masculino" | "Feminino" | "Outro";
  bloodType?: string;
  allergies?: string[];
  chronicConditions?: string[];
  generalNotes?: string;
  totalAppointments: number;
  totalSpent: number;
  lastVisit?: string;
  clinicalHistory: ClinicalEvolution[];
}

export interface ReminderItem {
  id: string;
  appointmentId: string;
  patientName: string;
  patientPhone: string;
  doctor: string;
  serviceName: string;
  date: string;
  time: string;
  type: "d_minus_1" | "d_day_2h" | "post_exam_ready";
  status: "scheduled" | "sent" | "confirmed_by_patient" | "cancelled_by_patient";
  scheduledFor: string;
  sentAt?: string;
  responseReceivedAt?: string;
  messageText: string;
}

export interface ClinicUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "doctor" | "receptionist";
  doctorId?: string; // Links to ServiceItem.id when role === "doctor"
  doctorName?: string;
  crm?: string;
  specialty?: string;
  phone?: string;
  pin?: string;
  status: "active" | "inactive";
  createdAt: string;
  lastLogin?: string;
  avatarUrl?: string;
}

export interface ClinicState {
  config: ClinicConfig;
  services: ServiceItem[];
  exams: LabExamItem[];
  patients: PatientRecord[];
  reminders: ReminderItem[];
  slots: AvailabilitySlot[];
  appointments: Appointment[];
  quotes: QuoteResult[];
  toolLogs: ToolLog[];
  hasGeminiKey: boolean;
  users?: ClinicUser[];
}

export interface ScenarioPreset {
  id: string;
  title: string;
  category: "Agendamento" | "Consulta" | "Orçamento / Exames" | "Cancelamento" | "Regras / Bloqueios" | "Webhook" | "Acessibilidade / Idosos";
  description: string;
  prompt: string;
  badge: string;
  highlightTool: string;
}
