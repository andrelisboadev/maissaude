import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { clinicDb } from "./server/clinicDatabase.js";
import { processWhatsAppMessage } from "./server/geminiService.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Garante que o estado em memória foi carregado do Supabase antes de qualquer rota
  // (resolve o problema de dados sumirem entre cold starts em ambiente serverless).
  app.use(async (_req, _res, next) => {
    await clinicDb.ensureHydrated();
    next();
  });

  // Após qualquer requisição que grave dados, persiste o snapshot no Supabase em segundo plano.
  app.use((req, res, next) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      res.on("finish", () => {
        clinicDb.persistSnapshot().catch((err) =>
          console.error("[server] Falha ao persistir snapshot após requisição:", err)
        );
      });
    }
    next();
  });

  // API Route: Health Check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
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

  // API Route: Add Clinical Evolution Note (supports both singular and plural)
  const handleAddEvolutionRoute = (req: any, res: any) => {
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
  app.post("/api/clinic/patients/:id/evolution", handleAddEvolutionRoute);
  app.post("/api/clinic/patients/:id/evolutions", handleAddEvolutionRoute);

  // API Route: Update Clinical Evolution
  const handleUpdateEvolutionRoute = (req: any, res: any) => {
    try {
      const { patientId, evolutionId } = req.params;
      const updated = clinicDb.updateClinicalEvolution(patientId, evolutionId, req.body);
      if (!updated) return res.status(404).json({ error: "Evolução ou paciente não encontrado" });
      res.json({ success: true, evolution: updated, patient: clinicDb.patients.find((p) => p.id === patientId) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  };
  app.put("/api/clinic/patients/:patientId/evolution/:evolutionId", handleUpdateEvolutionRoute);
  app.put("/api/clinic/patients/:patientId/evolutions/:evolutionId", handleUpdateEvolutionRoute);

  // API Route: Delete Clinical Evolution
  const handleDeleteEvolutionRoute = (req: any, res: any) => {
    try {
      const { patientId, evolutionId } = req.params;
      const ok = clinicDb.deleteClinicalEvolution(patientId, evolutionId);
      if (!ok) return res.status(404).json({ error: "Evolução não encontrada" });
      res.json({ success: true, message: "Evolução excluída com sucesso", patient: clinicDb.patients.find((p) => p.id === patientId) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  };
  app.delete("/api/clinic/patients/:patientId/evolution/:evolutionId", handleDeleteEvolutionRoute);
  app.delete("/api/clinic/patients/:patientId/evolutions/:evolutionId", handleDeleteEvolutionRoute);

  // API Route: Send / Dispatch Reminder
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

  // API Route: Process Patient Response to Reminder (Confirm or Cancel)
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

  // API Route: Update Clinic Settings
  app.post("/api/clinic/settings", (req, res) => {
    try {
      const { config, services } = req.body;
      if (config) {
        clinicDb.updateConfig(config);
      }
      if (Array.isArray(services)) {
        clinicDb.updateServices(services);
      }
      res.json({ success: true, config: clinicDb.config, services: clinicDb.services });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API Route: Create Manual Appointment (supports multiple route patterns)
  const handleCreateManualAppointmentRoute = (req: any, res: any) => {
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
  app.post("/api/clinic/appointment/create-manual", handleCreateManualAppointmentRoute);
  app.post("/api/appointments/manual", handleCreateManualAppointmentRoute);
  app.post("/api/clinic/appointments/manual", handleCreateManualAppointmentRoute);

  // API Route: Reset Clinic Database
  app.post("/api/clinic/reset", (req, res) => {
    clinicDb.reset();
    res.json({ success: true, message: "Banco de dados da clínica restaurado." });
  });

  // API Route: Trigger Mercado Pago Webhook / Simulate Payment
  const handleSimulatePaymentRoute = (req: any, res: any) => {
    const appointmentId = req.params.id || req.body.appointmentId;
    if (!appointmentId) {
      return res.status(400).json({ error: "appointmentId obrigatório" });
    }

    const outcome = clinicDb.processMercadoPagoPayment(appointmentId);
    if (!outcome) {
      return res.status(404).json({ error: "Agendamento não encontrado" });
    }

    res.json({
      success: true,
      appointment: outcome.appointment,
      whatsappNotification: outcome.whatsappMessage,
    });
  };
  app.post("/api/clinic/webhook/mercadopago", handleSimulatePaymentRoute);
  app.post("/api/appointments/:id/simulate-payment", handleSimulatePaymentRoute);
  app.post("/api/clinic/appointments/:id/simulate-payment", handleSimulatePaymentRoute);

  // API Route: Manual Appointment Actions from Dashboard / Reception
  const handleAppointmentActionRoute = (req: any, res: any) => {
    const id = req.params.id || req.body.id || req.body.appointmentId;
    const { action } = req.body;
    const apt = clinicDb.appointments.find((a) => a.id === id);
    if (!apt) {
      return res.status(404).json({ error: "Agendamento não encontrado" });
    }

    if (action === "confirm_paid" || action === "confirm_cash") {
      apt.status = "confirmed_paid";
      apt.confirmedAt = new Date().toISOString();
      apt.notes = action === "confirm_cash" ? "Pago em dinheiro no balcão" : "Confirmado manualmente pela recepção";
    } else if (action === "cancel") {
      apt.status = "cancelled";
      apt.notes = "Cancelado manualmente pela recepção";
      // Free slot
      const slot = clinicDb.slots.find(
        (s) => s.serviceId === apt.serviceId && s.date === apt.date && s.time === apt.time
      );
      if (slot) slot.isBooked = false;
    } else if (action === "mark_arrived") {
      apt.notes = `${apt.notes || ""} [Paciente presente na recepção]`.trim();
    } else if (action === "mark_finished") {
      apt.notes = `${apt.notes || ""} [Atendimento concluído pelo médico]`.trim();
    }

    res.json({ success: true, appointment: apt });
  };
  app.post("/api/clinic/appointment/action", handleAppointmentActionRoute);
  app.post("/api/appointments/:id/action", handleAppointmentActionRoute);
  app.post("/api/clinic/appointments/:id/action", handleAppointmentActionRoute);

  // API Route: Universal WhatsApp Webhook (Evolution API / Z-API / Baileys / Meta)
  app.post(["/api/webhook/whatsapp", "/api/webhook/evolution"], async (req, res) => {
    try {
      const body = req.body;
      let senderPhone = "";
      let senderName = "Paciente WhatsApp";
      let messageText = "";

      // 1. Format: Evolution API (messages.upsert)
      if (body?.data?.key?.remoteJid) {
        const key = body.data.key;
        if (key.fromMe) {
          return res.status(200).json({ status: "ignored_from_me" });
        }
        senderPhone = key.remoteJid.replace("@s.whatsapp.net", "").replace(/\D/g, "");
        senderName = body.data.pushName || "Paciente";
        messageText =
          body.data.message?.conversation ||
          body.data.message?.extendedTextMessage?.text ||
          body.data.message?.imageMessage?.caption ||
          "";
      }
      // 2. Format: Z-API
      else if (body?.phone && (body?.text?.message || body?.message)) {
        senderPhone = String(body.phone).replace(/\D/g, "");
        senderName = body.senderName || "Paciente";
        messageText = body.text?.message || body.message || "";
      }
      // 3. Format: Direct generic payload { phone, message, name }
      else if (body?.phone && body?.message) {
        senderPhone = String(body.phone).replace(/\D/g, "");
        senderName = body.name || "Paciente";
        messageText = body.message;
      }

      if (!messageText || !senderPhone) {
        return res.status(200).json({ status: "skipped_no_message" });
      }

      console.log(`[WhatsApp Webhook] Incoming message from ${senderPhone} (${senderName}): "${messageText}"`);

      // Process message with Gemini 3.7 Flash
      const aiResponse = await processWhatsAppMessage(messageText, [], senderPhone, senderName);

      // Optional auto-reply to Evolution API if EVOLUTION_API_URL and EVOLUTION_API_KEY exist
      const evolutionUrl = process.env.EVOLUTION_API_URL;
      const evolutionKey = process.env.EVOLUTION_API_KEY;
      const evolutionInstance = process.env.EVOLUTION_INSTANCE || "clinica-principal";

      if (evolutionUrl && evolutionKey && aiResponse?.reply) {
        try {
          await fetch(`${evolutionUrl}/message/sendText/${evolutionInstance}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: evolutionKey,
            },
            body: JSON.stringify({
              number: senderPhone,
              options: { delay: 1200, presence: "composing" },
              textMessage: { text: aiResponse.reply },
            }),
          });
        } catch (sendErr) {
          console.warn("[Evolution API] Failed to auto-dispatch response:", sendErr);
        }
      }

      return res.status(200).json({
        success: true,
        phone: senderPhone,
        patientName: senderName,
        reply: aiResponse.reply,
        toolCalls: aiResponse.toolCalls,
        appointmentCreated: aiResponse.appointmentCreated,
      });
    } catch (err: any) {
      console.error("[WhatsApp Webhook Error]:", err);
      return res.status(500).json({ error: "Webhook processing failed", details: err?.message });
    }
  });

  // API Route: Test WhatsApp Gateway dispatch
  app.post("/api/gateway/test-dispatch", async (req, res) => {
    try {
      const { apiUrl, apiKey, instanceName, targetPhone, testMessage } = req.body;
      if (!apiUrl || !apiKey || !targetPhone) {
        return res.status(400).json({ error: "Parâmetros obrigatórios: apiUrl, apiKey, targetPhone" });
      }

      const instance = instanceName || "clinica-principal";
      const cleanPhone = String(targetPhone).replace(/\D/g, "");
      const msg = testMessage || "✅ Mensagem de teste do Atendente Virtual de Clínica Médica.";

      const response = await fetch(`${apiUrl}/message/sendText/${instance}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
        },
        body: JSON.stringify({
          number: cleanPhone,
          options: { delay: 500, presence: "composing" },
          textMessage: { text: msg },
        }),
      });

      const data = await response.json();
      res.json({ success: response.ok, data, status: response.status });
    } catch (err: any) {
      res.status(500).json({ error: "Falha ao enviar mensagem de teste", details: err?.message });
    }
  });

  // Vite Middleware setup for Frontend
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`WhatsApp Clinic AI Assistant running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
