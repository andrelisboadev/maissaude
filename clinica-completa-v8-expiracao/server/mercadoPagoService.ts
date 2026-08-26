const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || "";

export const isMercadoPagoConfigured = Boolean(MP_ACCESS_TOKEN);

if (!isMercadoPagoConfigured) {
  console.warn(
    "[mercadoPago] MERCADOPAGO_ACCESS_TOKEN não configurada. " +
      "Pagamentos via Pix vão cair em modo de simulação (código fictício, sem cobrança real)."
  );
}

interface CreatePixParams {
  amount: number;
  description: string;
  externalReference: string;
  payerEmail?: string;
  payerFirstName?: string;
}

export interface PixPaymentResult {
  paymentId: string;
  status: string;
  qrCode: string; // "Pix copia e cola"
  qrCodeBase64: string; // imagem do QR Code em base64
  ticketUrl?: string;
}

/**
 * Cria uma cobrança Pix real via API de Pagamentos do Mercado Pago.
 * Retorna null se a integração não estiver configurada ou se a chamada falhar
 * (o chamador decide como lidar com a ausência — hoje faz fallback para um
 * código de demonstração, deixando isso explícito no retorno ao usuário).
 */
export async function createPixPayment(params: CreatePixParams): Promise<PixPaymentResult | null> {
  if (!isMercadoPagoConfigured) return null;

  try {
    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "X-Idempotency-Key": `${params.externalReference}-${Date.now()}`,
      },
      body: JSON.stringify({
        transaction_amount: Number(params.amount.toFixed(2)),
        description: params.description,
        payment_method_id: "pix",
        external_reference: params.externalReference,
        payer: {
          email: params.payerEmail || "paciente.whatsapp@bragancadigital.com.br",
          first_name: params.payerFirstName || "Paciente",
        },
      }),
    });

    const data: any = await response.json();

    if (!response.ok) {
      console.error("[mercadoPago] Falha ao criar pagamento Pix:", data);
      return null;
    }

    const poi = data.point_of_interaction?.transaction_data;
    return {
      paymentId: String(data.id),
      status: data.status,
      qrCode: poi?.qr_code || "",
      qrCodeBase64: poi?.qr_code_base64 || "",
      ticketUrl: poi?.ticket_url,
    };
  } catch (error) {
    console.error("[mercadoPago] Erro de rede ao criar pagamento Pix:", error);
    return null;
  }
}

/**
 * Busca o status real de um pagamento direto na API do Mercado Pago.
 * Usado pelo webhook: NUNCA confiamos apenas no corpo da notificação recebida,
 * sempre revalidamos o status consultando a API oficial antes de confirmar.
 */
export async function getPayment(paymentId: string): Promise<any | null> {
  if (!isMercadoPagoConfigured) return null;
  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });
    if (!response.ok) {
      console.error("[mercadoPago] Falha ao consultar pagamento", paymentId, response.status);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("[mercadoPago] Erro de rede ao consultar pagamento:", error);
    return null;
  }
}
