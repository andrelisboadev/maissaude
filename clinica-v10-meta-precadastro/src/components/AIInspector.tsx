import React, { useState } from "react";
import {
  Terminal,
  Cpu,
  Layers,
  Sparkles,
  Code2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Zap,
  ArrowRight,
  Play,
} from "lucide-react";
import { ToolLog, ClinicConfig } from "../types";

interface AIInspectorProps {
  toolLogs: ToolLog[];
  clinicConfig: ClinicConfig;
  hasGeminiKey: boolean;
  onExecuteCustomTool?: (toolName: string, args: any) => Promise<any>;
}

const TOOLS_METADATA = [
  {
    name: "consultar_horarios_disponiveis",
    title: "1. Consultar Horários Disponíveis",
    description: "Consulta horários livres e datas disponíveis na agenda da clínica para consultas e procedimentos médicos.",
    required: ["servico"],
    schema: {
      servico: "string (ex: 'Clínico Geral', 'Cardiologia', 'Dermatologia')",
      data_preferida: "string (opcional - ex: 'amanhã', '2026-08-14')",
      medico: "string (opcional - nome do especialista)",
    },
    sampleArgs: { servico: "Cardiologia", data_preferida: "amanhã" },
  },
  {
    name: "criar_agendamento",
    title: "2. Criar Agendamento",
    description: "Registra uma pré-reserva de agendamento na agenda da clínica e gera o link de pagamento Pix / Mercado Pago.",
    required: ["nome_paciente", "telefone", "servico", "data_hora"],
    schema: {
      nome_paciente: "string (ex: 'Carlos Eduardo Silva')",
      telefone: "string (ex: '5591981112233')",
      servico: "string (ex: 'Cardiologia')",
      data_hora: "string (ex: '2026-08-14 09:15')",
      medico: "string (opcional)",
    },
    sampleArgs: {
      nome_paciente: "Carlos Eduardo Silva",
      telefone: "5591981112233",
      servico: "Cardiologia",
      data_hora: "2026-08-14 09:15",
    },
  },
  {
    name: "consultar_status_agendamento",
    title: "3. Consultar Status Agendamento",
    description: "Consulta a situação atual de um agendamento existente pelo código AG-XXXX ou telefone do paciente.",
    required: ["identificador"],
    schema: {
      identificador: "string (código do agendamento ou telefone do paciente)",
    },
    sampleArgs: { identificador: "AG-1094" },
  },
  {
    name: "cancelar_agendamento",
    title: "4. Cancelar Agendamento",
    description: "Cancela um agendamento prévio e libera o horário de volta na agenda da clínica.",
    required: ["identificador"],
    schema: {
      identificador: "string (código AG-XXXX ou telefone)",
      motivo: "string (opcional)",
    },
    sampleArgs: { identificador: "AG-1095", motivo: "Imprevisto de trabalho" },
  },
  {
    name: "transferir_atendimento_humano",
    title: "5. Transferir para Humano",
    description: "Transfere a conversa para a equipe humana em casos de dúvidas médicas, emergências, descontos ou solicitações fora de escopo.",
    required: ["motivo"],
    schema: {
      motivo: "string (ex: 'Dúvida sobre medicação', 'Desconto solicitado')",
      resumo: "string (opcional - resumo da solicitação)",
    },
    sampleArgs: { motivo: "Dúvida sobre antibiótico", resumo: "Paciente perguntou posologia" },
  },
];

