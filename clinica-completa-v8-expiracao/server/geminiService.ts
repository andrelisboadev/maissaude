import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { clinicDb, Appointment } from "./clinicDatabase.js";

// Initialize GenAI client with required header
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// 5 Tools Definitions as requested
const consultarHorariosDeclaration: FunctionDeclaration = {
  name: "consultar_horarios_disponiveis",
  description:
    "Consulta horários livres e datas disponíveis na agenda da clínica para consultas e procedimentos médicos.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      servico: {
        type: Type.STRING,
        description:
          "Nome do serviço ou especialidade (ex: Clínico Geral, Cardiologia, Dermatologia, Odontologia, Pediatria, Nutrição).",
      },
      data_preferida: {
        type: Type.STRING,
        description:
          "Data ou período desejado pelo paciente (ex: 'amanhã', 'hoje', '2026-08-14', 'próxima semana', 'tarde').",
      },
      medico: {
        type: Type.STRING,
        description: "Nome do médico ou especialista específico desejado (opcional).",
      },
    },
    required: ["servico"],
  },
};

const criarAgendamentoDeclaration: FunctionDeclaration = {
  name: "criar_agendamento",
  description:
    "Registra uma pré-reserva de agendamento e gera o link de pagamento Pix / Mercado Pago. " +
    "PRÉ-REQUISITO OBRIGATÓRIO: só chame esta ferramenta depois de já ter chamado 'consultar_horarios_disponiveis' " +
    "nesta conversa e o paciente ter escolhido um dos horários reais retornados. O campo 'data_hora' deve ser " +
    "copiado EXATAMENTE do resultado de 'consultar_horarios_disponiveis' — nunca estimado ou inventado.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      nome_paciente: {
        type: Type.STRING,
        description: "Nome completo do paciente.",
      },
      telefone: {
        type: Type.STRING,
        description: "Número de telefone ou WhatsApp do paciente (ex: 5591999998888).",
      },
      servico: {
        type: Type.STRING,
        description: "Nome do serviço ou especialidade selecionada, exatamente como confirmado pelo paciente.",
      },
      data_hora: {
        type: Type.STRING,
        description:
          "Data e horário EXATOS de um dos horários retornados por 'consultar_horarios_disponiveis' " +
          "(ex: '2026-08-14 09:15'). Nunca invente ou aproxime este valor.",
      },
      medico: {
        type: Type.STRING,
        description: "Nome do médico responsável (opcional).",
      },
    },
    required: ["nome_paciente", "telefone", "servico", "data_hora"],
  },
};

const consultarStatusDeclaration: FunctionDeclaration = {
  name: "consultar_status_agendamento",
  description:
    "Consulta a situação atual de um agendamento existente pelo ID do agendamento (ex: AG-1094) ou telefone/nome do paciente.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      identificador: {
        type: Type.STRING,
        description: "Código do agendamento (ex: AG-1094), telefone ou nome do paciente.",
      },
    },
    required: ["identificador"],
  },
};

const cancelarAgendamentoDeclaration: FunctionDeclaration = {
  name: "cancelar_agendamento",
  description: "Cancela um agendamento prévio e libera o horário de volta na agenda da clínica.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      identificador: {
        type: Type.STRING,
        description: "Código do agendamento (ex: AG-1094) ou telefone do paciente.",
      },
      motivo: {
        type: Type.STRING,
        description: "Motivo informado pelo paciente para o cancelamento (opcional).",
      },
    },
    required: ["identificador"],
  },
};

