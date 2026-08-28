import React, { useState } from "react";
import {
  BookOpen,
  Code2,
  Database,
  Server,
  Cloud,
  Check,
  Copy,
  Terminal,
  Sparkles,
  ShieldAlert,
  CreditCard,
  MessageSquare,
  PhoneCall,
  ExternalLink,
} from "lucide-react";
import { ClinicConfig } from "../types";

interface InstallationGuideProps {
  clinicConfig: ClinicConfig;
}

export const InstallationGuide: React.FC<InstallationGuideProps> = ({ clinicConfig }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const sqlSchema = `-- ============================================================
-- SCHEMA SUPABASE (PostgreSQL) - AGENTE WHATSAPP CLÍNICA
-- Projeto: Bragança Digital • Contato: (91) 98839-0894
-- ============================================================

-- 1. CONVERSAS (Uma por número de WhatsApp do paciente)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  patient_name TEXT,
  status TEXT DEFAULT 'active', -- active, closed, transferred
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. HISTÓRICO DE MENSAGENS (Memória do Agente IA)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' ou 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. SERVIÇOS & ESPECIALIDADES DA CLÍNICA
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  duration_minutes INT DEFAULT 30,
  doctor TEXT NOT NULL,
  description TEXT
);

-- 4. VAGAS & DISPONIBILIDADE
CREATE TABLE IF NOT EXISTS availability_slots (
  id TEXT PRIMARY KEY,
  service_id TEXT REFERENCES services(id),
  doctor TEXT NOT NULL,
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE
);

-- 5. AGENDAMENTOS
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY, -- ex: 'AG-1094'
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  service_id TEXT REFERENCES services(id),
  doctor TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending_payment', -- 'pending_payment', 'confirmed_paid', 'cancelled', 'transferred'
  payment_id TEXT,
  payment_link TEXT,
  pix_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  notes TEXT
);

-- RLS: Manter habilitado no Supabase com acesso apenas via service_role no backend`;

  const vercelCode = `// api/whatsapp-orchestrator.js (Vercel Serverless Function)
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { "User-Agent": "aistudio-build" } }
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 5 Tools Gemini Function Declarations
const GEMINI_TOOLS = [{
  functionDeclarations: [
    {
      name: "consultar_horarios_disponiveis",
      description: "Consulta horários livres para agendamento",
      parameters: {
        type: Type.OBJECT,
        properties: {
          servico: { type: Type.STRING },
          data_preferida: { type: Type.STRING }
        },
        required: ["servico"]
      }
    },
    {
      name: "criar_agendamento",
      description: "Cria pré-reserva e gera cobrança Pix Mercado Pago",
      parameters: {
        type: Type.OBJECT,
        properties: {
          nome_paciente: { type: Type.STRING },
          telefone: { type: Type.STRING },
          servico: { type: Type.STRING },
          data_hora: { type: Type.STRING }
        },
        required: ["nome_paciente", "telefone", "servico", "data_hora"]
      }
    },
    {
      name: "consultar_status_agendamento",
      description: "Verifica situação do agendamento",
      parameters: {
        type: Type.OBJECT,
        properties: { identificador: { type: Type.STRING } },
        required: ["identificador"]
      }
    },
    {
      name: "cancelar_agendamento",
      description: "Cancela agendamento e libera vaga",
      parameters: {
        type: Type.OBJECT,
        properties: { identificador: { type: Type.STRING }, motivo: { type: Type.STRING } },
        required: ["identificador"]
      }
    },
    {
      name: "transferir_atendimento_humano",
      description: "Transfere conversa para recepção humana",
      parameters: {
        type: Type.OBJECT,
        properties: { motivo: { type: Type.STRING } },
        required: ["motivo"]
      }
    }
  ]
}];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { phone_number, message_text } = req.body;

  // 1. Recuperar histórico da conversa no Supabase
  // 2. Chamar ai.models.generateContent({ model: 'gemini-3.7-flash', ... })
  // 3. Executar tool se houver functionCalls e salvar agendamento
  // 4. Enviar mensagem de resposta pelo Baileys Bridge
  return res.json({ success: true });
}`;

  const envTemplate = `# Configurações de Ambiente (Vercel & Baileys)
GEMINI_API_KEY="AIzaSy..."
SUPABASE_URL="https://njevudvdahfvezndpryf.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsIn..."
MERCADO_PAGO_ACCESS_TOKEN="APP_USR-..."
BAILEYS_BRIDGE_URL="https://sua-sessao-baileys.railway.app"
AGENCY_CONTACT="(91) 98839-0894"`;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-bold text-white">
            Guia de Instalação, Arquitetura & Código de Produção
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manual completo de adaptação Anthropic Claude ➔ Google Gemini desenvolvido pela Bragança Digital.
        </p>
      </div>

      {/* Architecture Diagram */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-600" />
          <span>Arquitetura do Sistema de Produção</span>
        </h3>

        <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
          <pre>{`WhatsApp (Paciente)
      │
      ▼
Baileys Bridge (Railway/Fly.io) ── Sessão Ativa do WhatsApp da Clínica
      │
      ▼
Orquestrador (Vercel Functions / Node.js)
      │
      ├── 1. Supabase (conversations, messages, availability_slots, appointments)
      │
      ├── 2. Gemini 3.7 Flash API (Google AI Studio - Camada Gratuita)
      │
      └── 3. Mercado Pago Webhook (Confirmação Automática de Pix)`}</pre>
        </div>
      </div>

      {/* Database Schema Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              1. Estrutura do Banco de Dados (Supabase SQL)
            </h3>
          </div>

          <button
            onClick={() => copyToClipboard(sqlSchema, "sql")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
          >
            {copiedSection === "sql" ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedSection === "sql" ? "Copiado!" : "Copiar SQL"}</span>
          </button>
        </div>

        <pre className="p-4 bg-slate-950 text-emerald-300 rounded-xl text-xs font-mono overflow-x-auto max-h-72 border border-slate-800">
          {sqlSchema}
        </pre>
      </div>

      {/* Vercel Function Code */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              2. Orquestrador Vercel com Gemini 3.7 Function Calling
            </h3>
          </div>

          <button
            onClick={() => copyToClipboard(vercelCode, "vercel")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
          >
            {copiedSection === "vercel" ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedSection === "vercel" ? "Copiado!" : "Copiar Código"}</span>
          </button>
        </div>

        <pre className="p-4 bg-slate-950 text-indigo-300 rounded-xl text-xs font-mono overflow-x-auto max-h-72 border border-slate-800">
          {vercelCode}
        </pre>
      </div>

      {/* Vercel & Deployment Step-by-Step */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            Passo a Passo de Publicação na Vercel (Guia Rápido)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center text-[10px]">1</span>
              Importar no Vercel
            </span>
            <p className="text-slate-600 leading-relaxed">
              Suba o projeto no GitHub e clique em <strong>Add New Project</strong> na Vercel importando o repositório.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white inline-flex items-center justify-center text-[10px]">2</span>
              Configurar Variáveis
            </span>
            <p className="text-slate-600 leading-relaxed">
              Em <strong>Environment Variables</strong>, cole a <code>GEMINI_API_KEY</code>, <code>SUPABASE_URL</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code> e <code>MERCADO_PAGO_ACCESS_TOKEN</code>.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center text-[10px]">3</span>
              Conectar Baileys
            </span>
            <p className="text-slate-600 leading-relaxed">
              Aponte o webhook do Baileys para <code>https://seu-app.vercel.app/api/chat</code> e escaneie o QR Code do WhatsApp da clínica.
            </p>
          </div>
        </div>
      </div>

      {/* WordPress & Web Widget Integration Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <ExternalLink className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                4. Integração no WordPress / Site da Clínica
              </h3>
              <p className="text-xs text-slate-500">
                Como colocar o assistente para atender os pacientes dentro do site WordPress
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold self-start sm:self-auto">
            WordPress / Elementor / Script
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Opção A: Widget Flutuante WhatsApp Oficial */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px]">A</span>
                Widget Flutuante WhatsApp (Mais Recomendado)
              </h4>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-semibold">1 Clique</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              O botão flutuante oficial no canto do WordPress redireciona o paciente direto para o WhatsApp da clínica com mensagem pronta (ex: <em>"Olá, vim pelo site e quero agendar"</em>), onde a IA assume imediatamente.
            </p>
            <div className="bg-slate-950 text-slate-200 p-3 rounded-lg font-mono text-[11px] overflow-x-auto border border-slate-800">
{`<!-- Coloque no Footer do WordPress / Elementor -->
<a href="https://wa.me/55${(clinicConfig.phone || clinicConfig.agencyPhone || "91988390894").replace(/\\D/g, '')}?text=Ol%C3%A1%2C%20vim%20pelo%20site%20da%20cl%C3%ADnica%20e%20gostaria%20de%20agendar"
   target="_blank"
   style="position:fixed;bottom:20px;right:20px;background:#25D366;color:#fff;padding:12px 18px;border-radius:50px;font-weight:bold;text-decoration:none;box-shadow:0 4px 15px rgba(0,0,0,0.2);z-index:99999;display:flex;align-items:center;gap:8px;">
   <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" width="22" />
   Agendar no WhatsApp 24h
</a>`}
            </div>
          </div>

          {/* Opção B: Chat Embutido no Site (Iframe / Webchat) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">B</span>
                Chatbot Embutido Dentro da Página (Iframe)
              </h4>
              <span className="text-[10px] text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded font-semibold">Sem Sair do Site</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Permite que o paciente converse com o assistente inteligente diretamente em uma janela modal ou página dedicada (<code>/agendamento</code>) no WordPress.
            </p>
            <div className="bg-slate-950 text-slate-200 p-3 rounded-lg font-mono text-[11px] overflow-x-auto border border-slate-800">
{`<!-- Bloco HTML / Shortcode no WordPress -->
<iframe
  src="https://seu-app-agendamento.vercel.app/?mode=client"
  width="100%"
  height="650"
  style="border:none;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,0.12);"
  allow="camera; microphone"
></iframe>`}
            </div>
          </div>
        </div>
      </div>

      {/* Env Template */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-700" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              3. Variáveis de Ambiente (.env)
            </h3>
          </div>

          <button
            onClick={() => copyToClipboard(envTemplate, "env")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
          >
            {copiedSection === "env" ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedSection === "env" ? "Copiado!" : "Copiar .env"}</span>
          </button>
        </div>

        <pre className="p-4 bg-slate-950 text-amber-300 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800">
          {envTemplate}
        </pre>
      </div>

      {/* Sales Pitch & Commercial Script */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-indigo-900 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>Script Comercial para Apresentação em Clínicas</span>
          </h3>
          <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-full text-xs font-semibold">
            Material de Vendas
          </span>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-slate-300">
          <p className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 italic text-slate-100">
            &ldquo;O sistema que vocês estão vendo agora já está funcionando de ponta a ponta: ele atende no WhatsApp 24 horas por dia, consulta a agenda real dos seus médicos sem inventar horários, gera a cobrança Pix no Mercado Pago e só confirma a consulta quando o dinheiro cai na conta. Na versão de produção, conectamos diretamente ao número oficial da sua clínica.&rdquo;
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
              <strong className="text-emerald-400 block mb-1">Benefício 1: Zero No-Show</strong>
              <p className="text-slate-300">Como o paciente paga o Pix antecipado ou taxa de reserva para garantir a vaga, as faltas caem drasticamente.</p>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
              <strong className="text-indigo-400 block mb-1">Benefício 2: Recepção Livre</strong>
              <p className="text-slate-300">Sua secretária não perde horas respondendo "quais os horários de amanhã" e foca no atendimento presencial humanizado.</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <span className="text-slate-400">Contato Bragança Digital para Propostas:</span>
            <a
              href="https://wa.me/5591988390894"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>(91) 98839-0894</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
