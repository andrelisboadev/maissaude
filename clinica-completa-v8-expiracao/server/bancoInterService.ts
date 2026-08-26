import https from "node:https";
import crypto from "node:crypto";

const CLIENT_ID = process.env.INTER_CLIENT_ID || "";
const CLIENT_SECRET = process.env.INTER_CLIENT_SECRET || "";
const CERTIFICATE = process.env.INTER_CERTIFICATE || "";
const PRIVATE_KEY = process.env.INTER_PRIVATE_KEY || "";
const PIX_KEY = process.env.INTER_PIX_KEY || ""; // chave Pix cadastrada na conta PJ do Inter

const INTER_HOST = "cdpj.partners.bancointer.com.br";

export const isBancoInterConfigured = Boolean(
  CLIENT_ID && CLIENT_SECRET && CERTIFICATE && PRIVATE_KEY && PIX_KEY
);

if (!isBancoInterConfigured) {
  console.warn(
    "[bancoInter] Credenciais/certificado não configurados. Integração com Pix do Inter desativada."
  );
}

/**
 * Faz uma requisição HTTPS com mTLS (certificado + chave privada), exigido pela API do Inter.
 * Usamos o módulo `https` nativo do Node em vez de `fetch` porque o mTLS via `fetch`/undici
 * é instável entre versões do Node — `https.request` com `cert`/`key` é a forma mais confiável.
 */
function interRequest(
  path: string,
  method: string,
  body?: object,
  extraHeaders?: Record<string, string>
): Promise<{ status: number; json: any }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;

    const req = https.request(
      {
        host: INTER_HOST,
        path,
        method,
        cert: CERTIFICATE,
        key: PRIVATE_KEY,
        headers: {
          "Content-Type": "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
          ...extraHeaders,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = data ? JSON.parse(data) : {};
            resolve({ status: res.statusCode || 0, json });
          } catch (e) {
            resolve({ status: res.statusCode || 0, json: { raw: data } });
          }
        });
      }
    );

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

/**
 * Faz a requisição de token OAuth2 (form-urlencoded), que exige um Content-Type diferente
 * das demais chamadas da API do Inter.
 */
function interTokenRequest(): Promise<{ status: number; json: any }> {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "client_credentials",
      scope: "cob.write cob.read webhook.write webhook.read pix.write pix.read",
    }).toString();

    const req = https.request(
      {
        host: INTER_HOST,
        path: "/oauth/v2/token",
        method: "POST",
        cert: CERTIFICATE,
        key: PRIVATE_KEY,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode || 0, json: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode || 0, json: { raw: data } });
          }
        });
      }
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  try {
    const { status, json } = await interTokenRequest();
    if (status !== 200 || !json.access_token) {
      console.error("[bancoInter] Falha ao obter token de acesso:", status, json);
      return null;
    }
    cachedToken = {
      value: json.access_token,
      expiresAt: Date.now() + (json.expires_in - 30) * 1000, // 30s de margem
    };
    return cachedToken.value;
  } catch (error) {
    console.error("[bancoInter] Erro de rede ao obter token:", error);
    return null;
  }
}

/**
 * Registra a URL de webhook na API do Inter (precisa ser chamado uma vez).
 * Diferente do Mercado Pago, o Inter não tem campo no painel visual para isso —
 * o cadastro é feito via chamada de API.
 */
export async function registerWebhook(webhookUrl: string): Promise<boolean> {
  if (!isBancoInterConfigured) return false;
  const token = await getAccessToken();
  if (!token) return false;

  try {
    const { status, json } = await interRequest(
      `/pix/v2/webhook/${encodeURIComponent(PIX_KEY)}`,
      "PUT",
      { webhookUrl },
      { Authorization: `Bearer ${token}` }
    );
    if (status !== 204 && status !== 200) {
      console.error("[bancoInter] Falha ao registrar webhook:", status, json);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[bancoInter] Erro de rede ao registrar webhook:", error);
    return false;
  }
}

interface CreatePixParams {
  amount: number;
  description: string;
  externalReference: string;
  payerName?: string;
  expirationMinutes?: number;
}

export interface PixPaymentResult {
  paymentId: string; // txid gerado por nós, usado para consultar depois
  status: string;
  qrCode: string; // Pix copia e cola
  qrCodeBase64: string; // Inter não retorna imagem pronta; vazio aqui (o front pode gerar QR do texto)
  ticketUrl?: string;
}

/** Gera um txid válido para o Inter: 26 a 35 caracteres alfanuméricos. */
function generateTxid(externalReference: string): string {
  const clean = externalReference.replace(/[^a-zA-Z0-9]/g, "");
  const random = crypto.randomBytes(6).toString("hex");
  return `${clean}${random}`.slice(0, 35).padEnd(26, "0");
}

export async function createPixPayment(params: CreatePixParams): Promise<PixPaymentResult | null> {
  if (!isBancoInterConfigured) return null;

  const token = await getAccessToken();
  if (!token) return null;

  const txid = generateTxid(params.externalReference);

  try {
    const { status, json } = await interRequest(`/pix/v2/cob/${txid}`, "PUT", {
      calendario: { expiracao: (params.expirationMinutes || 15) * 60 },
      devedor: params.payerName ? { nome: params.payerName, cpf: "00000000000" } : undefined,
      valor: { original: params.amount.toFixed(2) },
      chave: PIX_KEY,
      solicitacaoPagador: params.description.slice(0, 140),
    }, { Authorization: `Bearer ${token}` });

    if (status !== 200 && status !== 201) {
      console.error("[bancoInter] Falha ao criar cobrança Pix:", status, json);
      return null;
    }

    return {
      paymentId: txid,
      status: json.status || "ATIVA",
      qrCode: json.pixCopiaECola || "",
      qrCodeBase64: "",
      ticketUrl: undefined,
    };
  } catch (error) {
    console.error("[bancoInter] Erro de rede ao criar cobrança Pix:", error);
    return null;
  }
}

/** Consulta o status real de uma cobrança direto na API do Inter (usado pelo webhook). */
export async function getPayment(txid: string): Promise<any | null> {
  if (!isBancoInterConfigured) return null;
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const { status, json } = await interRequest(`/pix/v2/cob/${txid}`, "GET", undefined, {
      Authorization: `Bearer ${token}`,
    });
    if (status !== 200) {
      console.error("[bancoInter] Falha ao consultar cobrança:", txid, status);
      return null;
    }
    // Normaliza pro mesmo formato usado no restante do código (status "approved"/"CONCLUIDA")
    return {
      ...json,
      status: json.status === "CONCLUIDA" ? "approved" : json.status,
      external_reference: txid,
    };
  } catch (error) {
    console.error("[bancoInter] Erro de rede ao consultar cobrança:", error);
    return null;
  }
}
