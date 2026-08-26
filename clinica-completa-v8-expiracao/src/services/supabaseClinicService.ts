import { supabase } from "../lib/supabase";
import {
  ServiceItem,
  Appointment,
  PatientRecord,
  ClinicalEvolution,
  ClinicUser,
  ToolLog,
} from "../types";
import {
  DEFAULT_SERVICES,
  DEFAULT_LAB_EXAMS,
  DEFAULT_PATIENTS,
  DEFAULT_USERS,
} from "../utils/clientClinicEngine";

// ------------------------------------------------------------------
// Mapeamento camelCase (app) <-> snake_case (Postgres/Supabase)
// ------------------------------------------------------------------
function serviceFromRow(row: any): ServiceItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    type: row.type,
    price: Number(row.price),
    durationMinutes: row.duration_minutes,
    description: row.description || "",
    doctor: row.doctor,
    specialtyDetails: row.specialty_details,
    crm: row.crm,
    availableDays: row.available_days || undefined,
    workStartHour: row.work_start_hour,
    workEndHour: row.work_end_hour,
    preparation: row.preparation,
    resultDeadlineHours: row.result_deadline_hours,
  };
}

function serviceToRow(s: ServiceItem) {
  return {
    id: s.id,
    name: s.name,
    category: s.category,
    type: s.type || "consulta",
    price: s.price,
    duration_minutes: s.durationMinutes,
    description: s.description,
    doctor: s.doctor,
    specialty_details: s.specialtyDetails,
    crm: s.crm,
    available_days: s.availableDays,
    work_start_hour: s.workStartHour,
    work_end_hour: s.workEndHour,
    preparation: s.preparation,
    result_deadline_hours: s.resultDeadlineHours,
  };
}

function patientFromRow(row: any, evolutions: ClinicalEvolution[] = []): PatientRecord {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    cpf: row.cpf,
    birthDate: row.birth_date,
    email: row.email,
    gender: row.gender,
    bloodType: row.blood_type,
    allergies: row.allergies || [],
    chronicConditions: row.chronic_conditions || [],
    generalNotes: row.general_notes,
    totalAppointments: row.total_appointments || 0,
    totalSpent: Number(row.total_spent || 0),
    lastVisit: row.last_visit,
    clinicalHistory: evolutions,
  };
}

function patientToRow(p: PatientRecord) {
  return {
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
  };
}

function appointmentFromRow(row: any): Appointment {
  return {
    id: row.id,
    patientName: row.patient_name,
    patientPhone: row.patient_phone,
    serviceId: row.service_id,
    serviceName: row.service_name,
    doctor: row.doctor,
    date: row.date,
    time: row.time,
    price: Number(row.price),
    status: row.status,
    paymentMethod: row.payment_method,
    paymentId: row.payment_id,
    paymentLink: row.payment_link,
    pixCode: row.pix_code,
    createdAt: row.created_at,
    confirmedAt: row.confirmed_at,
    notes: row.notes,
  };
}

function appointmentToRow(a: Appointment) {
  return {
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
    payment_method: a.paymentMethod,
    payment_id: a.paymentId,
    payment_link: a.paymentLink,
    pix_code: a.pixCode,
    confirmed_at: a.confirmedAt || null,
    notes: a.notes,
  };
}

function userFromRow(row: any): ClinicUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    doctorId: row.doctor_id,
    doctorName: row.doctor_name,
    crm: row.crm,
    specialty: row.specialty,
    phone: row.phone,
    status: row.status,
    createdAt: row.created_at,
    lastLogin: row.last_login,
    avatarUrl: row.avatar_url,
  };
}

function userToRow(u: ClinicUser) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    doctor_id: u.doctorId || null,
    doctor_name: u.doctorName,
    crm: u.crm,
    specialty: u.specialty,
    phone: u.phone,
    status: u.status,
    avatar_url: u.avatarUrl,
    last_login: u.lastLogin || null,
  };
}

export class SupabaseClinicService {
  private isSeeded = false;

