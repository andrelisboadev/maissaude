import {
  ServiceItem,
  AvailabilitySlot,
  Appointment,
  ClinicConfig,
  ToolLog,
  LabExamItem,
  QuoteResult,
  QuoteItem,
  PatientRecord,
  ReminderItem,
  ClinicalEvolution,
  ClinicUser,
} from "../types";

export const DEFAULT_USERS: ClinicUser[] = [
  {
    id: "usr-admin-1",
    name: "Administrador Geral (Diretoria)",
    email: "admin@santaclara.com.br",
    role: "admin",
    phone: "(91) 3245-8800",
    pin: "1234",
    status: "active",
    createdAt: "2026-01-10T08:00:00.000Z",
    lastLogin: "2026-08-16T14:30:00.000Z",
  },
  {
    id: "usr-recep-1",
    name: "Ana Clara & Recepção Central",
    email: "recepcao@santaclara.com.br",
    role: "receptionist",
    phone: "(91) 3245-8801",
    pin: "1234",
    status: "active",
    createdAt: "2026-01-15T08:00:00.000Z",
    lastLogin: "2026-08-16T15:10:00.000Z",
  },
  {
    id: "usr-doc-clinico",
    name: "Dr. Roberto Martins",
    email: "roberto.martins@santaclara.com.br",
    role: "doctor",
    doctorId: "clinico-geral",
    doctorName: "Dr. Roberto Martins",
    crm: "14205/PA",
    specialty: "Clínico Geral",
    phone: "(91) 98111-2001",
    pin: "1420",
    status: "active",
    createdAt: "2026-01-20T08:00:00.000Z",
    lastLogin: "2026-08-16T11:00:00.000Z",
  },
  {
    id: "usr-doc-endo",
    name: "Dra. Juliana Paes",
    email: "juliana.paes@santaclara.com.br",
    role: "doctor",
    doctorId: "endocrinologia",
    doctorName: "Dra. Juliana Paes",
    crm: "18942/PA",
    specialty: "Endocrinologia & Metabologia",
    phone: "(91) 98111-2002",
    pin: "1894",
    status: "active",
    createdAt: "2026-01-20T08:00:00.000Z",
    lastLogin: "2026-08-15T16:20:00.000Z",
  },
  {
    id: "usr-doc-cardio",
    name: "Dra. Mariana Costa",
    email: "mariana.costa@santaclara.com.br",
    role: "doctor",
    doctorId: "cardiologia",
    doctorName: "Dra. Mariana Costa",
    crm: "11230/PA",
    specialty: "Cardiologia",
    phone: "(91) 98111-2003",
    pin: "1123",
    status: "active",
    createdAt: "2026-01-20T08:00:00.000Z",
    lastLogin: "2026-08-16T09:40:00.000Z",
  },
  {
    id: "usr-doc-dermato",
    name: "Dra. Camila Albuquerque",
    email: "camila.albuquerque@santaclara.com.br",
    role: "doctor",
    doctorId: "dermatologia",
    doctorName: "Dra. Camila Albuquerque",
    crm: "16780/PA",
    specialty: "Dermatologia",
    phone: "(91) 98111-2004",
    pin: "1678",
    status: "active",
    createdAt: "2026-01-20T08:00:00.000Z",
    lastLogin: "2026-08-14T14:15:00.000Z",
  },
  {
    id: "usr-doc-odonto",
    name: "Dr. Felipe Santana",
    email: "felipe.santana@santaclara.com.br",
    role: "doctor",
    doctorId: "odontologia",
    doctorName: "Dr. Felipe Santana",
    crm: "CRO 9412/PA",
    specialty: "Odontologia & Avaliação",
    phone: "(91) 98111-2005",
    pin: "9412",
    status: "active",
    createdAt: "2026-02-01T08:00:00.000Z",
    lastLogin: "2026-08-15T18:00:00.000Z",
  },
  {
    id: "usr-doc-pediatria",
    name: "Dra. Ana Paula Carvalho",
    email: "anapaula.carvalho@santaclara.com.br",
    role: "doctor",
    doctorId: "pediatria",
    doctorName: "Dra. Ana Paula Carvalho",
    crm: "15302/PA",
    specialty: "Pediatria",
    phone: "(91) 98111-2006",
    pin: "1530",
    status: "active",
    createdAt: "2026-02-01T08:00:00.000Z",
    lastLogin: "2026-08-16T10:20:00.000Z",
  },
  {
    id: "usr-doc-orto",
    name: "Dr. Marcelo Oliveira",
    email: "marcelo.oliveira@santaclara.com.br",
    role: "doctor",
    doctorId: "ortopedia",
    doctorName: "Dr. Marcelo Oliveira",
    crm: "12891/PA",
    specialty: "Ortopedia & Traumatologia",
    phone: "(91) 98111-2007",
    pin: "1289",
    status: "active",
    createdAt: "2026-02-01T08:00:00.000Z",
    lastLogin: "2026-08-16T08:45:00.000Z",
  },
];

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

