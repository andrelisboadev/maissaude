import { supabaseAdmin, isSupabaseConfigured } from "./supabaseAdmin.js";
import { createPixPayment, isPaymentConfigured, activeProviderName } from "./paymentProvider.js";

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  type?: "consulta" | "exame" | "procedimento";
  price: number;
  durationMinutes: number;
  description: string;
  doctor: string;
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
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
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

export const DEFAULT_PATIENTS: PatientRecord[] = [
  {
    id: "pat-1",
    name: "Carlos Eduardo Silva",
    phone: "5591981112233",
    cpf: "452.883.192-04",
    birthDate: "1984-06-15",
    email: "carlos.silva@email.com",
    gender: "Masculino",
    bloodType: "O+",
    allergies: ["Dipirona"],
    chronicConditions: ["Hipertensão Arterial Sistêmica leve"],
    generalNotes: "Paciente disciplinado com medicação. Faz check-up cardiológico anual.",
    totalAppointments: 4,
    totalSpent: 860,
    lastVisit: "2026-08-10",
    clinicalHistory: [
      {
        id: "ev-1",
        date: "2026-08-10",
        doctor: "Dr. Roberto Martins (Clínico Geral)",
        diagnosisOrReason: "Rotina / Acompanhamento de PA",
        note: "PA 130x85 mmHg. Solicitado ECG e Perfil Lipídico para controle anual. Mantida dosagem de Losartana 50mg.",
        prescriptions: "Losartana Potássica 50mg - 1 cp pela manhã.",
      },
      {
        id: "ev-2",
        date: "2026-03-12",
        doctor: "Dra. Beatriz Santos (Cardiologista)",
        diagnosisOrReason: "Avaliação Cardiológica Preventiva",
        note: "Ecocardiograma normal com FE 68%. ECG em ritmo sinusal sem alterações isquêmicas.",
        prescriptions: "Dieta hipossódica e atividade aeróbica 150min/semana.",
      },
    ],
  },
  {
    id: "pat-2",
    name: "Juliana Mendes",
    phone: "5591984445566",
    cpf: "721.940.312-88",
    birthDate: "1992-11-20",
    email: "juliana.mendes@email.com",
    gender: "Feminino",
    bloodType: "A+",
    allergies: ["Nenhum registro"],
    chronicConditions: ["Dermatite Atópica sazonal"],
    generalNotes: "Prefere horários no período da tarde após 14h.",
    totalAppointments: 2,
    totalSpent: 480,
    lastVisit: "2026-07-28",
    clinicalHistory: [
      {
        id: "ev-3",
        date: "2026-07-28",
        doctor: "Dra. Camila Albuquerque (Dermatologista)",
        diagnosisOrReason: "Lesão eritematosa em antebraço",
        note: "Quadro compatível com eczema de contato. Orientada hidratação cutânea e sabonete neutro.",
        prescriptions: "Desonida creme 0.05% aplicar 1x ao dia por 7 dias. Hidratante corporal intensivo.",
      },
    ],
  },
  {
    id: "pat-3",
    name: "Mariana Costa",
    phone: "5591992334455",
    cpf: "812.543.901-22",
    birthDate: "1988-03-05",
    email: "mariana.costa@email.com",
    gender: "Feminino",
    bloodType: "B+",
    allergies: ["Penicilina / Amoxicilina"],
    chronicConditions: ["Enxaqueca com aura"],
    generalNotes: "Alérgica severa a penicilinas.",
    totalAppointments: 3,
    totalSpent: 620,
    lastVisit: "2026-08-02",
    clinicalHistory: [
      {
        id: "ev-4",
        date: "2026-08-02",
        doctor: "Dr. Marcelo Oliveira (Ortopedista)",
        diagnosisOrReason: "Tendinopatia de manguito rotador direito",
        note: "Dor em abdução de ombro a 90 graus. Manobra de Neer positiva. Indicado fisioterapia motora 10 sessões.",
        prescriptions: "Cetoprofeno 150mg 1 cp/dia por 5 dias (após refeição). Fisioterapia 10 sessões.",
      },
    ],
  },
  {
    id: "pat-4",
    name: "Lucas Ferreira",
    phone: "5591988776655",
    cpf: "339.112.774-19",
    birthDate: "1995-09-14",
    email: "lucas.ferreira@email.com",
    gender: "Masculino",
    bloodType: "O-",
    allergies: ["Nenhum registro"],
    chronicConditions: ["Nenhuma"],
    generalNotes: "Paciente novo, check-up admissional.",
    totalAppointments: 1,
    totalSpent: 180,
    lastVisit: "2026-08-11",
    clinicalHistory: [
      {
        id: "ev-5",
        date: "2026-08-11",
        doctor: "Dr. Roberto Martins (Clínico Geral)",
        diagnosisOrReason: "Exame Clínico Admissional",
        note: "Exame físico geral sem alterações. Apto para atividades laborais.",
        prescriptions: "Atestado de Saúde Ocupacional (ASO) emitido.",
      },
    ],
  },
];

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

// Generate realistic slots for the next 10 days respecting doctor days & hours
function generateInitialSlots(services: ServiceItem[]): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];
  const today = new Date();
  const defaultTimes = ["08:30", "09:15", "10:00", "11:00", "14:00", "15:00", "16:30", "17:15"];

  for (let d = 0; d < 10; d++) {
    const slotDate = new Date(today);
    slotDate.setDate(today.getDate() + d);
    const dayName = DAY_NAMES[slotDate.getDay()];
    if (dayName === "Domingo") continue;

    const dateStr = slotDate.toISOString().split("T")[0];

    services.forEach((service) => {
      const allowedDays = service.availableDays || ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
      if (!allowedDays.includes(dayName)) {
        return;
      }

      const startHour = parseInt(service.workStartHour?.split(":")[0] || "8", 10);
      const endHour = parseInt(service.workEndHour?.split(":")[0] || "18", 10);

      const filteredTimes = defaultTimes.filter((t) => {
        const h = parseInt(t.split(":")[0], 10);
        return h >= startHour && h < endHour;
      });

      const timesToUse = filteredTimes.length > 0 ? filteredTimes : ["09:00", "10:00", "14:00", "15:00"];

      timesToUse.forEach((time, tIndex) => {
        const isBooked = (d === 0 && (tIndex === 1 || tIndex === 4)) || (d === 1 && tIndex === 2);
        slots.push({
          id: `slot-${dateStr}-${service.id}-${time.replace(":", "")}`,
          serviceId: service.id,
          doctor: service.doctor,
          date: dateStr,
          time,
          isBooked,
        });
      });
    });
  }
  return slots;
}

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: "clinico-geral",
    name: "Clínico Geral (Consulta)",
    category: "Medicina Geral",
    price: 180,
    durationMinutes: 30,
    description: "Avaliação médica preventiva, exames de rotina e diagnóstico clínico.",
    doctor: "Dr. Roberto Martins",
    availableDays: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
    workStartHour: "08:00",
    workEndHour: "18:00",
  },
  {
    id: "cardiologia",
    name: "Cardiologia (Consulta + ECG)",
    category: "Especialidades",
    price: 260,
    durationMinutes: 40,
    description: "Consulta cardiológica completa com avaliação eletrocardiográfica.",
    doctor: "Dra. Mariana Costa",
    availableDays: ["Segunda", "Quarta", "Sexta"],
    workStartHour: "08:30",
    workEndHour: "17:00",
  },
  {
    id: "dermatologia",
    name: "Dermatologia",
    category: "Especialidades",
    price: 240,
    durationMinutes: 30,
    description: "Diagnóstico e tratamento de condições de pele, cabelos e unhas.",
    doctor: "Dra. Camila Albuquerque",
    availableDays: ["Terça", "Quinta", "Sábado"],
    workStartHour: "09:00",
    workEndHour: "16:00",
  },
  {
    id: "odontologia",
    name: "Odontologia & Avaliação",
    category: "Odonto",
    price: 190,
    durationMinutes: 45,
    description: "Check-up bucal completo, profilaxia e planejamento odontológico.",
    doctor: "Dr. Felipe Santana",
    availableDays: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
    workStartHour: "08:00",
    workEndHour: "19:00",
  },
  {
    id: "pediatria",
    name: "Pediatria",
    category: "Especialidades",
    price: 220,
    durationMinutes: 40,
    description: "Acompanhamento do desenvolvimento infantil e puericultura.",
    doctor: "Dra. Beatriz Neves",
    availableDays: ["Segunda", "Quarta", "Quinta"],
    workStartHour: "08:30",
    workEndHour: "17:30",
  },
  {
    id: "nutricao",
    name: "Nutrição Clínica & Esportiva",
    category: "Nutrição",
    price: 160,
    durationMinutes: 45,
    description: "Bioimpedância e plano alimentar individualizado.",
    doctor: "Nutr. Gabriel Torres",
    availableDays: ["Terça", "Quinta", "Sexta"],
    workStartHour: "10:00",
    workEndHour: "18:00",
  },
];