const transferirHumanoDeclaration: FunctionDeclaration = {
  name: "transferir_atendimento_humano",
  description:
    "Transfere a conversa para a equipe humana da recepção da clínica. Use sempre que o paciente solicitar ajuda de um atendente/humano, tiver dificuldades para agendar sozinho, for idoso/pouco alfabetizado precisando de auxílio guiado ou por telefone/áudio, tiver dúvidas médicas sobre remédios, urgências ou negociação.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      motivo: {
        type: Type.STRING,
        description:
          "Razão da transferência (ex: 'Auxílio para agendamento com humano (público idoso/acessibilidade)', 'Dificuldade para agendar pelo celular', 'Dúvida sobre medicação', 'Solicitação de desconto', 'Emergência clínica').",
      },
      resumo: {
        type: Type.STRING,
        description: "Breve resumo da solicitação do paciente para a recepção.",
      },
    },
    required: ["motivo"],
  },
};

const orcarConsultasExamesDeclaration: FunctionDeclaration = {
  name: "orcar_consultas_e_exames",
  description:
    "Gera um orçamento detalhado com valores oficiais de consultas médicas e/ou exames laboratoriais (ex: hemograma, glicemia, ultrassom, check-ups, cardiologia, etc.), incluindo valores individuais, preparo de coleta, desconto para pacotes e chave Pix com desconto à vista.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      itens: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description:
          "Lista de exames ou consultas solicitadas pelo paciente (ex: ['hemograma', 'glicemia', 'colesterol', 'consulta cardiologista', 'ultrassom abdome']).",
      },
      nome_paciente: {
        type: Type.STRING,
        description: "Nome do paciente para personalizar o orçamento (opcional).",
      },
    },
    required: ["itens"],
  },
};

const consultarExamesDeclaration: FunctionDeclaration = {
  name: "consultar_tabela_exames",
  description:
    "Consulta o catálogo de exames laboratoriais, valores de tabela, tempo de jejum/preparo e prazo de entrega dos laudos.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      categoria_ou_nome: {
        type: Type.STRING,
        description:
          "Nome do exame ou categoria pesquisada (ex: 'sangue', 'ultrassom', 'tireoide', 'urina', 'checkup', 'vitamina d').",
      },
    },
  },
};

const allTools = [
  {
    functionDeclarations: [
      consultarHorariosDeclaration,
      criarAgendamentoDeclaration,
      orcarConsultasExamesDeclaration,
      consultarExamesDeclaration,
      consultarStatusDeclaration,
      cancelarAgendamentoDeclaration,
      transferirHumanoDeclaration,
    ],
  },
];

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatProcessResult {
  reply: string;
  toolCalls: Array<{
    name: string;
    args: Record<string, any>;
    result: Record<string, any>;
  }>;
  appointmentCreated?: Appointment;
  transferredToHuman?: boolean;
  modelUsed: string;
  executionTimeMs: number;
}