export const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: "clinico-geral",
    name: "Clínico Geral (Consulta)",
    category: "Medicina Geral",
    price: 180,
    durationMinutes: 30,
    description: "Avaliação médica preventiva, exames de rotina e diagnóstico clínico.",
    doctor: "Dr. Roberto Martins",
    crm: "14205/PA",
    specialtyDetails: "Medicina preventiva, check-up anual, controle de pressão arterial (hipertensão) e sintomas gerais.",
    availableDays: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
    workStartHour: "08:00",
    workEndHour: "18:00",
  },
  {
    id: "endocrinologia",
    name: "Endocrinologia & Metabologia",
    category: "Especialidades",
    price: 280,
    durationMinutes: 40,
    description: "Diagnóstico e tratamento de doenças hormonais, tireoide, metabolismo e diabetes.",
    doctor: "Dra. Juliana Paes",
    crm: "18942/PA",
    specialtyDetails: "Especialista em tireoide (hipotireoidismo, hipertireoidismo, nódulos), diabetes mellitus, obesidade, reposição hormonal e distúrbios da hipófise/adrenais.",
    availableDays: ["Segunda", "Terça", "Quinta"],
    workStartHour: "08:30",
    workEndHour: "17:30",
  },
  {
    id: "cardiologia",
    name: "Cardiologia (Consulta + ECG)",
    category: "Especialidades",
    price: 260,
    durationMinutes: 40,
    description: "Consulta cardiológica completa com avaliação eletrocardiográfica.",
    doctor: "Dra. Mariana Costa",
    crm: "11230/PA",
    specialtyDetails: "Especialista em saúde cardiovascular, hipertensão arterial resistente, arritmias, insuficiência cardíaca e risco cirúrgico.",
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
    crm: "16780/PA",
    specialtyDetails: "Especialista em dermatite, psoríase, acne, melasma, queda de cabelo e mapeamento de sinais/câncer de pele.",
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
    crm: "CRO 9412/PA",
    specialtyDetails: "Profilaxia, clareamento, restaurações estéticas, endodontia e avaliação de saúde bucal.",
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
    crm: "15540/PA",
    specialtyDetails: "Puericultura, desenvolvimento neuropsicomotor, vacinação e controle de infecções respiratórias infantis.",
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
    crm: "CRN 6520/PA",
    specialtyDetails: "Emagrecimento sustentável, hipertrofia, nutrição para diabéticos, dislipidemias e reeducação alimentar.",
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
    preparation: "Jejum de 12 horas. Evitar álcool 72h antes",
    resultDeadline: "24 horas úteis",
    popular: true,
  },
  {
    id: "tsh-t4-livre",
    name: "TSH Ultra Sensível + T4 Livre (Tireoide)",
    category: "Genético / Hormonal",
    price: 75,
    preparation: "Jejum de 4 horas",
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
    preparation: "1ª urina da manhã após higiene íntima",
    resultDeadline: "24 horas úteis",
    popular: true,
  },
  {
    id: "parasitologico-fezes",
    name: "Exame Parasitológico de Fezes (EPF)",
    category: "Urina / Fezes",
    price: 30,
    preparation: "Coletar amostra em frasco estéril próprio",
    resultDeadline: "24 horas úteis",
  },
  {
    id: "ecg-repouso",
    name: "Eletrocardiograma (ECG em Repouso)",
    category: "Cardiológico",
    price: 80,
    preparation: "Sem necessidade de jejum",
    resultDeadline: "Laudo no mesmo dia",
    popular: true,
  },
  {
    id: "ecocardiograma",
    name: "Ecocardiograma Transtorácico com Doppler",
    category: "Cardiológico",
    price: 220,
    preparation: "Não requer jejum",
    resultDeadline: "Laudo em até 24 horas",
  },
  {
    id: "usg-abdominal-total",
    name: "Ultrassonografia de Abdome Total",
    category: "Imagem / Ultrassom",
    price: 160,
    preparation: "Jejum de 6 a 8 horas + bexiga cheia (beber água 1h antes)",
    resultDeadline: "Laudo com imagens no mesmo dia",
    popular: true,
  },
  {
    id: "usg-tireoide",
    name: "Ultrassonografia de Tireoide com Doppler",
    category: "Imagem / Ultrassom",
    price: 140,
    preparation: "Não requer jejum prévio",
    resultDeadline: "Laudo no mesmo dia",
  },
  {
    id: "checkup-basico",
    name: "Combo Check-up Básico (Hemograma + Glicemia + Lipídico + EAS + Creatinina + Ácido Úrico)",
    category: "Sangue / Bioquímica",
    price: 180,
    preparation: "Jejum de 12 horas + coleta de urina",
    resultDeadline: "24 a 48 horas úteis",
    popular: true,
  },
  {
    id: "checkup-cardio",
    name: "Combo Check-up Cardiológico (Consulta Cardiologista + ECG + Perfil Lipídico + Glicemia)",
    category: "Cardiológico",
    price: 340,
    preparation: "Jejum de 12 horas para sangue e consulta agendada",
    resultDeadline: "Laudo imediato do ECG + exames em 24h",
    popular: true,
  },
];

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function generateClientSlots(services: ServiceItem[]): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];
  const today = new Date();

  for (let d = 0; d < 14; d++) {
    const slotDate = new Date(today);
    slotDate.setDate(today.getDate() + d);
    const dayOfWeekName = DAY_NAMES[slotDate.getDay()];
    if (dayOfWeekName === "Domingo") continue;

    const dateStr = slotDate.toISOString().split("T")[0];

    services.forEach((service) => {
      const allowedDays = service.availableDays || ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
      if (!allowedDays.includes(dayOfWeekName)) {
        return;
      }

      // Parse start and end times
      const startParts = (service.workStartHour || "08:00").split(":");
      const endParts = (service.workEndHour || "18:00").split(":");
      
      const startMinutes = parseInt(startParts[0] || "8", 10) * 60 + parseInt(startParts[1] || "0", 10);
      const endMinutes = parseInt(endParts[0] || "18", 10) * 60 + parseInt(endParts[1] || "0", 10);
      const duration = Math.max(15, service.durationMinutes || 30);

      const generatedTimes: string[] = [];
      for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
        // Skip lunch break 12:00 - 13:00 if full day schedule (> 6 hours)
        if (endMinutes - startMinutes >= 360 && m >= 720 && m < 780) {
          continue;
        }
        const h = Math.floor(m / 60);
        const min = m % 60;
        const timeStr = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
        generatedTimes.push(timeStr);
      }

      const timesToUse = generatedTimes.length > 0 ? generatedTimes : ["09:00", "10:00", "14:00", "15:00", "16:00"];

      timesToUse.forEach((time, tIndex) => {
        // Pre-book a few demo slots for realistic experience on first days
        const isBooked = (d === 0 && (tIndex === 1 || tIndex === 3)) || (d === 1 && tIndex === 2);
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

export function deduplicateAppointments(list: Appointment[]): Appointment[] {
  if (!Array.isArray(list)) return [];
  const seenIds = new Set<string>();
  const seenSlotKeys = new Set<string>();
  const result: Appointment[] = [];

  for (const apt of list) {
    if (!apt || !apt.id) continue;
    if (seenIds.has(apt.id)) continue;
    seenIds.add(apt.id);

    // If active appointment for same doctor/date/time already exists, prevent duplicate
    const slotKey = `${apt.doctor || apt.serviceName || apt.serviceId}_${apt.date}_${apt.time}`;
    if (apt.status !== "cancelled") {
      if (seenSlotKeys.has(slotKey)) {
        continue;
      }
      seenSlotKeys.add(slotKey);
    }
    result.push(apt);
  }
  return result;
}

export function deduplicatePatients(list: PatientRecord[]): PatientRecord[] {
  if (!Array.isArray(list)) return [];
  const seenIds = new Set<string>();
  const seenKeys = new Set<string>();
  const result: PatientRecord[] = [];

  for (const pat of list) {
    if (!pat || !pat.id) continue;
    if (seenIds.has(pat.id)) continue;
    seenIds.add(pat.id);

    const cleanPhone = (pat.phone || "").replace(/\D/g, "");
    const cleanName = (pat.name || "").toLowerCase().trim();
    const key = cleanPhone ? `phone_${cleanPhone}` : `name_${cleanName}`;
    if (cleanPhone || cleanName) {
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
    }
    result.push(pat);
  }
  return result;
}

export class ClientClinicEngine {
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
  public slots: AvailabilitySlot[] = generateClientSlots(DEFAULT_SERVICES);
  public appointments: Appointment[] = [];
  public quotes: QuoteResult[] = [];
  public toolLogs: ToolLog[] = [];
  public users: ClinicUser[] = [...DEFAULT_USERS];

  constructor() {
    this.loadFromStorage();
    if (this.appointments.length === 0) {
      this.seed();
    }
    if (this.reminders.length === 0) {
      this.seedReminders();
    }
    this.saveToStorage();
  }

  private loadFromStorage() {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const savedApts = localStorage.getItem("clinic_appointments");
        if (savedApts) {
          const parsed = JSON.parse(savedApts);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.appointments = deduplicateAppointments(parsed);
          }
        }

        const savedPatients = localStorage.getItem("clinic_patients");
        if (savedPatients) {
          const parsed = JSON.parse(savedPatients);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.patients = deduplicatePatients(parsed);
          }
        }

        const savedUsers = localStorage.getItem("clinic_users");
        if (savedUsers) {
          const parsedUsers = JSON.parse(savedUsers);
          if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
            this.users = parsedUsers;
          }
        }

        const savedServices = localStorage.getItem("clinic_services");
        if (savedServices) {
          const parsed = JSON.parse(savedServices);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.services = parsed;
            this.slots = generateClientSlots(parsed);
          }
        }

        const savedConfig = localStorage.getItem("clinic_config");
        if (savedConfig) {
          const parsed = JSON.parse(savedConfig);
          if (parsed && typeof parsed === "object") {
            this.config = { ...this.config, ...parsed };
          }
        }

        const savedReminders = localStorage.getItem("clinic_reminders");
        if (savedReminders) {
          const parsed = JSON.parse(savedReminders);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.reminders = parsed;
          }
        }
      }
    } catch (e) {
      console.warn("Could not load from localStorage:", e);
    }
  }

  public saveToStorage() {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        this.appointments = deduplicateAppointments(this.appointments);
        this.patients = deduplicatePatients(this.patients);

        localStorage.setItem("clinic_appointments", JSON.stringify(this.appointments));
        localStorage.setItem("clinic_patients", JSON.stringify(this.patients));
        localStorage.setItem("clinic_users", JSON.stringify(this.users));
        localStorage.setItem("clinic_services", JSON.stringify(this.services));
        localStorage.setItem("clinic_config", JSON.stringify(this.config));
        localStorage.setItem("clinic_reminders", JSON.stringify(this.reminders));
      }
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  }

  public addUser(user: ClinicUser): ClinicUser {
    const existingIndex = this.users.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
    if (existingIndex >= 0) {
      this.users[existingIndex] = { ...this.users[existingIndex], ...user };
    } else {
      this.users.unshift(user);
    }
    this.saveToStorage();
    return user;
  }

  public updateUser(id: string, updates: Partial<ClinicUser>): ClinicUser | null {
    const index = this.users.findIndex((u) => u.id === id);
    if (index >= 0) {
      this.users[index] = { ...this.users[index], ...updates };
      this.saveToStorage();
      return this.users[index];
    }
    return null;
  }

  public deleteUser(id: string): boolean {
    const lenBefore = this.users.length;
    this.users = this.users.filter((u) => u.id !== id);
    this.saveToStorage();
    return this.users.length < lenBefore;
  }

  public authenticateUser(identifier: string, pin?: string): { success: boolean; user?: ClinicUser; message?: string } {
    const cleanId = identifier.trim().toLowerCase();
    const user = this.users.find(
      (u) => u.email.toLowerCase() === cleanId || u.id === cleanId || u.name.toLowerCase().includes(cleanId)
    );

    if (!user) {
      return { success: false, message: "Usuário não encontrado na clínica." };
    }

    if (user.status === "inactive") {
      return { success: false, message: "Este usuário está inativo no sistema. Contate a administração." };
    }

    if (pin && user.pin && user.pin !== pin) {
      return { success: false, message: "Senha / PIN de acesso incorreto." };
    }

    // Update lastLogin
    user.lastLogin = new Date().toISOString();
    this.saveToStorage();

    return { success: true, user };
  }

  private seed() {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    this.appointments = [
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
        pixCode:
          "00020126580014br.gov.bcb.pix0136clinicamedicasantaclara-pix-demo5204000053039865406240.005802BR5925CLINICA MEDICA SANTA CLARA6009BELEM62070503***6304E8A2",
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        notes: "Aguardando confirmação Pix.",
      },
    ];

    this.quotes = [
      {
        id: "ORC-7412",
        patientName: "Marcos Vinicius",
        items: [
          {
            id: "hemograma-completo",
            name: "Hemograma Completo",
            type: "exame",
            price: 35,
            doctorOrLab: "Laboratório Santa Clara",
            preparation: "Jejum recomendado de 4 horas",
          },
          {
            id: "glicemia-jejum",
            name: "Glicemia em Jejum",
            type: "exame",
            price: 25,
            doctorOrLab: "Laboratório Santa Clara",
            preparation: "Jejum obrigatório de 8 a 12 horas",
          },
          {
            id: "perfil-lipidico",
            name: "Perfil Lipídico / Colesterol Total",
            type: "exame",
            price: 55,
            doctorOrLab: "Laboratório Santa Clara",
            preparation: "Jejum de 12 horas",
          },
        ],
        subtotal: 115,
        discount: 6,
        total: 109,
        pixDiscountTotal: 104,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        pixCode: "00020126580014br.gov.bcb.pix0136clinicamedicasantaclara-pix-orc74125204000053039865406104.005802BR5925CLINICA MEDICA SANTA CLARA6009BELEM62070503***6304ORC1",
        paymentLink: "https://mpago.la/orc/orc-7412",
        notes: "Orçamento de rotina anual gerado no WhatsApp",
      },
    ];
  }

  private seedReminders() {
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
    this.slots = generateClientSlots(DEFAULT_SERVICES);
    this.appointments = [];
    this.quotes = [];
    this.toolLogs = [];
    this.seed();
    this.seedReminders();
  }

  public updateServices(newServices: ServiceItem[]) {
    this.services = [...newServices];
    this.slots = generateClientSlots(newServices);
  }

  public updateExams(newExams: LabExamItem[]) {
    this.exams = [...newExams];
  }

  public updatePatients(newPatients: PatientRecord[]) {
    this.patients = [...newPatients];
    this.saveToStorage();
  }

  public updatePatient(updatedPatient: PatientRecord) {
    const idx = this.patients.findIndex((p) => p.id === updatedPatient.id);
    if (idx !== -1) {
      this.patients[idx] = { ...this.patients[idx], ...updatedPatient };
    } else {
      this.patients.unshift(updatedPatient);
    }
    this.saveToStorage();
    return this.patients.find((p) => p.id === updatedPatient.id) || null;
  }

  public updatePatientNotes(patientId: string, generalNotes: string, allergies?: string[], chronicConditions?: string[]) {
    const patient = this.patients.find((p) => p.id === patientId);
    if (!patient) return null;
    patient.generalNotes = generalNotes;
    if (allergies) patient.allergies = allergies;
    if (chronicConditions) patient.chronicConditions = chronicConditions;
    this.saveToStorage();
    return patient;
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
    this.saveToStorage();
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
    this.saveToStorage();
    return patient.clinicalHistory[evIndex];
  }

  public deleteClinicalEvolution(patientId: string, evolutionId: string) {
    const patient = this.patients.find((p) => p.id === patientId);
    if (!patient || !Array.isArray(patient.clinicalHistory)) return false;

    const initialLen = patient.clinicalHistory.length;
    patient.clinicalHistory = patient.clinicalHistory.filter((e) => e.id !== evolutionId);
    this.saveToStorage();
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
        const slot = this.slots.find((s) => s.date === apt.date && s.time === apt.time && s.doctor === apt.doctor);
        if (slot) slot.isBooked = false;
      }
    }
    return { reminder: rem, appointment: apt };
  }

  public orcarConsultasExames(
    itens: string[] | string,
    nomePaciente?: string
  ) {
    const rawList = Array.isArray(itens)
      ? itens
      : (itens || "").split(/[,;\n+]/).map((i) => i.trim()).filter(Boolean);

    const foundItems: QuoteItem[] = [];
    let subtotal = 0;

    for (const rawItem of rawList) {
      const normalized = rawItem.toLowerCase().trim();
      if (!normalized) continue;

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

    const hasCombo = foundItems.length >= 2;
    const discount = hasCombo ? Math.round(subtotal * 0.05) : 0;
    const total = Math.max(0, subtotal - discount);
    const pixDiscountTotal = Math.round(total * 0.95);

    const quoteId = `ORC-${Math.floor(1000 + Math.random() * 9000)}`;
    const pixCode = `00020126580014br.gov.bcb.pix0136clinicamedicasantaclara-pix-${quoteId}5204000053039865406${pixDiscountTotal.toFixed(2)}5802BR5925CLINICA MEDICA SANTA CLARA6009BELEM62070503***6304${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
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
    
    // 1. Double-booking conflict validation for the same doctor/specialty at the specified date & time
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

    // 2. If appointment with identical ID already exists, return existing
    if (data.id) {
      const existingById = this.appointments.find((a) => a.id === data.id);
      if (existingById) {
        return existingById;
      }
    }

    const appointmentId = data.id || `AG-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalPrice = typeof data.price === "number" ? data.price : service.price;
    const paymentLink = `https://mpago.la/pay/${appointmentId.toLowerCase()}`;
    const pixCode = `00020126580014br.gov.bcb.pix0136clinicamedicasantaclara-pix-${appointmentId}5204000053039865406${finalPrice.toFixed(2)}5802BR5925CLINICA MEDICA SANTA CLARA6009BELEM62070503***6304${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

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

    // Mark slot as booked if exists
    const slot = this.slots.find(
      (s) => (s.serviceId === service.id || (service.doctor && s.doctor === service.doctor)) && s.date === data.date && s.time === data.time
    );
    if (slot) slot.isBooked = true;

    this.appointments.unshift(newApt);

    // Auto-link or create patient record (prevent duplicate names/phones)
    const cleanPhone = data.patientPhone.replace(/\D/g, "");
    const cleanName = data.patientName.toLowerCase().trim();
    const existingPatient = this.patients.find(
      (p) => (cleanPhone && p.phone.replace(/\D/g, "") === cleanPhone) || p.name.toLowerCase().trim() === cleanName
    );
    if (!existingPatient) {
      const newPatient: PatientRecord = {
        id: `pat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: data.patientName.trim(),
        phone: data.patientPhone.trim(),
        totalAppointments: 1,
        lastVisit: data.date,
        totalSpent: data.status === "confirmed_paid" ? finalPrice : 0,
        generalNotes: `Cadastrado na recepção via agendamento para ${service.name}`,
        clinicalHistory: [],
      };
      this.patients.unshift(newPatient);
    } else {
      existingPatient.totalAppointments = (existingPatient.totalAppointments || 0) + 1;
      existingPatient.lastVisit = data.date;
      if (data.status === "confirmed_paid") {
        existingPatient.totalSpent = (existingPatient.totalSpent || 0) + finalPrice;
      }
    }

    this.saveToStorage();
    return newApt;
  }

  public logTool(toolName: string, args: Record<string, any>, result: Record<string, any>, success = true) {
    const log: ToolLog = {
      id: `tool-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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

  public processMessage(userMessage: string, patientPhone: string, patientName?: string) {
    const startTime = Date.now();
    const lower = userMessage.toLowerCase();
    const toolCallsExecuted: Array<{ name: string; args: any; result: any }> = [];
    let reply = "";
    let appointmentCreated: Appointment | undefined = undefined;
    let transferredToHuman = false;

    // Rule: Medical doubts, emergency, discount negotiation, or Elderly / Low literacy Human Assistance Request
    if (
      lower.includes("remédio") ||
      lower.includes("remedio") ||
      lower.includes("medicamento") ||
      lower.includes("dor no peito") ||
      lower.includes("febre alta") ||
      lower.includes("desconto") ||
      lower.includes("mais barato") ||
      lower.includes("negociar") ||
      lower.includes("falar com atendente") ||
      lower.includes("falar com humano") ||
      lower.includes("humano") ||
      lower.includes("pessoa") ||
      lower.includes("atendente") ||
      lower.includes("atendente humano") ||
      lower.includes("ajuda de um humano") ||
      lower.includes("ajuda humana") ||
      lower.includes("auxílio") ||
      lower.includes("auxilio") ||
      lower.includes("ajuda para agendar") ||
      lower.includes("não sei agendar") ||
      lower.includes("nao sei agendar") ||
      lower.includes("não sei mexer") ||
      lower.includes("nao sei mexer") ||
      lower.includes("sou idoso") ||
      lower.includes("sou idosa") ||
      lower.includes("idoso") ||
      lower.includes("idosa") ||
      lower.includes("terceira idade") ||
      lower.includes("ligar") ||
      lower.includes("me liga") ||
      lower.includes("liguem para mim") ||
      lower.includes("telefone") ||
      lower === "0" ||
      lower.includes("opção 0") ||
      lower.includes("opcao 0") ||
      lower.includes("falar com alguém") ||
      lower.includes("falar com alguem") ||
      lower.includes("dificuldade") ||
      lower.includes("reclamação") ||
      lower.includes("reclamacao")
    ) {
      let motivo = "Solicitação de auxílio com atendente humano";
      if (lower.includes("desconto") || lower.includes("mais barato") || lower.includes("negociar")) {
        motivo = "Negociação de desconto / condições financeiras";
      } else if (lower.includes("remédio") || lower.includes("medicamento")) {
        motivo = "Dúvida médica sobre prescrição ou medicação";
      } else if (lower.includes("dor") || lower.includes("febre")) {
        motivo = "Sintoma clínico / triagem médica de urgência";
      } else if (
        lower.includes("idoso") ||
        lower.includes("idosa") ||
        lower.includes("ajuda") ||
        lower.includes("auxilio") ||
        lower.includes("auxílio") ||
        lower.includes("ligar") ||
        lower.includes("mexer") ||
        lower === "0"
      ) {
        motivo = "Auxílio para agendamento com recepcionista humana (Acessibilidade / Idosos)";
      }

      const protocolo = `PROT-${Math.floor(100000 + Math.random() * 900000)}`;
      const res = {
        transferido: true,
        protocolo,
        motivo_transferencia: motivo,
        telefone_recepcao: this.config.phone,
      };
      transferredToHuman = true;
      this.logTool("transferir_atendimento_humano", { motivo }, res);
      toolCallsExecuted.push({ name: "transferir_atendimento_humano", args: { motivo }, result: res });

      reply = `Com todo o carinho e atenção! 👵🧓🩺\n\nEstou transferindo seu atendimento agora mesmo para a nossa *equipe da recepção* para te ajudar no agendamento passo a passo.\n\n📌 *Protocolo de Atendimento:* ${protocolo}\n📞 *Telefone da Clínica:* ${this.config.phone}\n\nFique tranquilo(a)! Nossa equipe de atendentes já recebeu seu chamado e vai te responder aqui por mensagem ou ligar para você em instantes! ❤️`;
    }
    // Cancellation
    else if (lower.includes("cancelar") || lower.includes("desmarcar")) {
      const aptIndex = this.appointments.findIndex(
        (a) =>
          a.patientPhone.replace(/\D/g, "").includes(patientPhone.replace(/\D/g, "")) ||
          a.status !== "cancelled"
      );

      if (aptIndex !== -1) {
        const apt = this.appointments[aptIndex];
        apt.status = "cancelled";
        const res = { sucesso: true, id_agendamento: apt.id };
        this.logTool("cancelar_agendamento", { identificador: patientPhone }, res);
        toolCallsExecuted.push({ name: "cancelar_agendamento", args: { identificador: patientPhone }, result: res });
        reply = `Seu agendamento (*${apt.id}*) foi cancelado com sucesso. ✅\n\nO horário foi liberado no sistema. Caso queira reagendar futuramente, é só me chamar por aqui! Tenha um ótimo dia.`;
      } else {
        reply = `Não localizei nenhum agendamento ativo com o número *${patientPhone}*. Poderia me informar o código do agendamento (ex: *AG-1094*)?`;
      }
    }
    // Status lookup
    else if (lower.includes("status") || lower.includes("confirmado") || lower.includes("minha consulta")) {
      const apt = this.appointments.find(
        (a) => a.patientPhone.replace(/\D/g, "").includes(patientPhone.replace(/\D/g, ""))
      );

      if (apt) {
        const res = {
          encontrado: true,
          id_agendamento: apt.id,
          paciente: apt.patientName,
          servico: apt.serviceName,
          medico: apt.doctor,
          data: apt.date,
          horario: apt.time,
          status: apt.status === "confirmed_paid" ? "CONFIRMADO E PAGO" : "Pendente de Pagamento",
        };
        this.logTool("consultar_status_agendamento", { identificador: patientPhone }, res);
        toolCallsExecuted.push({ name: "consultar_status_agendamento", args: { identificador: patientPhone }, result: res });

        reply = `Aqui estão os detalhes do seu agendamento: 📋\n\n🔹 *Código:* ${apt.id}\n👤 *Paciente:* ${apt.patientName}\n🩺 *Serviço:* ${apt.serviceName}\n👨‍⚕️ *Profissional:* ${apt.doctor}\n📅 *Data:* ${apt.date}\n⏰ *Horário:* ${apt.time}\n📌 *Status:* ${res.status}\n\n${apt.status === "confirmed_paid" ? "✅ Seu horário está confirmado!" : `👉 *Pix Copia e Cola:* ${apt.pixCode}\n\n⚠️ *Lembrete:* O horário só fica garantido após a confirmação do Pix.`}`;
      } else {
        reply = `Não encontrei nenhum agendamento ativo para este número de telefone. Deseja consultar os horários disponíveis para agendar uma nova consulta?`;
      }
    }
    // Quotes for Consultations & Lab Exams (Orçamento)
    else if (
      lower.includes("orçamento") ||
      lower.includes("orcamento") ||
      lower.includes("orçar") ||
      lower.includes("orcar") ||
      lower.includes("cotar") ||
      lower.includes("cotação") ||
      lower.includes("quanto custa") ||
      lower.includes("qual o valor") ||
      lower.includes("preço de") ||
      lower.includes("preço do") ||
      lower.includes("tabela de exames") ||
      lower.includes("exame de sangue") ||
      lower.includes("hemograma") ||
      lower.includes("ultrassom") ||
      lower.includes("checkup") ||
      lower.includes("check-up") ||
      lower.includes("exames") ||
      lower.includes("laboratorio") ||
      lower.includes("laboratório")
    ) {
      if (
        lower.includes("tabela de exames") ||
        lower.includes("quais exames") ||
        lower.includes("lista de exames") ||
        lower.includes("catalogo de exames")
      ) {
        const res = this.consultarExamesLaboratoriais();
        const exList = res.exames
          .slice(0, 6)
          .map((e) => `• 🔬 *${e.nome}*: ${e.preco} _(${e.prazo_resultado})_`)
          .join("\n");

        reply = `Aqui estão os principais exames do nosso *${res.laboratorio}*: 🧪\n\n${exList}\n\n📍 *Coleta:* ${res.coleta}\n\n💡 Você pode me pedir um *orçamento personalizado* dizendo quais exames precisa (ex: _"quero orçamento de hemograma, glicemia e colesterol"_).`;
      } else {
        const itemsToQuote: string[] = [];
        if (lower.includes("hemograma")) itemsToQuote.push("Hemograma Completo");
        if (lower.includes("glicemia") || lower.includes("glicose")) itemsToQuote.push("Glicemia em Jejum");
        if (lower.includes("colesterol") || lower.includes("lipidico") || lower.includes("lipídico")) itemsToQuote.push("Perfil Lipídico / Colesterol Total e Frações");
        if (lower.includes("tireoide") || lower.includes("tsh")) itemsToQuote.push("TSH Ultra Sensível + T4 Livre (Tireoide)");
        if (lower.includes("vitamina d")) itemsToQuote.push("Vitamina D");
        if (lower.includes("vitamina b12") || lower.includes("b12")) itemsToQuote.push("Vitamina B12");
        if (lower.includes("urina") || lower.includes("eas")) itemsToQuote.push("EAS / Sumário de Urina Tipo 1");
        if (lower.includes("fezes") || lower.includes("parasitologico")) itemsToQuote.push("Exame Parasitológico de Fezes (EPF)");
        if (lower.includes("ecg") || lower.includes("eletrocardiograma")) itemsToQuote.push("Eletrocardiograma (ECG em Repouso)");
        if (lower.includes("ecocardiograma") || lower.includes("eco")) itemsToQuote.push("Ecocardiograma Transtorácico com Doppler");
        if (lower.includes("ultrassom") || lower.includes("usg") || lower.includes("ecografia")) itemsToQuote.push("Ultrassonografia de Abdome Total");
        if (lower.includes("check-up") || lower.includes("checkup") || lower.includes("check up")) itemsToQuote.push("Combo Check-up Básico");
        if (lower.includes("cardio") || lower.includes("cardiologista")) itemsToQuote.push("Cardiologia (Consulta + ECG)");
        if (lower.includes("dermato") || lower.includes("dermatologista")) itemsToQuote.push("Dermatologia");
        if (lower.includes("clinico") || lower.includes("clínico")) itemsToQuote.push("Clínico Geral (Consulta)");
        if (lower.includes("odonto") || lower.includes("dentista")) itemsToQuote.push("Odontologia & Avaliação");

        if (itemsToQuote.length === 0) {
          itemsToQuote.push("Hemograma Completo", "Glicemia em Jejum", "Perfil Lipídico / Colesterol Total e Frações");
        }

        const res = this.orcarConsultasExames(itemsToQuote, patientName || "Paciente");
        toolCallsExecuted.push({ name: "orcar_consultas_e_exames", args: { itens: itemsToQuote, nome_paciente: patientName }, result: res });

        const itemsText = res.itens_cotados
          .map((it: any) => `• *${it.nome}* (${it.tipo}): ${it.valor}\n  ↳ _Preparo:_ ${it.preparo}`)
          .join("\n\n");

        reply = `Olá, *${res.paciente}*! Preparei seu orçamento detalhado: 📋\n\n${itemsText}\n\n───────────────\n🧾 *Subtotal:* ${res.subtotal}\n${res.desconto_combo !== "Sem desconto" ? `🎁 *Desconto Combo:* ${res.desconto_combo}\n` : ""}💰 *Total:* ${res.valor_total}\n✨ *À vista no Pix com 5% de desconto:* *${res.valor_pix_com_desconto}*\n\n📌 *Validade:* ${res.validade}\n🧪 *Coleta:* Segunda a Sábado das 07:00 às 11:30 (sem agendamento prévio para exames de sangue)\n\nDeseja realizar a pré-reserva ou receber a chave Pix para garantir o desconto? 😊`;
      }
    }
    // Booking confirmation
    else if (
      (lower.includes("agendar") || lower.includes("confirmar") || lower.includes("quero às") || lower.includes("quero as") || lower.includes("pode ser") || lower.includes("pode agendar")) &&
      (lower.includes("carlos") || lower.includes("maria") || lower.includes("joão") || lower.includes("ana") || lower.includes("silva") || patientName || lower.includes("09:15") || lower.includes("10:00") || lower.includes("14:00") || lower.includes("15:00"))
    ) {
      const nameToUse = patientName || "Carlos Eduardo Silva";
      const serviceObj = lower.includes("cardio")
        ? this.services[1]
        : lower.includes("dermato")
        ? this.services[2]
        : lower.includes("odonto")
        ? this.services[3]
        : this.services[0];

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const dateStr = tomorrow.toISOString().split("T")[0];

      const appointmentId = `AG-${Math.floor(1000 + Math.random() * 9000)}`;
      const paymentLink = `https://mpago.la/pay/${appointmentId.toLowerCase()}`;
      const pixCode = `00020126580014br.gov.bcb.pix0136clinicamedicasantaclara-pix-${appointmentId}5204000053039865406${serviceObj.price.toFixed(2)}5802BR5925CLINICA MEDICA SANTA CLARA6009BELEM62070503***6304${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const newApt: Appointment = {
        id: appointmentId,
        patientName: nameToUse,
        patientPhone,
        serviceId: serviceObj.id,
        serviceName: serviceObj.name,
        doctor: serviceObj.doctor,
        date: dateStr,
        time: "09:15",
        price: serviceObj.price,
        status: "pending_payment",
        paymentId: `MP-${Math.floor(1000000 + Math.random() * 9000000)}`,
        paymentLink,
        pixCode,
        createdAt: new Date().toISOString(),
        notes: "Criado via simulador WhatsApp",
      };

      this.appointments.unshift(newApt);
      appointmentCreated = newApt;

      const res = {
        status_agendamento: "RESERVADO_PENDENTE_PAGAMENTO",
        id_agendamento: appointmentId,
        paciente: nameToUse,
        servico: serviceObj.name,
        valor: `R$ ${serviceObj.price.toFixed(2)}`,
        tempo_limite: `${this.config.paymentTimeoutMinutes} minutos`,
      };

      this.logTool("criar_agendamento", { nome_paciente: nameToUse, servico: serviceObj.name, data_hora: `${dateStr} 09:15` }, res);
      toolCallsExecuted.push({ name: "criar_agendamento", args: { nome_paciente: nameToUse, servico: serviceObj.name }, result: res });

      reply = `Perfeito, *${nameToUse}*! Pré-agendamento realizado com sucesso: 🗓️\n\n🩺 *${serviceObj.name}* com *${serviceObj.doctor}*\n📅 *Data:* ${dateStr} às 09:15\n💰 *Valor:* R$ ${serviceObj.price.toFixed(2)}\n\n⚠️ *IMPORTANTE:* O horário fica pré-reservado por até *${this.config.paymentTimeoutMinutes} minutos*. A confirmação definitiva ocorre automaticamente após o pagamento via Mercado Pago/Pix.\n\n💳 *Link de Pagamento:* ${paymentLink}\n\nAssim que o pagamento for aprovado, você receberá a confirmação definitiva aqui! 🏥`;
    }
    // Slot search
    else if (
      lower.includes("horario") ||
      lower.includes("horário") ||
      lower.includes("disponiv") ||
      lower.includes("consulta") ||
      lower.includes("agenda") ||
      lower.includes("amanha") ||
      lower.includes("amanhã") ||
      lower.includes("hoje") ||
      lower.includes("cardiologia") ||
      lower.includes("dermatologia") ||
      lower.includes("dentista") ||
      lower.includes("odonto") ||
      lower.includes("médico") ||
      lower.includes("medico")
    ) {
      let srv = this.services[0];
      if (lower.includes("cardio")) srv = this.services[1];
      if (lower.includes("dermato")) srv = this.services[2];
      if (lower.includes("odonto") || lower.includes("dentista")) srv = this.services[3];
      if (lower.includes("pediatra")) srv = this.services[4];
      if (lower.includes("nutri")) srv = this.services[5];

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split("T")[0];

      const res = {
        encontrados: 4,
        servico: srv.name,
        preco: `R$ ${srv.price.toFixed(2)}`,
        horarios: [
          { data: dateStr, horario: "09:15", medico: srv.doctor },
          { data: dateStr, horario: "10:00", medico: srv.doctor },
          { data: dateStr, horario: "14:00", medico: srv.doctor },
          { data: dateStr, horario: "16:30", medico: srv.doctor },
        ],
      };

      this.logTool("consultar_horarios_disponiveis", { servico: srv.name }, res);
      toolCallsExecuted.push({ name: "consultar_horarios_disponiveis", args: { servico: srv.name }, result: res });

      reply = `Temos os seguintes horários disponíveis para *${srv.name}* (R$ ${srv.price.toFixed(2)}):\n\n• 📅 *${dateStr}* às *09:15* - ${srv.doctor}\n• 📅 *${dateStr}* às *10:00* - ${srv.doctor}\n• 📅 *${dateStr}* às *14:00* - ${srv.doctor}\n• 📅 *${dateStr}* às *16:30* - ${srv.doctor}\n\nQual desses horários fica melhor para você? Por favor, me informe também seu *nome completo* para iniciarmos a reserva! 😊\n\n💡 *Prefere falar com uma pessoa?* Digite *0* ou diga *"falar com atendente"* para agendar com o auxílio da nossa recepção.`;
    } else {
      reply = `Olá! 👋 Sou o assistente virtual da *${this.config.clinicName}*.\n\nComo posso te ajudar hoje?\n\n1️⃣ *Consultar horários e especialidades*\n2️⃣ *Agendar uma consulta ou procedimento*\n3️⃣ *Orçamento de exames laboratoriais*\n4️⃣ *Verificar status de agendamento*\n5️⃣ *Cancelar agendamento*\n0️⃣ *Falar com Atendente Humano / Ajuda para Agendar*\n\n👵🧓 *Atenção:* Se você tiver qualquer dificuldade para digitar ou preferir agendar falando com uma pessoa da nossa recepção, basta digitar *0* ou dizer *"Quero ajuda de um atendente"*!`;
    }

    return {
      reply,
      toolCalls: toolCallsExecuted,
      appointmentCreated,
      transferredToHuman,
      modelUsed: "gemini-3.7-flash (cloud & resilient engine)",
      executionTimeMs: Date.now() - startTime,
    };
  }

  public manualAction(
    appointmentId: string,
    action: "confirm_cash" | "cancel" | "mark_arrived" | "mark_finished"
  ) {
    const apt = this.appointments.find((a) => a.id === appointmentId);
    if (!apt) return null;

    if (action === "confirm_cash") {
      apt.status = "confirmed_paid";
      apt.notes = "Pago em dinheiro / cartão na recepção";
      apt.confirmedAt = new Date().toISOString();
    } else if (action === "cancel") {
      apt.status = "cancelled";
      apt.notes = "Cancelado manualmente na recepção";
      const slot = this.slots.find((s) => s.date === apt.date && s.time === apt.time && s.doctor === apt.doctor);
      if (slot) slot.isBooked = false;
    } else if (action === "mark_arrived") {
      apt.notes = `${apt.notes || ""} [Paciente na sala de espera às ${new Date().toLocaleTimeString("pt-BR")}]`.trim();
    } else if (action === "mark_finished") {
      apt.notes = `${apt.notes || ""} [Atendimento concluído às ${new Date().toLocaleTimeString("pt-BR")}]`.trim();
    }

    this.saveToStorage();
    return apt;
  }

  public simulatePayment(appointmentId: string) {
    const apt = this.appointments.find((a) => a.id === appointmentId);
    if (!apt) return null;

    apt.status = "confirmed_paid";
    apt.confirmedAt = new Date().toISOString();
    apt.notes = "Pagamento confirmado automaticamente via Webhook Mercado Pago (Pix Aprovado)";
    this.saveToStorage();

    return {
      appointment: apt,
      whatsappMessage: `🎉 *PAGAMENTO CONFIRMADO!* ✅\n\nOlá *${apt.patientName}*, seu agendamento para *${apt.serviceName}* com *${apt.doctor}* está *CONFIRMADO*!\n\n📅 *Data:* ${apt.date}\n⏰ *Horário:* ${apt.time}\n📍 *Local:* ${this.config.clinicName} (${this.config.address})\n\nPor favor, chegue com 10 minutos de antecedência e traga um documento com foto. Qualquer dúvida, estamos à disposição! 🏥`,
    };
  }
}

export const clientClinicEngine = new ClientClinicEngine();
