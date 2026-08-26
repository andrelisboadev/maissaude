import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);

if (!isSupabaseConfigured) {
  console.warn(
    "[supabaseAdmin] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configuradas. " +
      "O backend vai operar apenas em memória (dados não persistem entre invocações)."
  );
}

/**
 * Stub inofensivo usado só quando as variáveis de ambiente não estão configuradas.
 * Nunca deveria ser chamado de verdade: todo ponto que usa supabaseAdmin já checa
 * `isSupabaseConfigured` antes (ensureHydrated/persistSnapshot), mas isso evita que
 * a própria criação do cliente derrube a função serverless com uma URL inválida/vazia.
 */
function createUnconfiguredStub(): any {
  const notConfigured = async () => ({
    data: null,
    error: new Error("Supabase não configurado (variáveis de ambiente ausentes)"),
  });
  const chain: any = {
    select: notConfigured,
    upsert: notConfigured,
    update: notConfigured,
    insert: notConfigured,
    delete: notConfigured,
    eq: () => chain,
    order: () => chain,
    maybeSingle: notConfigured,
  };
  return { from: () => chain };
}

/**
 * Cliente com service_role: roda só no servidor (nunca no navegador),
 * ignora RLS por design — é o próprio backend confiável falando com o Postgres.
 * Só é construído de verdade se as variáveis de ambiente existirem, para nunca
 * derrubar a função serverless por causa de uma URL vazia/inválida.
 */
export const supabaseAdmin: any = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      db: { schema: "whatsapp_ia" },
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : createUnconfiguredStub();