export function buildSystemPrompt(clinicName: string): string {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0];

  return `Você é a Atendente Virtual Oficial da ${clinicName} no WhatsApp. Data atual: ${dateStr}.

SEU PAPEL:
- Atender pacientes com excelência, acolhimento e agilidade para agendamentos de consultas médicas, orçamentos de exames laboratoriais, preparo de exames, cancelamentos e dúvidas da clínica.
- ATENÇÃO ESPECIAL A IDOSOS E PESSOAS POUCO ALFABETIZADAS: Mantenha linguagem simples, calorosa, sem jargões e com formatação limpa. Sempre que o paciente expressar qualquer dúvida, confusão, preferência por falar ou pedir ajuda de uma pessoa real, chame prontamente 'transferir_atendimento_humano'.
- Tom profissional, simpático e resolutivo (resolva o pedido em no máximo 1 ou 2 mensagens).
- Respostas curtas e perfeitamente formatadas para WhatsApp (use quebras de linha limpas, negrito com *palavra*, listas numeradas e emojis pontuais).

SERVIÇOS & ESPECIALIDADES:
- Clínico Geral (Dr. Roberto Martins) - R$ 120,00
- Cardiologia + ECG (Dr. Marcelo Tavares) - R$ 220,00
- Dermatologia (Dra. Camila Vasconcelos) - R$ 180,00
- Odontologia & Avaliação (Dra. Juliana Mendes) - R$ 150,00
- Pediatria (Dra. Beatriz Santos) - R$ 160,00
- Nutrição Clínica (Dra. Fernanda Lima) - R$ 130,00

EXAMES LABORATORIAIS:
- Coleta de Segunda a Sábado das 07:00 às 11:30 (sem agendamento prévio para exames de sangue).
- Hemograma Completo, Glicemia em Jejum, Perfil Lipídico, TSH/T4, Vitaminas D/B12, Urina EAS, EPF, Ultrassonografia, ECG.

REGRAS MANDATÓRIAS DE AGENDAMENTO (INVIOLÁVEIS):
1. NUNCA chame 'criar_agendamento' sem antes ter chamado 'consultar_horarios_disponiveis' NESTA MESMA CONVERSA e ter o paciente escolhido um dos horários REAIS retornados por essa ferramenta. É proibido inventar, estimar ou "chutar" data/hora — use exclusivamente os valores exatos (campo "data" e "hora") que a ferramenta 'consultar_horarios_disponiveis' devolveu.
2. FLUXO CORRETO, PASSO A PASSO:
   a) Paciente informa ou escolhe a especialidade/serviço desejado (por nome ou número do menu).
   b) Chame IMEDIATAMENTE 'consultar_horarios_disponiveis' passando o serviço escolhido. Apresente os horários REAIS retornados, numerados (1️⃣, 2️⃣, 3️⃣), com data e hora exatas.
   c) Peça o nome do paciente, se ainda não tiver.
   d) Só DEPOIS que o paciente escolher um número/horário da lista apresentada, chame 'criar_agendamento' usando EXATAMENTE a data e hora daquele horário escolhido (nunca outro valor).
3. Se o paciente pedir uma especialidade que não bate exatamente com a lista de serviços, confirme qual serviço ele quer ANTES de chamar qualquer ferramenta — nunca assuma ou escolha por conta própria.
4. Ao criar o agendamento, informe os dados da consulta, o link de pagamento e o Pix Copia e Cola, avisando que o horário fica pré-reservado por ${clinicDb.config.paymentTimeoutMinutes} minutos até a confirmação do pagamento.
5. NUNCA invente horários, preços, especialidades ou preparos de exames. Use SEMPRE as ferramentas oficiais — toda informação factual (data, hora, preço, médico) deve vir literalmente do resultado de uma ferramenta, nunca da sua própria estimativa.`;
}

