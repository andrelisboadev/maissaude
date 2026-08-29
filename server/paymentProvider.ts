import * as mercadoPago from "./mercadoPagoService.js";
import * as bancoInter from "./bancoInterService.js";

export interface PixPaymentResult {
  paymentId: string;
  status: string;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl?: string;
}

interface CreatePixParams {
  amount: number;
  description: string;
  externalReference: string;
  payerEmail?: string;
  payerFirstName?: string;
  expirationMinutes?: number;
}

/**
 * PAYMENT_PROVIDER define qual gateway processa os pagamentos Pix.
 * "inter" -> dinheiro cai direto na conta PJ do cliente (Banco Inter).
 * "mercadopago" (padrão) -> usa a conta Mercado Pago configurada.
 * Cada clínica/cliente pode ter seu próprio provedor configurado nas env vars do projeto dela.
 */
const PROVIDER = (process.env.PAYMENT_PROVIDER || "mercadopago").toLowerCase();

export const isPaymentConfigured =
  PROVIDER === "inter" ? bancoInter.isBancoInterConfigured : mercadoPago.isMercadoPagoConfigured;

export const activeProviderName = PROVIDER === "inter" ? "Banco Inter" : "Mercado Pago";

export async function createPixPayment(params: CreatePixParams): Promise<PixPaymentResult | null> {
  if (PROVIDER === "inter") {
    return bancoInter.createPixPayment({
      amount: params.amount,
      description: params.description,
      externalReference: params.externalReference,
      payerName: params.payerFirstName,
      expirationMinutes: params.expirationMinutes,
    });
  }
  return mercadoPago.createPixPayment(params);
}

export async function getPayment(paymentId: string): Promise<any | null> {
  if (PROVIDER === "inter") return bancoInter.getPayment(paymentId);
  return mercadoPago.getPayment(paymentId);
}