  /** Substitui firestoreClinicService.initializeDatabase() */
  async initializeDatabase(): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from("services")
        .select("id", { count: "exact", head: true });

      if (error) {
        console.error("Falha ao conectar no Supabase:", error.message);
        return false;
      }

      if (!count || count === 0) {
        console.log("Semeando dados iniciais da clínica no Supabase...");
        await this.seedInitialData();
      }
      this.isSeeded = true;
      return true;
    } catch (error) {
      console.error("Falha ao inicializar banco Supabase:", error);
      return false;
    }
  }

  private async seedInitialData() {
    try {
      await supabase.from("services").upsert(DEFAULT_SERVICES.map(serviceToRow));

      await supabase.from("lab_exams").upsert(
        DEFAULT_LAB_EXAMS.map((exam) => ({
          id: exam.id,
          name: exam.name,
          category: exam.category,
          price: exam.price,
          preparation: exam.preparation,
          result_deadline: exam.resultDeadline,
          popular: exam.popular || false,
        }))
      );

      await supabase.from("patients").upsert(DEFAULT_PATIENTS.map(patientToRow));

      await supabase.from("clinic_users").upsert(DEFAULT_USERS.map(userToRow));

      console.log("Supabase semeado com o catálogo inicial da clínica.");
    } catch (error) {
      console.error("Erro ao semear dados iniciais:", error);
    }
  }

  // -------------------------------------------------------------
  // SERVICES
  // -------------------------------------------------------------
  subscribeServices(onUpdate: (services: ServiceItem[]) => void) {
    supabase
      .from("services")
      .select("*")
      .then(({ data, error }) => {
        if (error) return console.error("Erro ao ler services:", error);
        if (data && data.length > 0) onUpdate(data.map(serviceFromRow));
      });

    const channel = supabase
      .channel("services-changes")
      .on("postgres_changes", { event: "*", schema: "whatsapp_ia", table: "services" }, async () => {
        const { data } = await supabase.from("services").select("*");
        if (data) onUpdate(data.map(serviceFromRow));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }

  async saveServices(services: ServiceItem[]) {
    const { error } = await supabase.from("services").upsert(services.map(serviceToRow));
    if (error) console.error("Erro ao salvar services:", error);
  }

  // -------------------------------------------------------------
  // PATIENTS
  // -------------------------------------------------------------
  private async loadPatientsWithHistory(): Promise<PatientRecord[]> {
    const [{ data: patientRows, error: pErr }, { data: evoRows, error: eErr }] = await Promise.all([
      supabase.from("patients").select("*"),
      supabase.from("clinical_evolutions").select("*").order("date", { ascending: false }),
    ]);
    if (pErr) console.error("Erro ao ler patients:", pErr);
    if (eErr) console.error("Erro ao ler clinical_evolutions:", eErr);

    const evosByPatient = new Map<string, ClinicalEvolution[]>();
    (evoRows || []).forEach((row: any) => {
      const evo: ClinicalEvolution = {
        id: row.id,
        date: row.date,
        doctor: row.doctor,
        diagnosisOrReason: row.diagnosis_or_reason,
        note: row.note,
        prescriptions: row.prescriptions,
      };
      const list = evosByPatient.get(row.patient_id) || [];
      list.push(evo);
      evosByPatient.set(row.patient_id, list);
    });

    return (patientRows || []).map((row: any) => patientFromRow(row, evosByPatient.get(row.id) || []));
  }

  subscribePatients(onUpdate: (patients: PatientRecord[]) => void) {
    this.loadPatientsWithHistory().then((list) => {
      if (list.length > 0) onUpdate(list);
    });

    const channel = supabase
      .channel("patients-changes")
      .on("postgres_changes", { event: "*", schema: "whatsapp_ia", table: "patients" }, async () => {
        onUpdate(await this.loadPatientsWithHistory());
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "whatsapp_ia", table: "clinical_evolutions" },
        async () => {
          onUpdate(await this.loadPatientsWithHistory());
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }

  async savePatient(patient: PatientRecord) {
    const { error } = await supabase.from("patients").upsert(patientToRow(patient));
    if (error) console.error("Erro ao salvar patient:", error);
  }

  async addClinicalEvolution(patientId: string, evolution: ClinicalEvolution) {
    const { error } = await supabase.from("clinical_evolutions").insert({
      id: evolution.id,
      patient_id: patientId,
      date: evolution.date,
      doctor: evolution.doctor,
      diagnosis_or_reason: evolution.diagnosisOrReason,
      note: evolution.note,
      prescriptions: evolution.prescriptions,
    });
    if (error) return console.error("Erro ao adicionar evolução clínica:", error);

    await supabase.from("patients").update({ last_visit: evolution.date }).eq("id", patientId);
  }

  // -------------------------------------------------------------
  // APPOINTMENTS
  // -------------------------------------------------------------
  subscribeAppointments(onUpdate: (appointments: Appointment[]) => void) {
    supabase
      .from("appointments")
      .select("*")
      .then(({ data, error }) => {
        if (error) return console.error("Erro ao ler appointments:", error);
        if (data && data.length > 0) onUpdate(data.map(appointmentFromRow));
      });

    const channel = supabase
      .channel("appointments-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "whatsapp_ia", table: "appointments" },
        async () => {
          const { data } = await supabase.from("appointments").select("*");
          if (data) onUpdate(data.map(appointmentFromRow));
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }

  async saveAppointment(appointment: Appointment) {
    const { error } = await supabase.from("appointments").upsert(appointmentToRow(appointment));
    if (error) console.error("Erro ao salvar appointment:", error);
  }

  async updateAppointmentStatus(
    id: string,
    status: Appointment["status"],
    paymentMethod?: Appointment["paymentMethod"]
  ) {
    const updates: Record<string, any> = { status };
    if (paymentMethod) updates.payment_method = paymentMethod;
    if (status === "confirmed_paid") updates.confirmed_at = new Date().toISOString();

    const { error } = await supabase.from("appointments").update(updates).eq("id", id);
    if (error) console.error("Erro ao atualizar status do agendamento:", error);
  }

  // -------------------------------------------------------------
  // CLINIC USERS (equipe: admin / médico / recepção)
  // -------------------------------------------------------------
  subscribeUsers(onUpdate: (users: ClinicUser[]) => void) {
    supabase
      .from("clinic_users")
      .select("*")
      .then(({ data, error }) => {
        if (error) return console.error("Erro ao ler clinic_users:", error);
        if (data && data.length > 0) onUpdate(data.map(userFromRow));
      });

    const channel = supabase
      .channel("clinic-users-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "whatsapp_ia", table: "clinic_users" },
        async () => {
          const { data } = await supabase.from("clinic_users").select("*");
          if (data) onUpdate(data.map(userFromRow));
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }

  async saveUser(user: ClinicUser) {
    const { error } = await supabase.from("clinic_users").upsert(userToRow(user));
    if (error) console.error("Erro ao salvar usuário da equipe:", error);
  }

  async deleteUser(userId: string) {
    const { error } = await supabase.from("clinic_users").delete().eq("id", userId);
    if (error) console.error("Erro ao remover usuário da equipe:", error);
  }

  // -------------------------------------------------------------
  // AUDIT LOGS
  // -------------------------------------------------------------
  async logToolExecution(toolName: string, args: any, result: any) {
    try {
      const log: ToolLog = {
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toLocaleTimeString("pt-BR"),
        toolName,
        arguments: args,
        result,
        success: true,
      };
      await supabase.from("tool_logs").insert({
        id: log.id,
        tool_name: log.toolName,
        arguments: log.arguments,
        result: log.result,
        success: log.success,
      });
    } catch (error) {
      console.warn("Não foi possível gravar o log de auditoria no Supabase:", error);
    }
  }
}

export const supabaseClinicService = new SupabaseClinicService();