export const DEFAULT_LAB_EXAMS: LabExamItem[] = [
  {
    id: "hemograma-completo",
    name: "Hemograma Completo",
    category: "Sangue / Bioquímica",
    price: 35,
    preparation: "Jejum recomendado de 4 horas (água permitida)",
    resultDeadline: "24 horas úteis",
    popular: true,
  },
  {
    id: "glicemia-jejum",
    name: "Glicemia em Jejum",
    category: "Sangue / Bioquímica",
    price: 25,
    preparation: "Jejum obrigatório de 8 a 12 horas",
    resultDeadline: "24 horas úteis",
    popular: true,
  },
  {
    id: "perfil-lipidico",
    name: "Perfil Lipídico / Colesterol Total e Frações",
    category: "Sangue / Bioquímica",
    price: 55,
    preparation: "Jejum de 12 horas. Evitar consumo de bebidas alcoólicas 72h antes",
    resultDeadline: "24 horas úteis",
    popular: true,
  },
  {
    id: "tsh-t4-livre",
    name: "TSH Ultra Sensível + T4 Livre (Tireoide)",
    category: "Genético / Hormonal",
    price: 75,
    preparation: "Jejum de 4 horas. Coletar preferencialmente pela manhã",
    resultDeadline: "48 horas úteis",
    popular: true,
  },
  {
    id: "vitamina-d",
    name: "Vitamina D (25-Hidroxivitamina D)",
    category: "Sangue / Bioquímica",
    price: 70,
    preparation: "Jejum de 4 horas",
    resultDeadline: "48 horas úteis",
    popular: true,
  },
  {
    id: "vitamina-b12",
    name: "Vitamina B12",
    category: "Sangue / Bioquímica",
    price: 45,
    preparation: "Jejum de 4 horas",
    resultDeadline: "48 horas úteis",
  },
  {
    id: "eas-urina",
    name: "EAS / Sumário de Urina Tipo 1",
    category: "Urina / Fezes",
    price: 28,
    preparation: "Coletar a 1ª urina da manhã após higiene íntima rigorosa (jato médio)",
    resultDeadline: "24 horas úteis",
    popular: true,
  },
  {
    id: "parasitologico-fezes",
    name: "Exame Parasitológico de Fezes (EPF)",
    category: "Urina / Fezes",
    price: 30,
    preparation: "Coletar amostra em frasco estéril próprio e entregar no laboratório",
    resultDeadline: "24 horas úteis",
  },
  {
    id: "ecg-repouso",
    name: "Eletrocardiograma (ECG em Repouso)",
    category: "Cardiológico",
    price: 80,
    preparation: "Evitar cremes ou óleos no tórax antes do exame. Não requer jejum",
    resultDeadline: "Laudo emitido no mesmo dia",
    popular: true,
  },
  {
    id: "ecocardiograma",
    name: "Ecocardiograma Transtorácico com Doppler",
    category: "Cardiológico",
    price: 220,
    preparation: "Não requer jejum. Trazer exames anteriores se houver",
    resultDeadline: "Laudo em até 24 horas",
  },
  {
    id: "usg-abdominal-total",
    name: "Ultrassonografia de Abdome Total",
    category: "Imagem / Ultrassom",
    price: 160,
    preparation: "Jejum de 6 a 8 horas + bexiga cheia (beber 4 a 6 copos de água 1h antes)",
    resultDeadline: "Laudo com imagens entregue no mesmo dia",
    popular: true,
  },
  {
    id: "usg-tireoide",
    name: "Ultrassonografia de Tireoide com Doppler",
    category: "Imagem / Ultrassom",
    price: 140,
    preparation: "Não requer preparo nem jejum prévio",
    resultDeadline: "Laudo no mesmo dia",
  },
  {
    id: "checkup-basico",
    name: "Combo Check-up Básico (Hemograma + Glicemia + Lipídico + EAS + Creatinina + Ácido Úrico)",
    category: "Sangue / Bioquímica",
    price: 180,
    preparation: "Jejum de 12 horas + coleta matinal de urina",
    resultDeadline: "24 a 48 horas úteis",
    popular: true,
  },
  {
    id: "checkup-cardio",
    name: "Combo Check-up Cardiológico (Consulta Cardiologista + ECG + Perfil Lipídico + Glicemia)",
    category: "Cardiológico",
    price: 340,
    preparation: "Jejum de 12 horas para coleta de sangue e consulta agendada",
    resultDeadline: "Laudo imediato do ECG + exames em 24h",
    popular: true,
  },
];

class ClinicDatabase {
  public config: ClinicConfig = {
    clinicName: "Clínica Médica Santa Clara",
    phone: "(91) 3245-8800",
    address: "Av. Nazaré, 1420 - Nazaré, Belém - PA",
    businessHours: "Segunda a Sexta das 08h às 19h | Sábado das 08h às 13h",
    agencyPhone: "(91) 98839-0894",
    paymentTimeoutMinutes: 15,
  };

  public services: ServiceItem[] = [...DEFAULT_SERVICES];
  public exams: LabExamItem[] = [...DEFAULT_LAB_EXAMS];
  public patients: PatientRecord[] = [...DEFAULT_PATIENTS];
  public reminders: ReminderItem[] = [];
  public slots: AvailabilitySlot[] = generateInitialSlots(DEFAULT_SERVICES);
  public appointments: Appointment[] = [];
  public quotes: QuoteResult[] = [];
  public toolLogs: ToolLog[] = [];

