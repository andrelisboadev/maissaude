const META_WHATSAPP_TOKEN = process.env.META_WHATSAPP_TOKEN || "";
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID || "";
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "";
const META_API_VERSION = "v21.0";

export const isMetaWhatsAppConfigured = Boolean(META_WHATSAPP_TOKEN && META_PHONE_NUMBER_ID);

if (!isMetaWhatsAppConfigured) {
  console.warn(
    "[metaWhatsApp] META_WHATSAPP_TOKEN / META_PHONE_NUMBER_ID não configurados. " +
      "O envio automático de resposta pelo WhatsApp oficial fica desativado (a IA continua respondendo no Simulador normalmente)."
  );
}

/**
 * Envia uma mensagem de texto pelo WhatsApp oficial (Meta Cloud API).
 * Funciona igual tanto com o número de teste gratuito da Meta quanto com o número
 * definitivo homologado — a única diferença está nas variáveis de ambiente configuradas.
 */
export async function sendTextMessage(to: string, text: string): Promise<boolean> {
  if (!isMetaWhatsAppConfigured) {
    console.warn("[metaWhatsApp] Tentativa de envio sem configuração ativa, ignorado.");
    return false;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/${META_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${META_WHATSAPP_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: text },
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error("[metaWhatsApp] Falha ao enviar mensagem:", response.status, errBody);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[metaWhatsApp] Erro de rede ao enviar mensagem:", error);
    return false;
  }
}

/** Confere o token de verificação exigido pela Meta ao configurar a URL do webhook. */
export function verifyWebhookChallenge(mode: string, token: string): boolean {
  return mode === "subscribe" && Boolean(META_VERIFY_TOKEN) && token === META_VERIFY_TOKEN;
}

export interface IncomingMetaMessage {
  senderPhone: string;
  senderName: string;
  messageText: string;
}

/**
 * Extrai a mensagem recebida do formato de payload da Meta Cloud API.
 * Retorna null se o evento não for uma mensagem de texto de paciente (ex: confirmação de leitura,
 * mensagem enviada por nós mesmos ecoada de volta, mídia não suportada, etc).
 */
export function parseIncomingMetaMessage(body: any): IncomingMetaMessage | null {
  try {
    const value = body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    if (!message || message.type !== "text") return null;

    const senderPhone = String(message.from || "").replace(/\D/g, "");
    const senderName = value?.contacts?.[0]?.profile?.name || "Paciente WhatsApp";
    const messageText = message.text?.body || "";

    if (!senderPhone || !messageText) return null;
    return { senderPhone, senderName, messageText };
  } catch (error) {
    console.error("[metaWhatsApp] Erro ao interpretar mensagem recebida:", error);
    return null;
  }
}
