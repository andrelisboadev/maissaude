import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Mic,
  MicOff,
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
  QrCode,
  Copy,
  ExternalLink,
  Zap,
  Sparkles,
  AlertTriangle,
  UserCheck,
  Calendar,
  Clock,
  Trash2,
  Volume2,
  VolumeX,
  Play,
  ArrowRight,
  Shield,
  HelpCircle,
} from "lucide-react";
import { Message, ClinicConfig, Appointment, ScenarioPreset } from "../types";
import { soundEffects } from "../utils/audioEffects";
import confetti from "canvas-confetti";

interface WhatsAppSimulatorProps {
  messages: Message[];
  onSendMessage: (text: string, customPhone?: string, customName?: string) => Promise<void>;
  isLoading: boolean;
  clinicConfig: ClinicConfig;
  activeAppointment?: Appointment;
  onSimulatePayment: (appointmentId: string) => Promise<void>;
  onClearChat: () => void;
  onOpenInspector: () => void;
  patientPhone: string;
  setPatientPhone: (phone: string) => void;
  patientName: string;
  setPatientName: (name: string) => void;
  viewMode?: "client" | "agency";
}

const PRESET_SCENARIOS: ScenarioPreset[] = [
  {
    id: "sc-idoso-1",
    title: "👵 1. Ajuda Humana (Idoso / 0)",
    category: "Acessibilidade / Idosos",
    badge: "Tool: transferir_humano",
    description: "Paciente idoso pede ajuda humana ou digita 0 por dificuldade no agendamento.",
    prompt: "Olá minha filha, sou idosa e não sei mexer direito no celular. Pode me ligar ou colocar uma pessoa para me ajudar a marcar uma consulta?",
    highlightTool: "transferir_atendimento_humano",
  },
  {
    id: "sc-1",
    title: "2. Consulta de Horários",
    category: "Consulta",
    badge: "Tool: consultar_horarios",
    description: "Pergunta sobre horários disponíveis para Cardiologia amanhã.",
    prompt: "Olá! Gostaria de saber os horários disponíveis para consulta de Cardiologia amanhã.",
    highlightTool: "consultar_horarios_disponiveis",
  },
  {
    id: "sc-orc-1",
    title: "3. Orçamento de Exames",
    category: "Orçamento / Exames",
    badge: "Tool: orcar_consultas_e_exames",
    description: "Solicita cotação de Hemograma, Glicemia e Colesterol com preparo e desconto Pix.",
    prompt: "Olá! Queria fazer um orçamento de exames de sangue: hemograma completo, glicemia e colesterol total. Qual o valor e o preparo?",
    highlightTool: "orcar_consultas_e_exames",
  },
  {
    id: "sc-orc-2",
    title: "4. Combo Consulta + Exames",
    category: "Orçamento / Exames",
    badge: "Tool: orcar_consultas_e_exames",
    description: "Pede cotação de consulta cardiológica + ECG + Ultrassom com pacote de desconto.",
    prompt: "Boa tarde! Gostaria de saber quanto fica para fazer uma consulta com Cardiologista, Eletrocardiograma e Ultrassom de abdome.",
    highlightTool: "orcar_consultas_e_exames",
  },
  {
    id: "sc-orc-3",
    title: "5. Catálogo de Exames & Jejum",
    category: "Orçamento / Exames",
    badge: "Tool: consultar_tabela_exames",
    description: "Pergunta quais exames laboratoriais a clínica faz e horários de coleta.",
    prompt: "Vocês fazem exames laboratoriais? Quais os principais exames e como funciona a coleta?",
    highlightTool: "consultar_tabela_exames",
  },
  {
    id: "sc-2",
    title: "6. Criar Agendamento",
    category: "Agendamento",
    badge: "Tool: criar_agendamento",
    description: "Confirma o agendamento fornecendo nome e horário escolhido.",
    prompt: "Perfeito! Pode agendar para mim, Carlos Eduardo Silva, no Clínico Geral amanhã às 09:15 por favor.",
    highlightTool: "criar_agendamento",
  },
  {
    id: "sc-3",
    title: "7. Consultar Status",
    category: "Consulta",
    badge: "Tool: consultar_status",
    description: "Verifica se o agendamento já foi confirmado ou está pendente.",
    prompt: "Gostaria de verificar o status do meu agendamento por favor.",
    highlightTool: "consultar_status_agendamento",
  },
  {
    id: "sc-4",
    title: "8. Cancelar Agendamento",
    category: "Cancelamento",
    badge: "Tool: cancelar_agendamento",
    description: "Solicita o cancelamento da consulta e liberação do horário.",
    prompt: "Preciso cancelar o meu agendamento por imprevisto.",
    highlightTool: "cancelar_agendamento",
  },
  {
    id: "sc-5",
    title: "9. Dúvida Médica (Regra Escopo)",
    category: "Regras / Bloqueios",
    badge: "Tool: transferir_humano",
    description: "Pergunta sobre dosagem de remédio. Deve transferir imediatamente para humano.",
    prompt: "Estou com muita dor de garganta e febre de 38.5. Posso tomar amoxicilina 500mg?",
    highlightTool: "transferir_atendimento_humano",
  },
  {
    id: "sc-6",
    title: "10. Pedido de Desconto Fora Tabela",
    category: "Regras / Bloqueios",
    badge: "Regra Inviolável",
    description: "Tenta negociar desconto de 50%. A IA não pode aceitar sem transferir.",
    prompt: "Achei a consulta um pouco cara. Você consegue me dar 50% de desconto no Pix?",
    highlightTool: "transferir_atendimento_humano",
  },
];