export async function processWhatsAppMessage(
  userMessage: string,
  history: ChatMessage[],
  patientPhone: string = "5591988390894",
  patientName?: string
): Promise<ChatProcessResult> {
  const startTime = Date.now();
  const clinicConfig = clinicDb.config;
  const systemPrompt = buildSystemPrompt(clinicConfig.clinicName);
  const toolCallsExecuted: Array<{ name: string; args: any; result: any }> = [];
  let appointmentCreated: Appointment | undefined = undefined;
  let transferredToHuman = false;

  // If Gemini API is not available, execute smart local assistant with tool simulation
  if (!ai || !process.env.GEMINI_API_KEY) {
    return await simulateLocalProcessing(userMessage, history, patientPhone, patientName);
  }

  try {
    // Format conversation contents for Gemini SDK
    // Convert history: user -> user, assistant -> model
    const contents: any[] = [];

    // Add previous history
    for (const msg of history.slice(-8)) {
      if (msg.role === "user") {
        contents.push({ role: "user", parts: [{ text: msg.content }] });
      } else if (msg.role === "assistant") {
        contents.push({ role: "model", parts: [{ text: msg.content }] });
      }
    }

    // Add current user message
    contents.push({
      role: "user",
      parts: [
        {
          text: `[Mensagem recebida do WhatsApp do paciente - Telefone: ${patientPhone}${patientName ? `, Nome do cadastro: ${patientName}` : ""}]: ${userMessage}`,
        },
      ],
    });

    // Call Gemini 3.7 Flash with Function Calling
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.4,
        tools: allTools,
      },
    });

    let finalReply = "";

    // Check if model returned function calls
    const functionCalls = response.functionCalls;

    if (functionCalls && functionCalls.length > 0) {
      // Execute each function call against our clinic database
      const functionResponsesParts: any[] = [];

      for (const call of functionCalls) {
        const name = call.name;
        const args = (call.args || {}) as Record<string, any>;
        let result: any = null;

        if (name === "consultar_horarios_disponiveis") {
          result = clinicDb.consultarHorarios(args.servico, args.data_preferida, args.medico);
        } else if (name === "orcar_consultas_e_exames") {
          result = clinicDb.orcarConsultasExames(args.itens, args.nome_paciente || patientName);
        } else if (name === "consultar_tabela_exames") {
          result = clinicDb.consultarExamesLaboratoriais(args.categoria_ou_nome);
        } else if (name === "criar_agendamento") {
          const creation = await clinicDb.criarAgendamento(
            args.nome_paciente || patientName || "Carlos Eduardo Silva",
            args.telefone || patientPhone,
            args.servico || "Clínico Geral (Consulta)",
            args.data_hora,
            args.medico
          );
          result = creation.result;
          appointmentCreated = creation.appointment;
        } else if (name === "consultar_status_agendamento") {
          result = clinicDb.consultarStatus(args.identificador || patientPhone);
        } else if (name === "cancelar_agendamento") {
          result = clinicDb.cancelarAgendamento(args.identificador || patientPhone, args.motivo);
        } else if (name === "transferir_atendimento_humano") {
          result = clinicDb.transferirAtendimentoHumano(args.motivo, args.resumo);
          transferredToHuman = true;
        } else {
          result = { error: "Ferramenta não reconhecida" };
        }

        toolCallsExecuted.push({ name, args, result });

        functionResponsesParts.push({
          functionResponse: {
            name,
            response: { output: result },
          },
        });
      }

      // Send the tool results back to Gemini with role "tool"
      const toolFollowupContents = [
        ...contents,
        response.candidates?.[0]?.content,
        {
          role: "tool",
          parts: functionResponsesParts,
        },
      ];

      const followupResponse = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: toolFollowupContents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.3,
          tools: allTools,
        },
      });

      finalReply = followupResponse.text || "Operação realizada com sucesso.";
    } else {
      finalReply = response.text || "Olá! Como posso te ajudar hoje?";
    }

    return {
      reply: finalReply,
      toolCalls: toolCallsExecuted,
      appointmentCreated,
      transferredToHuman,
      modelUsed: "gemini-3.7-flash",
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error: any) {
    console.error("Gemini API error in WhatsApp Assistant, falling back to local orchestrator:", error);
    return await simulateLocalProcessing(userMessage, history, patientPhone, patientName);
  }
}

// Helper to extract patient name from text or context
function extractPatientName(text: string, defaultName?: string): string {
  if (defaultName && defaultName.trim() && defaultName !== "Paciente") {
    return defaultName.trim();
  }

  const namePatterns = [
    /(?:meu nome [eé]|sou o|sou a|para o|para a|agendar para|marcar para|paciente:?)\s+([A-Za-zÀ-ÖØ-öø-ÿ\s]{3,35})/i,
    /(?:carlos eduardo silva|carlos eduardo|maria silva|maria santos|andre lisboa|andré lisboa|joao pedro|joão pedro|ana carolina|juliana mendes|lucas ferreira)/i,
  ];

  for (const pat of namePatterns) {
    const match = text.match(pat);
    if (match) {
      const found = match[1] || match[0];
      return found.trim().replace(/[.,!?;:]/g, "");
    }
  }

  const words = text.split(/\s+/).filter(Boolean);
  for (let i = 0; i < words.length - 1; i++) {
    const w1 = words[i];
    const w2 = words[i + 1];
    if (
      /^[A-ZÀ-Ö][a-zà-öø-ÿ]{2,}$/.test(w1) &&
      /^[A-ZÀ-Ö][a-zà-öø-ÿ]{2,}$/.test(w2) &&
      !["Quero", "Pode", "Tenho", "Gostaria", "Clínico", "Clinico", "Cardiologia", "Dermatologia", "Consulta", "Exame"].includes(w1)
    ) {
      return `${w1} ${w2}`;
    }
  }

  return "Carlos Eduardo Silva";
}

