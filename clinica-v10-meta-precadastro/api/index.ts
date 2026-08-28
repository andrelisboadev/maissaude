import express from "express";
import { clinicDb } from "../server/clinicDatabase.js";
import { processWhatsAppMessage } from "../server/geminiService.js";
import { supabaseAdmin, isSupabaseConfigured } from "../server/supabaseAdmin.js";

const app = express();
app.use(express.json());

// Garante que o estado em memória foi carregado do Supabase antes de qualquer rota
// (crítico aqui: cada invocação serverless pode ser uma instância nova).
app.use(async (_req, _res, next) => {
  await clinicDb.ensureHydrated();
  next();
});

// Após qualquer requisição que grave dados, persiste o snapshot no Supabase em segundo plano.
app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    res.on("finish", () => {
      clinicDb.persistSnapshot().catch((err) =>
        console.error("[api] Falha ao persistir snapshot após requisição:", err)
      );
    });
  }
  next();
});

// Rota administrativa: cria/convida um login real (Supabase Auth) para um membro da equipe.
// Só pode ser chamada por quem já está autenticado como admin (verificado pelo token).
app.post("/api/admin/invite-staff", async (req, res) => {
  if (!isSupabaseConfigured) {
    return res.status(503).json({ error: "Supabase não configurado neste ambiente" });
  }

  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Não autenticado" });

    const { data: callerData, error: callerError } = await supabaseAdmin.auth.getUser(token);
    if (callerError || !callerData?.user) return res.status(401).json({ error: "Token inválido" });

    const { data: callerProfile } = await supabaseAdmin
      .from("clinic_users")
      .select("role")
      .eq("auth_user_id", callerData.user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!callerProfile || callerProfile.role !== "admin") {
      return res.status(403).json({ error: "Apenas o gerente/admin pode convidar novos usuários" });
    }

    const { email, clinicUserId } = req.body;
    if (!email || !clinicUserId) {
      return res.status(400).json({ error: "email e clinicUserId são obrigatórios" });
    }

    const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      { redirectTo: `https://${req.headers.host}?mode=agency` }
    );

    if (inviteError || !invited?.user) {
      return res.status(500).json({ error: inviteError?.message || "Falha ao enviar convite" });
    }

    // Vincula o novo login real (auth_user_id) à linha já existente em clinic_users
    const { error: linkError } = await supabaseAdmin
      .from("clinic_users")
      .update({ auth_user_id: invited.user.id })
      .eq("id", clinicUserId);

    if (linkError) {
      return res.status(500).json({ error: "Convite enviado, mas falha ao vincular login: " + linkError.message });
    }

    res.json({ success: true, authUserId: invited.user.id });
  } catch (error: any) {
    console.error("[invite-staff] Erro:", error);
    res.status(500).json({ error: error?.message || "Erro interno" });
  }
});

// Rota administrativa: registra o webhook na API do Inter (chamar 1x depois de configurar
// as credenciais). Protegida por uma chave simples para não ficar aberta a qualquer um.
app.post("/api/admin/setup-inter-webhook", async (req, res) => {
  const adminKey = req.headers["x-admin-key"];
  if (!adminKey || adminKey !== process.env.ADMIN_SETUP_KEY) {
    return res.status(401).json({ error: "Não autorizado" });
  }
  const webhookUrl = `https://${req.headers.host}/api/clinic/webhook/bancointer`;
  const ok = await registerWebhook(webhookUrl);
  res.json({ success: ok, webhookUrl });
});

// API Route: Health Check
import { getPayment, isPaymentConfigured, activeProviderName } from "../server/paymentProvider.js";
import { registerWebhook } from "../server/bancoInterService.js";
import { sendTextMessage, verifyWebhookChallenge, parseIncomingMetaMessage, isMetaWhatsAppConfigured } from "../server/metaWhatsAppService.js";

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
    hasSupabaseServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    supabaseConfigured: isSupabaseConfigured,
    paymentProvider: activeProviderName,
    paymentConfigured: isPaymentConfigured,
    metaWhatsAppConfigured: isMetaWhatsAppConfigured,
    model: "gemini-3.7-flash",
  });
});

// API Route: Process WhatsApp Chat Message
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, phone, name } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Mensagem obrigatória" });
    }

    const result = await processWhatsAppMessage(
      message,
      Array.isArray(history) ? history : [],
      phone || "5591988390894",
      name
    );

    res.json(result);
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({
      error: "Falha ao processar mensagem",
      details: error?.message || String(error),
    });
  }
});

