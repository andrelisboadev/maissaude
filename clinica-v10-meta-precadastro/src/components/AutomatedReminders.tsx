import React, { useState, useMemo } from "react";
import {
  Bell,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Sliders,
  Check,
  AlertTriangle,
  UserCheck,
  Calendar,
  Phone,
  Filter,
  Play,
  Copy,
} from "lucide-react";
import { ReminderItem, Appointment } from "../types";

interface AutomatedRemindersProps {
  reminders: ReminderItem[];
  appointments: Appointment[];
  clinicName: string;
  onSendReminder: (reminderId: string) => void;
  onSendAllPending: () => void;
  onSimulatePatientResponse: (reminderId: string, action: "confirm" | "cancel") => void;
  onGenerateRemindersFromAppointments: () => void;
}

export const AutomatedReminders: React.FC<AutomatedRemindersProps> = ({
  reminders,
  appointments,
  clinicName,
  onSendReminder,
  onSendAllPending,
  onSimulatePatientResponse,
  onGenerateRemindersFromAppointments,
}) => {
  const [filterStatus, setFilterStatus] = useState<"all" | "scheduled" | "sent" | "confirmed" | "cancelled">("all");
  const [activeTab, setActiveTab] = useState<"list" | "templates" | "rules">("list");

  // Template settings state
  const [d1Template, setD1Template] = useState(
    "Olá, {paciente}! 👋 Passando para lembrar da sua consulta de {servico} com {medico} amanhã às {horario} na {clinica}. Por favor, responda '1' para confirmar presença ou '2' caso precise remarcar."
  );

  const [d0Template, setD0Template] = useState(
    "Olá, {paciente}! ⏰ Sua consulta com {medico} é hoje às {horario}. Lembre-se: {preparo}. Chegue com 10 min de antecedência. Estamos te aguardando!"
  );

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered list
  const filteredReminders = useMemo(() => {
    return reminders.filter((r) => {
      if (filterStatus === "scheduled") return r.status === "scheduled";
      if (filterStatus === "sent") return r.status === "sent";
      if (filterStatus === "confirmed") return r.status === "confirmed_by_patient";
      if (filterStatus === "cancelled") return r.status === "cancelled_by_patient";
      return true;
    });
  }, [reminders, filterStatus]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = reminders.length;
    const scheduled = reminders.filter((r) => r.status === "scheduled").length;
    const sent = reminders.filter((r) => r.status === "sent").length;
    const confirmed = reminders.filter((r) => r.status === "confirmed_by_patient").length;
    const cancelled = reminders.filter((r) => r.status === "cancelled_by_patient").length;
    const confirmationRate = total > 0 && (confirmed + cancelled > 0)
      ? Math.round((confirmed / (confirmed + cancelled)) * 100)
      : 88;

    return { total, scheduled, sent, confirmed, cancelled, confirmationRate };
  }, [reminders]);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 border border-slate-700/60 shadow-lg text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Bell className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Sistema de Lembretes Automáticos D-1 (WhatsApp)</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Disparos programados 24h e 2h antes da consulta para reduzir faltas (No-Show) e confirmar horários na agenda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onGenerateRemindersFromAppointments}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
            title="Sincronizar consultas agendadas e gerar fila de lembretes D-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sincronizar Agenda</span>
          </button>

          {metrics.scheduled > 0 && (
            <button
              onClick={onSendAllPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Disparar Pendentes ({metrics.scheduled})</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Total na Fila D-1</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.total}</p>
          <span className="text-[11px] text-indigo-500 font-medium">Lembretes cadastrados</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Confirmados pelo Paciente</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.confirmed}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Presença 100% garantida</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Aguardando Envio</span>
          <p className="text-2xl font-bold text-amber-500">{metrics.scheduled}</p>
          <span className="text-[11px] text-amber-600 font-medium">Programados para disparo</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Taxa de Confirmação</span>
          <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{metrics.confirmationRate}%</p>
          <span className="text-[11px] text-slate-400 font-medium">Redução drástica de no-show</span>
        </div>
      </div>

      {/* Tabs Switcher: List vs Templates vs Rules */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("list")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
            activeTab === "list"
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Fila de Disparos ({filteredReminders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("templates")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
            activeTab === "templates"
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Modelos de Mensagem (Templates)</span>
        </button>

        <button
          onClick={() => setActiveTab("rules")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
            activeTab === "rules"
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Regras de Automação</span>
        </button>
      </div>

      {/* TAB 1: REMINDERS LIST */}
      {activeTab === "list" && (
        <div className="space-y-4">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterStatus === "all"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Todos ({reminders.length})
              </button>
              <button
                onClick={() => setFilterStatus("scheduled")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterStatus === "scheduled"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Aguardando Envio ({metrics.scheduled})
              </button>
              <button
                onClick={() => setFilterStatus("sent")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterStatus === "sent"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Enviados ({metrics.sent})
              </button>
              <button
                onClick={() => setFilterStatus("confirmed")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterStatus === "confirmed"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Confirmados ({metrics.confirmed})
              </button>
              <button
                onClick={() => setFilterStatus("cancelled")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterStatus === "cancelled"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Cancelados ({metrics.cancelled})
              </button>
            </div>
          </div>

          {/* Table / List of Reminders */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {filteredReminders.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Bell className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-medium">Nenhum lembrete nesta categoria.</p>
                <p className="text-xs">Clique em "Sincronizar Agenda" para gerar os lembretes das consultas cadastradas.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredReminders.map((rem) => {
                  return (
                    <div
                      key={rem.id}
                      className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Left: Patient & Consultation info */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {rem.patientName}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {rem.patientPhone}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {rem.type === "d_minus_1" ? "Lembrete D-1 (24h)" : "Lembrete 2h Antes"}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                            <strong>{rem.serviceName}</strong> com {rem.doctor}
                          </span>
                          <span>•</span>
                          <span>Data: <strong>{rem.date}</strong> às <strong>{rem.time}</strong></span>
                        </div>

                        {/* WhatsApp Message Preview Quote */}
                        <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-mono relative group">
                          <p className="line-clamp-2">{rem.messageText}</p>
                          <button
                            onClick={() => handleCopyText(rem.messageText, rem.id)}
                            className="absolute right-2 top-2 p-1 rounded bg-white dark:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white text-[10px] flex items-center gap-1 border border-slate-200 dark:border-slate-600"
                            title="Copiar texto da mensagem"
                          >
                            {copiedId === rem.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === rem.id ? "Copiado" : "Copiar"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Right: Status & Interactive Controls */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-end lg:self-center">
                        {/* Status Badge */}
                        <div>
                          {rem.status === "scheduled" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              <Clock className="w-3.5 h-3.5 animate-spin" />
                              Programado
                            </span>
                          )}
                          {rem.status === "sent" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                              <Send className="w-3.5 h-3.5" />
                              Enviado (Aguardando Resposta)
                            </span>
                          )}
                          {rem.status === "confirmed_by_patient" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Confirmado pelo Paciente
                            </span>
                          )}
                          {rem.status === "cancelled_by_patient" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              Cancelado / Desistência
                            </span>
                          )}
                        </div>

                        {/* Interactive Action Buttons */}
                        <div className="flex items-center gap-2">
                          {rem.status === "scheduled" && (
                            <button
                              onClick={() => onSendReminder(rem.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-colors"
                              title="Disparar lembrete via WhatsApp agora"
                            >
                              <Send className="w-3 h-3" />
                              <span>Disparar</span>
                            </button>
                          )}

                          {rem.status === "sent" && (
                            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                              <span className="text-[10px] font-bold text-slate-500 px-1">Simular Paciente:</span>
                              <button
                                onClick={() => onSimulatePatientResponse(rem.id, "confirm")}
                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors"
                                title="Simular que o paciente respondeu '1 - Confirmar'"
                              >
                                👍 Confirma
                              </button>
                              <button
                                onClick={() => onSimulatePatientResponse(rem.id, "cancel")}
                                className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition-colors"
                                title="Simular que o paciente respondeu '2 - Cancelar'"
                              >
                                ✕ Cancela
                              </button>
                            </div>
                          )}

                          <a
                            href={`https://wa.me/${rem.patientPhone.replace(/\D/g, "")}?text=${encodeURIComponent(rem.messageText)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
                            title="Abrir diretamente no WhatsApp Web"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MESSAGE TEMPLATES */}
      {activeTab === "templates" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Personalização dos Modelos de Mensagem (WhatsApp)
            </h3>
            <p className="text-xs text-slate-500">
              Use as tags inteligentes para preenchimento dinâmico: <code>&#123;paciente&#125;</code>, <code>&#123;medico&#125;</code>, <code>&#123;servico&#125;</code>, <code>&#123;data&#125;</code>, <code>&#123;horario&#125;</code>, <code>&#123;clinica&#125;</code>, <code>&#123;preparo&#125;</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Template D-1 */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-emerald-500" />
                  Modelo D-1 (Véspera da Consulta)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                  Automático 24h antes
                </span>
              </div>

              <textarea
                rows={5}
                value={d1Template}
                onChange={(e) => setD1Template(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 font-mono"
              />

              <div className="text-[11px] text-slate-500">
                <strong>Gatilho de resposta automática:</strong> Quando o paciente responder "1", o sistema confirma o horário. Se responder "2", o agendamento é cancelado e a vaga liberada.
              </div>
            </div>

            {/* Template D-0 (2h antes) */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  Modelo D-0 (2 horas antes do atendimento)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
                  Orientações & Chegada
                </span>
              </div>

              <textarea
                rows={5}
                value={d0Template}
                onChange={(e) => setD0Template(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 font-mono"
              />

              <div className="text-[11px] text-slate-500">
                <strong>Orientações de preparo:</strong> Inclui automaticamente instruções de jejum para exames laboratoriais ou cuidados pré-consulta.
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => alert("Modelos de lembretes atualizados com sucesso!")}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md"
            >
              Salvar Modelos de Lembretes
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: AUTOMATION RULES */}
      {activeTab === "rules" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Regras de Negócio e Política de Faltas (No-Show)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                1. Confirmação Rápida no WhatsApp
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Ao responder "1" ou "Confirmar", o status na Recepção muda imediatamente para <strong>Confirmado</strong>, notificando a equipe de recepção.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-amber-500" />
                2. Reabertura Automática de Vaga
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Se o paciente informar que não poderá comparecer, a vaga é reaberta na grade imediatamente para outro paciente agendar via bot.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                3. Tolerância & Prazo de Cancelamento
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Cancelamentos sem custo permitidos até 4 horas antes do atendimento. Após isso, o sistema sugere remarcação amigável.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