  constructor() {
    this.seedInitialAppointments();
    this.seedInitialReminders();
  }

  // ==============================================================
  // PERSISTÊNCIA SUPABASE (substitui o armazenamento 100% em memória)
  // Padrão "hidrata no cold start + grava em segundo plano após cada mutação".
  // Isso resolve o item crítico de dados sumindo entre invocações serverless,
  // sem reescrever as regras de negócio que já existem acima/abaixo.
  // ==============================================================
  private hydrated = false;
  private hydratingPromise: Promise<void> | null = null;

  public async ensureHydrated(): Promise<void> {
    if (!isSupabaseConfigured || this.hydrated) return;
    if (!this.hydratingPromise) this.hydratingPromise = this.hydrateFromSupabase();
    await this.hydratingPromise;
  }

  private async hydrateFromSupabase(): Promise<void> {
    try {
      const [svc, exams, patients, evolutions, appts, slots, reminders, config] = await Promise.all([
        supabaseAdmin.from("services").select("*"),
        supabaseAdmin.from("lab_exams").select("*"),
        supabaseAdmin.from("patients").select("*"),
        supabaseAdmin.from("clinical_evolutions").select("*").order("date", { ascending: false }),
        supabaseAdmin.from("appointments").select("*"),
        supabaseAdmin.from("availability_slots").select("*"),
        supabaseAdmin.from("reminders").select("*"),
        supabaseAdmin.from("clinic_config").select("*").eq("id", 1).maybeSingle(),
      ]);

      if (svc.data && svc.data.length > 0) {
        this.services = svc.data.map((r: any) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          type: r.type,
          price: Number(r.price),
          durationMinutes: r.duration_minutes,
          description: r.description || "",
          doctor: r.doctor,
          availableDays: r.available_days || undefined,
          workStartHour: r.work_start_hour,
          workEndHour: r.work_end_hour,
          preparation: r.preparation,
          resultDeadlineHours: r.result_deadline_hours,
        }));
      }