// API Route: Get Clinic DB State
app.get("/api/clinic/state", (req, res) => {
  res.json({
    config: clinicDb.config,
    services: clinicDb.services,
    exams: clinicDb.exams,
    patients: clinicDb.patients,
    reminders: clinicDb.reminders,
    slots: clinicDb.slots,
    appointments: clinicDb.appointments,
    quotes: clinicDb.quotes,
    toolLogs: clinicDb.toolLogs,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// API Route: Update Patients List
app.post("/api/clinic/patients", (req, res) => {
  try {
    const { patients } = req.body;
    if (Array.isArray(patients)) {
      clinicDb.updatePatients(patients);
    }
    res.json({ success: true, patients: clinicDb.patients });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// API Route: Update Single Patient
app.put("/api/clinic/patients/:id", (req, res) => {
  try {
    const { id } = req.params;
    const updated = clinicDb.updatePatient({ ...req.body, id });
    if (!updated) return res.status(404).json({ error: "Paciente não encontrado" });
    res.json({ success: true, patient: updated, patients: clinicDb.patients });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Evolution Notes
const handleAddEvolution = (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { doctor, diagnosisOrReason, note, prescriptions, date } = req.body;
    const evolution = clinicDb.addClinicalEvolution(id, {
      date: date || new Date().toISOString().split("T")[0],
      doctor: doctor || "Médico Responsável",
      diagnosisOrReason: diagnosisOrReason || "Consulta de Rotina",
      note: note || "",
      prescriptions,
    });
    if (!evolution) return res.status(404).json({ error: "Paciente não encontrado" });
    res.json({ success: true, evolution, patient: clinicDb.patients.find((p) => p.id === id) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};
app.post("/api/clinic/patients/:id/evolution", handleAddEvolution);
app.post("/api/clinic/patients/:id/evolutions", handleAddEvolution);

const handleUpdateEvolution = (req: any, res: any) => {
  try {
    const { patientId, evolutionId } = req.params;
    const updated = clinicDb.updateClinicalEvolution(patientId, evolutionId, req.body);
    if (!updated) return res.status(404).json({ error: "Evolução ou paciente não encontrado" });
    res.json({ success: true, evolution: updated, patient: clinicDb.patients.find((p) => p.id === patientId) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};
app.put("/api/clinic/patients/:patientId/evolution/:evolutionId", handleUpdateEvolution);
app.put("/api/clinic/patients/:patientId/evolutions/:evolutionId", handleUpdateEvolution);

const handleDeleteEvolution = (req: any, res: any) => {
  try {
    const { patientId, evolutionId } = req.params;
    const ok = clinicDb.deleteClinicalEvolution(patientId, evolutionId);
    if (!ok) return res.status(404).json({ error: "Evolução não encontrada" });
    res.json({ success: true, message: "Evolução excluída com sucesso", patient: clinicDb.patients.find((p) => p.id === patientId) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};
app.delete("/api/clinic/patients/:patientId/evolution/:evolutionId", handleDeleteEvolution);
app.delete("/api/clinic/patients/:patientId/evolutions/:evolutionId", handleDeleteEvolution);

// Reminders
app.post("/api/clinic/reminders/send", (req, res) => {
  try {
    const { reminderId } = req.body;
    const rem = clinicDb.sendReminder(reminderId);
    if (!rem) return res.status(404).json({ error: "Lembrete não encontrado" });
    res.json({ success: true, reminder: rem });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/clinic/reminders/respond", (req, res) => {
  try {
    const { reminderId, action } = req.body;
    const result = clinicDb.processReminderResponse(reminderId, action);
    if (!result) return res.status(404).json({ error: "Lembrete não encontrado" });
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Settings
app.post("/api/clinic/settings", (req, res) => {
  try {
    const { config, services } = req.body;
    if (config) clinicDb.updateConfig(config);
    if (Array.isArray(services)) clinicDb.updateServices(services);
    res.json({ success: true, config: clinicDb.config, services: clinicDb.services });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Manual Appointment
const handleManualAppointment = (req: any, res: any) => {
  try {
    const { id, patientName, patientPhone, serviceId, date, time, price, status, notes } = req.body;
    if (!patientName || !patientPhone || !serviceId || !date || !time) {
      return res.status(400).json({ error: "Dados incompletos para o agendamento" });
    }

    const appointment = clinicDb.createManualAppointment({
      id,
      patientName,
      patientPhone,
      serviceId,
      date,
      time,
      price: typeof price === "number" ? price : undefined,
      status: status || "confirmed_paid",
      notes,
    });

    res.json({ success: true, appointment });
  } catch (e: any) {
    res.status(400).json({ error: e.message || "Erro ao criar agendamento" });
  }
};
app.post("/api/clinic/appointment/create-manual", handleManualAppointment);
app.post("/api/appointments/manual", handleManualAppointment);
app.post("/api/clinic/appointments/manual", handleManualAppointment);

// Reset
app.post("/api/clinic/reset", (req, res) => {
  clinicDb.reset();
  res.json({ success: true, message: "Banco de dados da clínica restaurado." });
});

// Confirmação MANUAL de pagamento pela recepção (ex: dinheiro/cartão no balcão).
// Isso é uma ação real da equipe, não uma simulação de Mercado Pago.
const handleManualPaymentConfirmation = (req: any, res: any) => {
  const appointmentId = req.params.id || req.body.appointmentId;
  if (!appointmentId) return res.status(400).json({ error: "appointmentId obrigatório" });

  const outcome = clinicDb.processMercadoPagoPayment(appointmentId);
  if (!outcome) return res.status(404).json({ error: "Agendamento não encontrado" });

  res.json({
    success: true,
    appointment: outcome.appointment,
    whatsappNotification: outcome.whatsappMessage,
  });
};
app.post("/api/appointments/:id/simulate-payment", handleManualPaymentConfirmation);
app.post("/api/clinic/appointments/:id/simulate-payment", handleManualPaymentConfirmation);

// Webhook REAL do Mercado Pago: recebe a notificação, revalida o status
// consultando a API oficial (nunca confia só no corpo recebido) e só então
// confirma o agendamento como pago.
app.post("/api/clinic/webhook/mercadopago", async (req, res) => {
  // Responde 200 imediatamente — é exigência do Mercado Pago para não reenviar a notificação.
  res.status(200).json({ received: true });

  try {
    const paymentId =
      req.body?.data?.id || req.query["data.id"] || req.query.id || req.body?.resource;
    const notificationType = req.body?.type || req.query.type || req.query.topic;

    if (!paymentId || (notificationType && notificationType !== "payment")) return;

    const payment = await getPayment(String(paymentId));
    if (!payment) {
      console.warn("[webhook mercadopago] Não foi possível consultar o pagamento", paymentId);
      return;
    }

    const appointmentId = payment.external_reference;
    if (payment.status === "approved" && appointmentId) {
      const outcome = clinicDb.processMercadoPagoPayment(appointmentId);
      if (outcome) {
        await clinicDb.persistSnapshot();
        console.log(`[webhook mercadopago] Agendamento ${appointmentId} confirmado como pago.`);
      }
    }
  } catch (error) {
    console.error("[webhook mercadopago] Erro ao processar notificação:", error);
  }
});

// Webhook REAL do Banco Inter: dispara quando um Pix é efetivamente recebido.
// Mesmo assim revalidamos consultando a API do Inter antes de confirmar (defesa em profundidade).
app.post("/api/clinic/webhook/bancointer", async (req, res) => {
  res.status(200).json({ received: true });

  try {
    const pixList = req.body?.pix;
    if (!Array.isArray(pixList) || pixList.length === 0) return;

    for (const pixEvent of pixList) {
      const txid = pixEvent?.txid;
      if (!txid) continue;

      const payment = await getPayment(String(txid));
      if (!payment) {
        console.warn("[webhook bancointer] Não foi possível consultar a cobrança", txid);
        continue;
      }

      if (payment.status === "approved") {
        const outcome = clinicDb.processMercadoPagoPayment(txid);
        if (outcome) {
          await clinicDb.persistSnapshot();
          console.log(`[webhook bancointer] Agendamento ${txid} confirmado como pago.`);
        }
      }
    }
  } catch (error) {
    console.error("[webhook bancointer] Erro ao processar notificação:", error);
  }
});

// Action
const handleAction = (req: any, res: any) => {
  const id = req.params.id || req.body.id || req.body.appointmentId;
  const { action } = req.body;
  const apt = clinicDb.appointments.find((a) => a.id === id);
  if (!apt) return res.status(404).json({ error: "Agendamento não encontrado" });

  if (action === "confirm_paid" || action === "confirm_cash") {
    apt.status = "confirmed_paid";
    apt.confirmedAt = new Date().toISOString();
    apt.notes = action === "confirm_cash" ? "Pago em dinheiro no balcão" : "Confirmado manualmente pela recepção";
  } else if (action === "cancel") {
    apt.status = "cancelled";
    apt.notes = "Cancelado manualmente pela recepção";
    const slot = clinicDb.slots.find((s) => s.serviceId === apt.serviceId && s.date === apt.date && s.time === apt.time);
    if (slot) slot.isBooked = false;
  } else if (action === "mark_arrived") {
    apt.notes = `${apt.notes || ""} [Paciente presente na recepção]`.trim();
  } else if (action === "mark_finished") {
    apt.notes = `${apt.notes || ""} [Atendimento concluído pelo médico]`.trim();
  }

  res.json({ success: true, appointment: apt });
};
app.post("/api/clinic/appointment/action", handleAction);
app.post("/api/appointments/:id/action", handleAction);
app.post("/api/clinic/appointments/:id/action", handleAction);

// Webhook oficial da Meta Cloud API (WhatsApp Business Platform).
// Funciona tanto com o número de teste gratuito quanto com o número real homologado.

// 1) Verificação da URL do webhook — a Meta chama isso UMA VEZ ao você salvar a URL no painel.
app.get("/api/webhook/meta", (req, res) => {
  const mode = req.query["hub.mode"] as string;
  const token = req.query["hub.verify_token"] as string;
  const challenge = req.query["hub.challenge"] as string;

  if (verifyWebhookChallenge(mode, token)) {
    console.log("[webhook meta] Verificação de URL confirmada com sucesso.");
    return res.status(200).send(challenge);
  }
  return res.status(403).json({ error: "Token de verificação inválido" });
});

// 2) Recebimento de mensagens reais dos pacientes.
app.post("/api/webhook/meta", async (req, res) => {
  // Responde 200 imediatamente — a Meta reenvia o evento se não receber confirmação rápida.
  res.status(200).json({ received: true });

  try {
    const incoming = parseIncomingMetaMessage(req.body);
    if (!incoming) return; // não era mensagem de texto de paciente (ex: status de entrega)

    await clinicDb.ensureHydrated();
    const aiResponse = await processWhatsAppMessage(
      incoming.messageText,
      [],
      incoming.senderPhone,
      incoming.senderName
    );

    if (aiResponse?.reply) {
      await sendTextMessage(incoming.senderPhone, aiResponse.reply);
    }
    await clinicDb.persistSnapshot();
  } catch (error) {
    console.error("[webhook meta] Erro ao processar mensagem recebida:", error);
  }
});

// WhatsApp Webhook
app.post(["/api/webhook/whatsapp", "/api/webhook/evolution"], async (req, res) => {
  try {
    const body = req.body;
    let senderPhone = "";
    let senderName = "Paciente WhatsApp";
    let messageText = "";

    if (body?.data?.key?.remoteJid) {
      const key = body.data.key;
      if (key.fromMe) return res.status(200).json({ status: "ignored_from_me" });
      senderPhone = key.remoteJid.replace("@s.whatsapp.net", "").replace(/\D/g, "");
      senderName = body.data.pushName || "Paciente";
      messageText = body.data.message?.conversation || body.data.message?.extendedTextMessage?.text || "";
    } else if (body?.phone && (body?.text?.message || body?.message)) {
      senderPhone = String(body.phone).replace(/\D/g, "");
      senderName = body.senderName || "Paciente";
      messageText = body.text?.message || body.message || "";
    } else if (body?.phone && body?.message) {
      senderPhone = String(body.phone).replace(/\D/g, "");
      senderName = body.name || "Paciente";
      messageText = body.message;
    }

    if (!messageText || !senderPhone) {
      return res.status(200).json({ status: "skipped_no_message" });
    }

    const aiResponse = await processWhatsAppMessage(messageText, [], senderPhone, senderName);
    return res.status(200).json({
      success: true,
      phone: senderPhone,
      patientName: senderName,
      reply: aiResponse.reply,
      toolCalls: aiResponse.toolCalls,
      appointmentCreated: aiResponse.appointmentCreated,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Webhook failed", details: err?.message });
  }
});

export default app;