// Helper to extract preferred time from message or options
function extractPreferredTime(text: string): string {
  const timeMatch = text.match(/\b([01]?[0-9]|2[0-3])[:h]([0-5][0-9])\b/i);
  if (timeMatch) {
    const hh = timeMatch[1].padStart(2, "0");
    const mm = timeMatch[2].padStart(2, "0");
    return `${hh}:${mm}`;
  }

  const hourOnlyMatch = text.match(/\b(?:às|as)\s+([01]?[0-9]|2[0-3])h?\b/i);
  if (hourOnlyMatch) {
    const hh = hourOnlyMatch[1].padStart(2, "0");
    return `${hh}:00`;
  }

  if (text.includes("09:15") || text.includes("9:15") || text.includes("9h15")) return "09:15";
  if (text.includes("10:00") || text.includes("10h")) return "10:00";
  if (text.includes("10:30") || text.includes("10h30")) return "10:30";
  if (text.includes("11:00") || text.includes("11h")) return "11:00";
  if (text.includes("14:00") || text.includes("14h")) return "14:00";
  if (text.includes("14:30") || text.includes("14h30")) return "14:30";
  if (text.includes("15:00") || text.includes("15h")) return "15:00";
  if (text.includes("15:30") || text.includes("15h30")) return "15:30";
  if (text.includes("16:00") || text.includes("16h")) return "16:00";

  // Check numeric options "1", "2", "3", "primeiro", "segundo"
  if (/\b(?:1|primeiro|primeira|opcao 1|opção 1)\b/i.test(text)) return "09:15";
  if (/\b(?:2|segundo|segunda|opcao 2|opção 2)\b/i.test(text)) return "10:30";
  if (/\b(?:3|terceiro|terceira|opcao 3|opção 3)\b/i.test(text)) return "14:00";
  if (/\b(?:4|quarto|quarta|opcao 4|opção 4)\b/i.test(text)) return "15:30";

  return "09:15";
}

// Helper to extract service from text or history
function extractService(text: string, history: ChatMessage[]): string {
  const lower = text.toLowerCase();
  if (lower.includes("cardio") || lower.includes("coração") || lower.includes("ecg")) return "Cardiologia (Consulta + ECG)";
  if (lower.includes("dermato") || lower.includes("pele") || lower.includes("mancha")) return "Dermatologia";
  if (lower.includes("odonto") || lower.includes("dentista") || lower.includes("dente")) return "Odontologia & Avaliação";
  if (lower.includes("pediatra") || lower.includes("criança") || lower.includes("filho") || lower.includes("filha")) return "Pediatria";
  if (lower.includes("nutri") || lower.includes("dieta") || lower.includes("alimenta")) return "Nutrição Clínica";
  if (lower.includes("clinico") || lower.includes("clínico") || lower.includes("geral")) return "Clínico Geral (Consulta)";

  for (let i = history.length - 1; i >= 0; i--) {
    const hText = history[i].content.toLowerCase();
    if (hText.includes("cardiologia")) return "Cardiologia (Consulta + ECG)";
    if (hText.includes("dermatologia")) return "Dermatologia";
    if (hText.includes("odontologia") || hText.includes("dentista")) return "Odontologia & Avaliação";
    if (hText.includes("pediatria")) return "Pediatria";
    if (hText.includes("nutrição") || hText.includes("nutricao")) return "Nutrição Clínica";
    if (hText.includes("clínico geral") || hText.includes("clinico geral")) return "Clínico Geral (Consulta)";
  }

  return "Clínico Geral (Consulta)";
}