      if (exams.data && exams.data.length > 0) {
        this.exams = exams.data.map((r: any) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          price: Number(r.price),
          preparation: r.preparation || "",
          resultDeadline: r.result_deadline || "",
          popular: r.popular || false,
        }));
      }

      if (patients.data && patients.data.length > 0) {
        const evosByPatient = new Map<string, ClinicalEvolution[]>();
        (evolutions.data || []).forEach((r: any) => {
          const list = evosByPatient.get(r.patient_id) || [];
          list.push({
            id: r.id,
            date: r.date,
            doctor: r.doctor,
            diagnosisOrReason: r.diagnosis_or_reason,
            note: r.note,
            prescriptions: r.prescriptions,
          });
          evosByPatient.set(r.patient_id, list);
        });

        this.patients = patients.data.map((r: any) => ({
          id: r.id,
          name: r.name,
          phone: r.phone,
          cpf: r.cpf,
          birthDate: r.birth_date,
          email: r.email,
          gender: r.gender,
          bloodType: r.blood_type,
          allergies: r.allergies || [],
          chronicConditions: r.chronic_conditions || [],
          generalNotes: r.general_notes,
          totalAppointments: r.total_appointments || 0,
          totalSpent: Number(r.total_spent || 0),
          lastVisit: r.last_visit,
          clinicalHistory: evosByPatient.get(r.id) || [],
        }));
      }

      if (appts.data && appts.data.length > 0) {
        this.appointments = appts.data.map((r: any) => ({
          id: r.id,
          patientName: r.patient_name,
          patientPhone: r.patient_phone,
          serviceId: r.service_id,
          serviceName: r.service_name,
          doctor: r.doctor,
          date: r.date,
          time: r.time,
          price: Number(r.price),
          status: r.status,
          paymentId: r.payment_id,
          paymentLink: r.payment_link,
          pixCode: r.pix_code,
          createdAt: r.created_at,
          confirmedAt: r.confirmed_at,
          notes: r.notes,
        }));
      }

      if (slots.data && slots.data.length > 0) {
        this.slots = slots.data.map((r: any) => ({
          id: r.id,
          serviceId: r.service_id,
          doctor: r.doctor,
          date: r.date,
          time: r.time,
          isBooked: r.is_booked,
        }));
      }

      if (reminders.data && reminders.data.length > 0) {
        this.reminders = reminders.data.map((r: any) => ({
          id: r.id,
          appointmentId: r.appointment_id,
          patientName: r.patient_name,
          patientPhone: r.patient_phone,
          doctor: r.doctor,
          serviceName: r.service_name,
          date: r.date,
          time: r.time,
          type: r.type,
          status: r.status,
          scheduledFor: r.scheduled_for,
          sentAt: r.sent_at,
          responseReceivedAt: r.response_received_at,
          messageText: r.message_text,
        }));
      }

      if (config.data) {
        this.config = {
          clinicName: config.data.clinic_name,
          phone: config.data.phone,
          address: config.data.address,
          businessHours: config.data.business_hours,
          agencyPhone: config.data.agency_phone,
          paymentTimeoutMinutes: config.data.payment_timeout_minutes,
          cnpj: config.data.cnpj || undefined,
        };
      }

      console.log("[clinicDatabase] Estado hidratado a partir do Supabase.");
    } catch (error) {
      console.error("[clinicDatabase] Falha ao hidratar do Supabase, mantendo dados padrão em memória:", error);
    } finally {
      this.hydrated = true;
    }
  }

  /**
   * Grava o estado atual em memória de volta no Supabase (write-through).
   * Chamado em segundo plano (fire-and-forget) pelas rotas que alteram dados,
   * para que nada se perca entre invocações serverless.
   */
  public async persistSnapshot(): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      await Promise.all([
        supabaseAdmin.from("clinic_config").upsert({
          id: 1,
          clinic_name: this.config.clinicName,
          phone: this.config.phone,
          address: this.config.address,
          business_hours: this.config.businessHours,
          agency_phone: this.config.agencyPhone,
          payment_timeout_minutes: this.config.paymentTimeoutMinutes,
          cnpj: this.config.cnpj || null,
        }),
        this.services.length > 0
          ? supabaseAdmin.from("services").upsert(
              this.services.map((s) => ({
                id: s.id,
                name: s.name,
                category: s.category,
                type: s.type || "consulta",
                price: s.price,
                duration_minutes: s.durationMinutes,
                description: s.description,
                doctor: s.doctor,
                available_days: s.availableDays,
                work_start_hour: s.workStartHour,
                work_end_hour: s.workEndHour,
                preparation: s.preparation,
                result_deadline_hours: s.resultDeadlineHours,
              }))
            )
          : Promise.resolve(),
        this.appointments.length > 0
          ? supabaseAdmin.from("appointments").upsert(
              this.appointments.map((a) => ({
                id: a.id,
                patient_name: a.patientName,
                patient_phone: a.patientPhone,
                service_id: a.serviceId,
                service_name: a.serviceName,
                doctor: a.doctor,
                date: a.date,
                time: a.time,
                price: a.price,
                status: a.status,
                payment_id: a.paymentId,
                payment_link: a.paymentLink,
                pix_code: a.pixCode,
                confirmed_at: a.confirmedAt || null,
                notes: a.notes,
              }))
            )
          : Promise.resolve(),
        this.patients.length > 0
          ? supabaseAdmin.from("patients").upsert(
              this.patients.map((p) => ({
                id: p.id,
                name: p.name,
                phone: p.phone,
                cpf: p.cpf,
                birth_date: p.birthDate || null,
                email: p.email,
                gender: p.gender,
                blood_type: p.bloodType,
                allergies: p.allergies,
                chronic_conditions: p.chronicConditions,
                general_notes: p.generalNotes,
                total_appointments: p.totalAppointments,
                total_spent: p.totalSpent,
                last_visit: p.lastVisit || null,
              }))
            )
          : Promise.resolve(),
        this.reminders.length > 0
          ? supabaseAdmin.from("reminders").upsert(
              this.reminders.map((r) => ({
                id: r.id,
                appointment_id: r.appointmentId,
                patient_name: r.patientName,
                patient_phone: r.patientPhone,
                doctor: r.doctor,
                service_name: r.serviceName,
                date: r.date,
                time: r.time,
                type: r.type,
                status: r.status,
                scheduled_for: r.scheduledFor,
                sent_at: r.sentAt || null,
                response_received_at: r.responseReceivedAt || null,
                message_text: r.messageText,
              }))
            )
          : Promise.resolve(),
        this.slots.length > 0
          ? supabaseAdmin.from("availability_slots").upsert(
              this.slots.map((s) => ({
                id: s.id,
                service_id: s.serviceId,
                doctor: s.doctor,
                date: s.date,
                time: s.time,
                is_booked: s.isBooked,
              }))
            )
          : Promise.resolve(),
      ]);

      // Evoluções clínicas: upsert por paciente (tabela filha, id próprio já embutido no objeto)
      const allEvolutions = this.patients.flatMap((p) =>
        (p.clinicalHistory || []).map((e) => ({
          id: e.id,
          patient_id: p.id,
          date: e.date,
          doctor: e.doctor,
          diagnosis_or_reason: e.diagnosisOrReason,
          note: e.note,
          prescriptions: e.prescriptions,
        }))
      );
      if (allEvolutions.length > 0) {
        await supabaseAdmin.from("clinical_evolutions").upsert(allEvolutions);
      }
    } catch (error) {
      console.error("[clinicDatabase] Falha ao persistir snapshot no Supabase:", error);
    }
  }

  private seedInitialAppointments() {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    
    this.appointments.push(
      {
        id: "AG-1094",
        patientName: "Carlos Eduardo Silva",
        patientPhone: "5591981112233",
        serviceId: "clinico-geral",
        serviceName: "Clínico Geral (Consulta)",
        doctor: "Dr. Roberto Martins",
        date: todayStr,
        time: "09:15",
        price: 180,
        status: "confirmed_paid",
        paymentId: "MP-9841203",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        confirmedAt: new Date(Date.now() - 3600000 * 1.8).toISOString(),
        notes: "Paciente com histórico de hipertensão leve.",
      },
      {
        id: "AG-1095",
        patientName: "Juliana Mendes",
        patientPhone: "5591984445566",
        serviceId: "dermatologia",
        serviceName: "Dermatologia",
        doctor: "Dra. Camila Albuquerque",
        date: todayStr,
        time: "15:00",
        price: 240,
        status: "pending_payment",
        paymentId: "MP-9841244",
        paymentLink: "https://mpago.la/2Kj9z8m",
        pixCode: "00020126580014br.gov.bcb.pix0136clinicamedicasantaclara-pix-demo5204000053039865406240.005802BR5925CLINICA MEDICA SANTA CLARA6009BELEM62070503***6304E8A2",
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        notes: "Aguardando confirmação Pix.",
      }
    );
  }

  private seedInitialReminders() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    this.reminders = [
      {
        id: "rem-1",
        appointmentId: "AG-1094",
        patientName: "Carlos Eduardo Silva",
        patientPhone: "5591981112233",
        doctor: "Dr. Roberto Martins",
        serviceName: "Clínico Geral (Consulta)",
        date: tomorrowStr,
        time: "09:15",
        type: "d_minus_1",
        status: "confirmed_by_patient",
        scheduledFor: "2026-08-13T10:00:00.000Z",
        sentAt: "2026-08-13T10:00:15.000Z",
        responseReceivedAt: "2026-08-13T10:14:22.000Z",
        messageText: "Olá, Carlos! 👋 Passando para lembrar da sua consulta com Dr. Roberto Martins amanhã às 09:15 na Clínica Santa Clara. Responda '1' para confirmar presença ou '2' caso precise remarcar.",
      },
      {
        id: "rem-2",
        appointmentId: "AG-1095",
        patientName: "Juliana Mendes",
        patientPhone: "5591984445566",
        doctor: "Dra. Camila Albuquerque",
        serviceName: "Dermatologia",
        date: tomorrowStr,
        time: "15:00",
        type: "d_minus_1",
        status: "sent",
        scheduledFor: new Date(Date.now() - 1800000).toISOString(),
        sentAt: new Date(Date.now() - 1750000).toISOString(),
        messageText: "Olá, Juliana! 👋 Lembramos da sua consulta com Dra. Camila Albuquerque amanhã às 15:00 na Clínica Santa Clara. Por favor, confirme se poderá comparecer.",
      },
      {
        id: "rem-3",
        appointmentId: "AG-1098",
        patientName: "Mariana Costa",
        patientPhone: "5591992334455",
        doctor: "Dr. Marcelo Oliveira",
        serviceName: "Ortopedia",
        date: tomorrowStr,
        time: "16:30",
        type: "d_minus_1",
        status: "scheduled",
        scheduledFor: new Date(Date.now() + 3600000).toISOString(),
        messageText: "Olá, Mariana! 👋 Lembrete de consulta de Ortopedia com Dr. Marcelo Oliveira amanhã às 16:30. Responda SIM para confirmar presença.",
      },
    ];
  }

  public reset() {
    this.services = [...DEFAULT_SERVICES];
    this.exams = [...DEFAULT_LAB_EXAMS];
    this.patients = [...DEFAULT_PATIENTS];
    this.slots = generateInitialSlots(DEFAULT_SERVICES);
    this.appointments = [];
    this.quotes = [];
    this.toolLogs = [];
    this.seedInitialAppointments();
    this.seedInitialReminders();
  }

  public updateServices(newServices: ServiceItem[]) {
    this.services = [...newServices];
    this.slots = generateInitialSlots(newServices);
  }

  public updateExams(newExams: LabExamItem[]) {
    this.exams = [...newExams];
  }

  public updatePatients(newPatients: PatientRecord[]) {
    this.patients = [...newPatients];
  }

  public updatePatient(updatedPatient: PatientRecord) {
    const idx = this.patients.findIndex((p) => p.id === updatedPatient.id);
    if (idx !== -1) {
      this.patients[idx] = { ...this.patients[idx], ...updatedPatient };
    } else {
      this.patients.unshift(updatedPatient);
    }
    return this.patients.find((p) => p.id === updatedPatient.id) || null;
  }

  public addClinicalEvolution(patientId: string, evolution: Omit<ClinicalEvolution, "id">) {
    const patient = this.patients.find((p) => p.id === patientId);
    if (!patient) return null;

    if (!Array.isArray(patient.clinicalHistory)) {
      patient.clinicalHistory = [];
    }

    const newEv: ClinicalEvolution = {
      id: `ev-${Date.now()}`,
      ...evolution,
    };

    patient.clinicalHistory.unshift(newEv);
    patient.lastVisit = evolution.date;
    return newEv;
  }

  public updateClinicalEvolution(
    patientId: string,
    evolutionId: string,
    updated: Partial<Omit<ClinicalEvolution, "id">>
  ) {
    const patient = this.patients.find((p) => p.id === patientId);
    if (!patient || !Array.isArray(patient.clinicalHistory)) return null;

    const evIndex = patient.clinicalHistory.findIndex((e) => e.id === evolutionId);
    if (evIndex === -1) return null;

    patient.clinicalHistory[evIndex] = {
      ...patient.clinicalHistory[evIndex],
      ...updated,
    };
    return patient.clinicalHistory[evIndex];
  }

  public deleteClinicalEvolution(patientId: string, evolutionId: string) {
    const patient = this.patients.find((p) => p.id === patientId);
    if (!patient || !Array.isArray(patient.clinicalHistory)) return false;

    const initialLen = patient.clinicalHistory.length;
    patient.clinicalHistory = patient.clinicalHistory.filter((e) => e.id !== evolutionId);
    return patient.clinicalHistory.length < initialLen;
  }

  public sendReminder(reminderId: string) {
    const rem = this.reminders.find((r) => r.id === reminderId);
    if (!rem) return null;
    rem.status = "sent";
    rem.sentAt = new Date().toISOString();
    return rem;
  }

  public processReminderResponse(reminderId: string, action: "confirm" | "cancel") {
    const rem = this.reminders.find((r) => r.id === reminderId);
    if (!rem) return null;
    rem.status = action === "confirm" ? "confirmed_by_patient" : "cancelled_by_patient";
    rem.responseReceivedAt = new Date().toISOString();

    const apt = this.appointments.find((a) => a.id === rem.appointmentId);
    if (apt) {
      if (action === "confirm") {
        apt.status = "confirmed_paid";
        apt.notes = `${apt.notes || ""} [Presença confirmada pelo paciente via Lembrete WhatsApp]`.trim();
      } else {
        apt.status = "cancelled";
        apt.notes = `${apt.notes || ""} [Cancelado pelo paciente via resposta ao Lembrete WhatsApp]`.trim();
        // free slot
        const slot = this.slots.find((s) => s.date === apt.date && s.time === apt.time && s.doctor === apt.doctor);
        if (slot) slot.isBooked = false;
      }
    }
    return { reminder: rem, appointment: apt };
  }

  // Tool 6: Orçamento de Consultas e Exames Laboratoriais
  public orcarConsultasExames(
    itens: string[] | string,
    nomePaciente?: string,
    aplicarDescontoPix: boolean = true
  ) {
    const rawList = Array.isArray(itens)
      ? itens
      : (itens || "").split(/[,;\n+]/).map((i) => i.trim()).filter(Boolean);

    const foundItems: QuoteItem[] = [];
    let subtotal = 0;

    for (const rawItem of rawList) {
      const normalized = rawItem.toLowerCase().trim();
      if (!normalized) continue;

      // 1. Check in lab exams first
      const matchedExam = this.exams.find(
        (e) =>
          e.name.toLowerCase().includes(normalized) ||
          normalized.includes(e.name.toLowerCase()) ||
          normalized.includes(e.id)
      );

      if (matchedExam) {
        foundItems.push({
          id: matchedExam.id,
          name: matchedExam.name,
          type: "exame",
          price: matchedExam.price,
          doctorOrLab: "Laboratório Santa Clara",
          preparation: matchedExam.preparation,
        });
        subtotal += matchedExam.price;
        continue;
      }

      // 2. Check in doctor consultations
      const matchedService = this.services.find(
        (s) =>
          s.name.toLowerCase().includes(normalized) ||
          s.category.toLowerCase().includes(normalized) ||
          normalized.includes(s.name.toLowerCase()) ||
          normalized.includes(s.id) ||
          s.doctor.toLowerCase().includes(normalized)
      );

      if (matchedService) {
        foundItems.push({
          id: matchedService.id,
          name: matchedService.name,
          type: "consulta",
          price: matchedService.price,
          doctorOrLab: matchedService.doctor,
          preparation: "Trazer exames anteriores e documento com foto.",
        });
        subtotal += matchedService.price;
        continue;
      }

      // 3. Loose search
      const looseExam = this.exams.find((e) => {
        const words = normalized.split(/\s+/).filter((w) => w.length > 3);
        return words.some((w) => e.name.toLowerCase().includes(w));
      });

      if (looseExam) {
        foundItems.push({
          id: looseExam.id,
          name: looseExam.name,
          type: "exame",
          price: looseExam.price,
          doctorOrLab: "Laboratório Santa Clara",
          preparation: looseExam.preparation,
        });
        subtotal += looseExam.price;
        continue;
      }

      const looseService = this.services.find((s) => {
        const words = normalized.split(/\s+/).filter((w) => w.length > 3);
        return words.some((w) => s.name.toLowerCase().includes(w));
      });

      if (looseService) {
        foundItems.push({
          id: looseService.id,
          name: looseService.name,
          type: "consulta",
          price: looseService.price,
          doctorOrLab: looseService.doctor,
        });
        subtotal += looseService.price;
      }
    }

    // If combo of 3+ items or combo of consulta + exame, provide 5% bundle discount
    const hasCombo = foundItems.length >= 2;
    const discount = hasCombo ? Math.round(subtotal * 0.05) : 0;
    const total = Math.max(0, subtotal - discount);
    const pixDiscountTotal = Math.round(total * 0.95); // 5% extra on Pix

    const quoteId = `ORC-${Math.floor(1000 + Math.random() * 9000)}`;
    const pixCode = `00020126580014br.gov.bcb.pix0136clinicamedicasantaclara-pix-${quoteId}5204000053039865406${pixDiscountTotal.toFixed(2)}5802BR5925CLINICA MEDICA SANTA CLARA6009BELEM62070503***6304${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const paymentLink = `https://mpago.la/orc/${quoteId.toLowerCase()}`;

    const quoteResult: QuoteResult = {
      id: quoteId,
      patientName: nomePaciente || "Paciente",
      items: foundItems,
      subtotal,
      discount,
      total,
      pixDiscountTotal,
      createdAt: new Date().toISOString(),
      pixCode,
      paymentLink,
      notes: "Orçamento válido por 7 dias. Resultados de exames disponíveis online.",
    };

    if (foundItems.length > 0) {
      this.quotes.unshift(quoteResult);
      if (this.quotes.length > 30) this.quotes.pop();
    }

    const toolResult = {
      id_orcamento: quoteId,
      paciente: nomePaciente || "Paciente",
      total_itens: foundItems.length,
      itens_cotados: foundItems.map((it) => ({
        nome: it.name,
        tipo: it.type === "exame" ? "Exame Laboratorial" : "Consulta Médica",
        valor: `R$ ${it.price.toFixed(2)}`,
        preparo: it.preparation || "Sem preparo especial",
        responsavel: it.doctorOrLab,
      })),
      subtotal: `R$ ${subtotal.toFixed(2)}`,
      desconto_combo: discount > 0 ? `R$ ${discount.toFixed(2)} (5% desconto pacote)` : "Sem desconto",
      valor_total: `R$ ${total.toFixed(2)}`,
      valor_pix_com_desconto: `R$ ${pixDiscountTotal.toFixed(2)} (5% desconto à vista no Pix)`,
      link_pagamento: paymentLink,
      pix_copia_cola: pixCode,
      validade: "7 dias",
    };

    this.logTool("orcar_consultas_e_exames", { itens: rawList, nomePaciente }, toolResult);
    return toolResult;
  }

  // Tool 7: Consultar Tabela de Exames Laboratoriais
  public consultarExamesLaboratoriais(categoriaOuNome?: string) {
    const term = (categoriaOuNome || "").toLowerCase().trim();

    let filtered = this.exams;
    if (term) {
      filtered = this.exams.filter(
        (e) =>
          e.name.toLowerCase().includes(term) ||
          e.category.toLowerCase().includes(term) ||
          e.id.toLowerCase().includes(term)
      );
    }

    if (filtered.length === 0) {
      filtered = this.exams.filter((e) => e.popular);
    }

    const result = {
      total_encontrados: filtered.length,
      laboratorio: "Laboratório de Análises Clínicas Santa Clara",
      coleta: "Segunda a Sábado das 07:00 às 11:30 (Sem necessidade de agendamento prévio para coleta de sangue)",
      exames: filtered.map((e) => ({
        id: e.id,
        nome: e.name,
        categoria: e.category,
        preco: `R$ ${e.price.toFixed(2)}`,
        preparo: e.preparation,
        prazo_resultado: e.resultDeadline,
      })),
    };

    this.logTool("consultar_tabela_exames", { categoriaOuNome }, result);
    return result;
  }

  public createManualAppointment(data: {
    id?: string;
    patientName: string;
    patientPhone: string;
    serviceId: string;
    date: string;
    time: string;
    price?: number;
    status: "confirmed_paid" | "pending_payment";
    notes?: string;
  }): Appointment {
    const service = this.services.find((s) => s.id === data.serviceId) || this.services[0];
    
    // 1. Double-booking conflict check for the doctor/service on this date and time
    const existingConflict = this.appointments.find(
      (a) =>
        a.status !== "cancelled" &&
        (a.serviceId === service.id || (service.doctor && a.doctor === service.doctor)) &&
        a.date === data.date &&
        a.time === data.time &&
        (!data.id || a.id !== data.id)
    );
    if (existingConflict) {
      throw new Error(`O horário ${data.time} no dia ${data.date} já está reservado para o(a) paciente ${existingConflict.patientName}.`);
    }

    // 2. Prevent duplicate creation if matching ID already exists
    if (data.id) {
      const existingById = this.appointments.find((a) => a.id === data.id);
      if (existingById) {
        return existingById;
      }
    }

    const appointmentId = data.id || `AG-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalPrice = typeof data.price === "number" ? data.price : service.price;
    const paymentLink = `https://mpago.la/pay/${appointmentId.toLowerCase()}`;
    const pixCode = `00020126580014br.gov.bcb.pix0136clinicamedicasantaclara-pix-${appointmentId}5204000053039865406${finalPrice.toFixed(2)}5802BR5925CLINICA MEDICA SANTA CLARA6009BELEM62070503***6304${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const newApt: Appointment = {
      id: appointmentId,
      patientName: data.patientName.trim(),
      patientPhone: data.patientPhone.trim(),
      serviceId: service.id,
      serviceName: service.name,
      doctor: service.doctor,
      date: data.date,
      time: data.time,
      price: finalPrice,
      status: data.status,
      paymentId: `MP-${Math.floor(1000000 + Math.random() * 9000000)}`,
      paymentLink: data.status === "pending_payment" ? paymentLink : undefined,
      pixCode: data.status === "pending_payment" ? pixCode : undefined,
      createdAt: new Date().toISOString(),
      confirmedAt: data.status === "confirmed_paid" ? new Date().toISOString() : undefined,
      notes: data.notes || "Agendamento manual registrado na recepção",
    };

    // Mark slot as booked
    const slot = this.slots.find(
      (s) => (s.serviceId === service.id || (service.doctor && s.doctor === service.doctor)) && s.date === data.date && s.time === data.time
    );
    if (slot) slot.isBooked = true;

    this.appointments.unshift(newApt);

    // Auto-link or update patient record without creating duplicates
    const cleanPhone = data.patientPhone.replace(/\D/g, "");
    const cleanName = data.patientName.toLowerCase().trim();
    const existingPatient = this.patients.find(
      (p) => (cleanPhone && p.phone.replace(/\D/g, "") === cleanPhone) || p.name.toLowerCase().trim() === cleanName
    );
    if (!existingPatient) {
      this.patients.unshift({
        id: `pat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: data.patientName.trim(),
        phone: data.patientPhone.trim(),
        totalAppointments: 1,
        lastVisit: data.date,
        totalSpent: data.status === "confirmed_paid" ? finalPrice : 0,
        generalNotes: `Cadastrado na recepção via agendamento para ${service.name}`,
        clinicalHistory: [],
      });
    } else {
      existingPatient.totalAppointments = (existingPatient.totalAppointments || 0) + 1;
      existingPatient.lastVisit = data.date;
      if (data.status === "confirmed_paid") {
        existingPatient.totalSpent = (existingPatient.totalSpent || 0) + finalPrice;
      }
    }

    return newApt;
  }

  public updateConfig(partial: Partial<ClinicConfig>) {
    this.config = { ...this.config, ...partial };
  }

  public logTool(toolName: string, args: Record<string, any>, result: Record<string, any>, success: boolean = true) {
    const log: ToolLog = {
      id: `tool-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toLocaleTimeString("pt-BR"),
      toolName,
      arguments: args,
      result,
      success,
    };
    this.toolLogs.unshift(log);
    if (this.toolLogs.length > 50) this.toolLogs.pop();
    return log;
  }

  // Tool 1: Consultar horários
  /**
   * Expira em memória os agendamentos pendentes de pagamento vencidos, liberando o slot.
   * O Supabase já faz isso via pg_cron a cada 2 minutos (fonte da verdade), mas essa checagem
   * evita que a instância do servidor ofereça um horário "ocupado" só porque ainda não sincronizou.
   */
  private expireStaleAppointmentsInMemory(): void {
    const timeoutMs = (this.config.paymentTimeoutMinutes || 15) * 60 * 1000;
    const now = Date.now();

    for (const apt of this.appointments) {
      if (apt.status !== "pending_payment") continue;
      const createdAt = new Date(apt.createdAt).getTime();
      if (isNaN(createdAt) || now - createdAt < timeoutMs) continue;

      apt.status = "cancelled";
      apt.notes = `${apt.notes || ""} [Expirado automaticamente: pagamento não confirmado a tempo]`.trim();

      const slot = this.slots.find(
        (s) => s.serviceId === apt.serviceId && s.date === apt.date && s.time === apt.time
      );
      if (slot) slot.isBooked = false;
    }
  }

  public consultarHorarios(servico: string, dataPreferida?: string, medico?: string) {
    this.expireStaleAppointmentsInMemory();

    const normalizedServico = (servico || "").toLowerCase();
    const normalizedMedico = (medico || "").toLowerCase();

    // Find matching service
    const matchingService = this.services.find(
      (s) =>
        s.name.toLowerCase().includes(normalizedServico) ||
        s.category.toLowerCase().includes(normalizedServico) ||
        normalizedServico.includes(s.category.toLowerCase()) ||
        normalizedServico.includes(s.id)
    );

    let filteredSlots = this.slots.filter((slot) => !slot.isBooked);

    if (matchingService) {
      filteredSlots = filteredSlots.filter((slot) => slot.serviceId === matchingService.id);
    } else if (normalizedServico) {
      // try matching by doctor name or loose service name
      filteredSlots = filteredSlots.filter(
        (slot) =>
          slot.doctor.toLowerCase().includes(normalizedServico) ||
          slot.serviceId.toLowerCase().includes(normalizedServico)
      );
    }

    if (normalizedMedico) {
      filteredSlots = filteredSlots.filter((slot) => slot.doctor.toLowerCase().includes(normalizedMedico));
    }

    // Filter by date if specified
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    if (dataPreferida) {
      const lowerDate = dataPreferida.toLowerCase();
      if (lowerDate.includes("hoje") || lowerDate === todayStr) {
        filteredSlots = filteredSlots.filter((slot) => slot.date === todayStr);
      } else if (lowerDate.includes("amanhã") || lowerDate.includes("amanha")) {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];
        filteredSlots = filteredSlots.filter((slot) => slot.date === tomorrowStr);
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(dataPreferida)) {
        filteredSlots = filteredSlots.filter((slot) => slot.date === dataPreferida);
      } else if (/^\d{2}\/\d{2}/.test(dataPreferida)) {
        // e.g. 14/08
        const parts = dataPreferida.split("/");
        const day = parts[0].padStart(2, "0");
        const month = parts[1].padStart(2, "0");
        const year = today.getFullYear();
        const formatted = `${year}-${month}-${day}`;
        filteredSlots = filteredSlots.filter((slot) => slot.date === formatted);
      }
    }

    // Sort by date and time
    filteredSlots.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

    // Limit to next 8 available slots for clean WhatsApp presentation
    const availableSlots = filteredSlots.slice(0, 8).map((s) => {
      const srv = this.services.find((serv) => serv.id === s.serviceId);
      return {
        slot_id: s.id,
        data: s.date,
        horario: s.time,
        medico: s.doctor,
        servico: srv ? srv.name : s.serviceId,
        valor_reais: srv ? srv.price : 180,
      };
    });

    const result = {
      encontrados: availableSlots.length,
      servico_pesquisado: matchingService ? matchingService.name : servico,
      preco_consulta: matchingService ? `R$ ${matchingService.price.toFixed(2)}` : "Consulte serviço",
      horarios_disponiveis: availableSlots,
      aviso_pagamento: "Atenção: Os horários só são garantidos após a confirmação do pagamento via Pix/Mercado Pago.",
    };

    this.logTool("consultar_horarios_disponiveis", { servico, dataPreferida, medico }, result);
    return result;
  }

  // Tool 2: Criar agendamento
  public async criarAgendamento(
    nomePaciente: string,
    telefone: string,
    servico: string,
    dataHora: string,
    medico?: string
  ) {
    this.expireStaleAppointmentsInMemory();

    // Parse service — SEM fallback silencioso: se não achar um serviço real, é erro.
    const normalizedServico = (servico || "").toLowerCase().trim();
    const serviceObj = this.services.find(
      (s) =>
        s.name.toLowerCase().includes(normalizedServico) ||
        s.category.toLowerCase().includes(normalizedServico) ||
        (normalizedServico.length > 2 && normalizedServico.includes(s.id))
    );

    if (!serviceObj) {
      const result = {
        status_agendamento: "ERRO_SERVICO_NAO_IDENTIFICADO",
        erro: `Não foi possível identificar o serviço "${servico}" na lista de especialidades da clínica.`,
        orientacao_importante:
          "Pergunte ao paciente qual especialidade específica ele deseja (use o nome exato da lista de serviços), depois chame 'consultar_horarios_disponiveis' novamente antes de tentar agendar.",
      };
      this.logTool("criar_agendamento", { nomePaciente, telefone, servico, dataHora, medico }, result);
      return { result, appointment: undefined };
    }

    // Parse date and time
    let date = "";
    let time = "";

    if (dataHora.includes("T")) {
      const parts = dataHora.split("T");
      date = parts[0];
      time = parts[1].slice(0, 5);
    } else if (dataHora.includes(" ")) {
      const parts = dataHora.split(" ");
      date = parts[0];
      time = parts[1].slice(0, 5);
    } else {
      date = new Date().toISOString().split("T")[0];
      time = dataHora;
    }

    // Validação REAL de disponibilidade: o horário precisa existir na agenda e estar livre.
    // Isso é a trava de segurança contra a IA "inventar" data/hora sem checar antes.
    const matchingSlot = this.slots.find(
      (s) => s.serviceId === serviceObj.id && s.date === date && s.time === time
    );

    if (!matchingSlot || matchingSlot.isBooked) {
      const alternativas = this.slots
        .filter((s) => s.serviceId === serviceObj.id && !s.isBooked)
        .slice(0, 5)
        .map((s) => ({ data: s.date, hora: s.time }));

      const result = {
        status_agendamento: "ERRO_HORARIO_INDISPONIVEL",
        erro: matchingSlot
          ? `O horário ${date} às ${time} para ${serviceObj.name} já está ocupado.`
          : `O horário ${date} às ${time} não existe na agenda de ${serviceObj.name}.`,
        horarios_realmente_disponiveis: alternativas,
        orientacao_importante:
          "NÃO invente outro horário. Chame 'consultar_horarios_disponiveis' novamente e apresente ao paciente apenas os horários realmente livres listados aqui, para ele escolher um deles.",
      };
      this.logTool("criar_agendamento", { nomePaciente, telefone, servico, dataHora, medico }, result);
      return { result, appointment: undefined };
    }

    const doctorName = medico || serviceObj.doctor;
    const appointmentId = `AG-${Math.floor(1000 + Math.random() * 9000)}`;

    // Tenta gerar uma cobrança Pix REAL via Mercado Pago. Se a integração não estiver
    // configurada (ou a chamada falhar), cai para um código de demonstração — mas o
    // campo `pagamentoReal` deixa isso explícito para quem estiver lendo o resultado.
    const pixReal = await createPixPayment({
      amount: serviceObj.price,
      description: `${serviceObj.name} - ${doctorName} - ${this.config.clinicName}`,
      externalReference: appointmentId,
      payerFirstName: nomePaciente,
      expirationMinutes: this.config.paymentTimeoutMinutes,
    });

    const paymentId = pixReal?.paymentId || `DEMO-${Math.floor(1000000 + Math.random() * 9000000)}`;
    const paymentLink = pixReal?.ticketUrl || `https://mpago.la/pay/${appointmentId.toLowerCase()}`;
    const pixCode =
      pixReal?.qrCode ||
      `00020126580014br.gov.bcb.pix0136${this.config.clinicName.replace(/\s+/g, "").toLowerCase()}-pix-${appointmentId}5204000053039865406${serviceObj.price.toFixed(2)}5802BR5925${this.config.clinicName.slice(0, 25)}6009BELEM62070503***6304${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newAppointment: Appointment = {
      id: appointmentId,
      patientName: nomePaciente || "Paciente WhatsApp",
      patientPhone: telefone || "5591999998888",
      serviceId: serviceObj.id,
      serviceName: serviceObj.name,
      doctor: doctorName,
      date,
      time,
      price: serviceObj.price,
      status: "pending_payment",
      paymentId,
      paymentLink,
      pixCode,
      createdAt: new Date().toISOString(),
      notes: isPaymentConfigured
        ? `Criado automaticamente via WhatsApp IA Gemini — cobrança Pix real via ${activeProviderName}`
        : "Criado automaticamente via WhatsApp IA Gemini (MODO DEMO: nenhum provedor de pagamento configurado, código Pix é ilustrativo)",
    };

    // Marca o slot (já validado acima) como reservado
    matchingSlot.isBooked = true;

    this.appointments.unshift(newAppointment);

    const result = {
      status_agendamento: "RESERVADO_PENDENTE_PAGAMENTO",
      id_agendamento: appointmentId,
      paciente: nomePaciente,
      servico: serviceObj.name,
      medico: doctorName,
      data: date,
      horario: time,
      valor: `R$ ${serviceObj.price.toFixed(2)}`,
      link_pagamento: paymentLink,
      pix_copia_cola: pixCode,
      pagamento_real: isPaymentConfigured,
      tempo_limite_minutos: this.config.paymentTimeoutMinutes,
      orientacao_importante:
        `O horário NÃO está confirmado ainda. O paciente tem até ${this.config.paymentTimeoutMinutes} minutos para pagar pelo link ou Pix gerado. Assim que o pagamento for aprovado pelo Mercado Pago, a confirmação definitiva chegará automaticamente pelo WhatsApp.`,
    };

    this.logTool("criar_agendamento", { nomePaciente, telefone, servico, dataHora, medico }, result);
    return { result, appointment: newAppointment };
  }

  // Tool 3: Consultar status
  public consultarStatus(identificador: string) {
    const cleanId = (identificador || "").trim().toLowerCase();
    const cleanPhone = cleanId.replace(/\D/g, "");

    const apt = this.appointments.find(
      (a) =>
        a.id.toLowerCase() === cleanId ||
        a.patientPhone.replace(/\D/g, "").includes(cleanPhone) ||
        a.patientName.toLowerCase().includes(cleanId)
    );

    if (!apt) {
      const result = {
        encontrado: false,
        mensagem: "Nenhum agendamento ativo encontrado com os dados informados. Verifique o código ou nome/telefone.",
      };
      this.logTool("consultar_status_agendamento", { identificador }, result, false);
      return result;
    }

    const statusMap = {
      pending_payment: "Pendente de Pagamento (Horário pré-reservado, aguardando confirmação do Pix/Mercado Pago)",
      confirmed_paid: "CONFIRMADO E PAGO (Horário garantido na agenda do médico)",
      cancelled: "Cancelado",
      transferred: "Transferido para recepção humana",
    };

    const result = {
      encontrado: true,
      id_agendamento: apt.id,
      paciente: apt.patientName,
      servico: apt.serviceName,
      medico: apt.doctor,
      data: apt.date,
      horario: apt.time,
      valor: `R$ ${apt.price.toFixed(2)}`,
      status: statusMap[apt.status] || apt.status,
      link_pagamento_ativo: apt.status === "pending_payment" ? apt.paymentLink : null,
      pix_ativo: apt.status === "pending_payment" ? apt.pixCode : null,
    };

    this.logTool("consultar_status_agendamento", { identificador }, result);
    return result;
  }

  // Tool 4: Cancelar agendamento
  public cancelarAgendamento(identificador: string, motivo?: string) {
    const cleanId = (identificador || "").trim().toLowerCase();
    const cleanPhone = cleanId.replace(/\D/g, "");

    const aptIndex = this.appointments.findIndex(
      (a) =>
        a.id.toLowerCase() === cleanId ||
        a.patientPhone.replace(/\D/g, "").includes(cleanPhone) ||
        a.patientName.toLowerCase().includes(cleanId)
    );

    if (aptIndex === -1) {
      const result = {
        sucesso: false,
        mensagem: "Não foi possível localizar o agendamento para cancelamento.",
      };
      this.logTool("cancelar_agendamento", { identificador, motivo }, result, false);
      return result;
    }

    const apt = this.appointments[aptIndex];
    apt.status = "cancelled";
    apt.notes = `Cancelado via WhatsApp IA. Motivo: ${motivo || "Solicitado pelo paciente"}`;

    // Free up slot
    const slot = this.slots.find(
      (s) => s.serviceId === apt.serviceId && s.date === apt.date && s.time === apt.time
    );
    if (slot) {
      slot.isBooked = false;
    }

    const result = {
      sucesso: true,
      id_agendamento: apt.id,
      paciente: apt.patientName,
      servico: apt.serviceName,
      data_liberada: `${apt.date} às ${apt.time}`,
      mensagem: "Agendamento cancelado com sucesso. O horário foi liberado no sistema.",
    };

    this.logTool("cancelar_agendamento", { identificador, motivo }, result);
    return result;
  }

  // Tool 5: Transferir para humano
  public transferirAtendimentoHumano(motivo: string, resumo?: string) {
    const protocolo = `PROT-${Math.floor(100000 + Math.random() * 900000)}`;
    const result = {
      transferido: true,
      protocolo,
      motivo_transferencia: motivo,
      resumo_conversa: resumo || "Paciente com solicitação que necessita de avaliação da recepção.",
      telefone_recepcao: this.config.phone,
      agencia_suporte: this.config.agencyPhone,
      mensagem: `Atendimento transferido para a equipe humana. Protocolo gerado: ${protocolo}. Um atendente da clínica entrará em contato em instantes neste mesmo chat.`,
    };

    this.logTool("transferir_atendimento_humano", { motivo, resumo }, result);
    return result;
  }

  // Webhook Mercado Pago Simulator
  public processMercadoPagoPayment(appointmentId: string) {
    const apt = this.appointments.find((a) => a.id === appointmentId);
    if (!apt) return null;

    apt.status = "confirmed_paid";
    apt.confirmedAt = new Date().toISOString();
    apt.notes = "Pagamento confirmado automaticamente via Webhook Mercado Pago (Pix Aprovado)";

    return {
      appointment: apt,
      whatsappMessage: `🎉 *PAGAMENTO CONFIRMADO!* ✅\n\nOlá *${apt.patientName}*, seu agendamento para *${apt.serviceName}* com *${apt.doctor}* está *CONFIRMADO*!\n\n📅 *Data:* ${apt.date}\n⏰ *Horário:* ${apt.time}\n📍 *Local:* ${this.config.clinicName} (${this.config.address})\n\nPor favor, chegue com 10 minutos de antecedência e traga um documento com foto. Qualquer dúvida, estamos à disposição! 🏥`,
    };
  }
}

export const clinicDb = new ClinicDatabase();