export const WhatsAppSimulator: React.FC<WhatsAppSimulatorProps> = ({
  messages,
  onSendMessage,
  isLoading,
  clinicConfig,
  activeAppointment,
  onSimulatePayment,
  onClearChat,
  onOpenInspector,
  patientPhone,
  setPatientPhone,
  patientName,
  setPatientName,
  viewMode = "agency",
}) => {
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle Speech Recognition for voice input
  const toggleSpeechRecognition = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Seu navegador não suporta reconhecimento de voz direto. Digite sua mensagem.");
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "pt-BR";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const textToSend = inputText;
    setInputText("");
    await onSendMessage(textToSend, patientPhone, patientName);
  };

  const handleScenarioClick = async (scenario: ScenarioPreset) => {
    if (isLoading) return;
    await onSendMessage(scenario.prompt, patientPhone, patientName);
  };

  const handleCopyPix = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSpeak = (msgId: string, text: string) => {
    if (speakingMsgId === msgId) {
      soundEffects.stopSpeaking();
      setSpeakingMsgId(null);
    } else {
      soundEffects.speakPortuguese(text);
      setSpeakingMsgId(msgId);
    }
  };

  const triggerPaymentWebhook = async (aptId: string) => {
    await onSimulatePayment(aptId);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // Helper to render WhatsApp formatted text (*bold*, _italic_, links)
  const formatWhatsAppText = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");

    return lines.map((line, lIdx) => {
      // Process bold *text*
      const parts = line.split(/(\*[^*]+\*|_[^_]+_|https?:\/\/[^\s]+)/g);

      return (
        <div key={lIdx} className={line.trim() === "" ? "h-2" : "min-h-[1.25rem]"}>
          {parts.map((part, pIdx) => {
            if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
              return (
                <strong key={pIdx} className="font-bold text-slate-900">
                  {part.slice(1, -1)}
                </strong>
              );
            }
            if (part.startsWith("_") && part.endsWith("_") && part.length > 2) {
              return (
                <em key={pIdx} className="italic text-slate-700">
                  {part.slice(1, -1)}
                </em>
              );
            }
            if (part.startsWith("http://") || part.startsWith("https://")) {
              return (
                <a
                  key={pIdx}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline font-medium break-all hover:text-blue-800"
                >
                  {part}
                </a>
              );
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT / CENTER: WhatsApp Web Shell (7 or 8 cols on desktop) */}
      <div className="lg:col-span-8 flex flex-col h-[750px] bg-slate-900 rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden">
        {/* WhatsApp Header */}
        <div className="bg-emerald-800 text-white px-4 py-3 flex items-center justify-between shadow-md z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-emerald-600 border-2 border-emerald-400 flex items-center justify-center font-bold text-white shadow">
                {clinicConfig.clinicName.charAt(0)}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-emerald-800"></span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm sm:text-base leading-tight">
                  {clinicConfig.clinicName}
                </span>
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] shadow-sm">
                  ✓
                </span>
              </div>
              <p className="text-xs text-emerald-100 flex items-center gap-1">
                {isLoading ? (
                  <span className="italic font-medium animate-pulse text-emerald-200">
                    digitando...
                  </span>
                ) : (
                  <span>online • Atendimento Oficial</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-emerald-100">
            <button
              onClick={onClearChat}
              title="Limpar histórico de conversa"
              className="p-2 rounded-full hover:bg-emerald-700/60 transition-colors text-xs font-medium flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
            {viewMode === "agency" && (
              <button
                onClick={onOpenInspector}
                title="Abrir Inspetor de Tools e LLM"
                className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1 border border-emerald-500/40"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ver Tools</span>
              </button>
            )}
          </div>
        </div>

        {/* WhatsApp Chat Canvas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#e5ddd5] bg-opacity-95 relative bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]">
          {/* WhatsApp Encryption Security Notice */}
          <div className="flex justify-center my-1">
            <div className="bg-amber-100/90 text-amber-900 border border-amber-300 text-[11px] px-3 py-1 rounded-lg max-w-md text-center shadow-xs flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>
                As mensagens são protegidas. Este canal é operado por Inteligência Artificial conectada à agenda oficial.
              </span>
            </div>
          </div>

          {/* Messages Stream */}
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            const isWebhook = msg.isWebhookNotification;

            if (isWebhook) {
              return (
                <div key={msg.id} className="flex justify-center my-2 animate-bounce">
                  <div className="bg-emerald-100 border-2 border-emerald-500 text-emerald-950 px-4 py-2.5 rounded-xl shadow-md max-w-md text-xs sm:text-sm">
                    {formatWhatsAppText(msg.content)}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"} transition-all`}
              >
                <div
                  className={`relative max-w-[88%] sm:max-w-[78%] rounded-2xl p-3 sm:p-3.5 shadow-sm text-sm ${
                    isUser
                      ? "bg-[#d9fdd3] text-slate-900 rounded-tr-xs"
                      : "bg-white text-slate-900 rounded-tl-xs border border-slate-200/80"
                  }`}
                >
                  {/* Message Body */}
                  <div className="text-slate-900 leading-relaxed break-words whitespace-pre-wrap">
                    {formatWhatsAppText(msg.content)}
                  </div>

                  {/* Payment Card Attached to Message if Appointment Created */}
                  {msg.appointment && msg.appointment.status === "pending_payment" && (
                    <div className="mt-3 p-3 bg-amber-50/90 border border-amber-200 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between border-b border-amber-200/80 pb-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                          <QrCode className="w-4 h-4 text-amber-700" />
                          <span>PIX MERCADO PAGO • R$ {msg.appointment.price.toFixed(2)}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-[10px] font-bold">
                          Pré-Reserva (30 min)
                        </span>
                      </div>

                      <p className="text-xs text-amber-800">
                        O horário só é garantido após a compensação do Pix pelo Mercado Pago.
                      </p>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {msg.pixCode && (
                          <button
                            onClick={() => handleCopyPix(msg.pixCode!, msg.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-semibold shadow-xs transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{copiedId === msg.id ? "Copiado!" : "Copiar Pix"}</span>
                          </button>
                        )}

                        <button
                          onClick={() => triggerPaymentWebhook(msg.appointment!.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-colors animate-pulse"
                        >
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          <span>Simular Pagamento Pix</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Transfer to Human Card if applicable */}
                  {msg.transferredToHuman && (
                    <div className="mt-2.5 p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 space-y-1">
                      <div className="flex items-center gap-1 font-bold text-indigo-950">
                        <UserCheck className="w-4 h-4 text-indigo-600" />
                        <span>Encaminhado para Atendimento Humano</span>
                      </div>
                      <p className="text-indigo-800 text-[11px]">
                        Atendente entrará em contato via WhatsApp. Central: {clinicConfig.phone}
                      </p>
                    </div>
                  )}

                  {/* Message Meta: Timestamp, Audio, and Tool Execution Pill */}
                  <div className="flex items-center justify-end gap-2 mt-1 pt-1 text-[11px] text-slate-500">
                    {!isUser && (
                      <button
                        onClick={() => handleSpeak(msg.id, msg.content)}
                        title="Ouvir áudio da resposta"
                        className="hover:text-emerald-700 flex items-center gap-0.5 text-[10px] text-slate-600 transition-colors"
                      >
                        {speakingMsgId === msg.id ? (
                          <VolumeX className="w-3 h-3 text-red-500 animate-pulse" />
                        ) : (
                          <Volume2 className="w-3 h-3 text-emerald-600" />
                        )}
                        <span>Ouvir</span>
                      </button>
                    )}

                    {viewMode === "agency" && msg.toolCalls && msg.toolCalls.length > 0 && (
                      <button
                        onClick={onOpenInspector}
                        className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 hover:bg-slate-200 text-[10px] font-mono text-indigo-700 flex items-center gap-1"
                        title="Ver Function Calling detalhado"
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>{msg.toolCalls[0].name}</span>
                      </button>
                    )}

                    <span>{msg.timestamp}</span>

                    {isUser && (
                      <span className="text-emerald-600">
                        <CheckCheck className="w-3.5 h-3.5 inline" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-start">
              <div className="bg-white rounded-2xl rounded-tl-xs p-3 shadow-xs border border-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></span>
                <span
                  className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                  style={{ animationDelay: "0.15s" }}
                ></span>
                <span
                  className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                  style={{ animationDelay: "0.3s" }}
                ></span>
                <span className="text-xs text-slate-500 ml-1 font-medium">
                  Consultando ferramentas...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Scenario Chips Tray */}
        <div className="bg-slate-100 px-3 py-2 border-t border-slate-200 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="font-semibold text-slate-600 shrink-0 flex items-center gap-1 text-[11px]">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              Cenários:
            </span>
            {PRESET_SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                onClick={() => handleScenarioClick(sc)}
                disabled={isLoading}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors shadow-2xs flex items-center gap-1 border ${
                  sc.id === "sc-idoso-1"
                    ? "bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900 font-semibold"
                    : "bg-white hover:bg-emerald-50 border-slate-300 hover:border-emerald-400 text-slate-700 hover:text-emerald-800"
                }`}
              >
                <span>{sc.title}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onSendMessage("0", patientPhone, patientName)}
            disabled={isLoading}
            title="Solicitar Atendente Humano / Suporte para Idosos (Opção 0)"
            className="shrink-0 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Chamar Atendente (0)</span>
          </button>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="bg-slate-200 px-3 py-2 flex items-center gap-2 border-t border-slate-300"
        >
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            title={isRecording ? "Parar gravação" : "Falar mensagem por voz"}
            className={`p-2.5 rounded-full transition-all ${
              isRecording
                ? "bg-red-500 text-white animate-pulse"
                : "bg-slate-300 hover:bg-slate-400 text-slate-700"
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            id="whatsapp-message-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isRecording ? "Ouvindo sua voz..." : "Digite uma mensagem como paciente..."
            }
            disabled={isLoading}
            className="flex-1 bg-white px-4 py-2.5 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
          />

          <button
            id="whatsapp-send-btn"
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className={`p-2.5 rounded-full transition-all ${
              inputText.trim() && !isLoading
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
                : "bg-slate-300 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* RIGHT: Live Patient Context & Operational Assistant Drawer (4 cols on desktop) */}
      <div className="lg:col-span-4 space-y-4">
        {/* Patient Profile & Phone Simulator */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Simular Perfil do Paciente</span>
            </h3>
            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              Sessão Ativa
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Nome do Paciente:
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Ex: Carlos Eduardo Silva"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                WhatsApp / Telefone:
              </label>
              <input
                type="text"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="Ex: 5591981112233"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Active Appointment & Pix Simulator Card */}
        {activeAppointment && (
          <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-emerald-500/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
              Agendamento Mais Recente
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-900 text-sm">
                {activeAppointment.id} • {activeAppointment.serviceName}
              </span>
            </div>

            <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl mb-3">
              <div>
                <strong>Médico:</strong> {activeAppointment.doctor}
              </div>
              <div>
                <strong>Data & Hora:</strong> {activeAppointment.date} às {activeAppointment.time}
              </div>
              <div>
                <strong>Valor:</strong> R$ {activeAppointment.price.toFixed(2)}
              </div>
              <div>
                <strong>Status:</strong>{" "}
                <span
                  className={`font-semibold px-1.5 py-0.5 rounded ${
                    activeAppointment.status === "confirmed_paid"
                      ? "bg-emerald-100 text-emerald-800"
                      : activeAppointment.status === "pending_payment"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-200 text-slate-800"
                  }`}
                >
                  {activeAppointment.status === "confirmed_paid"
                    ? "PAGO & CONFIRMADO"
                    : activeAppointment.status === "pending_payment"
                    ? "Pendente Pix"
                    : activeAppointment.status}
                </span>
              </div>
            </div>

            {activeAppointment.status === "pending_payment" && (
              <button
                onClick={() => triggerPaymentWebhook(activeAppointment.id)}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Simular Aprovação Mercado Pago (Webhook)</span>
              </button>
            )}
          </div>
        )}

        {/* Operational Guardrails Card */}
        <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl shadow-sm border border-slate-800 text-xs space-y-2.5">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Shield className="w-4 h-4" />
            <span>Regras Invioláveis do Agente (Gemini)</span>
          </div>

          <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
            <li>
              <strong>Acessibilidade & Idosos:</strong> Opção "0" ou pedido de ajuda transfere imediatamente para atendente humano na recepção por voz ou chat.
            </li>
            <li>
              <strong>Sem Alucinações:</strong> Sempre consulta horários reais no banco antes de responder.
            </li>
            <li>
              <strong>Confirmação de Reserva:</strong> Horário garantido via Pix Mercado Pago ou no balcão da clínica.
            </li>
            <li>
              <strong>Bloqueio de Descontos:</strong> Não negocia valores fora da tabela oficial.
            </li>
            <li>
              <strong>Dúvidas Médicas / Emergências:</strong> Transfere imediatamente para médico/recepcionista com protocolo oficial.
            </li>
          </ul>

          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
            <span>Contato Agência Vendas:</span>
            <strong className="text-emerald-400">{clinicConfig.agencyPhone}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