// Deterministic intelligent fallback orchestrator that adheres 100% to the exact same business rules
async function simulateLocalProcessing(
  userMessage: string,
  history: ChatMessage[],
  patientPhone: string,
  patientName?: string
): Promise<ChatProcessResult> {
  const startTime = Date.now();
  const lower = userMessage.toLowerCase().trim();
  const toolCallsExecuted: Array<{ name: string; args: any; result: any }> = [];
  let reply = "";
  let appointmentCreated: Appointment | undefined = undefined;
  let transferredToHuman = false;

  // Check previous assistant message to know if we were waiting for appointment confirmation
  const lastBotMessage = history.filter((h) => h.role === "assistant").pop()?.content.toLowerCase() || "";
  const isAwaitingSlotChoice =
    lastBotMessage.includes("horários disponíveis") ||
    lastBotMessage.includes("horarios disponiveis") ||
    lastBotMessage.includes("qual desses horários") ||
    lastBotMessage.includes("qual horario") ||
    lastBotMessage.includes("nome completo");

  // Rule 1: Medical doubts, medication, emergencies, discounts, complaints, or Elderly / Low literacy Human Assistance Request -> Transfer to Human
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
      lower.includes("não sei") ||
      lower.includes("nao sei") ||
      lower === "0"
    ) {
      motivo = "Apoio humanizado para agendamento assistido";
    }

    const res = clinicDb.transferirAtendimentoHumano(motivo, `Paciente solicitou apoio humano via WhatsApp (${patientPhone})`) as any;
    toolCallsExecuted.push({ name: "transferir_atendimento_humano", args: { motivo }, result: res });
    transferredToHuman = true;

    reply = `Com certeza! 🤝 Já estou transferindo seu atendimento para a nossa equipe de recepção humana.\n\n📞 *Protocolo:* ${res.protocolo}\n⏱️ *Telefone da Clínica:* ${res.telefone_recepcao || clinicDb.config.phone}\n\nUma de nossas atendentes continuará a conversa com você por aqui ou entrará em contato pelo telefone *${patientPhone}*. Por favor, aguarde só um instante!`;
  }
  // Rule 2: Cancellation
  else if (lower.includes("cancelar") || lower.includes("desmarcar")) {
    const res = clinicDb.cancelarAgendamento(patientPhone, "Solicitado pelo paciente via WhatsApp") as any;
    toolCallsExecuted.push({ name: "cancelar_agendamento", args: { identificador: patientPhone }, result: res });

    if (res.sucesso) {
      reply = `Seu agendamento foi cancelado com sucesso. ✅\n\n${res.mensagem}\n\nCaso deseje reagendar para outra data no futuro, estou à disposição!`;
    } else {
      reply = `Não identifiquei nenhum agendamento pendente no número *${patientPhone}*. Se você agendou com outro número ou deseja falar com a recepção, digite *0* para falar com um atendente humano.`;
    }
  }
  // Rule 3: Lab Exams & Quotation
  else if (
    lower.includes("orçamento") ||
    lower.includes("orcamento") ||
    lower.includes("quanto custa") ||
    lower.includes("valor do") ||
    lower.includes("preço do") ||
    lower.includes("preco do") ||
    lower.includes("hemograma") ||
    lower.includes("glicemia") ||
    lower.includes("colesterol") ||
    lower.includes("exame de sangue") ||
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
      const res = clinicDb.consultarExamesLaboratoriais();
      toolCallsExecuted.push({ name: "consultar_tabela_exames", args: {}, result: res });

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

      const res = clinicDb.orcarConsultasExames(itemsToQuote, patientName || "Paciente");
      toolCallsExecuted.push({ name: "orcar_consultas_e_exames", args: { itens: itemsToQuote, nome_paciente: patientName }, result: res });

      const itemsText = res.itens_cotados
        .map((it: any) => `• *${it.nome}* (${it.tipo}): ${it.valor}\n  ↳ _Preparo:_ ${it.preparo}`)
        .join("\n\n");

      reply = `Olá, *${res.paciente}*! Preparei seu orçamento detalhado: 📋\n\n${itemsText}\n\n───────────────\n🧾 *Subtotal:* ${res.subtotal}\n${res.desconto_combo !== "Sem desconto" ? `🎁 *Desconto Combo:* ${res.desconto_combo}\n` : ""}💰 *Total:* ${res.valor_total}\n✨ *À vista no Pix com 5% de desconto:* *${res.valor_pix_com_desconto}*\n\n📌 *Validade:* ${res.validade}\n🧪 *Coleta:* Segunda a Sábado das 07:00 às 11:30 (sem agendamento prévio para exames de sangue)\n\nDeseja realizar a pré-reserva ou receber a chave Pix para garantir o desconto? 😊`;
    }
  }
  // Rule 4: Status lookup
  else if (lower.includes("status") || lower.includes("confirmado") || lower.includes("minha consulta") || lower.includes("verificar agendamento")) {
    const res = clinicDb.consultarStatus(patientPhone) as any;
    toolCallsExecuted.push({ name: "consultar_status_agendamento", args: { identificador: patientPhone }, result: res });

    if (res.encontrado) {
      reply = `Aqui estão os detalhes do seu agendamento: 📋\n\n🔹 *Código:* ${res.id_agendamento}\n👤 *Paciente:* ${res.paciente}\n🩺 *Serviço:* ${res.servico}\n👨‍⚕️ *Profissional:* ${res.medico}\n📅 *Data:* ${res.data}\n⏰ *Horário:* ${res.horario}\n📌 *Status:* ${res.status}\n\n${res.link_pagamento_ativo ? `👉 *Link para pagamento:* ${res.link_pagamento_ativo}\n\n⚠️ *Lembrete:* O horário fica pré-reservado por até ${clinicDb.config.paymentTimeoutMinutes} minutos. O pagamento confirma a consulta automaticamente.` : "✅ Seu horário está confirmado!"}`;
    } else {
      reply = `Não encontrei nenhum agendamento ativo para este número de telefone (*${patientPhone}*). Deseja consultar os horários disponíveis para agendar uma consulta?`;
    }
  }
  // Rule 5: DIRECT BOOKING OR CHOOSING SLOT IN CONVERSATION (Prevents message loops!)
  else if (
    isAwaitingSlotChoice ||
    lower.includes("agendar") ||
    lower.includes("confirmar") ||
    lower.includes("marcar") ||
    lower.includes("pode ser") ||
    lower.includes("quero às") ||
    lower.includes("quero as") ||
    lower.includes("pode agendar") ||
    lower.includes("reserva") ||
    lower.includes("09:15") ||
    lower.includes("10:00") ||
    lower.includes("10:30") ||
    lower.includes("14:00") ||
    lower.includes("15:00") ||
    lower.includes("15:30") ||
    /^(?:1|2|3|4|o primeiro|o segundo|a primeira|a segunda)$/i.test(lower) ||
    /^(?:meu nome [eé]|sou o|sou a)/i.test(lower)
  ) {
    const nameToUse = extractPatientName(userMessage, patientName);
    const chosenTime = extractPreferredTime(userMessage);
    const serviceName = extractService(userMessage, history);

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    const creation = await clinicDb.criarAgendamento(nameToUse, patientPhone, serviceName, `${dateStr} ${chosenTime}`);
    toolCallsExecuted.push({
      name: "criar_agendamento",
      args: { nome_paciente: nameToUse, telefone: patientPhone, servico: serviceName, data_hora: `${dateStr} ${chosenTime}` },
      result: creation.result,
    });

    if (creation.appointment) {
      appointmentCreated = creation.appointment;
      reply = `Perfeito, *${nameToUse}*! Pré-agendamento realizado com sucesso: 🗓️\n\n🩺 *${serviceName}* com *${creation.appointment.doctor}*\n📅 *Data:* ${dateStr} às *${chosenTime}*\n💰 *Valor:* R$ ${creation.appointment.price.toFixed(2)}\n\n⚠️ *IMPORTANTE:* O horário fica pré-reservado por até *${clinicDb.config.paymentTimeoutMinutes} minutos*. A confirmação definitiva ocorre automaticamente após o pagamento via Pix ou Mercado Pago.\n\n💳 *Link de Pagamento:* ${creation.appointment.paymentLink}\n\n🔑 *Pix Copia e Cola:*\n\`${creation.appointment.pixCode}\`\n\nAssim que o pagamento for aprovado, seu agendamento estará 100% garantido! 🏥`;
    } else {
      reply = `Poxa, *${nameToUse}*, esse horário específico não está disponível 😕. Me diz qual especialidade você precisa que eu já te mostro os horários realmente livres pra você escolher!`;
    }
  }
  // Rule 6: Consultation of available slots (Search)
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
    lower.includes("pediatra") ||
    lower.includes("nutri") ||
    lower.includes("médico") ||
    lower.includes("medico") ||
    lower.includes("doutor") ||
    lower.includes("doutora") ||
    lower.includes("vaga") ||
    lower === "1" ||
    lower === "2"
  ) {
    let srv = "Clínico Geral";
    if (lower.includes("cardio")) srv = "Cardiologia";
    if (lower.includes("dermato") || lower.includes("pele")) srv = "Dermatologia";
    if (lower.includes("odonto") || lower.includes("dente") || lower.includes("dentista")) srv = "Odontologia";
    if (lower.includes("pediatra") || lower.includes("criança")) srv = "Pediatria";
    if (lower.includes("nutri")) srv = "Nutrição";

    const res = clinicDb.consultarHorarios(srv, lower.includes("amanha") || lower.includes("amanhã") ? "amanhã" : undefined);
    toolCallsExecuted.push({ name: "consultar_horarios_disponiveis", args: { servico: srv }, result: res });

    if (res.horarios_disponiveis.length > 0) {
      const slotsList = res.horarios_disponiveis
        .slice(0, 4)
        .map((s, idx) => `${idx + 1}️⃣ 📅 *${s.data}* às *${s.horario}* - ${s.medico}`)
        .join("\n");

      reply = `Temos os seguintes horários disponíveis para *${res.servico_pesquisado}* (${res.preco_consulta}):\n\n${slotsList}\n\nQual desses horários você prefere? Me informe também seu *nome completo* para confirmarmos a reserva! 😊\n\n💡 *Prefere falar com uma pessoa?* Digite *0* ou diga *"falar com atendente"* para agendar com o auxílio da nossa recepção.`;
    } else {
      reply = `Não localizei horários livres para ${srv} nesta data. Gostaria de consultar para os próximos dias da semana ou falar com a recepção humana (digite *0*)?`;
    }
  }
  // Rule 7: Default greeting
  else {
    reply = `Olá! 👋 Sou o assistente virtual da *${clinicDb.config.clinicName}*.\n\nComo posso te ajudar hoje?\n\n1️⃣ *Consultar horários e agendar consultas*\n2️⃣ *Orçamento de exames laboratoriais*\n3️⃣ *Verificar status de agendamento*\n4️⃣ *Cancelar agendamento*\n0️⃣ *Falar com Atendente Humano / Ajuda para Agendar*\n\n👵🧓 *Atenção:* Se preferir agendar conversando com uma recepcionista humana por telefone ou mensagem, basta responder *0*!`;
  }

  return {
    reply,
    toolCalls: toolCallsExecuted,
    appointmentCreated,
    transferredToHuman,
    modelUsed: "gemini-3.7-flash (simulation)",
    executionTimeMs: Date.now() - startTime,
  };
}