export const AIInspector: React.FC<AIInspectorProps> = ({
  toolLogs,
  clinicConfig,
  hasGeminiKey,
}) => {
  const [selectedTool, setSelectedTool] = useState(TOOLS_METADATA[0]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"logs" | "schemas" | "comparison">("logs");

  const copyJson = (data: any, id: string) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Inspetor de IA & Function Calling</h2>
            <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded-full">
              Gemini 3.7 Flash Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Monitore em tempo real as chamadas de ferramentas, parâmetros, payloads JSON e ciclo de vida do agente.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === "logs" ? "bg-emerald-600 text-white" : "text-slate-300 hover:text-white"
              }`}
            >
              Logs ao Vivo ({toolLogs.length})
            </button>
            <button
              onClick={() => setActiveTab("schemas")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === "schemas" ? "bg-emerald-600 text-white" : "text-slate-300 hover:text-white"
              }`}
            >
              5 Ferramentas (Schemas)
            </button>
            <button
              onClick={() => setActiveTab("comparison")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === "comparison" ? "bg-emerald-600 text-white" : "text-slate-300 hover:text-white"
              }`}
            >
              Gemini vs Claude
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: Live Tool Logs */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          {toolLogs.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm text-slate-500 space-y-3">
              <Cpu className="w-10 h-10 text-slate-400 mx-auto animate-pulse" />
              <h3 className="font-bold text-slate-800 text-base">Nenhuma chamada de ferramenta registrada ainda</h3>
              <p className="text-xs max-w-md mx-auto">
                Envie uma mensagem no Simulador do WhatsApp (ex: <em>"Quais os horários de Cardiologia amanhã?"</em>) para ver as ferramentas sendo executadas em tempo real!
              </p>
            </div>
          ) : (
            toolLogs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-md overflow-hidden"
              >
                {/* Log Header */}
                <div className="bg-slate-800/90 px-4 py-2.5 flex items-center justify-between border-b border-slate-700/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {log.toolName}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">[{log.timestamp}]</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/50 rounded">
                      SUCCESS 200
                    </span>
                    <button
                      onClick={() => copyJson(log, log.id)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 text-xs"
                      title="Copiar JSON completo"
                    >
                      {copiedId === log.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Log Body */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 p-4 gap-4 text-xs font-mono">
                  {/* Arguments Sent by Gemini */}
                  <div>
                    <div className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider mb-1.5 flex items-center gap-1">
                      <Code2 className="w-3 h-3 text-indigo-400" />
                      <span>1. Argumentos enviados pela IA (Gemini):</span>
                    </div>
                    <pre className="p-3 bg-slate-950 rounded-xl text-indigo-300 overflow-x-auto border border-slate-800">
                      {JSON.stringify(log.arguments, null, 2)}
                    </pre>
                  </div>

                  {/* Result Returned from Database */}
                  <div>
                    <div className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider mb-1.5 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      <span>2. Resposta retornada do Banco (Supabase/DB):</span>
                    </div>
                    <pre className="p-3 bg-slate-950 rounded-xl text-emerald-300 overflow-x-auto border border-slate-800">
                      {JSON.stringify(log.result, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: Schemas of the 5 Tools */}
      {activeTab === "schemas" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Tool Selector List */}
          <div className="lg:col-span-5 space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Ferramentas Disponíveis ao Agente:
            </h3>
            {TOOLS_METADATA.map((tool) => (
              <button
                key={tool.name}
                onClick={() => setSelectedTool(tool)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                  selectedTool.name === tool.name
                    ? "bg-slate-900 text-white border-emerald-500 shadow-md"
                    : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 shadow-xs"
                }`}
              >
                <div className="font-bold text-xs sm:text-sm">{tool.title}</div>
                <div
                  className={`text-[11px] mt-1 line-clamp-2 ${
                    selectedTool.name === tool.name ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {tool.description}
                </div>
              </button>
            ))}
          </div>

          {/* Tool Schema Detail */}
          <div className="lg:col-span-7 bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <div className="text-xs text-emerald-400 font-mono font-bold uppercase">
                Function Declaration
              </div>
              <h3 className="text-lg font-bold text-white font-mono mt-0.5">{selectedTool.name}</h3>
              <p className="text-xs text-slate-300 mt-1">{selectedTool.description}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                  Campos Obrigatórios:
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedTool.required.map((req) => (
                    <span
                      key={req}
                      className="px-2 py-0.5 bg-red-950 text-red-300 border border-red-800/60 rounded font-mono text-[11px]"
                    >
                      {req}*
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                  Estrutura dos Parâmetros (Schema):
                </span>
                <pre className="p-3 bg-slate-950 rounded-xl text-emerald-300 font-mono overflow-x-auto border border-slate-800">
                  {JSON.stringify(selectedTool.schema, null, 2)}
                </pre>
              </div>

              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                  Exemplo de Payload de Chamada:
                </span>
                <pre className="p-3 bg-slate-950 rounded-xl text-indigo-300 font-mono overflow-x-auto border border-slate-800">
                  {JSON.stringify(selectedTool.sampleArgs, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Gemini vs Claude Comparison */}
      {activeTab === "comparison" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Estratégia de Transição: Google Gemini (Fase Demo Grátis) ➔ Claude Anthropic (Fase Produção)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Como documentado no guia da Bragança Digital, a estrutura de orquestração no Vercel e tabelas no Supabase são 100% idênticas. Apenas o conector do LLM é alternado quando o cliente fecha o contrato.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-emerald-950 text-sm">Fase 1: Demo & Vendas (Agora)</h4>
                <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 text-xs font-bold rounded-full">
                  Custo: R$ 0 / mês
                </span>
              </div>
              <ul className="text-xs text-emerald-900 space-y-1.5 list-disc list-inside">
                <li><strong>Modelo:</strong> Gemini 3.7 Flash (Google AI Studio)</li>
                <li><strong>API Key:</strong> Gratuita sem cartão de crédito</li>
                <li><strong>Formato de Tools:</strong> <code>functionDeclarations</code> com <code>Type.OBJECT</code></li>
                <li><strong>Objetivo:</strong> Demonstrar o sistema funcionando de ponta a ponta sem gastar nada.</li>
              </ul>
            </div>

            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-indigo-950 text-sm">Fase 2: Produção (Cliente Pago)</h4>
                <span className="px-2 py-0.5 bg-indigo-200 text-indigo-900 text-xs font-bold rounded-full">
                  Coberto pelo Cliente
                </span>
              </div>
              <ul className="text-xs text-indigo-900 space-y-1.5 list-disc list-inside">
                <li><strong>Modelo:</strong> Claude 3.5 Sonnet / 4 (Anthropic)</li>
                <li><strong>API Key:</strong> Paga coberta pela mensalidade do cliente</li>
                <li><strong>Formato de Tools:</strong> <code>tools</code> com <code>input_schema</code></li>
                <li><strong>Objetivo:</strong> Máxima robustez e confiabilidade no atendimento diário.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
